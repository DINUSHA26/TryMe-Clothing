import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(request);
    const { id } = await params;

    const body = await request.json();
    const { isDisabledByAdmin, adminNote } = body;

    const existing = await (prisma as any).websiteService.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (isDisabledByAdmin !== undefined) updateData.isDisabledByAdmin = !!isDisabledByAdmin;
    if (adminNote !== undefined) updateData.adminNote = adminNote ? String(adminNote).trim() : null;

    const updated = await (prisma as any).websiteService.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Service has been ${updated.isDisabledByAdmin ? "disabled" : "enabled"} successfully`,
    });
  } catch (error) {
    console.error("Error moderating service:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "Failed to update service" },
      { status: 500 }
    );
  }
}

