import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const authUser = requireAdsSeller(request);

    const seller = await prisma.adsSeller.findUnique({
      where: { userId: authUser.userId },
      select: { id: true, businessName: true },
    });

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Ads Seller profile not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const where: any = {
      adsSellerId: seller.id,
    };

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { lastMessage: { contains: search, mode: "insensitive" } },
      ];
    }

    const [conversations, unreadCount, total] = await Promise.all([
      (prisma as any).storeAiConversation.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: 100,
      }),
      (prisma as any).storeAiConversation.count({
        where: { adsSellerId: seller.id, unreadByStore: true },
      }),
      (prisma as any).storeAiConversation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        conversations,
        stats: {
          total,
          unreadCount,
        },
      },
    });
  } catch (error: any) {
    console.error("Ads Seller AI Conversations error:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "Failed to fetch AI conversations" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = requireAdsSeller(request);
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    const seller = await prisma.adsSeller.findUnique({
      where: { userId: authUser.userId },
      select: { id: true },
    });

    if (!seller) {
      return NextResponse.json({ success: false, error: "Ads Seller not found" }, { status: 404 });
    }

    await (prisma as any).storeAiConversation.updateMany({
      where: { id, adsSellerId: seller.id },
      data: { unreadByStore: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "Failed to update status" },
      { status: 500 }
    );
  }
}
