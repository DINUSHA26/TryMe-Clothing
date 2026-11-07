import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Please login to react to stories" },
        { status: 401 }
      );
    }

    const { id: storyId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { emoji } = body;

    if (!emoji || typeof emoji !== "string" || emoji.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Emoji reaction is required" },
        { status: 400 }
      );
    }

    const cleanEmoji = emoji.trim();

    // 1. Verify story exists
    const story = await prisma.socialStory.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        { success: false, error: "Story not found" },
        { status: 404 }
      );
    }

    // 2. Check existing reaction
    const existingReaction = await prisma.storyReaction.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId: user.userId,
        },
      },
    });

    let myReaction: string | null = null;
    let action: "added" | "updated" | "removed" = "added";

    if (existingReaction) {
      if (existingReaction.emoji === cleanEmoji) {
        // Toggle off if user clicks the exact same emoji
        await prisma.storyReaction.delete({
          where: { id: existingReaction.id },
        });
        myReaction = null;
        action = "removed";
      } else {
        // Switch emoji
        await prisma.storyReaction.update({
          where: { id: existingReaction.id },
          data: { emoji: cleanEmoji },
        });
        myReaction = cleanEmoji;
        action = "updated";
      }
    } else {
      // New reaction
      await prisma.storyReaction.create({
        data: {
          storyId,
          userId: user.userId,
          emoji: cleanEmoji,
        },
      });
      myReaction = cleanEmoji;
      action = "added";
    }

    // 3. Fetch aggregated reactions
    const allReactions = await prisma.storyReaction.findMany({
      where: { storyId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
            vendor: {
              select: {
                businessName: true,
                logo: true,
              },
            },
            adsSeller: {
              select: {
                businessName: true,
                contactInfo: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const count = allReactions.length;
    const byEmoji: Record<string, number> = {};
    allReactions.forEach((r) => {
      byEmoji[r.emoji] = (byEmoji[r.emoji] || 0) + 1;
    });

    const formattedReactions = allReactions.map((r) => {
      let name = "User";
      let avatar = r.user.avatar || null;

      if (r.user.role === "VENDOR" && r.user.vendor) {
        name = r.user.vendor.businessName;
        avatar = r.user.vendor.logo || avatar;
      } else if (r.user.adsSeller) {
        name = r.user.adsSeller.businessName || "Classified Seller";
        avatar = (r.user.adsSeller.contactInfo as any)?.logo || avatar;
      } else {
        name =
          [r.user.firstName, r.user.lastName].filter(Boolean).join(" ") ||
          "User";
      }

      return {
        id: r.id,
        userId: r.userId,
        name,
        avatar,
        role: r.user.role,
        emoji: r.emoji,
        createdAt: r.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        action,
        myReaction,
        count,
        byEmoji,
        reactions: formattedReactions,
      },
    });
  } catch (error) {
    console.error("Error handling story reaction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process reaction" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    const { id: storyId } = await context.params;

    const story = await prisma.socialStory.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        { success: false, error: "Story not found" },
        { status: 404 }
      );
    }

    const allReactions = await prisma.storyReaction.findMany({
      where: { storyId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
            vendor: {
              select: {
                businessName: true,
                logo: true,
              },
            },
            adsSeller: {
              select: {
                businessName: true,
                contactInfo: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const count = allReactions.length;
    const byEmoji: Record<string, number> = {};
    allReactions.forEach((r) => {
      byEmoji[r.emoji] = (byEmoji[r.emoji] || 0) + 1;
    });

    const myReaction = user
      ? allReactions.find((r) => r.userId === user.userId)?.emoji || null
      : null;

    const formattedReactions = allReactions.map((r) => {
      let name = "User";
      let avatar = r.user.avatar || null;

      if (r.user.role === "VENDOR" && r.user.vendor) {
        name = r.user.vendor.businessName;
        avatar = r.user.vendor.logo || avatar;
      } else if (r.user.adsSeller) {
        name = r.user.adsSeller.businessName || "Classified Seller";
        avatar = (r.user.adsSeller.contactInfo as any)?.logo || avatar;
      } else {
        name =
          [r.user.firstName, r.user.lastName].filter(Boolean).join(" ") ||
          "User";
      }

      return {
        id: r.id,
        userId: r.userId,
        name,
        avatar,
        role: r.user.role,
        emoji: r.emoji,
        createdAt: r.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        count,
        byEmoji,
        myReaction,
        reactions: formattedReactions,
      },
    });
  } catch (error) {
    console.error("Error fetching story reactions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reactions" },
      { status: 500 }
    );
  }
}
