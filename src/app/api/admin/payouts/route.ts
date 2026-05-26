/**
 * Admin payouts API
 * GET /api/admin/payouts - List all payout requests with filtering
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { payoutFiltersSchema } from "@/lib/validations/wallet";
import { maskAccountNumber } from "@/lib/utils/formatters";



/**
 * GET /api/admin/payouts
 * List all payout requests with filtering and stats
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    requireAdmin(request);

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "20",
      status: searchParams.get("status") || undefined,
      vendorId: searchParams.get("vendorId") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
    };

    const validation = payoutFiltersSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { page, pageSize, status, vendorId, dateFrom, dateTo } =
      validation.data;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (vendorId) {
      where.wallet = {
        vendorId,
      };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.payout.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / pageSize);
    const skip = (page - 1) * pageSize;

    // Fetch payouts with vendor information
    const payouts = await prisma.payout.findMany({
      where,
      include: {
        wallet: {
          include: {
            vendor: {
              select: {
                id: true,
                businessName: true,
                businessEmail: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
    });

    // Calculate aggregate stats
    const stats = await prisma.payout.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
      _sum: {
        amount: true,
      },
    });

    const aggregateStats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      totalPendingAmount: 0,
    };

    for (const stat of stats) {
      const count = stat._count.status;
      const sum = stat._sum.amount?.toNumber() || 0;

      switch (stat.status) {
        case "PENDING":
          aggregateStats.pending = count;
          aggregateStats.totalPendingAmount = sum;
          break;
        case "PROCESSING":
          aggregateStats.processing = count;
          break;
        case "COMPLETED":
          aggregateStats.completed = count;
          break;
        case "FAILED":
          aggregateStats.failed = count;
          break;
      }
    }

    // Format payouts for response (mask account numbers)
    const formattedPayouts = payouts.map((payout) => ({
      id: payout.id,
      amount: payout.amount.toNumber(),
      vendor: {
        id: payout.wallet.vendor.id,
        businessName: payout.wallet.vendor.businessName,
        businessEmail: payout.wallet.vendor.businessEmail,
      },
      wallet: {
        pendingBalance: payout.wallet.pendingBalance.toNumber(),
        availableBalance: payout.wallet.availableBalance.toNumber(),
      },
      bankName: payout.bankName,
      accountNumber: maskAccountNumber(payout.accountNumber),
      accountHolder: payout.accountHolder,
      branchCode: payout.branchCode,
      status: payout.status,
      notes: payout.notes,
      transactionRef: payout.transactionRef,
      processedAt: payout.processedAt?.toISOString() || null,
      createdAt: payout.createdAt.toISOString(),
      updatedAt: payout.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        payouts: formattedPayouts,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
        },
        stats: aggregateStats,
      },
    });
  } catch (error) {
    console.error("[Admin Payouts API] Error fetching payouts:", error);
    console.error("[Admin Payouts API] Error details:", error instanceof Error ? error.message : String(error));
    console.error("[Admin Payouts API] Error stack:", error instanceof Error ? error.stack : "No stack trace");

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch payouts",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
