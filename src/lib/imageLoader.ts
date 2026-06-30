interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Optimizes an image URL dynamically.
 * For Cloudinary, it injects auto-format, auto-quality, dynamic resizing, and limits upscaling.
 * For Unsplash, it updates format, quality, and width parameters.
 * For local assets, it returns the URL unchanged.
 */
export function optimizeImageUrl(src: string, width: number, quality?: number): string {
  if (!src) return "";

  // 1. Cloudinary optimization
  if (src.includes("res.cloudinary.com")) {
    const uploadMarker = "/upload/";
    const index = src.indexOf(uploadMarker);
    if (index !== -1) {
      const before = src.substring(0, index + uploadMarker.length);
      const after = src.substring(index + uploadMarker.length);
      
      // Look for an existing transformation segment and replace it, or insert a new one before version segment (e.g. v1719234823).
      const match = after.match(/(?:([^\/]+)\/)?(v\d+\/.*)/);
      if (match) {
        const [_, existingTransform, rest] = match;
        // f_auto: best format (AVIF, WebP, etc.)
        // q_auto: automated quality compression
        // w_width: dynamic resizing
        // c_limit: crop mode to prevent upscaling
        const params = `f_auto,q_auto,w_${width},c_limit`;
        return `${before}${params}/${rest}`;
      } else {
        const params = `f_auto,q_auto,w_${width},c_limit`;
        return `${before}${params}/${after}`;
      }
    }
  }

  // 2. Unsplash optimization
  if (src.includes("images.unsplash.com")) {
    try {
      const url = new URL(src);
      url.searchParams.set("auto", "format");
      url.searchParams.set("q", (quality || 75).toString());
      url.searchParams.set("w", width.toString());
      url.searchParams.set("fit", "max");
      return url.toString();
    } catch (e) {
      return src;
    }
  }

  // 3. Local assets or other domains
  return src;
}

/**
 * Next.js custom image loader default export
 */
export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  return optimizeImageUrl(src, width, quality);
}
