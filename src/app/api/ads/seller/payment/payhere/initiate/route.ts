import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";
import { generatePaymentHash, getPayHereURL, formatAmount } from "@/lib/payhere";
import { getAppUrl } from "@/lib/env";

/**
 * POST /api/ads/seller/payment/payhere/initiate
 * Initiate a PayHere payment for a plan purchase.
 * Creates an AdsSubscription (PENDING_APPROVAL) + AdsPayment (PENDING).
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);

    // Get seller profile and user details
    const seller = await prisma.adsSeller.findUnique({
      where: { userId: user.userId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Seller profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { success: false, error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Fetch plan
    const plan = await prisma.adsPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { success: false, error: "Selected plan not found or inactive" },
        { status: 404 }
      );
    }

    // Expire any existing PENDING_APPROVAL subscriptions for this seller to avoid duplicate attempts
    await prisma.adsSubscription.updateMany({
      where: { sellerId: seller.id, status: "PENDING_APPROVAL" },
      data: { status: "CANCELLED" },
    });

    // Create subscription (PENDING_APPROVAL) + payment record (PENDING)
    const subscription = await prisma.adsSubscription.create({
      data: {
        sellerId: seller.id,
        planId: plan.id,
        status: "PENDING_APPROVAL",
        adsUsed: 0,
        payment: {
          create: {
            amount: plan.price,
            currency: "LKR",
            status: "PENDING",
            paymentMethod: "PAYHERE",
          },
        },
      },
      include: {
        payment: true,
        plan: { select: { name: true } },
      },
    });

    // Get PayHere credentials
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchantId || !merchantSecret) {
      console.error("PayHere credentials not configured");
      return NextResponse.json(
        {
          success: false,
          error: "Payment gateway not configured. Please contact support.",
        },
        { status: 500 }
      );
    }

    const formattedAmount = formatAmount(plan.price.toNumber());

    // Generate PayHere hash
    // Formula: MD5(merchant_id + order_id + amount + currency + MD5(merchant_secret).toUpperCase()).toUpperCase()
    const hash = generatePaymentHash(
      merchantId,
      subscription.id, // order_id is the subscription.id
      formattedAmount,
      "LKR",
      merchantSecret
    );

    const appUrl = getAppUrl();
    const firstName = seller.user.firstName || "Seller";
    const lastName = seller.user.lastName || "";

    const paymentData = {
      merchant_id: merchantId,
      return_url: `${appUrl}/ads-seller/plans?payment=success&subId=${subscription.id}`,
      cancel_url: `${appUrl}/ads-seller/plans?payment=cancelled`,
      notify_url: `${appUrl}/api/ads/seller/payment/payhere/webhook`,
      order_id: subscription.id,
      items: `Upgrade to ${plan.name}`,
      currency: "LKR",
      amount: formattedAmount,
      first_name: firstName,
      last_name: lastName,
      email: seller.user.email || "",
      phone: seller.phone || "0000000000",
      address: "TryMe Seller Location",
      city: "Colombo",
      country: "Sri Lanka",
      hash: hash,
    };

    // Get PayHere URL (sandbox or live)
    const payhereUrl = getPayHereURL();

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        payhereUrl,
        paymentData,
      },
    });
  } catch (error) {
    console.error("PayHere subscription payment initiation error:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred initiating payment" },
      { status: 500 }
    );
  }
}
