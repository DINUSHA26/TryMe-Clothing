import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor, handleAuthError, getEffectiveVendor } from "@/lib/auth-helpers";
import { OrderStatus, PaymentStatus } from "@prisma/client";

async function generatePosOrderNumber(tx: any): Promise<string> {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const prefix = `POS-${datePart}-`;

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

  const posIdentifier = `pos_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
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
    const user = requireVendor(request);

    const effective = await getEffectiveVendor(user.userId);
    if (!effective) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
    }
    const vendor = effective.vendor;

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

    const result = await prisma.$transaction(async (tx) => {
      const processedItems = [];
      let calculatedSubtotal = 0;
      let totalItemDiscounts = 0;

      for (const item of cartItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: {
            images: { take: 1, orderBy: { position: "asc" } },
            variants: { where: { id: item.variantId || undefined } },
          },
        });

        if (!product || product.vendorId !== vendor.id) {
          throw new Error(`Product not found or unauthorized: ${item.name || item.productId}`);
        }

        const quantity = Math.max(1, parseInt(item.quantity) || 1);
        let unitPrice = Number(product.price);
        let variantSnapshot = null;

        if (item.variantId) {
          const variant = product.variants.find((v) => v.id === item.variantId);
          if (!variant) {
            throw new Error(`Variant not found for product "${product.name}"`);
          }

          if (variant.stock < quantity) {
            throw new Error(
              `Insufficient stock for "${product.name} (${variant.value})". Available: ${variant.stock}, Requested: ${quantity}`
            );
          }

          unitPrice = Number(product.price) + Number(variant.priceAdjustment || 0);
          variantSnapshot = {
            id: variant.id,
            name: variant.name,
            value: variant.value,
            sku: variant.sku,
          };

          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: { decrement: quantity } },
          });
        } else {
          if (product.stock < quantity) {
            throw new Error(
              `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${quantity}`
            );
          }

          await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: quantity } },
          });
        }

        const lineRawTotal = unitPrice * quantity;
        const itemDiscount = Math.max(0, Math.min(lineRawTotal, Number(item.discountAmount) || 0));
        const lineFinalTotal = lineRawTotal - itemDiscount;

        calculatedSubtotal += lineRawTotal;
        totalItemDiscounts += itemDiscount;

        processedItems.push({
          productId: product.id,
          productSnapshot: {
            id: product.id,
            name: product.name,
            sku: product.sku,
            images: product.images.map((img) => img.url),
          },
          variantSnapshot,
          quantity,
          unitPrice,
          totalPrice: lineFinalTotal,
          itemDiscount,
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
      const finalGrandTotal = Math.max(0, calculatedSubtotal - totalDiscounts);

      const changeDue =
        paymentMethod === "CASH" ? Math.max(0, Number(cashReceived) - finalGrandTotal) : 0;

      const customerId = await resolveOrCreatePosCustomer(tx, customerInfo);
      const orderNumber = await generatePosOrderNumber(tx);

      const shippingAddressJson = {
        fullName: customerInfo?.fullName || "Walk-in Customer",
        phone: customerInfo?.phone || "",
        addressLine1: "In-Store Purchase",
        city: vendor.businessAddress || "In-Store",
        province: "Local",
        postalCode: "00000",
        country: "Sri Lanka",
        orderSource: "POS_WALK_IN",
        paymentMethod,
        cashReceived: Number(cashReceived),
        changeDue,
        overallDiscount: calculatedOverallDiscount,
        totalItemDiscounts,
        cashier: vendor.businessName,
      };

      const order = await tx.order.create({
        data: {
          customerId,
          orderNumber,
          totalAmount: finalGrandTotal,
          subtotal: calculatedSubtotal,
          discountAmount: totalDiscounts,
          shippingAmount: 0,
          status: "COMPLETED" as OrderStatus,
          shippingAddressJson,
          notes: notes || "POS In-Store Walk-in Sale",
          items: {
            create: processedItems.map((item) => ({
              vendorId: vendor.id,
              productId: item.productId,
              productSnapshot: item.productSnapshot,
              variantSnapshot: item.variantSnapshot || undefined,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              status: "DELIVERED",
              shippedAt: new Date(),
            })),
          },
          payment: {
            create: {
              paymentMethod: paymentMethod === "CARD" ? "CARD" : "CASH",
              amount: finalGrandTotal,
              status: "COMPLETED" as PaymentStatus,
              paidAt: new Date(),
            },
          },
        },
        include: {
          items: true,
        },
      });

      return {
        order,
        items: processedItems,
        subtotal: calculatedSubtotal,
        totalDiscounts,
        grandTotal: finalGrandTotal,
        cashReceived: Number(cashReceived),
        changeDue,
        orderNumber,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        vendor: {
          businessName: vendor.businessName,
          businessPhone: vendor.businessPhone,
          businessEmail: vendor.businessEmail,
          businessAddress: vendor.businessAddress,
          logo: vendor.logo,
        },
      },
    });
  } catch (error: any) {
    console.error("[POS Checkout API] Error:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process POS checkout" },
      { status: 400 }
    );
  }
}
