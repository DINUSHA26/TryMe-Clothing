/**
 * Admin Payment Methods Report API
 * GET /api/admin/reports/payment-methods - Payment method breakdown
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { orderDistributionFiltersSchema } from "@/lib/validations/report";



/**
 * GET /api/admin/reports/payment-methods
 * Get payment count by method
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    requireAdmin(request);

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      vendorId: searchParams.get("vendorId") || undefined,
    };

    const validation = orderDistributionFiltersSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { dateFrom, dateTo, vendorId } = validation.data;

    // Build where clause
    const whereClause: any = {
      status: "COMPLETED",
    };

    if (dateFrom) {
      whereClause.createdAt = { gte: new Date(dateFrom) };
    }

    if (dateTo) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        lte: new Date(dateTo),
      };
    }

    if (vendorId) {
      whereClause.order = {
        items: {
          some: {
            vendorId: vendorId,
          },
        },
      };
    }

    // Group payments by method
    const paymentsByMethod = await prisma.payment.groupBy({
      by: ["paymentMethod"],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    // Convert to object format { METHOD: count }
    const distribution: Record<string, number> = {};

    paymentsByMethod.forEach((item) => {
      if (item.paymentMethod) {
        distribution[item.paymentMethod] = item._count.id;
      }
    });

    // If no data, return empty object instead of default values
    // This allows the UI to show "No data" message

    return NextResponse.json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    console.error("Failed to fetch payment methods distribution:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch payment methods distribution",
      },
      { status: 500 }
    );
  }
}
