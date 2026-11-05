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

/**
 * Ensures a vendor has at least one general Product record so that
 * custom services, classified ad orders, and POS walk-in items can be
 * linked to OrderItem (which has a strict foreign key constraint to Product).
 *
 * NOTE: This internal placeholder is strictly hidden from public listings
 * (isActive: false, isDraft: true, showOnMarketplace: false, showOnWebsite: false)
 * so it will NEVER appear on the home page, search, or storefront catalogs!
 */
export async function getOrCreateVendorProduct(vendorId: string, tx: any = prisma) {
  let product = await tx.product.findFirst({
    where: { vendorId },
  });

  if (!product) {
    let category = await tx.category.findFirst({
      where: { isActive: true },
    });
    if (!category) {
      category = await tx.category.findFirst();
    }

    if (!category) {
      category = await tx.category.create({
        data: {
          name: "General",
          slug: `general-${Date.now().toString(36)}`,
          description: "General Category",
          isActive: true,
        },
      });
    }

    const uniqueSlug = `internal-catalog-${vendorId.slice(-6)}-${Date.now().toString(36)}`;

    product = await tx.product.create({
      data: {
        vendorId,
        categoryId: category.id,
        name: "Store Internal Catalog Item",
        slug: uniqueSlug,
        description: "Internal record for direct, marketplace, and POS order persistence",
        price: 0,
        stock: 99999,
        isActive: false,
        isDraft: true,
        showOnWebsite: false,
        showOnMarketplace: false,
      },
    });
  }

  return product;
}
