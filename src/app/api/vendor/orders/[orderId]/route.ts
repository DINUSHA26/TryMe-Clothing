/**
 * Vendor order details API
 * GET /api/vendor/orders/[orderId] - Get single order details for vendor
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

import { getVendorOrderDetail } from "@/lib/services/vendor-order-service";

/**
 * GET /api/vendor/orders/[orderId]
 * Returns order details scoped to this vendor's items
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = requireVendor(request);

    // Look up vendor record
    const vendorRecord = await prisma.vendor.findUnique({
      where: { userId: user.userId },
    });
    if (!vendorRecord) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }
    const vendorId = vendorRecord.id;

    const { orderId } = await params;

    const data = await getVendorOrderDetail(vendorId, orderId);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("[Vendor Order Detail API] Error:", error);

    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch order details" },
      { status: error.message === "Order not found" ? 404 : 500 }
    );
  }
}
