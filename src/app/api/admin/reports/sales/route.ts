/**
 * Admin Sales Report API
 * GET /api/admin/reports/sales - Detailed sales list with pagination
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { reportFiltersSchema } from "@/lib/validations/report";



/**
 * GET /api/admin/reports/sales
 * Get detailed sales list with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    requireAdmin(request);

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "50",
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      vendorId: searchParams.get("vendorId") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      minAmount: searchParams.get("minAmount") || undefined,
      maxAmount: searchParams.get("maxAmount") || undefined,
    };

    const validation = reportFiltersSchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      page,
      pageSize,
      dateFrom,
      dateTo,
      vendorId,
      status,
      search,
      minAmount,
      maxAmount,
    } = validation.data;

    // Build where clause
    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        {
          orderNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          customer: {
            user: {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

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
      whereClause.items = {
        some: {
          vendorId: vendorId,
        },
      };
    }

    if (minAmount !== undefined) {
      whereClause.totalAmount = { gte: minAmount };
    }

    if (maxAmount !== undefined) {
      whereClause.totalAmount = {
        ...whereClause.totalAmount,
        lte: maxAmount,
      };
    }

    // Count total records
    const totalCount = await prisma.order.count({
      where: whereClause,
    });

    // Fetch paginated orders
    const skip = (page - 1) * pageSize;
    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        totalAmount: true,
        status: true,
        customer: {
          select: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        items: {
          select: {
            vendor: {
              select: {
                businessName: true,
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

    // Calculate commission for each order
    const orderIds = orders.map((o) => o.id);
    const commissions = await prisma.walletTransaction.groupBy({
      by: ["orderItemId"],
      where: {
        type: "COMMISSION",
        orderItem: {
          orderId: {
            in: orderIds,
          },
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Create commission map
    const commissionByOrderId = new Map<string, number>();
    const orderItemToOrderMap = await prisma.orderItem.findMany({
      where: {
        orderId: {
          in: orderIds,
        },
      },
      select: {
        id: true,
        orderId: true,
      },
    });

    orderItemToOrderMap.forEach((item) => {
      const commission = commissions.find((c) => c.orderItemId === item.id);
      if (commission) {
        const orderId = item.orderId;
        const amount = Math.abs(
          commission._sum.amount?.toNumber() || 0
        );
        commissionByOrderId.set(
          orderId,
          (commissionByOrderId.get(orderId) || 0) + amount
        );
      }
    });

    // Format sales data
    const salesData = orders.map((order) => {
      const vendors = Array.from(
        new Set(order.items.map((item) => item.vendor.businessName))
      );

      return {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        customerEmail: order.customer.user.email,
        totalAmount: order.totalAmount.toNumber(),
        commissionAmount: commissionByOrderId.get(order.id) || 0,
        status: order.status,
        vendors: vendors.join(", "),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items: salesData,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch sales report:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch sales report",
      },
      { status: 500 }
    );
  }
}
