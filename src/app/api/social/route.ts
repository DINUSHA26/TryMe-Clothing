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
                            select: { businessName: true, logo: true }
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

        const total = await prisma.socialPost.count({ where: { isActive: true } });

        return NextResponse.json({
            success: true,
            data: {
                posts,
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

        // Resolve product slug if tag is provided
        let productSlug: string | null = null;
        if (productTag) {
            productSlug = await resolveProductSlug(productTag);
        }

        const post = await prisma.socialPost.create({
            data: {
                userId: user.userId,
                content,
                images: images || [],
                productTag: productTag || null,
                productSlug: productSlug || null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        vendor: { select: { businessName: true, logo: true } }
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

async function resolveProductSlug(tag: string): Promise<string | null> {
    if (!tag) return null;
    const trimmedTag = tag.trim();
    if (!trimmedTag) return null;

    // 1. Check if it's a URL (contains /products/)
    if (trimmedTag.includes("/products/")) {
        const parts = trimmedTag.split("/products/");
        if (parts.length > 1) {
            const slugPart = parts[1].split("?")[0].split("#")[0].trim();
            const product = await prisma.product.findUnique({
                where: { slug: slugPart },
                select: { slug: true }
            });
            if (product) return product.slug;
        }
    }

    // 2. Treat as a SKU (check Product first, then ProductVariant)
    const productBySku = await prisma.product.findFirst({
        where: { sku: { equals: trimmedTag, mode: "insensitive" } },
        select: { slug: true }
    });
    if (productBySku) return productBySku.slug;

    const variantBySku = await prisma.productVariant.findFirst({
        where: { sku: { equals: trimmedTag, mode: "insensitive" } },
        include: { product: { select: { slug: true } } }
    });
    if (variantBySku && variantBySku.product) return variantBySku.product.slug;

    return null;
}
