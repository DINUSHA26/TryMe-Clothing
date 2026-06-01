import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

/**
 * GET /api/admin/ads-plans
 * List all ads pricing plans (active and inactive) for admin
 */
export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);

    const plans = await prisma.adsPlan.findMany({
      orderBy: { price: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("Error fetching ads plans:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while fetching plans" },
      { status: 500 }
    );
  }
}
