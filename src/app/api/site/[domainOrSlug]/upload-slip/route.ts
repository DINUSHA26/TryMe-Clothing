import { NextRequest, NextResponse } from "next/server";
import { uploadImage, uploadFile } from "@/lib/cloudinary";
import { IMAGE_CONFIG } from "@/lib/utils/image";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) {
      return NextResponse.json(
        { success: false, error: "File must be an image or PDF" },
        { status: 400 }
      );
    }

    if (file.size > IMAGE_CONFIG.maxSize) {
      const maxSizeMB = IMAGE_CONFIG.maxSize / 1024 / 1024;
      return NextResponse.json(
        { success: false, error: `File size must be less than ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const folder = "website-order-slips";
    const result = isPdf
      ? await uploadFile(buffer, file.type, folder)
      : await uploadImage(buffer, folder);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Slip upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload payment slip" },
      { status: 500 }
    );
  }
}

