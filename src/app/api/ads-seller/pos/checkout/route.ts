import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdsSeller, handleAuthError, getEffectiveAdsSeller } from "@/lib/auth-helpers";
import { getOrCreateAdsSellerVendor, getOrCreateVendorProduct } from "@/lib/ads-seller-vendor";
import { Prisma } from "@prisma/client";

async function generatePosOrderNumber(tx: any): Promise<string> {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const prefix = `POS-AD-${datePart}-`;

  const latestOrder = await tx.order.findFirst({
    where: {
      orderNumber: { startsWith: prefix },
    },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
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

async function resolveOrCreatePosCustomer(
  tx: any,
  customerInfo?: { fullName?: string; phone?: string; email?: string }
): Promise<string> {
  const cleanPhone = customerInfo?.phone?.trim() || "";
  const cleanEmail = customerInfo?.email?.trim().toLowerCase() || "";
  const fullName = customerInfo?.fullName?.trim() || "Walk-in Customer";

  if (cleanEmail) {
    const existing = await tx.user.findUnique({
      where: { email: cleanEmail },
      include: { customer: true },
    });
    if (existing?.customer) return existing.customer.id;
  }

  if (cleanPhone) {
    const existing = await tx.user.findUnique({
      where: { phone: cleanPhone },
      include: { customer: true },
    });
    if (existing?.customer) return existing.customer.id;
  }

  const posIdentifier = `pos_ad_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const fakeEmail = cleanEmail || `${posIdentifier}@pos.tryme.lk`;

  const newUser = await tx.user.create({
    data: {
      email: fakeEmail,
      phone: cleanPhone || null,
      firstName: fullName.split(" ")[0] || "Walk-in",
      lastName: fullName.split(" ").slice(1).join(" ") || "Customer",
      role: "CUSTOMER",
      passwordHash: "POS_WALK_IN_NOPASSWORD",
      emailVerified: true,
      customer: {
        create: {},
      },
    },
    include: {
      customer: true,
    },
  });

  return newUser.customer!.id;
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);

    const effective = await getEffectiveAdsSeller(user.userId);
    if (!effective) {
      return NextResponse.json({ success: false, error: "Ads seller not found" }, { status: 404 });
    }
    const adsSeller = effective.seller;

    const sellerVendor = await getOrCreateAdsSellerVendor(user.userId);
    if (!sellerVendor) {
      return NextResponse.json({ success: false, error: "Seller vendor profile not found" }, { status: 404 });
    }
    const vendor = sellerVendor.vendor;

    const body = await request.json();
    const {
      cartItems,
      customerInfo,
      paymentMethod = "CASH",
      cashReceived = 0,
      overallDiscount = 0,
      overallDiscountType = "FIXED",
      notes = "",
    } = body;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ success: false, error: "Cart is empty" }, { status: 400 });
    }

    let calculatedSubtotal = 0;
    let totalItemDiscounts = 0;
    const processedItems: any[] = [];

    for (const item of cartItems) {
      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      const unitPrice = Number(item.price) || 0;
      const lineRawTotal = unitPrice * quantity;
      const itemDiscount = Math.max(0, Math.min(lineRawTotal, Number(item.discountAmount) || 0));
      const lineFinalTotal = lineRawTotal - itemDiscount;

      calculatedSubtotal += lineRawTotal;
      totalItemDiscounts += itemDiscount;

      processedItems.push({
        id: item.id,
        productId: item.productId || item.id,
        name: item.name || item.title || "Till Item",
        variantName: item.variantName || null,
        variantId: item.variantId || null,
        quantity,
        unitPrice,
        totalPrice: lineFinalTotal,
        itemDiscount,
        image: item.image || item.imageUrl || null,
      });
    }

    let calculatedOverallDiscount = 0;
    if (overallDiscount > 0) {
      if (overallDiscountType === "PERCENTAGE") {
        calculatedOverallDiscount = (calculatedSubtotal * overallDiscount) / 100;
      } else {
        calculatedOverallDiscount = Number(overallDiscount);
      }
    }
    calculatedOverallDiscount = Math.min(
      calculatedSubtotal - totalItemDiscounts,
      calculatedOverallDiscount
    );

    const totalDiscounts = totalItemDiscounts + calculatedOverallDiscount;
    const grandTotal = Math.max(0, calculatedSubtotal - totalDiscounts);
    const changeDue = paymentMethod === "CASH" ? Math.max(0, Number(cashReceived) - grandTotal) : 0;

    // Database transaction to create real Order + OrderItems
    const createdOrder = await prisma.$transaction(async (tx) => {
      const customerId = await resolveOrCreatePosCustomer(tx, customerInfo);
      const orderNumber = await generatePosOrderNumber(tx);
      const fallbackProduct = await getOrCreateVendorProduct(vendor.id, tx);

      const addressSnapshot = {
        label: "In-Store POS Till Walk-In",
        fullName: customerInfo?.fullName?.trim() || "Walk-in Customer",
        phone: customerInfo?.phone?.trim() || "0000000000",
        email: customerInfo?.email?.trim() || "pos@tryme.lk",
        addressLine1: "In-Store Counter",
        city: "Physical Store",
        province: "Store Till",
        postalCode: "00000",
        country: "Sri Lanka",
        orderSource: "POS_WALK_IN",
        paymentMethod: paymentMethod === "CARD" ? "CARD" : "CASH",
        sellerName: adsSeller.businessName || "Ads Store",
      };

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          status: "COMPLETED",
          subtotal: new Prisma.Decimal(calculatedSubtotal),
          discountAmount: new Prisma.Decimal(totalDiscounts),
          shippingAmount: new Prisma.Decimal(0),
          totalAmount: new Prisma.Decimal(grandTotal),
          shippingAddressJson: addressSnapshot as any,
          notes: notes ? `[POS In-Store Walk-in Sale] ${notes}` : "POS In-Store Walk-in Sale",
        },
      });

      for (const item of processedItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: fallbackProduct.id,
            vendorId: vendor.id,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            totalPrice: new Prisma.Decimal(item.totalPrice),
            status: "COMPLETED",
            productSnapshot: {
              id: item.productId,
              name: item.name,
              variantName: item.variantName,
              price: item.unitPrice,
              image: item.image,
              itemType: "POS_ITEM",
            },
            variantSnapshot: item.variantName ? { name: "Variant", value: item.variantName } : undefined,
          },
        });

        // Deduct stock in ClassifiedAd
        try {
          const adId = item.productId;
          const ad = await (tx as any).classifiedAd.findUnique({
            where: { id: adId },
            select: { id: true, specifications: true, sellerId: true },
          });

          if (ad && ad.sellerId === adsSeller.id) {
            const specs = typeof ad.specifications === "object" && ad.specifications ? { ...ad.specifications } : {};
            if (item.variantId && Array.isArray(specs.variants)) {
              const varIdx = specs.variants.findIndex(
                (v: any, i: number) => `${ad.id}-var-${i}` === item.variantId || v.id === item.variantId
              );
              if (varIdx !== -1 && specs.variants[varIdx]) {
                const vStock = specs.variants[varIdx].stock !== undefined ? Number(specs.variants[varIdx].stock) : 10;
                specs.variants[varIdx].stock = Math.max(0, vStock - item.quantity);
              }
            }
            const curStock = specs.stock !== undefined ? Number(specs.stock) : 10;
            specs.stock = Math.max(0, curStock - item.quantity);

            await (tx as any).classifiedAd.update({
              where: { id: ad.id },
              data: { specifications: specs },
            });
          }
        } catch (stockErr) {
          console.warn("Failed to deduct stock for ad item:", stockErr);
        }
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "COMPLETED",
          note: `In-Store POS counter receipt issued (${paymentMethod})`,
        },
      });

      return order;
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        items: processedItems,
        subtotal: calculatedSubtotal,
        totalDiscounts,
        grandTotal,
        paymentMethod,
        cashReceived: Number(cashReceived),
        changeDue,
        createdAt: createdOrder.createdAt.toISOString(),
        customerInfo: customerInfo || { fullName: "Walk-in Customer" },
        vendor: {
          businessName: adsSeller.businessName || "Ads Store",
          businessPhone: adsSeller.phone || "",
          businessEmail: adsSeller.user?.email || "",
          businessAddress: "In-Store Counter",
          logo: null,
        },
      },
    });
  } catch (error: any) {
    console.error("Error in Ads Seller POS checkout:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json({ success: false, error: error.message || "Failed to process POS checkout" }, { status: 400 });
  }
}
