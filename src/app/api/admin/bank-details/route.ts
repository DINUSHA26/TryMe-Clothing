import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bankDetailsSchema = z.object({
  bankName: z.string().min(2, "Bank name is required"),
  accountName: z.string().min(2, "Account holder name is required"),
  accountNumber: z.string().min(5, "Valid account number is required"),
  branch: z.string().min(2, "Branch name is required"),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("X-User-Id");
    const userRole = request.headers.get("X-User-Role");

    if (!userId || userRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Super Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = bankDetailsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const bankDetails = validation.data;

    const setting = await prisma.systemSetting.upsert({
      where: { key: "bank_details" },
      update: {
        value: bankDetails,
      },
      create: {
        key: "bank_details",
        value: bankDetails,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Official bank details updated successfully",
      data: setting.value,
    });
  } catch (error) {
    console.error("Error updating bank details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update bank details" },
      { status: 500 }
    );
  }
}
