import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const type = searchParams.get("type") || "ALL";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (type !== "ALL") {
      where.contextType = type;
    }

    if (search) {
      where.OR = [
        { storeName: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { lastMessage: { contains: search, mode: "insensitive" } },
        { sessionId: { contains: search, mode: "insensitive" } },
      ];
    }

    const [conversations, total, totalMessagesAgg] = await Promise.all([
      (prisma as any).storeAiConversation.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      (prisma as any).storeAiConversation.count({ where }),
      (prisma as any).storeAiConversation.aggregate({
        _sum: { messageCount: true },
      }),
    ]);

    const activeStoresCount = await (prisma as any).storeAiConversation.groupBy({
      by: ["storeName"],
      _count: { storeName: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        conversations,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          totalConversations: total,
          totalMessages: totalMessagesAgg._sum.messageCount || 0,
          activeStores: activeStoresCount.length,
        },
      },
    });
  } catch (error: any) {
    console.error("Admin AI Conversations error:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "Failed to fetch AI conversations" },
      { status: 500 }
    );
  }
}
