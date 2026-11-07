import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor, handleAuthError, getEffectiveVendor } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const authUser = requireVendor(request);

    const effective = await getEffectiveVendor(authUser.userId);
    if (!effective) {
      return NextResponse.json(
        { success: false, error: "Vendor profile not found" },
        { status: 404 }
      );
    }
    const vendor = effective.vendor;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const where: any = {
      vendorId: vendor.id,
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
        where: { vendorId: vendor.id, unreadByStore: true },
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
    console.error("Vendor AI Conversations error:", error);
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
    const authUser = requireVendor(request);
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    const effective = await getEffectiveVendor(authUser.userId);
    if (!effective) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
    }
    const vendor = effective.vendor;

    await (prisma as any).storeAiConversation.updateMany({
      where: { id, vendorId: vendor.id },
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

