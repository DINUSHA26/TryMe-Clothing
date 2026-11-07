import { NextRequest, NextResponse } from "next/server";
import { verifyInternalSecret } from "@/lib/internal-auth";
import { getVendorAccess, getAdsSellerAccess } from "@/lib/rbac";

/**
 * Internal endpoint used ONLY by the Edge middleware to look up a vendor or ads seller
 * staff member's RBAC permissions.
 */
export async function GET(request: NextRequest) {
  if (!verifyInternalSecret(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");
  const scope = searchParams.get("scope");

  if (!userId || !scope) {
    return NextResponse.json({ error: "userId and scope required" }, { status: 400 });
  }

  try {
    let access;
    if (scope === "VENDOR") {
      access = await getVendorAccess(userId);
    } else if (scope === "ADS_SELLER") {
      access = await getAdsSellerAccess(userId);
    } else {
      return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
    }

    return NextResponse.json(access, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[RBAC] store-access lookup failed:", error);
    return NextResponse.json({ error: "lookup failed" }, { status: 500 });
  }
}

