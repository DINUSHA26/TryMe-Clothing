import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_BANK_DETAILS = {
  bankName: "Seylan Bank",
  accountName: "Fashion Dora",
  accountNumber: "1230-13526365-001",
  branch: "Main Branch",
};

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "bank_details" },
    });

    if (setting && setting.value) {
      return NextResponse.json({
        success: true,
        data: setting.value,
      });
    }

    return NextResponse.json({
      success: true,
      data: DEFAULT_BANK_DETAILS,
    });
  } catch (error) {
    console.error("Error fetching bank details:", error);
    return NextResponse.json({
      success: true,
      data: DEFAULT_BANK_DETAILS,
    });
  }
}
