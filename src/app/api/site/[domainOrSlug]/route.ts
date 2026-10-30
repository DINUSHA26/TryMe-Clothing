import { NextRequest, NextResponse } from "next/server";
import { getStandaloneSiteData } from "@/lib/site-resolver";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domainOrSlug: string }> }
) {
  try {
    const { domainOrSlug } = await params;
    const siteData = await getStandaloneSiteData(domainOrSlug);

    if (!siteData) {
      return NextResponse.json({ success: false, error: "Website not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: siteData,
    });
  } catch (error: any) {
    console.error("Public site fetch error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
