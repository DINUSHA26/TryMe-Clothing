import { NextRequest, NextResponse } from "next/server";
import { uploadImage, uploadFile } from "@/lib/cloudinary";
import { IMAGE_CONFIG } from "@/lib/utils/image";

/**
 * POST /api/upload
 * Upload image or PDF to Cloudinary with validation
 */
export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "products";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const fileNameLower = (file.name || "").toLowerCase();
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf" || fileNameLower.endsWith(".pdf");
    const isExcel =
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel" ||
      file.type === "text/csv" ||
      file.type.includes("spreadsheet") ||
      file.type.includes("excel") ||
      fileNameLower.endsWith(".xlsx") ||
      fileNameLower.endsWith(".xls") ||
      fileNameLower.endsWith(".csv");
    const isWord =
      file.type === "application/msword" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileNameLower.endsWith(".doc") ||
      fileNameLower.endsWith(".docx");

    // Validate file type
    if (!isImage && !isPdf && !isExcel && !isWord) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported file type. Please upload images (JPG, PNG, WebP), PDFs, Excel files (.xlsx, .xls, .csv), or Word documents.",
        },
        { status: 400 }
      );
    }

    // Validate file size: up to 15MB for documents, 5MB for general images
    const maxAllowedSize = isImage ? 10 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxAllowedSize) {
      const maxSizeMB = Math.round(maxAllowedSize / 1024 / 1024);
      return NextResponse.json(
        {
          success: false,
          error: `File size must be less than ${maxSizeMB}MB`,
        },
        { status: 400 }
      );
    }

    // Convert to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let result;
    if (isImage) {
      // Upload Image to Cloudinary
      result = await uploadImage(buffer, folder);
    } else {
      // Upload PDF, Excel, or Word to Cloudinary
      result = await uploadFile(buffer, file.type, folder, file.name);
    }

    const detectedType = isImage ? "image" : isPdf ? "pdf" : isExcel ? "excel" : "file";

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        name: file.name,
        size: file.size,
        fileType: detectedType,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload file. Please try again.",
      },
      { status: 500 }
    );
  }
}
