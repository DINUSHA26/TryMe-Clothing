import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * GET /api/chat/download
 * Proxy and securely deliver chat attachments (PDFs, Excel, images, documents)
 * Bypasses Cloudinary's 401 restriction on direct PDF URLs by generating
 * authenticated download URLs and streaming the content with proper MIME types.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileUrl = searchParams.get("url");
    const requestedName = searchParams.get("name") || "attachment";
    const mode = searchParams.get("mode") || "inline"; // "inline" for PDF preview, "attachment" for download

    if (!fileUrl) {
      return NextResponse.json({ success: false, error: "No URL provided" }, { status: 400 });
    }

    // Determine MIME type
    const lowerName = requestedName.toLowerCase();
    const isPdf = lowerName.endsWith(".pdf") || fileUrl.toLowerCase().endsWith(".pdf");
    const isExcel =
      lowerName.endsWith(".xlsx") ||
      lowerName.endsWith(".xls") ||
      lowerName.endsWith(".csv") ||
      fileUrl.toLowerCase().endsWith(".csv") ||
      fileUrl.toLowerCase().endsWith(".xlsx");
    const isImage =
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".webp") ||
      lowerName.endsWith(".gif");

    let contentType = "application/octet-stream";
    if (isPdf) contentType = "application/pdf";
    else if (lowerName.endsWith(".xlsx")) contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    else if (lowerName.endsWith(".xls")) contentType = "application/vnd.ms-excel";
    else if (lowerName.endsWith(".csv")) contentType = "text/csv; charset=utf-8";
    else if (lowerName.endsWith(".png")) contentType = "image/png";
    else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) contentType = "image/jpeg";
    else if (lowerName.endsWith(".webp")) contentType = "image/webp";

    // URLs to try in order of priority
    const urlsToTry: string[] = [];

    if (fileUrl.includes("res.cloudinary.com")) {
      const match = fileUrl.match(/\/(image|raw|video)\/upload\/(?:v\d+\/)?([^\?]+)/);
      if (match) {
        const resourceType = match[1] as "image" | "raw" | "video";
        const pathPart = match[2];
        const lastDot = pathPart.lastIndexOf(".");

        let publicId = pathPart;
        let format = "";
        if (lastDot !== -1) {
          publicId = pathPart.slice(0, lastDot);
          format = pathPart.slice(lastDot + 1);
        }

        // Try signed download URL first for Cloudinary assets
        try {
          const signedUrl = cloudinary.utils.private_download_url(
            publicId,
            format,
            {
              resource_type: resourceType,
              type: "upload",
            }
          );
          if (signedUrl) urlsToTry.push(signedUrl);
        } catch (signErr) {
          console.warn("[Chat Download] Failed to sign URL:", signErr);
        }

        // Also try signing without format if raw
        if (resourceType === "raw") {
          try {
            const rawSigned = cloudinary.utils.private_download_url(
              pathPart,
              "",
              {
                resource_type: "raw",
                type: "upload",
              }
            );
            if (rawSigned) urlsToTry.push(rawSigned);
          } catch {}
        }
      }
    }

    // Always include direct fileUrl as fallback
    urlsToTry.push(fileUrl);

    // Attempt fetching
    let upstreamRes: Response | null = null;
    for (const url of urlsToTry) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          upstreamRes = res;
          break;
        }
      } catch (err) {
        // try next
      }
    }

    if (!upstreamRes || !upstreamRes.ok) {
      console.error(`[Chat Download] Failed to fetch file from all attempted URLs`);
      return NextResponse.json(
        { success: false, error: "Failed to retrieve file from storage" },
        { status: upstreamRes?.status || 404 }
      );
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    const disposition = mode === "attachment" || isExcel
      ? `attachment; filename="${encodeURIComponent(requestedName)}"`
      : `inline; filename="${encodeURIComponent(requestedName)}"`;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("[Chat Download API Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
