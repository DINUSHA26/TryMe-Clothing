import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { getAdminPosData } from "@/lib/services/admin-pos-service";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
      vendorId: searchParams.get("vendorId") || undefined,
      paymentMethod: searchParams.get("paymentMethod") || undefined,
      dateRange: searchParams.get("dateRange") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const data = await getAdminPosData(filters);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[Admin POS API] Error:", error);

    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: (error as any)?.message || "Failed to fetch admin POS data" },
      { status: 500 }
    );
  }
}

