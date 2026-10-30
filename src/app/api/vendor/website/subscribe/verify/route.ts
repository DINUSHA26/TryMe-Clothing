import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    const { subId } = await request.json();
    if (!subId) {
      return NextResponse.json({ success: false, error: "Subscription ID is required" }, { status: 400 });
    }

    const subscription = await prisma.vendorWebsiteSubscription.findUnique({
      where: { id: subId },
      include: {
        vendor: true,
        adsSeller: true,
      },
    });

    if (!subscription) {
      return NextResponse.json({ success: false, error: "Subscription not found" }, { status: 404 });
    }

    // Verify ownership
    const isOwner = (subscription.vendor && subscription.vendor.userId === userId) ||
                    (subscription.adsSeller && subscription.adsSeller.userId === userId);

    if (!isOwner) {
      return NextResponse.json({ success: false, error: "Unauthorized access to subscription" }, { status: 403 });
    }

    // If pending payment, activate it
    if (subscription.status === "PENDING_PAYMENT" || subscription.status === "ACTIVE") {
      const startsAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Expire previous active subscriptions
      if (subscription.vendorId) {
        await prisma.vendorWebsiteSubscription.updateMany({
          where: {
            vendorId: subscription.vendorId,
            id: { not: subId },
            status: "ACTIVE",
          },
          data: { status: "EXPIRED" },
        });
      } else if (subscription.adsSellerId) {
        await prisma.vendorWebsiteSubscription.updateMany({
          where: {
            adsSellerId: subscription.adsSellerId,
            id: { not: subId },
            status: "ACTIVE",
          },
          data: { status: "EXPIRED" },
        });
      }

      const updated = await prisma.vendorWebsiteSubscription.update({
        where: { id: subId },
        data: {
          status: "ACTIVE",
          startsAt,
          expiresAt,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Plan upgraded successfully to ${updated.tier}!`,
        data: updated,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Subscription status: ${subscription.status}`,
      data: subscription,
    });
  } catch (error: any) {
    console.error("Subscription verification error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to verify subscription" }, { status: 500 });
  }
}
