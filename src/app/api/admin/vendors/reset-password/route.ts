import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { passwordUtils } from "@/lib/auth";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

const resetSchema = z.object({
  vendorId: z.string().min(1, "Vendor ID is required"),
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

    const { vendorId } = validation.data;

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: "Vendor not found" },
        { status: 404 }
      );
    }

    // Generate new temp password
    const tempPassword = passwordUtils.generateRandom(12);
    const passwordHash = await passwordUtils.hash(tempPassword);

    await prisma.user.update({
      where: { id: vendor.userId },
      data: { passwordHash, mustChangePassword: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        tempPassword,
        email: vendor.user.email,
        businessName: vendor.businessName,
      },
    });
  } catch (error) {
    console.error("Error resetting vendor password:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
