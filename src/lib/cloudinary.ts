import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Upload image to Cloudinary
 * @param file - Buffer of the image file
 * @param folder - Cloudinary folder path (e.g., 'products', 'categories')
 * @returns Upload result with URL and metadata
 */
export async function uploadImage(
  file: Buffer,
  folder: string = "products"
): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${file.toString("base64")}`,
      {
        folder: `fashiondora/${folder}`,
        transformation: [
          { width: 1200, height: 1200, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      }
    );

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
}

/**
 * Upload a file (like bank slip) to Cloudinary
 * @param file - Buffer of the file
 * @param mimeType - MIME type of the file
 * @param folder - Cloudinary folder path
 */
export async function uploadFile(
  file: Buffer,
  mimeType: string,
  folder: string = "documents"
): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(
      `data:${mimeType};base64,${file.toString("base64")}`,
      {
        folder: `fashiondora/${folder}`,
      }
    );

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width || 0,
      height: result.height || 0,
      format: result.format,
    };
  } catch (error) {
    console.error("Cloudinary file upload error:", error);
    throw new Error("Failed to upload file to Cloudinary");
  }
}

/**
 * Delete image from Cloudinary
 * @param publicId - Public ID of the image to delete
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    // Don't throw - deletion failure shouldn't block the operation
  }
}

/**
 * Delete multiple images from Cloudinary
 * @param publicIds - Array of public IDs to delete
 */
export async function deleteImages(publicIds: string[]): Promise<void> {
  try {
    await cloudinary.api.delete_resources(publicIds);
  } catch (error) {
    console.error("Cloudinary bulk delete error:", error);
    // Don't throw - deletion failure shouldn't block the operation
  }
}
