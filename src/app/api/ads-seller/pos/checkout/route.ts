import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);

    const adsSeller = await (prisma as any).adsSeller.findUnique({
      where: { userId: user.userId },
      select: {
        id: true,
        businessName: true,
        businessPhone: true,
        businessEmail: true,
        businessAddress: true,
        logo: true,
      },
    });

    if (!adsSeller) {
      return NextResponse.json({ success: false, error: "Ads seller not found" }, { status: 404 });
    }

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

    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}`;
    const orderNumber = `POS-AD-${datePart}-${Math.floor(100 + Math.random() * 900)}`;

    let calculatedSubtotal = 0;
    let totalItemDiscounts = 0;
    const processedItems = [];

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
        name: item.name,
        variantName: item.variantName || null,
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
    const grandTotal = Math.max(0, calculatedSubtotal - totalDiscounts);
    const changeDue = paymentMethod === "CASH" ? Math.max(0, Number(cashReceived) - grandTotal) : 0;

    return NextResponse.json({
      success: true,
      data: {
        orderNumber,
        items: processedItems,
        subtotal: calculatedSubtotal,
        totalDiscounts,
        grandTotal,
        paymentMethod,
        cashReceived: Number(cashReceived),
        changeDue,
        createdAt: new Date().toISOString(),
        customerInfo: customerInfo || { fullName: "Walk-in Customer" },
        vendor: {
          businessName: adsSeller.businessName || "Ads Store",
          businessPhone: adsSeller.businessPhone || "",
          businessEmail: adsSeller.businessEmail || "",
          businessAddress: adsSeller.businessAddress || "",
          logo: adsSeller.logo || null,
        },
      },
    });
  } catch (error: any) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json({ success: false, error: error.message || "Failed to process POS checkout" }, { status: 400 });
  }
}

