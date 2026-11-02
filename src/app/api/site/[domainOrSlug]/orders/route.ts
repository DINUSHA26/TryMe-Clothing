import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getStandaloneSiteData } from "@/lib/site-resolver";

async function generateWebsiteOrderNumber(tx: any): Promise<string> {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const prefix = `WEB-${datePart}-`;

  const latestOrder = await tx.order.findFirst({
    where: {
      orderNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      orderNumber: "desc",
    },
    select: {
      orderNumber: true,
    },
  });

  let nextSeq = 1;
  if (latestOrder?.orderNumber) {
    const parts = latestOrder.orderNumber.split("-");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextSeq = lastNum + 1;
    }
  }

  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}

async function resolveOrCreateWebsiteCustomer(
  tx: any,
  customerInfo: { fullName: string; email?: string; phone: string }
): Promise<string> {
  const cleanEmail = customerInfo.email?.trim().toLowerCase() || null;
  const cleanPhone = customerInfo.phone.trim();

  // 1. Check if a user with this email or phone already has a customer profile
  let user = null;
  if (cleanEmail) {
    user = await tx.user.findUnique({
      where: { email: cleanEmail },
      include: { customer: true },
    });
  }
  if (!user && cleanPhone) {
    user = await tx.user.findUnique({
      where: { phone: cleanPhone },
      include: { customer: true },
    });
  }

  if (user?.customer) {
    return user.customer.id;
  }

  if (user && !user.customer) {
    const createdCustomer = await tx.customer.create({
      data: { userId: user.id },
    });
    return createdCustomer.id;
  }

  // 2. Otherwise create a lightweight guest customer User + Customer
  const nameParts = (customerInfo.fullName || "Website Customer").trim().split(/\s+/);
  const firstName = nameParts[0] || "Customer";
  const lastName = nameParts.slice(1).join(" ") || "";
  const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const guestEmail = cleanEmail || `guest-${uniqueSuffix}@website.tryme.lk`;

  const newUser = await tx.user.create({
    data: {
      email: guestEmail,
      role: "CUSTOMER",
      firstName,
      lastName,
      isActive: true,
    },
  });

  const newCustomer = await tx.customer.create({
    data: { userId: newUser.id },
  });

  return newCustomer.id;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ domainOrSlug: string }> }
) {
  try {
    const { domainOrSlug } = await params;
    const siteData = await getStandaloneSiteData(domainOrSlug);

    if (!siteData || !siteData.vendor) {
      return NextResponse.json(
        { success: false, error: "Store not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      items,
      shippingAddress,
      paymentMethod,
      paymentSlipUrl,
      bankReference,
      notes,
      couponCode,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Your cart is empty" },
        { status: 400 }
      );
    }

    if (
      !shippingAddress?.fullName?.trim() ||
      !shippingAddress?.phone?.trim() ||
      !shippingAddress?.addressLine1?.trim() ||
      !shippingAddress?.city?.trim()
    ) {
      return NextResponse.json(
        { success: false, error: "Please complete all required delivery details" },
        { status: 400 }
      );
    }

    const normalizedMethod =
      paymentMethod === "BANK_DEPOSIT" ? "BANK_DEPOSIT" : "COD";

    const ecommerceConfig = (siteData.config?.footerSection as any)?.ecommerceConfig || {};
    const shippingFeeSetting = Number(ecommerceConfig.shippingFee ?? 350);
    const freeShippingThreshold = Number(ecommerceConfig.freeShippingThreshold ?? 0);

    // If this is a VENDOR store, create real Order + OrderItems in Prisma
    if (siteData.type === "VENDOR") {
      const vendorId = siteData.vendor.id;

      // Fetch real products for the items
      const productIds = items.map((i: any) => i.productId || i.id).filter(Boolean);
      const dbProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          vendorId,
        },
        include: {
          images: { orderBy: { position: "asc" }, take: 1 },
          variants: true,
        },
      });

      // Fallback product if ordering a custom service item from a Vendor website
      let fallbackProduct: (typeof dbProducts)[0] | null = dbProducts[0] || null;
      if (!fallbackProduct) {
        fallbackProduct = await prisma.product.findFirst({
          where: { vendorId },
          include: {
            images: { orderBy: { position: "asc" }, take: 1 },
            variants: true,
          },
        });
      }

      let subtotal = 0;
      const preparedItems: any[] = [];

      for (const reqItem of items) {
        const qty = Math.max(1, Number(reqItem.quantity) || 1);
        const matchedProduct = dbProducts.find(
          (p) => p.id === (reqItem.productId || reqItem.id)
        );

        if (matchedProduct) {
          const variant = reqItem.variantId
            ? matchedProduct.variants.find((v) => v.id === reqItem.variantId)
            : null;

          const availableStock = variant ? variant.stock : matchedProduct.stock;
          if (availableStock < qty) {
            return NextResponse.json(
              {
                success: false,
                error: `"${matchedProduct.name}" only has ${availableStock} left in stock`,
              },
              { status: 400 }
            );
          }

          const basePrice = Number(matchedProduct.price);
          const adjustment = variant?.priceAdjustment ? Number(variant.priceAdjustment) : 0;
          const unitPrice = Math.max(0, basePrice + adjustment);
          const totalPrice = unitPrice * qty;
          subtotal += totalPrice;

          preparedItems.push({
            isDbProduct: true,
            productId: matchedProduct.id,
            variantId: variant?.id || null,
            quantity: qty,
            unitPrice,
            totalPrice,
            productSnapshot: {
              id: matchedProduct.id,
              name: matchedProduct.name,
              slug: matchedProduct.slug,
              image: matchedProduct.images[0]?.url || reqItem.image || null,
              sku: variant?.sku || matchedProduct.sku || null,
              vendorName: siteData.vendor.businessName,
              itemType: reqItem.itemType || "PRODUCT",
            },
            variantSnapshot: variant
              ? {
                  id: variant.id,
                  name: variant.name,
                  value: variant.value,
                  priceAdjustment: Number(variant.priceAdjustment || 0),
                }
              : reqItem.variantLabel
              ? { name: "Option", value: reqItem.variantLabel }
              : null,
          });
        } else if (fallbackProduct) {
          // Service item or custom catalog item mapped to vendor's order table
          const unitPrice = Math.max(0, Number(reqItem.price) || 0);
          const totalPrice = unitPrice * qty;
          subtotal += totalPrice;

          preparedItems.push({
            isDbProduct: false,
            productId: fallbackProduct.id,
            variantId: null,
            quantity: qty,
            unitPrice,
            totalPrice,
            productSnapshot: {
              id: reqItem.id || `service-${Date.now()}`,
              name: reqItem.name || reqItem.title || "Service / Custom Item",
              slug: fallbackProduct.slug,
              image: reqItem.image || null,
              vendorName: siteData.vendor.businessName,
              itemType: reqItem.itemType || "SERVICE",
            },
            variantSnapshot: reqItem.variantLabel
              ? { name: "Package", value: reqItem.variantLabel }
              : null,
          });
        }
      }

      // Validate and apply coupon if provided
      let coupon: any = null;
      let discountAmount = 0;

      if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
        const cleanCode = couponCode.trim().toUpperCase();
        coupon = await prisma.coupon.findUnique({
          where: { code: cleanCode },
        });

        if (!coupon || !coupon.isActive) {
          return NextResponse.json(
            { success: false, error: "Invalid or inactive coupon code" },
            { status: 400 }
          );
        }

        // Channel check: cannot be TryMe-only
        if (coupon.applicableTo === "TRYME") {
          return NextResponse.json(
            { success: false, error: "This coupon is only valid on the TryMe.lk marketplace" },
            { status: 400 }
          );
        }

        // Vendor check
        if (coupon.vendorId && coupon.vendorId !== vendorId) {
          return NextResponse.json(
            { success: false, error: "This coupon is not valid for this store" },
            { status: 400 }
          );
        }

        // Date check
        const now = new Date();
        if (now < coupon.validFrom || (coupon.validUntil && now > coupon.validUntil)) {
          return NextResponse.json(
            { success: false, error: "Coupon is not valid at this time" },
            { status: 400 }
          );
        }

        // Total usage limit check
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
          return NextResponse.json(
            { success: false, error: "Coupon has reached its maximum usage limit" },
            { status: 400 }
          );
        }

        // Min order amount check
        if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount.toNumber()) {
          return NextResponse.json(
            {
              success: false,
              error: `Minimum order amount for this coupon is Rs. ${coupon.minOrderAmount.toNumber().toFixed(2)}`,
            },
            { status: 400 }
          );
        }

        // Calculate discount with precise 2-decimal rounding
        if (coupon.type === "PERCENTAGE") {
          discountAmount = (subtotal * Number(coupon.value)) / 100;
          if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
            discountAmount = Number(coupon.maxDiscount);
          }
        } else {
          discountAmount = Math.min(Number(coupon.value), subtotal);
        }
        discountAmount = Number(discountAmount.toFixed(2));
      }

      const shippingAmount =
        freeShippingThreshold > 0 && subtotal >= freeShippingThreshold
          ? 0
          : shippingFeeSetting;
      const totalAmount = Math.max(0, Number((subtotal - discountAmount + shippingAmount).toFixed(2)));

      // Initial status:
      // For COD, set to PAYMENT_CONFIRMED so vendor can immediately process/ship, or PENDING_VERIFICATION for Bank Deposit
      const initialOrderStatus =
        normalizedMethod === "COD" ? "PAYMENT_CONFIRMED" : "PENDING_VERIFICATION";

      if (preparedItems.length > 0) {
        const createdOrder = await prisma.$transaction(async (tx) => {
          const customerId = await resolveOrCreateWebsiteCustomer(tx, {
            fullName: shippingAddress.fullName,
            email: shippingAddress.email,
            phone: shippingAddress.phone,
          });

          const orderNumber = await generateWebsiteOrderNumber(tx);

          const addressSnapshot = {
            label: "Website Direct Order",
            fullName: shippingAddress.fullName.trim(),
            phone: shippingAddress.phone.trim(),
            email: shippingAddress.email?.trim() || "",
            addressLine1: shippingAddress.addressLine1.trim(),
            addressLine2: shippingAddress.addressLine2?.trim() || "",
            city: shippingAddress.city.trim(),
            province: shippingAddress.province?.trim() || "Western",
            postalCode: shippingAddress.postalCode?.trim() || "00000",
            country: "Sri Lanka",
            orderSource: "VENDOR_WEBSITE",
            websiteDomainOrSlug: domainOrSlug,
            paymentMethod: normalizedMethod,
            paymentSlipUrl: paymentSlipUrl || null,
            bankReference: bankReference || null,
          };

          const order = await tx.order.create({
            data: {
              orderNumber,
              customerId,
              status: initialOrderStatus,
              subtotal: new Prisma.Decimal(subtotal),
              discountAmount: new Prisma.Decimal(discountAmount),
              shippingAmount: new Prisma.Decimal(shippingAmount),
              totalAmount: new Prisma.Decimal(totalAmount),
              couponId: coupon?.id || null,
              shippingAddressJson: addressSnapshot as any,
              notes: notes
                ? `[Website Direct Order - ${normalizedMethod}] ${notes}`
                : `[Website Direct Order - ${normalizedMethod}]`,
            },
          });

          for (const pItem of preparedItems) {
            await tx.orderItem.create({
              data: {
                orderId: order.id,
                productId: pItem.productId,
                vendorId,
                productSnapshot: pItem.productSnapshot as any,
                variantId: pItem.variantId,
                variantSnapshot: pItem.variantSnapshot as any,
                quantity: pItem.quantity,
                unitPrice: new Prisma.Decimal(pItem.unitPrice),
                totalPrice: new Prisma.Decimal(pItem.totalPrice),
                status: initialOrderStatus,
              },
            });

            if (pItem.isDbProduct) {
              if (pItem.variantId) {
                await tx.productVariant.update({
                  where: { id: pItem.variantId },
                  data: { stock: { decrement: pItem.quantity } },
                });
              }
              await tx.product.update({
                where: { id: pItem.productId },
                data: { stock: { decrement: pItem.quantity } },
              });
            }
          }

          await tx.payment.create({
            data: {
              orderId: order.id,
              paymentMethod: normalizedMethod,
              amount: new Prisma.Decimal(totalAmount),
              currency: "LKR",
              status: "PENDING",
              paymentSlipUrl: paymentSlipUrl || null,
              notificationData: {
                orderSource: "VENDOR_WEBSITE",
                bankReference: bankReference || null,
                customerEmail: shippingAddress.email || null,
                customerPhone: shippingAddress.phone || null,
              } as any,
            },
          });

          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: initialOrderStatus,
              note: `Direct order placed on ${siteData.vendor.businessName} website via ${
                normalizedMethod === "COD" ? "Cash on Delivery (COD)" : "Bank Deposit"
              }`,
            },
          });

          if (coupon) {
            await tx.coupon.update({
              where: { id: coupon.id },
              data: { usageCount: { increment: 1 } },
            });
            await tx.couponUsage.create({
              data: {
                couponId: coupon.id,
                customerId,
                orderId: order.id,
              },
            });
          }

          return order;
        });

        return NextResponse.json({
          success: true,
          data: {
            orderId: createdOrder.id,
            orderNumber: createdOrder.orderNumber,
            status: createdOrder.status,
            paymentMethod: normalizedMethod,
            subtotal,
            discountAmount,
            shippingAmount,
            totalAmount,
            couponCode: coupon?.code || null,
            createdAt: createdOrder.createdAt.toISOString(),
          },
        });
      }
    }

    // Fallback for AdsSeller or Vendor with no DB products yet: store in VendorWebsiteConfig
    const fallbackOrderNumber = `WEB-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;

    const subtotal = items.reduce(
      (sum: number, i: any) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1),
      0
    );
    const shippingAmount =
      freeShippingThreshold > 0 && subtotal >= freeShippingThreshold
        ? 0
        : shippingFeeSetting;
    const totalAmount = subtotal + shippingAmount;

    if (siteData.config?.id) {
      const existingFooter = (siteData.config.footerSection as any) || {};
      const existingDirectOrders = Array.isArray(existingFooter.websiteDirectOrders)
        ? existingFooter.websiteDirectOrders
        : [];

      const newOrderObj = {
        id: `web-order-${Date.now()}`,
        orderNumber: fallbackOrderNumber,
        status: normalizedMethod === "COD" ? "PAYMENT_CONFIRMED" : "PENDING_VERIFICATION",
        paymentMethod: normalizedMethod,
        paymentSlipUrl: paymentSlipUrl || null,
        bankReference: bankReference || null,
        subtotal,
        shippingAmount,
        totalAmount,
        items,
        shippingAddress,
        notes: notes || "",
        createdAt: new Date().toISOString(),
      };

      await (prisma as any).vendorWebsiteConfig.update({
        where: { id: siteData.config.id },
        data: {
          footerSection: {
            ...existingFooter,
            websiteDirectOrders: [newOrderObj, ...existingDirectOrders],
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: fallbackOrderNumber,
        orderNumber: fallbackOrderNumber,
        status: normalizedMethod === "COD" ? "PAYMENT_CONFIRMED" : "PENDING_VERIFICATION",
        paymentMethod: normalizedMethod,
        subtotal,
        shippingAmount,
        totalAmount,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error creating website direct order:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to place order" },
      { status: 500 }
    );
  }
}
