import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getOrCreateAdsSellerVendor, getOrCreateVendorProduct } from "@/lib/ads-seller-vendor";

async function generateMarketplaceOrderNumber(tx: any): Promise<string> {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const prefix = `TRYME-${datePart}-`;

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

async function resolveOrCreateCustomer(
  tx: any,
  customerInfo: { fullName: string; phone: string; email?: string }
): Promise<string> {
  const cleanEmail = customerInfo.email?.trim().toLowerCase() || null;
  const cleanPhone = customerInfo.phone.trim();

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

  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const fallbackEmail = cleanEmail || `customer_${Date.now()}_${randomSuffix}@tryme.lk`;

  const newUser = await tx.user.create({
    data: {
      email: fallbackEmail,
      phone: cleanPhone || null,
      firstName: customerInfo.fullName.split(" ")[0] || "Guest",
      lastName: customerInfo.fullName.split(" ").slice(1).join(" ") || "Buyer",
      role: "CUSTOMER",
      passwordHash: "MARKETPLACE_GUEST_NOPASSWORD",
      emailVerified: true,
      customer: {
        create: {},
      },
    },
    include: { customer: true },
  });

  return newUser.customer!.id;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ adId: string }> }
) {
  try {
    const { adId } = await context.params;

    const ad = await (prisma as any).classifiedAd.findUnique({
      where: { id: adId },
      include: {
        seller: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            user: { select: { id: true, email: true } },
          },
        },
      },
    });

    if (!ad || ad.status !== "ACTIVE") {
      return NextResponse.json({ success: false, error: "Item not found or not active" }, { status: 404 });
    }

    if (ad.showOnMarketplace === false) {
      return NextResponse.json({
        success: false,
        error: "This item is not currently enabled for online marketplace purchase.",
      }, { status: 400 });
    }

    if (!ad.price || Number(ad.price) <= 0) {
      return NextResponse.json({
        success: false,
        error: "Contact the seller directly to negotiate the price.",
      }, { status: 400 });
    }

    const body = await request.json();
    const {
      fullName,
      phone,
      email,
      addressLine1,
      city,
      district,
      paymentMethod = "COD",
      quantity = 1,
      notes = "",
    } = body;

    if (!fullName?.trim() || !phone?.trim() || !addressLine1?.trim() || !city?.trim()) {
      return NextResponse.json({
        success: false,
        error: "Please fill in all delivery details (Name, Phone, Address, City).",
      }, { status: 400 });
    }

    const orderQty = Math.max(1, parseInt(quantity) || 1);
    const unitPrice = Number(ad.price);
    const subtotal = unitPrice * orderQty;
    const shippingFee = 0; // standard / free marketplace delivery
    const totalAmount = subtotal + shippingFee;

    // Platform commission (10% default platform commission on marketplace sales)
    const platformCommissionRate = 10;
    const commissionAmount = (subtotal * platformCommissionRate) / 100;
    const sellerEarnings = subtotal - commissionAmount;

    // Check stock if available
    const specs = (typeof ad.specifications === "object" && ad.specifications) ? { ...ad.specifications } : {};
    const curStock = specs.stock !== undefined ? Number(specs.stock) : 10;

    if (curStock < orderQty) {
      return NextResponse.json({
        success: false,
        error: `Insufficient stock. Only ${curStock} available.`,
      }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Decrement stock
      specs.stock = Math.max(0, curStock - orderQty);
      await tx.classifiedAd.update({
        where: { id: ad.id },
        data: { specifications: specs },
      });

      // 2. Resolve Customer
      const customerId = await resolveOrCreateCustomer(tx, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email?.trim(),
      });

      // 3. Generate Order Number
      const orderNumber = await generateMarketplaceOrderNumber(tx);

      // 4. Create address snapshot
      const addressSnapshot = {
        label: "TryMe Marketplace Online Order",
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email?.trim() || "",
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        district: district?.trim() || "Western",
        country: "Sri Lanka",
        orderSource: "TRYME_MARKETPLACE",
        paymentMethod: paymentMethod === "BANK_TRANSFER" ? "BANK_TRANSFER" : "COD",
        commissionRate: platformCommissionRate,
        commissionAmount,
        sellerEarnings,
        adId: ad.id,
        adTitle: ad.title,
        sellerName: ad.seller.businessName || "Ads Seller",
      };

      // 5. Create Order
      const initialStatus = paymentMethod === "BANK_TRANSFER" ? "PENDING_VERIFICATION" : "PROCESSING";
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          status: initialStatus,
          subtotal: new Prisma.Decimal(subtotal),
          discountAmount: new Prisma.Decimal(0),
          shippingAmount: new Prisma.Decimal(shippingFee),
          totalAmount: new Prisma.Decimal(totalAmount),
          shippingAddressJson: addressSnapshot as any,
          notes: `[TryMe Marketplace Order] Ad: "${ad.title}" (Qty: ${orderQty}). ${notes}`.trim(),
        },
      });

      // 6. Create OrderItem linked to Seller's Vendor record
      const sellerUserId = ad.seller?.user?.id;
      let vendorId: string | null = null;
      if (sellerUserId) {
        const sellerVendor = await getOrCreateAdsSellerVendor(sellerUserId);
        if (sellerVendor) {
          vendorId = sellerVendor.vendor.id;
        }
      }

      if (vendorId) {
        const fallbackProduct = await getOrCreateVendorProduct(vendorId, tx);
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: fallbackProduct.id,
            vendorId,
            quantity: orderQty,
            unitPrice: new Prisma.Decimal(unitPrice),
            totalPrice: new Prisma.Decimal(subtotal),
            status: initialStatus,
            productSnapshot: {
              id: ad.id,
              name: ad.title,
              image: ad.images?.[0] || null,
              price: unitPrice,
              adId: ad.id,
              sellerName: ad.seller.businessName,
              itemType: "MARKETPLACE_AD",
            },
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: newOrder.id,
            status: initialStatus,
            note: `Online marketplace order placed on TryMe.lk via ${paymentMethod === "BANK_TRANSFER" ? "Bank Transfer" : "Cash on Delivery"}`,
          },
        });
      }

      return {
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        totalAmount,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        orderNumber: result.orderNumber,
        totalAmount: result.totalAmount,
        adTitle: ad.title,
        sellerName: ad.seller.businessName || "TryMe Verified Seller",
      },
      message: "Order placed successfully! We will coordinate shipping and delivery.",
    });
  } catch (error: any) {
    console.error("Marketplace ad order error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to place marketplace order",
    }, { status: 500 });
  }
}

