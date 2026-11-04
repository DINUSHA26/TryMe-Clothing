import { prisma } from "@/lib/prisma";
import { removeDomainFromVercel } from "@/lib/vercel-domains";

export const SUBSCRIPTION_VALIDITY_DAYS = 30; // 1 Month validity
export const GRACE_PERIOD_DAYS = 14; // 14 days after expiry before auto domain disconnect & site offline

export interface SubscriptionLifecycleStatus {
  subscription: any | null;
  state: "NO_SUBSCRIPTION" | "ACTIVE" | "EXPIRED_GRACE_PERIOD" | "EXPIRED_DISCONNECTED";
  canEditAndPublish: boolean;
  isLiveAccessible: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  graceEndsAt: string | null;
  daysRemaining: number | null;
  graceDaysRemaining: number | null;
  autoDisconnectedDomain?: string | null;
}

/**
 * Evaluates and enforces the 1-month subscription + 14-day post-expiry grace period lifecycle
 * for a Vendor or AdsSeller website.
 *
 * Rules:
 * 1. Every paid subscription is valid for 1 month (30 days) from `startsAt`.
 * 2. Once `now > expiresAt`:
 *    - Vendor CANNOT update or publish the website in the Website Builder (`canEditAndPublish = false`).
 * 3. If `now > expiresAt + 14 days` (14 days passed after expiry without upgrading/renewing):
 *    - Automatically disconnects the live custom domain (removes from Vercel & deletes DB record).
 *    - Automatically sets `VendorWebsiteConfig.isPublished = false`.
 *    - Marks the subscription status as `EXPIRED`.
 *    - Live website access is blocked (`isLiveAccessible = false`).
 */
