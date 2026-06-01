import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

/**
 * GET /api/admin/ads-plan-payments
 * List all AdsPayment records for admin review.
 * Supports ?status=PENDING_APPROVAL|COMPLETED|REJECTED|all
 */
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING_APPROVAL";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where =
      status && status !== "all"
        ? { status: status as any }
        : {};

    const totalCount = await prisma.adsPayment.count({ where });

    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.adsPayment.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.adsPayment.count({ where: { status: "COMPLETED" } }),
      prisma.adsPayment.count({ where: { status: "REJECTED" } }),
    ]);

    const payments = await prisma.adsPayment.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        subscription: {
          include: {
            plan: { select: { name: true, price: true, billingCycle: true } },
            seller: {
              include: {
                user: { select: { email: true, firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        payments,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
        counts: {
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching plan payments:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "Failed to fetch plan payments" },
      { status: 500 }
    );
  }
}
