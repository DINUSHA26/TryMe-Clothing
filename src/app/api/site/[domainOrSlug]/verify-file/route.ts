import { NextRequest, NextResponse } from "next/server";
import { getStandaloneSiteDataCached } from "@/lib/site-resolver";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domainOrSlug: string }> }
) {
  try {
    const { domainOrSlug } = await params;
    const file = request.nextUrl.searchParams.get("file") || "";
    const siteData = await getStandaloneSiteDataCached(domainOrSlug);

    const footerConfig = (siteData?.config?.footerSection as any) || {};
    const seoConfig = footerConfig.seoConfig || {};
    const configuredVerificationCode =
      seoConfig.metaVerificationCode ||
      footerConfig.metaVerificationCode ||
      siteData?.customDomain?.verificationKey;

    const baseFileName = file.replace(/\.html$/i, "");

    // 1. Meta / Facebook domain verification file matching
    // Meta verification files are either named `facebook<code_or_hash>.html` or `<code_or_hash>.html`
    // and their content is the code itself or standard Meta verification content.
    if (configuredVerificationCode) {
      if (
        baseFileName === configuredVerificationCode ||
        baseFileName === `facebook${configuredVerificationCode}` ||
        file.toLowerCase().includes(configuredVerificationCode.toLowerCase())
      ) {
        return new NextResponse(configuredVerificationCode, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    }

    // 2. Fallback: if the requested file starts with "facebook", return the file content as the token
    if (baseFileName.startsWith("facebook") || baseFileName.startsWith("google")) {
      const token = baseFileName.replace(/^facebook/i, "").replace(/^google/i, "") || baseFileName;
      return new NextResponse(token, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // 3. Fallback to verification key
    if (siteData?.customDomain?.verificationKey) {
      return new NextResponse(siteData.customDomain.verificationKey, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    return new NextResponse("Not Found", { status: 404 });
  } catch (error: any) {
    console.error("Verification file handler error:", error);
    return new NextResponse("Error", { status: 500 });
  }
}

