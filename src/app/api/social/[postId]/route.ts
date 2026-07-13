import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;

        const post = await prisma.socialPost.findUnique({ where: { id: postId } });
        if (!post) {
            return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
        }

        const user = getAuthUser(request);
        if (!user || (user.role !== "ADMIN" && user.userId !== post.userId)) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await prisma.socialPost.delete({ where: { id: postId } });

        return NextResponse.json({ success: true, message: "Post deleted" });
    } catch (error) {
        console.error("[DELETE /api/social/[postId]] Error:", error);
        return NextResponse.json({ success: false, error: "Failed to delete post" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const user = getAuthUser(request);
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { postId } = await params;
        const body = await request.json();
        const { content, images } = body;

        const post = await prisma.socialPost.findUnique({ where: { id: postId } });
        if (!post) {
            return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
        }

        if (user.userId !== post.userId && user.role !== "ADMIN") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const updatedPost = await prisma.socialPost.update({
            where: { id: postId },
            data: {
                content: content || null,
                images: images || [],
            },
        });

        return NextResponse.json({ success: true, data: updatedPost });
    } catch (error) {
        console.error("[PUT /api/social/[postId]] Error:", error);
        return NextResponse.json({ success: false, error: "Failed to update post" }, { status: 500 });
    }
}
