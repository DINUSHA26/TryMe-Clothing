import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> }
) {
    try {
        const { postId } = await params;

        const comments = await prisma.socialComment.findMany({
            where: { postId, isActive: true },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        vendor: { select: { businessName: true, logo: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, data: comments });
    } catch (error) {
        console.error("[GET /api/social/[postId]/comments] Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch comments" }, { status: 500 });
    }
}

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
        const { content } = await request.json();

        if (!content || content.trim() === "") {
            return NextResponse.json({ success: false, error: "Comment content is required" }, { status: 400 });
        }

        const post = await prisma.socialPost.findUnique({ where: { id: postId } });
        if (!post) {
            return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
        }

        const comment = await prisma.socialComment.create({
            data: {
                postId,
                userId: user.userId,
                content
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
                }
            }
        });

        return NextResponse.json({ success: true, data: comment });
    } catch (error) {
        console.error("[POST /api/social/[postId]/comments] Error:", error);
        return NextResponse.json({ success: false, error: "Failed to add comment" }, { status: 500 });
    }
}
