import { NextRequest, NextResponse } from "next/server";
import { requireAdsSeller, handleAuthError } from "@/lib/auth-helpers";
import { getAdsSellerAccess } from "@/lib/rbac";

/**
 * GET /api/ads-seller/access/me
 * Returns the logged-in ads seller user's RBAC access (used by sidebar & UI guards).
 */
export async function GET(request: NextRequest) {
  try {
    const user = requireAdsSeller(request);
    const access = await getAdsSellerAccess(user.userId);
    return NextResponse.json({ success: true, data: access });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("[API] ads-seller/access/me error:", error);
    return NextResponse.json({ success: false, error: "Failed to load access" }, { status: 500 });
  }
}

