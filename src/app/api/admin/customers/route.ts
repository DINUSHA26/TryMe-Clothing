import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { getAdminCustomersData } from "@/lib/services/admin-customer-service";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
      source: searchParams.get("source") || undefined,
      vendorId: searchParams.get("vendorId") || undefined,
      search: searchParams.get("search") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
    };

    const data = await getAdminCustomersData(filters);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[Admin Customers API] Error:", error);

    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      { success: false, error: (error as any)?.message || "Failed to fetch admin customer data" },
      { status: 500 }
    );
  }
}
