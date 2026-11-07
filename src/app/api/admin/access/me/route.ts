import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { getAdminAccess } from "@/lib/rbac";

/**
 * GET /api/admin/access/me
 * Returns the logged-in admin's RBAC access (used by the sidebar & UI guards).
 */
export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    const access = await getAdminAccess(admin.userId);
    return NextResponse.json({ success: true, data: access });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] access/me error:", error);
    return NextResponse.json({ success: false, error: "Failed to load access" }, { status: 500 });
  }
}