export async function evaluateAndEnforceSubscriptionLifecycle(whereClause: {
  vendorId?: string;
  adsSellerId?: string;
  OR?: Array<{ vendorId?: string; adsSellerId?: string }>;
}): Promise<SubscriptionLifecycleStatus> {
  const now = new Date();

  let subscriptionWhere: any = {
    status: { in: ["ACTIVE", "EXPIRED"] },
  };

  if (whereClause.OR && whereClause.OR.length > 0) {
    subscriptionWhere.OR = whereClause.OR;
  } else if (whereClause.vendorId && whereClause.adsSellerId) {
    subscriptionWhere.OR = [
      { vendorId: whereClause.vendorId },
      { adsSellerId: whereClause.adsSellerId },
    ];
  } else if (whereClause.vendorId) {
    subscriptionWhere.vendorId = whereClause.vendorId;
  } else if (whereClause.adsSellerId) {
    subscriptionWhere.adsSellerId = whereClause.adsSellerId;
  }

  // Fetch latest approved/active/expired subscription (ignore PENDING_PAYMENT / REJECTED / PENDING_APPROVAL for active check)
  const latestSub = await (prisma as any).vendorWebsiteSubscription.findFirst({
    where: subscriptionWhere,
    orderBy: { createdAt: "desc" },
  });

  if (!latestSub) {
    return {
      subscription: null,
      state: "NO_SUBSCRIPTION",
      canEditAndPublish: false,
      isLiveAccessible: true, // Free trial / preview mode unless expired
      startsAt: null,
      expiresAt: null,
      graceEndsAt: null,
      daysRemaining: null,
      graceDaysRemaining: null,
    };
  }

  // Ensure startsAt and expiresAt are always populated (1 month = 30 days)
  const startsAtDate = latestSub.startsAt ? new Date(latestSub.startsAt) : new Date(latestSub.createdAt);
  let expiresAtDate = latestSub.expiresAt ? new Date(latestSub.expiresAt) : null;

  if (!expiresAtDate) {
    expiresAtDate = new Date(startsAtDate);
    expiresAtDate.setDate(expiresAtDate.getDate() + SUBSCRIPTION_VALIDITY_DAYS);
    // Persist the computed 1-month expiry date so it's stored in DB
    try {
      await (prisma as any).vendorWebsiteSubscription.update({
        where: { id: latestSub.id },
        data: { startsAt: startsAtDate, expiresAt: expiresAtDate },
      });
      latestSub.startsAt = startsAtDate;
      latestSub.expiresAt = expiresAtDate;
    } catch {
      // ignore if update fails
    }
  }

  // Grace period ends 14 days after expiresAt
  const graceEndsAtDate = new Date(expiresAtDate.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  const msUntilExpiry = expiresAtDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24));

  const msUntilGraceEnd = graceEndsAtDate.getTime() - now.getTime();
  const graceDaysRemaining = Math.max(0, Math.ceil(msUntilGraceEnd / (1000 * 60 * 60 * 24)));

  // CASE 1: Subscription is currently ACTIVE (now <= expiresAt)
  if (msUntilExpiry > 0 && latestSub.status === "ACTIVE") {
    return {
      subscription: latestSub,
      state: "ACTIVE",
      canEditAndPublish: true,
      isLiveAccessible: true,
      startsAt: startsAtDate.toISOString(),
      expiresAt: expiresAtDate.toISOString(),
      graceEndsAt: graceEndsAtDate.toISOString(),
      daysRemaining,
      graceDaysRemaining: GRACE_PERIOD_DAYS,
    };
  }

  // Subscription has passed its 1-month expiry date (now > expiresAt)
  // Mark subscription status as EXPIRED in DB if it was still marked ACTIVE
  if (latestSub.status === "ACTIVE") {
    try {
      await (prisma as any).vendorWebsiteSubscription.update({
        where: { id: latestSub.id },
        data: { status: "EXPIRED" },
      });
      latestSub.status = "EXPIRED";
    } catch {
      // ignore
    }
  }

  // CASE 2: Within 14-Day Grace Period after expiry (expiresAt < now <= graceEndsAt)
  // Cannot edit/publish in Website Builder, but live domain not yet disconnected
  if (msUntilGraceEnd > 0) {
    return {
      subscription: latestSub,
      state: "EXPIRED_GRACE_PERIOD",
      canEditAndPublish: false,
      isLiveAccessible: true,
      startsAt: startsAtDate.toISOString(),
      expiresAt: expiresAtDate.toISOString(),
      graceEndsAt: graceEndsAtDate.toISOString(),
      daysRemaining: 0,
      graceDaysRemaining,
    };
  }

  // CASE 3: More than 14 days past expiry (now > graceEndsAt)
  // Automatically disconnect live custom domain and unpublish website so live site has no access!
  let disconnectedDomainName: string | null = null;
  try {
    let domainWhere: any = {};
    if (whereClause.OR && whereClause.OR.length > 0) {
      domainWhere.OR = whereClause.OR;
    } else if (whereClause.vendorId && whereClause.adsSellerId) {
      domainWhere.OR = [
        { vendorId: whereClause.vendorId },
        { adsSellerId: whereClause.adsSellerId },
      ];
    } else if (whereClause.vendorId) {
      domainWhere.vendorId = whereClause.vendorId;
    } else if (whereClause.adsSellerId) {
      domainWhere.adsSellerId = whereClause.adsSellerId;
    }

    const existingDomain = await (prisma as any).vendorCustomDomain.findFirst({
      where: domainWhere,
    });

    if (existingDomain) {
      disconnectedDomainName = existingDomain.domain;
      try {
        await removeDomainFromVercel(existingDomain.domain);
      } catch (e) {
        console.warn("Failed to remove expired domain from Vercel:", e);
      }
      await (prisma as any).vendorCustomDomain.delete({
        where: { id: existingDomain.id },
      });
    }

    // Also unpublish the website config so the live site is inaccessible
    await (prisma as any).vendorWebsiteConfig.updateMany({
      where: {
        ...domainWhere,
        isPublished: true,
      },
      data: {
        isPublished: false,
      },
    });
  } catch (err) {
    console.error("Error enforcing 14-day post-expiry domain disconnect:", err);
  }

  return {
    subscription: latestSub,
    state: "EXPIRED_DISCONNECTED",
    canEditAndPublish: false,
    isLiveAccessible: false,
    startsAt: startsAtDate.toISOString(),
    expiresAt: expiresAtDate.toISOString(),
    graceEndsAt: graceEndsAtDate.toISOString(),
    daysRemaining: 0,
    graceDaysRemaining: 0,
    autoDisconnectedDomain: disconnectedDomainName,
  };
}
