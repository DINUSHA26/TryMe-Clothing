import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const posts = await prisma.socialPost.findMany({
            where: { isActive: true },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        vendor: {
                            select: { id: true, businessName: true, logo: true, slug: true }
                        },
                        adsSeller: {
                            select: { id: true, businessName: true, slug: true, contactInfo: true }
                        }
                    }
                },
                likes: {
                    select: { userId: true }
                },
                savedBy: {
                    select: { userId: true }
                },
                _count: {
                    select: { comments: { where: { isActive: true } } } // count comments
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        });

        // Map follow status if user is logged in
        let followedVendorIds: string[] = [];
        let followedAdsSellerIds: string[] = [];

        try {
            const user = getAuthUser(request);
            if (user) {
                const customer = await prisma.customer.findUnique({
                    where: { userId: user.userId },
                });
                if (customer) {
                    const vendorFollows = await prisma.vendorFollower.findMany({
                        where: { customerId: customer.id },
                        select: { vendorId: true },
                    });
                    followedVendorIds = vendorFollows.map(f => f.vendorId);

                    const adsSellerFollows = await (prisma as any).adsSellerFollower.findMany({
                        where: { customerId: customer.id },
                        select: { adsSellerId: true },
                    });
                    followedAdsSellerIds = adsSellerFollows.map((f: any) => f.adsSellerId);
                }
            }
        } catch (err) {
            console.error("Error fetching followed vendors/sellers in social feed API:", err);
        }

        const mappedPosts = posts.map(post => {
            const author = { ...post.user };
            if (author.vendor) {
                (author.vendor as any).isFollowing = followedVendorIds.includes(author.vendor.id);
            }
            if ((author as any).adsSeller) {
                ((author as any).adsSeller as any).isFollowing = followedAdsSellerIds.includes((author as any).adsSeller.id);
            }
            return {
                ...post,
                user: author,
            };
        });

        const total = await prisma.socialPost.count({ where: { isActive: true } });

        return NextResponse.json({
            success: true,
            data: {
                posts: mappedPosts,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error("[GET /api/social] Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch posts" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = getAuthUser(request);
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { content, images, productTag } = await request.json();

        if (!content && (!images || images.length === 0)) {
            return NextResponse.json({ success: false, error: "Post must have content or images" }, { status: 400 });
        }

        // Resolve product slug/ad ID and tag type if tag is provided
        let productSlug: string | null = null;
        let tagType: string | null = null;
        if (productTag) {
            const resolved = await resolveSocialTag(productTag);
            if (resolved) {
                productSlug = resolved.slug;
                tagType = resolved.type;
            }
        }

        const post = await prisma.socialPost.create({
            data: {
                userId: user.userId,
                content,
                images: images || [],
                productTag: productTag || null,
                productSlug: productSlug || null,
                tagType: tagType || null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        vendor: { select: { id: true, businessName: true, logo: true, slug: true } },
                        adsSeller: { select: { id: true, businessName: true, slug: true, contactInfo: true } }
                    }
                },
                likes: true,
                savedBy: {
                    select: { userId: true }
                },
                _count: {
                    select: { comments: true }
                }
            }
        });

        return NextResponse.json({ success: true, data: post });
    } catch (error) {
        console.error("[POST /api/social] Error:", error);
        return NextResponse.json({ success: false, error: "Failed to create post" }, { status: 500 });
    }
}

async function resolveSocialTag(tag: string): Promise<{ slug: string; type: string } | null> {
    if (!tag) return null;
    const trimmedTag = tag.trim();
    if (!trimmedTag) return null;

    // 1. Check if it's a marketplace ad URL
    if (trimmedTag.includes("/marketplace/")) {
        const parts = trimmedTag.split("/marketplace/");
        if (parts.length > 1) {
            const adId = parts[1].split("?")[0].split("#")[0].trim();
            const ad = await prisma.classifiedAd.findUnique({
                where: { id: adId },
                select: { id: true }
            });
            if (ad) {
                return { slug: ad.id, type: "AD" };
            }
        }
    }

    // 2. Check if it's a product URL (contains /products/)
    if (trimmedTag.includes("/products/")) {
        const parts = trimmedTag.split("/products/");
        if (parts.length > 1) {
            const slugPart = parts[1].split("?")[0].split("#")[0].trim();
            const product = await prisma.product.findUnique({
                where: { slug: slugPart },
                select: { slug: true }
            });
            if (product) return { slug: product.slug, type: "PRODUCT" };
        }
    }

    // 3. Treat as a SKU (check Product first, then ProductVariant)
    const productBySku = await prisma.product.findFirst({
        where: { sku: { equals: trimmedTag, mode: "insensitive" } },
        select: { slug: true }
    });
    if (productBySku) return { slug: productBySku.slug, type: "PRODUCT" };

    const variantBySku = await prisma.productVariant.findFirst({
        where: { sku: { equals: trimmedTag, mode: "insensitive" } },
        include: { product: { select: { slug: true } } }
    });
    if (variantBySku && variantBySku.product) return { slug: variantBySku.product.slug, type: "PRODUCT" };

    return null;
}
