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

        // Check if already saved
        const existingSave = await prisma.savedPost.findUnique({
            where: {
                userId_postId: {
                    userId: user.userId,
                    postId,
                }
            }
        });

        if (existingSave) {
            // Unsave
            await prisma.savedPost.delete({
                where: { id: existingSave.id }
            });
            return NextResponse.json({ success: true, saved: false });
        } else {
            // Save
            await prisma.savedPost.create({
                data: {
                    postId,
                    userId: user.userId,
                }
            });
            return NextResponse.json({ success: true, saved: true });
        }

    } catch (error) {
        console.error("[POST /api/social/[postId]/save] Error:", error);
        return NextResponse.json({ success: false, error: "Failed to toggle save post" }, { status: 500 });
    }
}
