import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    const now = new Date();

    // ── GUEST PATH: Show stories from top 10 popular vendors ────────────
    if (!user) {
      // Find the top 10 vendors ranked by follower count (most popular first)
      const topVendors = await prisma.vendor.findMany({
        where: {
          status: "ACTIVE",
          isShopOpen: true,
        },
        select: {
          userId: true,
          businessName: true,
          logo: true,
          slug: true,
          _count: {
            select: { followers: true },
          },
        },
        orderBy: {
          followers: {
            _count: "desc",
          },
        },
        take: 10,
      });

      const topVendorUserIds = topVendors.map((v) => v.userId);

      // Fetch active (non-expired) stories from those top vendors
      const publicStories = await prisma.socialStory.findMany({
        where: {
          expiresAt: { gt: now },
          userId: { in: topVendorUserIds },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              vendor: {
                select: {
                  businessName: true,
                  logo: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Group stories by user
      const groupedStoriesMap = new Map<string, any>();

      publicStories.forEach((story) => {
        const storyUserId = story.userId;

        let displayName = "User";
        let logoUrl = null;
        let slug = null;

        if (story.user.role === "VENDOR" && story.user.vendor) {
          displayName = story.user.vendor.businessName;
          logoUrl = story.user.vendor.logo;
          slug = story.user.vendor.slug;
        } else {
          displayName =
            [story.user.firstName, story.user.lastName]
              .filter(Boolean)
              .join(" ") ||
            story.user.email?.split("@")[0] ||
            "User";
        }

        if (!groupedStoriesMap.has(storyUserId)) {
          groupedStoriesMap.set(storyUserId, {
            userId: storyUserId,
            displayName,
            logoUrl,
            slug,
            isSelf: false,
            isFollowed: false,
            stories: [],
          });
        }

        groupedStoriesMap.get(storyUserId).stories.push({
          id: story.id,
          imageUrl: story.imageUrl,
          createdAt: story.createdAt.toISOString(),
        });
      });

      const groupedStories = Array.from(groupedStoriesMap.values());

      return NextResponse.json({
        success: true,
        data: { groupedStories },
      });
    }

    // ── AUTHENTICATED PATH: Show followed vendors + own stories + popular vendors ─────────
    let followedUserIds: string[] = [];
    const customer = await prisma.customer.findUnique({
      where: { userId: user.userId },
    });

    if (customer) {
      const follows = await prisma.vendorFollower.findMany({
        where: { customerId: customer.id },
        include: {
          vendor: {
            select: {
              userId: true,
            },
          },
        },
      });
      followedUserIds = follows.map((f) => f.vendor.userId);
    }

    // Fetch top 10 popular vendors to fill the space
    const topVendors = await prisma.vendor.findMany({
      where: { status: "ACTIVE", isShopOpen: true },
      select: { userId: true },
      orderBy: { followers: { _count: "desc" } },
      take: 10,
    });
    const topVendorUserIds = topVendors.map((v) => v.userId);

    const allRelevantUserIds = Array.from(new Set([...followedUserIds, ...topVendorUserIds]));

    const storyFilter = {
      expiresAt: { gt: now },
      OR: [
        { userId: { in: allRelevantUserIds } },
        { userId: user.userId },
      ],
    };

    // 2. Fetch active stories (expiresAt > now) for followed vendors, popular vendors, and the user's own stories
    const activeStories = await prisma.socialStory.findMany({
      where: storyFilter,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            vendor: {
              select: {
                businessName: true,
                logo: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group stories by user for display in the Stories Tray
    const groupedStoriesMap = new Map<string, any>();

    activeStories.forEach((story) => {
      const storyUserId = story.userId;
      const isSelf = storyUserId === user.userId;
      const isFollowed = followedUserIds.includes(storyUserId);

      // Determine display name and logo
      let displayName = "User";
      let logoUrl = null;
      let slug = null;

      if (story.user.role === "VENDOR" && story.user.vendor) {
        displayName = story.user.vendor.businessName;
        logoUrl = story.user.vendor.logo;
        slug = story.user.vendor.slug;
      } else {
        displayName = [story.user.firstName, story.user.lastName].filter(Boolean).join(" ") || story.user.email?.split("@")[0] || "User";
      }

      if (!groupedStoriesMap.has(storyUserId)) {
        groupedStoriesMap.set(storyUserId, {
          userId: storyUserId,
          displayName,
          logoUrl,
          slug,
          isSelf,
          isFollowed,
          stories: [],
        });
      }

      groupedStoriesMap.get(storyUserId).stories.push({
        id: story.id,
        imageUrl: story.imageUrl,
        createdAt: story.createdAt.toISOString(),
      });
    });

    let groupedStories = Array.from(groupedStoriesMap.values());
    
    // Sort logic: Own stories first, followed vendors next, then popular vendors
    groupedStories.sort((a, b) => {
      if (a.isSelf) return -1;
      if (b.isSelf) return 1;
      if (a.isFollowed && !b.isFollowed) return -1;
      if (!a.isFollowed && b.isFollowed) return 1;
      return 0; // maintain original order for others
    });

    return NextResponse.json({
      success: true,
      data: {
        groupedStories,
      },
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("Error fetching stories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "Image URL is required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours expiration

    const newStory = await prisma.socialStory.create({
      data: {
        userId: user.userId,
        imageUrl,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        story: newStory,
      },
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("Error creating story:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create story" },
      { status: 500 }
    );
  }
}
