import { prisma } from "@/lib/prisma";

export interface ResolvedWebsiteEntity {
  type: "VENDOR" | "ADS_SELLER";
  entity: any;
  userRole: string;
  vendorId?: string;
  adsSellerId?: string;
  primaryWhere: { vendorId: string } | { adsSellerId: string };
  flexibleWhere:
    | { OR: Array<{ vendorId?: string; adsSellerId?: string }> }
    | { vendorId: string }
    | { adsSellerId: string };
}

/**
 * Accurately resolves whether the authenticated user is operating primarily
 * as an ADS_SELLER or a VENDOR, preventing shadow vendor accounts
 * (auto-generated for Ads Sellers for Wallet / Coupons / Orders) from hijacking
 * their identity or causing website subscriptions to be missed.
 */
export async function resolveWebsiteEntity(userId: string): Promise<ResolvedWebsiteEntity | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      vendor: {
        select: {
          id: true,
          businessName: true,
          slug: true,
          logo: true,
          banner: true,
          businessPhone: true,
          businessEmail: true,
          businessAddress: true,
        },
      },
      adsSeller: {
        select: {
          id: true,
          businessName: true,
          slug: true,
          phone: true,
          contactInfo: true,
        },
      },
      staffMember: {
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              slug: true,
              logo: true,
              banner: true,
              businessPhone: true,
              businessEmail: true,
              businessAddress: true,
            },
          },
          adsSeller: {
            select: {
              id: true,
              businessName: true,
              slug: true,
              phone: true,
              contactInfo: true,
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  const vendor = user.vendor || user.staffMember?.vendor;
  const adsSeller = user.adsSeller || user.staffMember?.adsSeller;

  const vendorId = vendor?.id;
  const adsSellerId = adsSeller?.id;

  const flexibleWhere =
    vendorId && adsSellerId
      ? {
          OR: [{ vendorId }, { adsSellerId }],
        }
      : vendorId
      ? { vendorId }
      : adsSellerId
      ? { adsSellerId }
      : { vendorId: "none" };

  // 1. If user is ADS_SELLER, AdsSeller is primary!
  if (user.role === "ADS_SELLER" && adsSeller) {
    return {
      type: "ADS_SELLER",
      entity: adsSeller,
      userRole: user.role,
      vendorId,
      adsSellerId,
      primaryWhere: { adsSellerId: adsSeller.id },
      flexibleWhere,
    };
  }

  // 2. If user is VENDOR, Vendor is primary!
  if (user.role === "VENDOR" && vendor) {
    return {
      type: "VENDOR",
      entity: vendor,
      userRole: user.role,
      vendorId,
      adsSellerId,
      primaryWhere: { vendorId: vendor.id },
      flexibleWhere,
    };
  }

  // 3. Fallbacks:
  if (adsSeller) {
    return {
      type: "ADS_SELLER",
      entity: adsSeller,
      userRole: user.role,
      vendorId,
      adsSellerId,
      primaryWhere: { adsSellerId: adsSeller.id },
      flexibleWhere,
    };
  }

  if (vendor) {
    return {
      type: "VENDOR",
      entity: vendor,
      userRole: user.role,
      vendorId,
      adsSellerId,
      primaryWhere: { vendorId: vendor.id },
      flexibleWhere,
    };
  }

  return null;
}

