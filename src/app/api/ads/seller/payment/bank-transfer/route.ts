import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";
import { uploadFile } from "@/lib/cloudinary";

/**
 * POST /api/ads/seller/payment/bank-transfer
 * Upload a bank transfer slip for a plan purchase.
 * Creates an AdsSubscription (PENDING_APPROVAL) + AdsPayment with bankSlipUrl.
 */
export async function POST(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);

    // Get seller profile
    const seller = await prisma.adsSeller.findUnique({
      where: { userId: user.userId },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          take: 1,
        },
      },
    });

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Seller profile not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const planId = formData.get("planId") as string;
    const slipFile = formData.get("slip") as File | null;

    if (!planId || !slipFile) {
      return NextResponse.json(
        { success: false, error: "Plan ID and bank slip are required" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(slipFile.type)) {
      return NextResponse.json(
        { success: false, error: "Only JPG, PNG, and PDF files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (slipFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size must be less than 5MB" },
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

    // Upload slip to Cloudinary
    const arrayBuffer = await slipFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let uploadResult;
    try {
      uploadResult = await uploadFile(buffer, slipFile.type, "ads-plan-slips");
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      return NextResponse.json(
        { success: false, error: "Failed to upload bank slip. Please try again." },
        { status: 500 }
      );
    }

    // Expire any existing PENDING_APPROVAL subscriptions for this seller
    await prisma.adsSubscription.updateMany({
      where: { sellerId: seller.id, status: "PENDING_APPROVAL" },
      data: { status: "CANCELLED" },
    });

    // Create subscription (PENDING_APPROVAL) + payment record
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
            status: "PENDING_APPROVAL",
            paymentMethod: "BANK_TRANSFER",
            bankSlipUrl: uploadResult.url,
          },
        },
      },
      include: {
        payment: true,
        plan: { select: { name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        planName: subscription.plan.name,
        status: "PENDING_APPROVAL",
        message:
          "Your bank transfer slip has been submitted. An admin will verify and activate your plan shortly.",
      },
    });
  } catch (error) {
    console.error("Bank transfer payment error:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred processing your payment" },
      { status: 500 }
    );
  }
}
