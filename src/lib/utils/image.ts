// Image upload configuration
export const IMAGE_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  minDimensions: { width: 300, height: 300 },
  maxDimensions: { width: 4000, height: 4000 },
  allowedFormats: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
};

/**
 * Validate image file type and size
 * @param file - File object to validate
 * @returns Error message if invalid, null if valid
 */
export function validateImageFile(file: File): string | null {
  // Check file type
  if (!IMAGE_CONFIG.allowedFormats.includes(file.type)) {
    return "Invalid file format. Only JPG, PNG, and WEBP are allowed.";
  }

  // Check file size
  if (file.size > IMAGE_CONFIG.maxSize) {
    const maxSizeMB = IMAGE_CONFIG.maxSize / 1024 / 1024;
    return `File size must be less than ${maxSizeMB}MB`;
  }

  return null;
}

/**
 * Validate image dimensions
 * @param file - File object to validate
 * @returns Promise that resolves to error message if invalid, null if valid
 */
export async function validateImageDimensions(
  file: File
): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      if (
        img.width < IMAGE_CONFIG.minDimensions.width ||
        img.height < IMAGE_CONFIG.minDimensions.height
      ) {
        resolve(
          `Image dimensions must be at least ${IMAGE_CONFIG.minDimensions.width}x${IMAGE_CONFIG.minDimensions.height}px`
        );
      } else if (
        img.width > IMAGE_CONFIG.maxDimensions.width ||
        img.height > IMAGE_CONFIG.maxDimensions.height
      ) {
        resolve(
          `Image dimensions must not exceed ${IMAGE_CONFIG.maxDimensions.width}x${IMAGE_CONFIG.maxDimensions.height}px`
        );
      } else {
        resolve(null);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("Failed to load image");
    };

    img.src = url;
  });
}

/**
 * Validate image file completely (type, size, and dimensions)
 * @param file - File object to validate
 * @returns Promise that resolves to error message if invalid, null if valid
 */
export async function validateImage(file: File): Promise<string | null> {
  // First check file type and size
  const fileError = validateImageFile(file);
  if (fileError) {
    return fileError;
  }

  // Then check dimensions
  const dimensionsError = await validateImageDimensions(file);
  if (dimensionsError) {
    return dimensionsError;
  }

  return null;
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
