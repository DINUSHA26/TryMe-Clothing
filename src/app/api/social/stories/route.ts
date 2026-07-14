import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    const now = new Date();

    // 1. Fetch followed vendor & adsSeller user IDs if user is authenticated
    let followedUserIds: string[] = [];
    if (user) {
      const customer = await prisma.customer.findUnique({
        where: { userId: user.userId },
      });
      if (customer) {
        // Followed boutique vendors
        const vendorFollows = await prisma.vendorFollower.findMany({
          where: { customerId: customer.id },
          include: {
            vendor: {
              select: { userId: true },
            },
          },
        });
        const vendorUserIds = vendorFollows.map((f) => f.vendor.userId);

        // Followed classified ad sellers
        const adsSellerFollows = await (prisma as any).adsSellerFollower.findMany({
          where: { customerId: customer.id },
          include: {
            adsSeller: {
              select: { userId: true },
            },
          },
        });
        const adsSellerUserIds = adsSellerFollows.map((f: any) => f.adsSeller.userId);

        followedUserIds = Array.from(new Set([...vendorUserIds, ...adsSellerUserIds]));
      }
    }

    // 2. Fetch ALL active stories (expiresAt > now) in the system
    const activeStories = await prisma.socialStory.findMany({
      where: {
        expiresAt: { gt: now },
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
                id: true,
                businessName: true,
                logo: true,
                slug: true,
              },
            },
            adsSeller: {
              select: {
                id: true,
                businessName: true,
                slug: true,
                contactInfo: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Group stories by user for display in the Stories Tray
    const groupedStoriesMap = new Map<string, any>();

    activeStories.forEach((story) => {
      const storyUserId = story.userId;
      const isSelf = user ? storyUserId === user.userId : false;
      const isFollowed = followedUserIds.includes(storyUserId);

      // Determine display name, logo and slug
      let displayName = "User";
      let logoUrl = null;
      let slug = null;

      if (story.user.role === "VENDOR" && story.user.vendor) {
        displayName = story.user.vendor.businessName;
        logoUrl = story.user.vendor.logo;
        slug = story.user.vendor.slug;
      } else if (story.user.adsSeller) {
        displayName = story.user.adsSeller.businessName || "Classified Seller";
        logoUrl = (story.user.adsSeller.contactInfo as any)?.logo || null;
        slug = story.user.adsSeller.slug;
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

    const groupedStories = Array.from(groupedStoriesMap.values());

    // 4. Sort logic: Own stories first, followed stores/sellers next, then others
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
