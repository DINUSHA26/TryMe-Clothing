import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFile, uploadImage } from "@/lib/cloudinary";
import { TIER_LIMITS, WebsiteTier } from "@/types/website-builder";
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

    let vendorId: string | null = null;
    let adsSellerId: string | null = null;

    const vendor = await prisma.vendor.findUnique({
      where: { userId },
      select: { id: true, businessName: true },
    });

    if (vendor) {
      vendorId = vendor.id;
    } else {
      const adsSeller = await (prisma as any).adsSeller.findUnique({
        where: { userId },
        select: { id: true, businessName: true },
      });
      if (adsSeller) {
        adsSellerId = adsSeller.id;
      }
    }

    if (!vendorId && !adsSellerId) {
      return NextResponse.json({ success: false, error: "Vendor or Ads Seller account not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const tier = formData.get("tier") as WebsiteTier;
    const slipFile = formData.get("slip") as File | null;

    if (!tier || !TIER_LIMITS[tier]) {
      return NextResponse.json({ success: false, error: "Invalid website tier selected" }, { status: 400 });
    }

    if (!slipFile) {
      return NextResponse.json({ success: false, error: "Bank deposit slip file is required" }, { status: 400 });
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(slipFile.type)) {
      return NextResponse.json({ success: false, error: "Only JPG, PNG, WEBP, and PDF files are allowed" }, { status: 400 });
    }

    if (slipFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File size must be under 5MB" }, { status: 400 });
    }

    // Upload to Cloudinary with fallback
    let bankSlipUrl = "";
    try {
      const bytes = await slipFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      if (slipFile.type === "application/pdf") {
        const uploadResult = await uploadFile(buffer, slipFile.type, "website-subscription-slips");
        bankSlipUrl = uploadResult.url;
      } else {
        const uploadResult = await uploadImage(buffer, "website-subscription-slips");
        bankSlipUrl = uploadResult.url;
      }
    } catch (uploadErr) {
      console.warn("Cloudinary upload failed, using base64 data URL fallback:", uploadErr);
      const bytes = await slipFile.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      bankSlipUrl = `data:${slipFile.type};base64,${base64}`;
    }

    const tierInfo = TIER_LIMITS[tier];

    // Create subscription in PENDING_APPROVAL status
    const subscription = await (prisma as any).vendorWebsiteSubscription.create({
      data: {
        vendorId: vendorId || undefined,
        adsSellerId: adsSellerId || undefined,
        tier,
        status: "PENDING_APPROVAL",
        price: tierInfo.price,
        billingPeriod: "MONTHLY",
        paymentMethod: "BANK_TRANSFER",
        bankSlipUrl: bankSlipUrl,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bank slip submitted successfully! Our admin team will verify and activate your website plan within 2–4 business hours.",
      data: subscription,
    });
  } catch (error: any) {
    console.error("Bank transfer subscription error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process bank slip" }, { status: 500 });
  }
}
