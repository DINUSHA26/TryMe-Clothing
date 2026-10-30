import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const domains = await (prisma as any).vendorCustomDomain.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            logo: true,
          },
        },
        adsSeller: {
          select: {
            id: true,
            businessName: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: domains });
  } catch (error: any) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
