import { NextRequest, NextResponse } from "next/server";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { walletTransactionFiltersSchema } from "@/lib/validations/wallet";
import { getOrCreateAdsSellerVendor } from "@/lib/ads-seller-vendor";

/**
 * GET /api/ads-seller/wallet/transactions
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);
    const sellerVendor = await getOrCreateAdsSellerVendor(user.userId);

    if (!sellerVendor) {
      return NextResponse.json({ success: false, error: "Ads seller not found" }, { status: 404 });
    }

    const { wallet } = sellerVendor;

    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "50",
      type: searchParams.get("type") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
    };

    const validation = walletTransactionFiltersSchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { page, pageSize, type, dateFrom, dateTo } = validation.data;

    const where: any = {
      walletId: wallet.id,
    };

    if (type) where.type = type;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const total = await prisma.walletTransaction.count({ where });

    const transactions = await prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        orderItem: {
          select: {
            id: true,
            order: {
              select: {
                id: true,
                orderNumber: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const formatted = transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount.toNumber(),
      balanceBefore: t.balanceBefore.toNumber(),
      balanceAfter: t.balanceAfter.toNumber(),
      description: t.description,
      createdAt: t.createdAt.toISOString(),
      orderItem: t.orderItem
        ? {
            id: t.orderItem.id,
            orderNumber: t.orderItem.order?.orderNumber || "N/A",
            productName: t.orderItem.product?.name || "Order Item",
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        transactions: formatted,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
