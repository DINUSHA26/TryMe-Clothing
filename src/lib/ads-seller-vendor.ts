import { prisma } from "@/lib/prisma";

/**
 * Ensures an Ads Seller has an associated Vendor record and Wallet
 * so that Coupons, Wallet balance, Transactions, and Payouts work
 * seamlessly with full relational integrity.
 */
export async function getOrCreateAdsSellerVendor(userId: string) {
  let vendor = await prisma.vendor.findUnique({
    where: { userId },
    include: { wallet: true },
  });

  if (!vendor) {
    const seller = await (prisma as any).adsSeller.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!seller) return null;

    const baseSlug = seller.slug || `seller-${Date.now().toString(36)}`;
    let slug = baseSlug;
    const existingSlug = await prisma.vendor.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${baseSlug}-ads`;
    }

    vendor = await prisma.vendor.create({
      data: {
        userId,
        businessName: seller.businessName || `${seller.user.firstName || "Seller"} Store`,
        businessEmail: seller.user.email || `${seller.slug}@tryme.lk`,
        businessPhone: seller.phone || "0770000000",
        slug,
        status: "ACTIVE",
        isShopOpen: true,
      },
      include: { wallet: true },
    });
  }

  // Ensure Wallet exists
  let wallet = vendor.wallet;
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        vendorId: vendor.id,
      },
    });
  }

  return { vendor, wallet };
}
