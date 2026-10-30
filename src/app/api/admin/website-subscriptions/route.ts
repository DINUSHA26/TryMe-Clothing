import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const subscriptions = await (prisma as any).vendorWebsiteSubscription.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            businessEmail: true,
            businessPhone: true,
            logo: true,
          },
        },
        adsSeller: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            phone: true,
          },
        },
      },
    });

    // Calculate KPI Stats
    const activeSubs = subscriptions.filter((s: any) => s.status === "ACTIVE");
    const pendingSubs = subscriptions.filter((s: any) => s.status === "PENDING_APPROVAL");
    const totalMRR = activeSubs.reduce((acc: number, s: any) => acc + Number(s.price || 0), 0);

    return NextResponse.json({
      success: true,
      data: subscriptions,
      stats: {
        totalSubscriptions: subscriptions.length,
        activeCount: activeSubs.length,
        pendingCount: pendingSubs.length,
        totalMRR,
      },
    });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminUser = requireAdmin(request);
    const body = await request.json();
    const { subscriptionId, action, rejectionReason } = body;

    if (!subscriptionId || !action) {
      return NextResponse.json({ success: false, error: "Subscription ID and action are required" }, { status: 400 });
    }

    const sub = await (prisma as any).vendorWebsiteSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!sub) {
      return NextResponse.json({ success: false, error: "Subscription not found" }, { status: 404 });
    }

    if (action === "APPROVE") {
      const startsAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      if (sub.vendorId) {
        await (prisma as any).vendorWebsiteSubscription.updateMany({
          where: {
            vendorId: sub.vendorId,
            id: { not: subscriptionId },
            status: "ACTIVE",
          },
          data: { status: "EXPIRED" },
        });
      } else if (sub.adsSellerId) {
        await (prisma as any).vendorWebsiteSubscription.updateMany({
          where: {
            adsSellerId: sub.adsSellerId,
            id: { not: subscriptionId },
            status: "ACTIVE",
          },
          data: { status: "EXPIRED" },
        });
      }

      const updated = await (prisma as any).vendorWebsiteSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: "ACTIVE",
          approvedByAdmin: adminUser.userId,
          approvedAt: new Date(),
          startsAt,
          expiresAt,
          rejectionReason: null,
        },
      });

      return NextResponse.json({ success: true, message: "Subscription approved and activated for 30 days!", data: updated });
    } else if (action === "REJECT") {
      const updated = await (prisma as any).vendorWebsiteSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: "REJECTED",
          approvedByAdmin: adminUser.userId,
          rejectionReason: rejectionReason || "Payment verification failed / bank slip invalid.",
        },
      });

      return NextResponse.json({ success: true, message: "Subscription rejected.", data: updated });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
