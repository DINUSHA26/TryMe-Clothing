import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { evaluateAndEnforceSubscriptionLifecycle } from "@/lib/website-subscription-guard";
import { TIER_LIMITS, WebsiteTier } from "@/types/website-builder";

const TIER_RANK: Record<string, number> = {
  ONE_PAGE: 1,
  SIX_PAGES: 2,
  TWELVE_PAGES: 3,
};

const TIER_NAME: Record<string, string> = {
  ONE_PAGE: "1-Page Website",
  SIX_PAGES: "6-Page Website",
  TWELVE_PAGES: "12-Page Website",
};

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    // Proactively evaluate any active subscriptions whose 1-month validity has passed
    const overdueSubs = await (prisma as any).vendorWebsiteSubscription.findMany({
      where: {
        status: { in: ["ACTIVE", "EXPIRED"] },
        expiresAt: { lt: new Date() },
      },
      select: { vendorId: true, adsSellerId: true },
    });

    for (const s of overdueSubs) {
      const whereClause = s.vendorId ? { vendorId: s.vendorId } : s.adsSellerId ? { adsSellerId: s.adsSellerId } : null;
      if (whereClause) {
        await evaluateAndEnforceSubscriptionLifecycle(whereClause);
      }
    }

    const [subscriptions, domains] = await Promise.all([
      (prisma as any).vendorWebsiteSubscription.findMany({
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
      }),
      (prisma as any).vendorCustomDomain.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Group subscriptions by unique subscriber (Vendor or Ads Seller) so the same subscriber is never duplicated
    const subscriberMap = new Map<string, any[]>();
    for (const sub of subscriptions) {
      const key = sub.vendorId
        ? `vendor:${sub.vendorId}`
        : sub.adsSellerId
        ? `adsSeller:${sub.adsSellerId}`
        : `sub:${sub.id}`;
      const existing = subscriberMap.get(key) || [];
      existing.push(sub);
      subscriberMap.set(key, existing);
    }

    const subscribers: any[] = [];

    for (const [subscriberKey, rawHistory] of subscriberMap.entries()) {
      // Sort oldest -> newest to build accurate upgrade & renewal timeline
      const chronological = [...rawHistory].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      let prevApprovedSub: any = null;
      const annotatedChronological = chronological.map((item, idx) => {
        const currRank = TIER_RANK[item.tier] || 1;
        const currName = TIER_NAME[item.tier] || item.tier;
        let eventType: "INITIAL" | "UPGRADE" | "DOWNGRADE" | "RENEWAL" = "INITIAL";
        let transitionLabel = `Initial Plan: ${currName}`;
        let fromTier: string | null = null;

        if (idx > 0 && prevApprovedSub) {
          const prevRank = TIER_RANK[prevApprovedSub.tier] || 1;
          const prevName = TIER_NAME[prevApprovedSub.tier] || prevApprovedSub.tier;
          fromTier = prevApprovedSub.tier;

          if (currRank > prevRank) {
            eventType = "UPGRADE";
            transitionLabel = `Upgraded: ${prevName} → ${currName}`;
          } else if (currRank < prevRank) {
            eventType = "DOWNGRADE";
            transitionLabel = `Changed Plan: ${prevName} → ${currName}`;
          } else {
            eventType = "RENEWAL";
            transitionLabel = `Renewed Plan: ${currName} (+30 Days)`;
          }
        }

        // Check if a newer ACTIVE or EXPIRED subscription superseded this one
        const hasNewerActiveOrApproved = chronological
          .slice(idx + 1)
          .some((later) => later.status === "ACTIVE" || later.status === "EXPIRED");

        const displayStatus =
          item.status === "EXPIRED" && hasNewerActiveOrApproved
            ? "SUPERSEDED_BY_UPGRADE"
            : item.status;

        if (item.status === "ACTIVE" || item.status === "EXPIRED") {
          prevApprovedSub = item;
        }

        return {
          ...item,
          stepNumber: idx + 1,
          eventType,
          transitionLabel,
          fromTier,
          toTier: item.tier,
          displayStatus,
          replacedByNewerPlan: hasNewerActiveOrApproved,
        };
      });

      // Reverse for newest-first display while keeping chronological available
      const historyNewestFirst = [...annotatedChronological].reverse();

      // Determine the primary current subscription for this subscriber:
      // 1. ACTIVE subscription if one exists
      // 2. Otherwise PENDING_APPROVAL subscription if one exists
      // 3. Otherwise the most recent subscription
      const activeSub = historyNewestFirst.find((s) => s.status === "ACTIVE") || null;
      const pendingSub = historyNewestFirst.find((s) => s.status === "PENDING_APPROVAL") || null;
      const currentSub = activeSub || pendingSub || historyNewestFirst[0];

      const firstItem = currentSub || historyNewestFirst[0];
      const isVendor = Boolean(firstItem?.vendorId);
      const entity = isVendor
        ? {
            id: firstItem.vendor?.id || firstItem.vendorId,
            businessName: firstItem.vendor?.businessName || "Vendor Store",
            slug: firstItem.vendor?.slug || "",
            email: firstItem.vendor?.businessEmail || "",
            phone: firstItem.vendor?.businessPhone || "",
            logo: firstItem.vendor?.logo || null,
          }
        : {
            id: firstItem.adsSeller?.id || firstItem.adsSellerId,
            businessName: firstItem.adsSeller?.businessName || "Ads Seller Store",
            slug: firstItem.adsSeller?.slug || "",
            email: "",
            phone: firstItem.adsSeller?.phone || "",
            logo: null,
          };

      const matchedDomain = domains.find((d: any) =>
        isVendor ? d.vendorId === entity.id : d.adsSellerId === entity.id
      );

      const paidHistory = annotatedChronological.filter(
        (s) => s.status === "ACTIVE" || s.status === "EXPIRED"
      );
      const totalSpent = paidHistory.reduce((sum, s) => sum + Number(s.price || 0), 0);
      const upgradeCount = annotatedChronological.filter((s) => s.eventType === "UPGRADE").length;
      const renewalCount = annotatedChronological.filter((s) => s.eventType === "RENEWAL").length;

      // Build concise plan journey path (e.g. ["ONE_PAGE", "SIX_PAGES", "TWELVE_PAGES"])
      const planJourney = annotatedChronological.map((s) => ({
        id: s.id,
        tier: s.tier,
        tierName: TIER_NAME[s.tier] || s.tier,
        price: Number(s.price || 0),
        paymentMethod: s.paymentMethod,
        status: s.status,
        displayStatus: s.displayStatus,
        eventType: s.eventType,
        transitionLabel: s.transitionLabel,
        createdAt: s.createdAt,
        startsAt: s.startsAt,
        expiresAt: s.expiresAt,
        bankSlipUrl: s.bankSlipUrl,
      }));

      subscribers.push({
        subscriberKey,
        entityType: isVendor ? "VENDOR" : "ADS_SELLER",
        entity,
        currentSubscription: currentSub,
        activeSubscription: activeSub,
        pendingSubscription: pendingSub,
        customDomain: matchedDomain || null,
        totalTransactions: annotatedChronological.length,
        totalSpent,
        upgradeCount,
        renewalCount,
        planJourney,
        history: historyNewestFirst,
      });
    }

    // Sort subscribers: those with PENDING_APPROVAL first, then ACTIVE, then most recent activity
    subscribers.sort((a, b) => {
      if (Boolean(a.pendingSubscription) !== Boolean(b.pendingSubscription)) {
        return a.pendingSubscription ? -1 : 1;
      }
      if (Boolean(a.activeSubscription) !== Boolean(b.activeSubscription)) {
        return a.activeSubscription ? -1 : 1;
      }
      const dateA = new Date(a.currentSubscription?.createdAt || 0).getTime();
      const dateB = new Date(b.currentSubscription?.createdAt || 0).getTime();
      return dateB - dateA;
    });

    // Calculate KPI Stats based on unique subscribers & active subscriptions
    const activeSubscribers = subscribers.filter((s) => Boolean(s.activeSubscription));
    const pendingSubs = subscriptions.filter((s: any) => s.status === "PENDING_APPROVAL");
    const totalMRR = activeSubscribers.reduce(
      (acc: number, s: any) => acc + Number(s.activeSubscription?.price || 0),
      0
    );
    const totalLifetimeRevenue = subscriptions
      .filter((s: any) => s.status === "ACTIVE" || s.status === "EXPIRED")
      .reduce((acc: number, s: any) => acc + Number(s.price || 0), 0);

    return NextResponse.json({
      success: true,
      data: subscriptions,
      subscribers,
      stats: {
        totalSubscribers: subscribers.length,
        totalSubscriptions: subscriptions.length,
        activeCount: activeSubscribers.length,
        pendingCount: pendingSubs.length,
        totalMRR,
        totalLifetimeRevenue,
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
    const { subscriptionId, action, rejectionReason, newTier } = body;

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

      return NextResponse.json({
        success: true,
        message: "Subscription approved and activated for 1 Month (30 days)!",
        data: updated,
      });
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
    } else if (action === "EXTEND_30_DAYS") {
      const now = new Date();
      const baseDate = sub.expiresAt && new Date(sub.expiresAt) > now ? new Date(sub.expiresAt) : now;
      const nextExpiry = new Date(baseDate);
      nextExpiry.setDate(nextExpiry.getDate() + 30);

      if (sub.vendorId) {
        await (prisma as any).vendorWebsiteSubscription.updateMany({
          where: { vendorId: sub.vendorId, id: { not: subscriptionId }, status: "ACTIVE" },
          data: { status: "EXPIRED" },
        });
      } else if (sub.adsSellerId) {
        await (prisma as any).vendorWebsiteSubscription.updateMany({
          where: { adsSellerId: sub.adsSellerId, id: { not: subscriptionId }, status: "ACTIVE" },
          data: { status: "EXPIRED" },
        });
      }

      const updated = await (prisma as any).vendorWebsiteSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: "ACTIVE",
          startsAt: sub.startsAt || now,
          expiresAt: nextExpiry,
          approvedByAdmin: adminUser.userId,
          approvedAt: now,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Subscription extended by 30 days!",
        data: updated,
      });
    } else if (action === "CHANGE_TIER" && newTier && TIER_LIMITS[newTier as WebsiteTier]) {
      const tierMeta = TIER_LIMITS[newTier as WebsiteTier];
      const startsAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Mark previous active subscriptions as EXPIRED (superseded by upgrade)
      if (sub.vendorId) {
        await (prisma as any).vendorWebsiteSubscription.updateMany({
          where: { vendorId: sub.vendorId, status: "ACTIVE" },
          data: { status: "EXPIRED" },
        });
      } else if (sub.adsSellerId) {
        await (prisma as any).vendorWebsiteSubscription.updateMany({
          where: { adsSellerId: sub.adsSellerId, status: "ACTIVE" },
          data: { status: "EXPIRED" },
        });
      }

      // Create a new subscription record so the upgrade history is preserved accurately
      const created = await (prisma as any).vendorWebsiteSubscription.create({
        data: {
          vendorId: sub.vendorId || null,
          adsSellerId: sub.adsSellerId || null,
          tier: newTier,
          price: tierMeta.price,
          paymentMethod: sub.paymentMethod || "ONLINE_PAYHERE",
          status: "ACTIVE",
          approvedByAdmin: adminUser.userId,
          approvedAt: startsAt,
          startsAt,
          expiresAt,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Subscriber upgraded/changed to ${tierMeta.name} for 30 days!`,
        data: created,
      });
    } else if (action === "EXPIRE_NOW") {
      const updated = await (prisma as any).vendorWebsiteSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: "EXPIRED",
          expiresAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Subscription marked as expired.",
        data: updated,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
