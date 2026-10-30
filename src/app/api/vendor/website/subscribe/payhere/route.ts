import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TIER_LIMITS, WebsiteTier } from "@/types/website-builder";
import { generatePaymentHash, getPayHereURL } from "@/lib/payhere";
import { getAppUrl } from "@/lib/env";
import { getAuthUser } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    let userId = request.headers.get("X-User-Id");
    if (!userId) {
      const authUser = getAuthUser(request);
      userId = authUser?.userId || null;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        vendor: true,
        adsSeller: true,
      },
    });

    if (!user || (!user.vendor && !user.adsSeller)) {
      return NextResponse.json({ success: false, error: "Vendor or seller account not found" }, { status: 404 });
    }

    const body = await request.json();
    const tier = body.tier as WebsiteTier;

    if (!tier || !TIER_LIMITS[tier]) {
      return NextResponse.json({ success: false, error: "Invalid website tier selected" }, { status: 400 });
    }

    const tierInfo = TIER_LIMITS[tier];
    const targetWhere = user.vendor ? { vendorId: user.vendor.id } : { adsSellerId: user.adsSeller!.id };

    // Create a pending subscription
    const subscription = await (prisma as any).vendorWebsiteSubscription.create({
      data: {
        ...targetWhere,
        tier,
        status: "PENDING_PAYMENT",
        price: tierInfo.price,
        billingPeriod: "MONTHLY",
        paymentMethod: "ONLINE_PAYHERE",
      },
    });

    const host = request.headers.get("host") || "";
    const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
    const requestAppUrl = host ? `${protocol}://${host}` : getAppUrl();
    const returnBasePath = user.vendor ? "/vendor/website-builder" : "/ads-seller/website-builder";

    const orderId = `WEB-SUB-${subscription.id}`;

    const merchantId = process.env.PAYHERE_MERCHANT_ID || "1211149";
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || "4Tz9sV2pL8mN";
    const formattedAmount = tierInfo.price.toFixed(2);
    const hash = generatePaymentHash(merchantId, orderId, formattedAmount, "LKR", merchantSecret);

    const storeName = user.vendor?.businessName || user.adsSeller?.businessName || "TryMe Store";

    const payhereData = {
      merchant_id: merchantId,
      return_url: `${requestAppUrl}${returnBasePath}?payment=success&subId=${subscription.id}`,
      cancel_url: `${requestAppUrl}${returnBasePath}?payment=cancelled`,
      notify_url: `${requestAppUrl}/api/vendor/website/subscribe/payhere-webhook`,
      order_id: orderId,
      items: `TryMe Website Builder - ${tierInfo.name}`,
      currency: "LKR",
      amount: formattedAmount,
      first_name: user.firstName || storeName.split(" ")[0] || "Vendor",
      last_name: user.lastName || (storeName.split(" ").slice(1).join(" ") || "Store"),
      email: user.email || "vendor@tryme.lk",
      phone: user.phone || user.vendor?.businessPhone || user.adsSeller?.phone || "0770000000",
      address: user.vendor?.businessAddress || "Colombo, Sri Lanka",
      city: "Colombo",
      country: "Sri Lanka",
      hash: hash,
    };

    return NextResponse.json({
      success: true,
      data: {
        payhereUrl: getPayHereURL(),
        params: payhereData,
        subscriptionId: subscription.id,
      },
    });
  } catch (error: any) {
    console.error("PayHere initiation error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to initiate online payment" }, { status: 500 });
  }
}
