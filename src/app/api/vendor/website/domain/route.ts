import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDomainToVercel, cleanDomain, getDomainConfig, removeDomainFromVercel } from "@/lib/vercel-domains";
import { getAuthUser } from "@/lib/auth-helpers";

async function getVendorOrSeller(userId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { userId },
    select: { id: true, businessName: true, slug: true },
  });
  if (vendor) return { type: "VENDOR" as const, entity: vendor, whereClause: { vendorId: vendor.id } };

  const adsSeller = await (prisma as any).adsSeller.findUnique({
    where: { userId },
    select: { id: true, businessName: true, slug: true },
  });
  if (adsSeller) return { type: "ADS_SELLER" as const, entity: adsSeller, whereClause: { adsSellerId: adsSeller.id } };

  return null;
}

export async function GET(request: NextRequest) {
  try {
    let userId = request.headers.get("X-User-Id");
    if (!userId) {
      const authUser = getAuthUser(request);
      userId = authUser?.userId || null;
    }
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const target = await getVendorOrSeller(userId);
    if (!target) return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });

    const domainRecord = await (prisma as any).vendorCustomDomain.findFirst({
      where: target.whereClause,
    });

    return NextResponse.json({
      success: true,
      data: domainRecord,
      instructions: {
        apexRecord: {
          type: "A",
          name: "@",
          value: "76.76.21.21",
          description: "Point your root domain to the Vercel Anycast IP",
        },
        cnameRecord: {
          type: "CNAME",
          name: "www",
          value: "cname.vercel-dns.com",
          description: "Point your www subdomain to Vercel DNS",
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let userId = request.headers.get("X-User-Id");
    if (!userId) {
      const authUser = getAuthUser(request);
      userId = authUser?.userId || null;
    }
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const target = await getVendorOrSeller(userId);
    if (!target) return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });

    // Verify active subscription
    const activeSub = await (prisma as any).vendorWebsiteSubscription.findFirst({
      where: {
        ...target.whereClause,
        status: "ACTIVE",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (!activeSub) {
      return NextResponse.json(
        { success: false, error: "An active website subscription is required to connect a custom domain." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const rawDomain = body.domain;

    if (!rawDomain) {
      return NextResponse.json({ success: false, error: "Domain name is required" }, { status: 400 });
    }

    const domain = cleanDomain(rawDomain);
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ success: false, error: "Please enter a valid domain format (e.g. fashiondora.lk)" }, { status: 400 });
    }

    // Check if domain is already in use by someone else
    const existing = await (prisma as any).vendorCustomDomain.findUnique({
      where: { domain },
    });

    if (existing && ((target.type === "VENDOR" && existing.vendorId !== target.entity.id) || (target.type === "ADS_SELLER" && existing.adsSellerId !== target.entity.id))) {
      return NextResponse.json({ success: false, error: "This domain is already connected to another store." }, { status: 409 });
    }

    // Register domain on Vercel
    const vercelRes = await addDomainToVercel(domain);
    if (!vercelRes.success && vercelRes.error && !vercelRes.error.includes("already")) {
      console.warn("Vercel domain addition warning:", vercelRes.error);
    }

    // Save to database
    const savedDomain = await (prisma as any).vendorCustomDomain.upsert({
      where: target.whereClause,
      create: {
        ...target.whereClause,
        domain,
        dnsStatus: "PENDING_VERIFICATION",
        sslActive: false,
      },
      update: {
        domain,
        dnsStatus: "PENDING_VERIFICATION",
        sslActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: savedDomain,
      instructions: {
        apexRecord: { type: "A", name: "@", value: "76.76.21.21" },
        cnameRecord: { type: "CNAME", name: "www", value: "cname.vercel-dns.com" },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    let userId = request.headers.get("X-User-Id");
    if (!userId) {
      const authUser = getAuthUser(request);
      userId = authUser?.userId || null;
    }
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const target = await getVendorOrSeller(userId);
    if (!target) return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });

    const existing = await (prisma as any).vendorCustomDomain.findFirst({
      where: target.whereClause,
    });

    if (existing) {
      await removeDomainFromVercel(existing.domain);
      await (prisma as any).vendorCustomDomain.delete({
        where: { id: existing.id },
      });
    }

    return NextResponse.json({ success: true, message: "Custom domain disconnected successfully." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
