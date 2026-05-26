import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const user = getAuthUser(request);
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { postId } = await params;

        const post = await prisma.socialPost.findUnique({ where: { id: postId } });
        if (!post) {
            return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
        }

        // Check if already liked
        const existingLike = await prisma.socialLike.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId: user.userId,
                }
            }
        });

        if (existingLike) {
            // Unlike
            await prisma.socialLike.delete({
                where: { id: existingLike.id }
            });
            return NextResponse.json({ success: true, liked: false });
        } else {
            // Like
            await prisma.socialLike.create({
                data: {
                    postId,
                    userId: user.userId,
                }
            });
            return NextResponse.json({ success: true, liked: true });
        }

    } catch (error) {
        console.error("[POST /api/social/[postId]/like] Error:", error);
        return NextResponse.json({ success: false, error: "Failed to toggle like" }, { status: 500 });
    }
}
