import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDomainConfig, verifyDomainOnVercel } from "@/lib/vercel-domains";
import { getAuthUser } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    let userId = request.headers.get("X-User-Id");
    if (!userId) {
      const authUser = getAuthUser(request);
      userId = authUser?.userId || null;
    }
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const vendor = await prisma.vendor.findUnique({
      where: { userId },
      select: { id: true },
    });

    const whereClause = vendor
      ? { vendorId: vendor.id }
      : {
          adsSellerId: (
            await (prisma as any).adsSeller.findUnique({
              where: { userId },
              select: { id: true },
            })
          )?.id,
        };

    if (!whereClause.vendorId && !whereClause.adsSellerId) {
      return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });
    }

    const domainRecord = await (prisma as any).vendorCustomDomain.findFirst({
      where: whereClause,
    });

    if (!domainRecord) {
      return NextResponse.json({ success: false, error: "No custom domain configured" }, { status: 404 });
    }

    // Verify on Vercel
    const verifyRes = await verifyDomainOnVercel(domainRecord.domain);
    const configRes = await getDomainConfig(domainRecord.domain);

    const isVerified = verifyRes.verified || !configRes.misconfigured;

    const updated = await (prisma as any).vendorCustomDomain.update({
      where: { id: domainRecord.id },
      data: {
        dnsStatus: isVerified ? "ACTIVE" : "PENDING_VERIFICATION",
        sslActive: Boolean(configRes.sslActive),
        verifiedAt: isVerified ? new Date() : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      isVerified,
      sslActive: configRes.sslActive,
      misconfigured: configRes.misconfigured,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
