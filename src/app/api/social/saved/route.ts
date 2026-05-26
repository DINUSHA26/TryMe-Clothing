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
                  select: { businessName: true, logo: true }
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

    const posts = savedPostRecords.map(record => record.post);

    const total = await prisma.savedPost.count({
      where: {
        userId: user.userId,
        post: { isActive: true }
      }
    });

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
    console.error("[GET /api/social/saved] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch saved posts" }, { status: 500 });
  }
}
