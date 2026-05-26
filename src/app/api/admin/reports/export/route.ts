/**
 * Admin Export Report API
 * POST /api/admin/reports/export - Generate CSV exports
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { exportRequestSchema } from "@/lib/validations/report";
import { formatReportData } from "@/lib/utils/export";
import Papa from "papaparse";
import { format } from "date-fns";



/**
 * POST /api/admin/reports/export
 * Export report data as CSV
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    requireAdmin(request);

    const body = await request.json();
    const validation = exportRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { reportType, filters } = validation.data;

    let data: any[] = [];

    // Fetch data based on report type
    switch (reportType) {
      case "sales": {
        const whereClause: any = {};

        if (filters.dateFrom) {
          whereClause.createdAt = { gte: new Date(filters.dateFrom) };
        }

        if (filters.dateTo) {
          whereClause.createdAt = {
            ...whereClause.createdAt,
            lte: new Date(filters.dateTo),
          };
        }

        if (filters.status) {
          whereClause.status = filters.status;
        }

        if (filters.vendorId) {
          whereClause.items = {
            some: {
              vendorId: filters.vendorId,
            },
          };
        }

        const orders = await prisma.order.findMany({
          where: whereClause,
          select: {
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
          take: 10000, // Limit to prevent memory issues
          orderBy: {
            createdAt: "desc",
          },
        });

        data = orders.map((order) => {
          const vendors = Array.from(
            new Set(order.items.map((item) => item.vendor.businessName))
          );

          return {
            orderNumber: order.orderNumber,
            createdAt: format(new Date(order.createdAt), "yyyy-MM-dd HH:mm:ss"),
            customer: order.customer.user.email,
            totalAmount: order.totalAmount.toNumber(),
            status: order.status,
            vendors: vendors.join(", "),
          };
        });
        break;
      }

      case "vendors": {
        const whereClause: any = {
          order: {
            status: {
              in: [
                "PAYMENT_CONFIRMED",
                "PROCESSING",
                "SHIPPED",
                "PARTIALLY_SHIPPED",
                "DELIVERY_CONFIRMED",
                "DELIVERED",
                "COMPLETED",
              ],
            },
          },
        };

        if (filters.dateFrom) {
          whereClause.order.createdAt = { gte: new Date(filters.dateFrom) };
        }

        if (filters.dateTo) {
          whereClause.order.createdAt = {
            ...whereClause.order.createdAt,
            lte: new Date(filters.dateTo),
          };
        }

        const vendorStats = await prisma.orderItem.groupBy({
          by: ["vendorId"],
          where: whereClause,
          _sum: {
            totalPrice: true,
          },
          _count: {
            id: true,
          },
        });

        const vendorIds = vendorStats.map((stat) => stat.vendorId);
        const vendors = await prisma.vendor.findMany({
          where: {
            id: {
              in: vendorIds,
            },
          },
        });

        const vendorMap = new Map(vendors.map((v) => [v.id, v]));

        data = vendorStats.map((stat) => {
          const vendor = vendorMap.get(stat.vendorId);
          return {
            businessName: vendor?.businessName || "Unknown",
            totalRevenue: stat._sum.totalPrice?.toNumber() || 0,
            orderCount: stat._count.id,
            isActive: vendor?.status === "ACTIVE" ? "Active" : "Inactive",
          };
        });
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid report type" },
          { status: 400 }
        );
    }

    // Format data for CSV
    const formattedData = formatReportData(data, reportType);

    // Generate CSV
    const csv = Papa.unparse(formattedData, {
      header: true,
      quotes: true,
    });

    // Return CSV with proper headers
    const filename = `${reportType}_report_${format(new Date(), "yyyy-MM-dd")}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv;charset=utf-8;",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to export report:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "Failed to export report",
      },
      { status: 500 }
    );
  }
}
