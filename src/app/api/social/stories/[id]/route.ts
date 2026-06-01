import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, handleAuthError } from "@/lib/auth-helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: storyId } = await params;
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Find the story
    const story = await prisma.socialStory.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        { success: false, error: "Story not found" },
        { status: 404 }
      );
    }

    // Authorization check
    if (story.userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to edit this story" },
        { status: 403 }
      );
    }

    // Update story
    const updatedStory = await prisma.socialStory.update({
      where: { id: storyId },
      data: { imageUrl },
    });

    return NextResponse.json({
      success: true,
      data: {
        story: updatedStory,
      },
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("Error editing story:", error);
    return NextResponse.json(
      { success: false, error: "Failed to edit story" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: storyId } = await params;

    // Find the story
    const story = await prisma.socialStory.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        { success: false, error: "Story not found" },
        { status: 404 }
      );
    }

    // Authorization check
    if (story.userId !== user.userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to delete this story" },
        { status: 403 }
      );
    }

    // Delete story
    await prisma.socialStory.delete({
      where: { id: storyId },
    });

    return NextResponse.json({
      success: true,
      message: "Story deleted successfully",
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("Error deleting story:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete story" },
      { status: 500 }
    );
  }
}
