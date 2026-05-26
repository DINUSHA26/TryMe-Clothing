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

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    // Validate file type
    if (!isImage && !isPdf) {
      return NextResponse.json(
        { success: false, error: "File must be an image or a PDF" },
        { status: 400 }
      );
    }

    // Validate file size (5MB)
    if (file.size > IMAGE_CONFIG.maxSize) {
      const maxSizeMB = IMAGE_CONFIG.maxSize / 1024 / 1024;
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
    if (isPdf) {
      // Upload PDF to Cloudinary
      result = await uploadFile(buffer, file.type, folder);
    } else {
      // Upload Image to Cloudinary
      result = await uploadImage(buffer, folder);
    }

    return NextResponse.json({
      success: true,
      data: result,
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
