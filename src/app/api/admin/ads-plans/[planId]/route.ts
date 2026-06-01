import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

/**
 * PATCH /api/admin/ads-plans/[planId]
 * Update price, maxAds, features or status of an ads pricing plan
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const admin = requireAdmin(request);
    const { planId } = params;
    const body = await request.json();

    const plan = await prisma.adsPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: "Ads plan not found" },
        { status: 404 }
      );
    }

    const updatedPlan = await prisma.adsPlan.update({
      where: { id: planId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.maxAds !== undefined && { maxAds: parseInt(body.maxAds.toString()) }),
        ...(body.price !== undefined && { price: parseFloat(body.price.toString()) }),
        ...(body.billingCycle && { billingCycle: body.billingCycle }),
        ...(body.isActive !== undefined && { isActive: !!body.isActive }),
        ...(body.features && { features: body.features }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedPlan,
    });
  } catch (error) {
    console.error("Error updating ads plan:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while updating the plan" },
      { status: 500 }
    );
  }
}
