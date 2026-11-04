import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDomainToVercel, cleanDomain, removeDomainFromVercel } from "@/lib/vercel-domains";
import { getAuthUser } from "@/lib/auth-helpers";
import { resolveWebsiteEntity } from "@/lib/website-entity-helper";

export async function GET(request: NextRequest) {
  try {
    let userId = request.headers.get("X-User-Id");
    if (!userId) {
      const authUser = getAuthUser(request);
      userId = authUser?.userId || null;
    }
    if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const target = await resolveWebsiteEntity(userId);
    if (!target) return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });

    const domainRecord = await (prisma as any).vendorCustomDomain.findFirst({
      where: target.flexibleWhere,
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

    const target = await resolveWebsiteEntity(userId);
    if (!target) return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });

    // Verify active subscription (using flexible matching so both seller & vendor links match)
    const activeSub = await (prisma as any).vendorWebsiteSubscription.findFirst({
      where: {
        ...target.flexibleWhere,
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

    if (
      existing &&
      ((target.vendorId && existing.vendorId && existing.vendorId !== target.vendorId) ||
       (target.adsSellerId && existing.adsSellerId && existing.adsSellerId !== target.adsSellerId))
    ) {
      return NextResponse.json({ success: false, error: "This domain is already connected to another store." }, { status: 409 });
    }

    // Register domain on Vercel
    const vercelRes = await addDomainToVercel(domain);
    if (!vercelRes.success && vercelRes.error && !vercelRes.error.includes("already")) {
      console.warn("Vercel domain addition warning:", vercelRes.error);
    }

    // Check existing record for this store
    const storeDomain = await (prisma as any).vendorCustomDomain.findFirst({
      where: target.flexibleWhere,
    });

    let savedDomain;
    if (storeDomain) {
      savedDomain = await (prisma as any).vendorCustomDomain.update({
        where: { id: storeDomain.id },
        data: {
          domain,
          dnsStatus: "PENDING_VERIFICATION",
          sslActive: false,
        },
      });
    } else {
      savedDomain = await (prisma as any).vendorCustomDomain.create({
        data: {
          ...target.primaryWhere,
          domain,
          dnsStatus: "PENDING_VERIFICATION",
          sslActive: false,
        },
      });
    }

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

    const target = await resolveWebsiteEntity(userId);
    if (!target) return NextResponse.json({ success: false, error: "Account not found" }, { status: 404 });

    const existing = await (prisma as any).vendorCustomDomain.findFirst({
      where: target.flexibleWhere,
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
