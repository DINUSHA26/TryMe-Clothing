/**
 * Vendor Export Report API
 * POST /api/vendor/reports/export - Generate CSV exports for vendor
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { exportRequestSchema } from "@/lib/validations/report";
import Papa from "papaparse";
import { format } from "date-fns";

/**
 * POST /api/vendor/reports/export
 * Export vendor report data as CSV
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = requireVendor(request);

    const body = await request.json();
    const validation = exportRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { reportType, filters } = validation.data;

    // Get vendor record
    const vendorRecord = await prisma.vendor.findUnique({
      where: { userId: user.userId },
    });
    if (!vendorRecord) {
      return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
    }
    const vendorId = vendorRecord.id;

    let data: any[] = [];

    // Fetch data based on report type
    switch (reportType) {
      case "sales": {
        const whereClause: any = {
          vendorId,
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
          const dateToObj = new Date(filters.dateTo);
          dateToObj.setHours(23, 59, 59, 999);
          whereClause.order.createdAt = {
            ...whereClause.order.createdAt,
            lte: dateToObj,
          };
        }

        const orderItems = await prisma.orderItem.findMany({
          where: whereClause,
          select: {
            order: {
              select: {
                orderNumber: true,
                createdAt: true,
                customer: {
                  select: {
                    user: {
                      select: {
                        email: true,
                      },
                    },
                  },
                },
              },
            },
            productSnapshot: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            status: true,
          },
          take: 10000,
          orderBy: {
            order: {
              createdAt: "desc",
            },
          },
        });

        data = orderItems.map((item) => {
          const snapshot = item.productSnapshot as any;
          return {
            orderNumber: item.order.orderNumber,
            date: format(new Date(item.order.createdAt), "yyyy-MM-dd HH:mm:ss"),
            customer: item.order.customer.user.email,
            product: snapshot?.name || "Unknown",
            quantity: item.quantity,
            unitPrice: item.unitPrice.toNumber(),
            totalPrice: item.totalPrice.toNumber(),
            status: item.status,
          };
        });
        break;
      }

      case "products": {
        const products = await prisma.product.findMany({
          where: {
            vendorId,
          },
          select: {
            name: true,
            price: true,
            stock: true,
            isActive: true,
          },
        });

        data = products.map((product) => ({
          name: product.name,
          price: product.price.toNumber(),
          stock: product.stock,
          status: product.isActive ? "Active" : "Inactive",
        }));
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid report type" },
          { status: 400 }
        );
    }

    // Generate CSV
    const csv = Papa.unparse(data, {
      header: true,
      quotes: true,
    });

    // Return CSV with proper headers
    const filename = `vendor_${reportType}_report_${format(new Date(), "yyyy-MM-dd")}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv;charset=utf-8;",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to export vendor report:", error);

    // Log to a file for diagnostics
    try {
      const fs = require("fs");
      fs.writeFileSync("d:\\my-project\\PrimeWear-main\\PrimeWear-main\\scratch\\export-error.log", error instanceof Error ? `${error.message}\n${error.stack}` : String(error));
    } catch (e) {
      // If require fails in ESM, try dynamic import
      import("fs").then((fs) => {
        fs.writeFileSync("d:\\my-project\\PrimeWear-main\\PrimeWear-main\\scratch\\export-error.log", error instanceof Error ? `${error.message}\n${error.stack}` : String(error));
      }).catch(() => {});
    }

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
