import { prisma } from "@/lib/prisma";
import { getEffectiveAdsSeller } from "@/lib/auth-helpers";

/**
 * Ensures an Ads Seller has an associated Vendor record and Wallet
 * so that Coupons, Wallet balance, Transactions, and Payouts work
 * seamlessly with full relational integrity.
 */
export async function getOrCreateAdsSellerVendor(userId: string) {
  const effective = await getEffectiveAdsSeller(userId);
  if (!effective) return null;
  const seller = effective.seller;
  const ownerUserId = seller.userId;

  let vendor = await prisma.vendor.findUnique({
    where: { userId: ownerUserId },
    include: { wallet: true },
  });

  if (!vendor) {
    const baseSlug = seller.slug || `seller-${Date.now().toString(36)}`;
    let slug = baseSlug;
    const existingSlug = await prisma.vendor.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${baseSlug}-ads`;
    }

    vendor = await prisma.vendor.create({
      data: {
        userId: ownerUserId,
        businessName: seller.businessName || "Seller Store",
        businessEmail: `${seller.slug || "seller"}@tryme.lk`,
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

/**
 * Finds or creates a matching storefront Category (prisma.category)
 * for an ad's classifieds category name/slug.
 */
export async function findOrCreateStoreCategory(categoryName?: string, categorySlug?: string) {
  const targetName = categoryName?.trim() || "General";
  const targetSlug = (categorySlug?.trim() || targetName.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/^-|-$/g, "");

  let category = await prisma.category.findFirst({
    where: {
      OR: [
        { name: { equals: targetName, mode: "insensitive" } },
        { slug: { equals: targetSlug, mode: "insensitive" } },
      ],
    },
  });

  if (!category) {
    // Generate unique slug
    let uniqueSlug = targetSlug;
    const exists = await prisma.category.findUnique({ where: { slug: uniqueSlug } });
    if (exists) {
      uniqueSlug = `${targetSlug}-${Date.now().toString(36).slice(-4)}`;
    }

    category = await prisma.category.create({
      data: {
        name: targetName,
        slug: uniqueSlug,
        description: `${targetName} collection on TryMe Shop`,
        isActive: true,
      },
    });
  }

  return category;
}

/**
 * Synchronizes an Ads Seller item (from classified ad or standalone product)
 * to the storefront Product table (Shop by Category /prisma.product)
 * when TryMe Shop is enabled or disabled.
 */
export async function syncAdsSellerItemToStorefront({
  ownerUserId,
  adId,
  title,
  description,
  price,
  images = [],
  categoryName,
  categorySlug,
  showOnWebsite = true,
  specs = {},
  showInTryMeShop,
}: {
  ownerUserId: string;
  adId?: string;
  title: string;
  description?: string;
  price?: number | null;
  images?: string[];
  categoryName?: string;
  categorySlug?: string;
  showOnWebsite?: boolean;
  specs: any;
  showInTryMeShop: boolean;
}) {
  const currentSpecs = { ...specs };

  if (showInTryMeShop) {
    const vendorResult = await getOrCreateAdsSellerVendor(ownerUserId);
    if (!vendorResult) {
      throw new Error("Unable to create or load vendor profile for this ads seller");
    }
    const { vendor } = vendorResult;
    const storeCategory = await findOrCreateStoreCategory(categoryName, categorySlug);

    const safePrice = price !== undefined && price !== null ? Number(price) : 0;
    const safeStock = currentSpecs.stock !== undefined ? Number(currentSpecs.stock) : 10;
    const safeSku = currentSpecs.sku || (adId ? `AD-${adId.slice(-6).toUpperCase()}` : `PRD-${Date.now().toString(36).toUpperCase()}`);
    const safeDesc = description?.trim() || title.trim();

    let product = null;
    if (currentSpecs.linkedProductId) {
      product = await prisma.product.findUnique({
        where: { id: currentSpecs.linkedProductId },
      });
    }

    if (product) {
      // Update existing storefront product
      await prisma.product.update({
        where: { id: product.id },
        data: {
          name: title.trim(),
          description: safeDesc,
          price: safePrice,
          stock: safeStock,
          categoryId: storeCategory.id,
          isActive: true,
          isDisabledByAdmin: false,
          showOnMarketplace: true,
          showOnWebsite: !!showOnWebsite,
        },
      });
    } else {
      // Create new storefront product
      const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      let uniqueSlug = `${baseSlug || "item"}-${Date.now().toString(36)}`;
      const existingSlug = await prisma.product.findUnique({ where: { slug: uniqueSlug } });
      if (existingSlug) {
        uniqueSlug = `${baseSlug || "item"}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
      }

      const validImages = Array.isArray(images) ? images.filter(Boolean) : [];

      const created = await prisma.product.create({
        data: {
          vendorId: vendor.id,
          categoryId: storeCategory.id,
          name: title.trim(),
          slug: uniqueSlug,
          description: safeDesc,
          price: safePrice,
          stock: safeStock,
          sku: safeSku,
          isActive: true,
          isDisabledByAdmin: false,
          showOnMarketplace: true,
          showOnWebsite: !!showOnWebsite,
          images: {
            create: validImages.map((url, idx) => ({
              url,
              position: idx,
            })),
          },
        },
      });
      currentSpecs.linkedProductId = created.id;
    }

    currentSpecs.showInTryMeShop = true;
  } else {
    // Disable in storefront Shop by Category
    if (currentSpecs.linkedProductId) {
      await prisma.product.update({
        where: { id: currentSpecs.linkedProductId },
        data: {
          showOnMarketplace: false,
          isActive: false,
        },
      }).catch((e) => {
        console.warn("Could not deactivate linked storefront product:", e?.message);
      });
    }
    currentSpecs.showInTryMeShop = false;
  }

  return currentSpecs;
}
