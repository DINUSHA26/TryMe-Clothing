import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Fetch SavedPost records, then map them to the matching SocialPostType format
    const savedPostRecords = await prisma.savedPost.findMany({
      where: {
        userId: user.userId,
        post: { isActive: true }
      },
      include: {
        post: {
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
            _count: {
              select: { comments: { where: { isActive: true } } }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const rawPosts = savedPostRecords.map(record => record.post);

    // Map follow status for saved posts
    let followedVendorIds: string[] = [];
    let followedAdsSellerIds: string[] = [];

    try {
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
    } catch (err) {
      console.error("Error fetching followed vendors/sellers in saved posts API:", err);
    }

    const mappedPosts = rawPosts.map(post => {
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

    const total = await prisma.savedPost.count({
      where: {
        userId: user.userId,
        post: { isActive: true }
      }
    });

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
    console.error("[GET /api/social/saved] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch saved posts" }, { status: 500 });
  }
}
