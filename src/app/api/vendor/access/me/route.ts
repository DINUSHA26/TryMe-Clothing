import { NextRequest, NextResponse } from "next/server";
import { requireVendor, handleAuthError } from "@/lib/auth-helpers";
import { getVendorAccess } from "@/lib/rbac";

/**
 * GET /api/vendor/access/me
 * Returns the logged-in vendor user's RBAC access (used by sidebar & UI guards).
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireVendor(request);
    const access = await getVendorAccess(user.userId);
    return NextResponse.json({ success: true, data: access });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] vendor/access/me error:", error);
    return NextResponse.json({ success: false, error: "Failed to load access" }, { status: 500 });
  }
}

