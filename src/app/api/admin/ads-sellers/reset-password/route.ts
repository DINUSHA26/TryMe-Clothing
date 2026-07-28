import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { passwordUtils } from "@/lib/auth";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

const resetSchema = z.object({
  sellerId: z.string().min(1, "Seller ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);

    const body = await request.json();
    const validation = resetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { sellerId } = validation.data;

    const seller = await prisma.adsSeller.findUnique({
      where: { id: sellerId },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });

    if (!seller) {
      return NextResponse.json(
        { success: false, error: "Ads Seller not found" },
        { status: 404 }
      );
    }

    // Generate new temp password
    const tempPassword = passwordUtils.generateRandom(12);
    const passwordHash = await passwordUtils.hash(tempPassword);

    await prisma.user.update({
      where: { id: seller.userId },
      data: { passwordHash, mustChangePassword: true },
    });

    const businessName = seller.businessName || `${seller.user.firstName || ''} ${seller.user.lastName || ''}`.trim() || seller.user.email;

    return NextResponse.json({
      success: true,
      data: {
        tempPassword,
        email: seller.user.email,
        businessName,
      },
    });
  } catch (error) {
    console.error("Error resetting ads seller password:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
