import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const type = searchParams.get("type") || "ALL";
    const storeRole = searchParams.get("storeRole") || "ALL"; // ALL | VENDOR | ADS_SELLER
    const customerType = searchParams.get("customerType") || "ALL"; // ALL | REGISTERED | GUEST
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    // 1. Store Role Filter (Vendor vs Ads Seller)
    if (storeRole === "VENDOR") {
      where.OR = [
        { vendorId: { not: null } },
        { contextType: "VENDOR" },
      ];
    } else if (storeRole === "ADS_SELLER") {
      where.OR = [
        { adsSellerId: { not: null } },
        { contextType: "ADS_SELLER" },
        { contextType: "AD" },
      ];
    }

    // 2. Specific Context Type
    if (type !== "ALL") {
      where.contextType = type;
    }

    // 3. Customer Type Filter (Registered Customer vs Guest Customer)
    if (customerType === "REGISTERED") {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { customerId: { not: null } },
            {
              customerEmail: {
                not: null,
                contains: "@",
              },
            },
          ],
        },
        {
          NOT: {
            customerName: "Guest Customer",
          },
        },
      ];
    } else if (customerType === "GUEST") {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { customerId: null },
            { customerName: "Guest Customer" },
            { customerName: null },
            { customerEmail: null },
          ],
        },
      ];
    }

    // 4. Search Query
    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { storeName: { contains: search, mode: "insensitive" } },
            { customerName: { contains: search, mode: "insensitive" } },
            { customerPhone: { contains: search, mode: "insensitive" } },
            { customerEmail: { contains: search, mode: "insensitive" } },
            { lastMessage: { contains: search, mode: "insensitive" } },
            { sessionId: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const [conversations, total, totalMessagesAgg] = await Promise.all([
      (prisma as any).storeAiConversation.findMany({
        where,
        include: {
          vendor: { select: { id: true, businessName: true, slug: true } },
          adsSeller: { select: { id: true, businessName: true, slug: true } },
          customer: {
            select: {
              id: true,
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      (prisma as any).storeAiConversation.count({ where }),
      (prisma as any).storeAiConversation.aggregate({
        _sum: { messageCount: true },
      }),
    ]);

    const [activeStoresCount, vendorCount, adsSellerCount] = await Promise.all([
      (prisma as any).storeAiConversation.groupBy({
        by: ["storeName"],
        _count: { storeName: true },
      }),
      (prisma as any).storeAiConversation.count({
        where: {
          OR: [{ vendorId: { not: null } }, { contextType: "VENDOR" }],
        },
      }),
      (prisma as any).storeAiConversation.count({
        where: {
          OR: [{ adsSellerId: { not: null } }, { contextType: "ADS_SELLER" }, { contextType: "AD" }],
        },
      }),
    ]);

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
          vendorCount,
          adsSellerCount,
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
