import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  _context: { params: Promise<{ adId: string }> }
) {
  return NextResponse.json(
    {
      success: false,
      error: "Direct purchasing from classified ads is disabled. Ads sellers can list items on TryMe Shop by Category for standard storefront checkout.",
    },
    { status: 400 }
  );
}
