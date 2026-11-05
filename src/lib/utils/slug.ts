/**
 * Generate a URL-friendly slug from a string
 * Handles special characters, spaces, and ensures uniqueness if needed
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Remove special characters except spaces and hyphens
    .replace(/[^\w\s-]/g, "")
    // Replace spaces with hyphens
    .replace(/\s+/g, "-")
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a unique slug following industry e-commerce standards:
 * 1. Try base slug first (e.g. "lacoste-t-shirt")
 * 2. If collision occurs, qualify with vendor/store slug (e.g. "lacoste-t-shirt-coolword")
 * 3. If still colliding, append a short unique alphanumeric suffix (e.g. "lacoste-t-shirt-coolword-8f2a")
 * 4. Fallback to sequential counter if all attempts fail
 */
export async function generateUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>,
  qualifier?: string
): Promise<string> {
  // 1. If base slug is free, use it
  if (!(await checkExists(baseSlug))) {
    return baseSlug;
  }

  // 2. If taken, try incorporating the qualifier (e.g. store/vendor slug)
  if (qualifier) {
    const cleanQualifier = generateSlug(qualifier);
    if (cleanQualifier && !baseSlug.endsWith(`-${cleanQualifier}`)) {
      const qualifiedSlug = `${baseSlug}-${cleanQualifier}`;
      if (!(await checkExists(qualifiedSlug))) {
        return qualifiedSlug;
      }
    }
  }

  // 3. If still taken, append a clean short 4-char alphanumeric code (industry standard e.g. Amazon / Daraz)
  const prefix =
    qualifier && !baseSlug.endsWith(`-${generateSlug(qualifier)}`)
      ? `${baseSlug}-${generateSlug(qualifier)}`
      : baseSlug;

  for (let i = 0; i < 10; i++) {
    const shortCode = Math.random().toString(36).substring(2, 6);
    const candidate = `${prefix}-${shortCode}`;
    if (!(await checkExists(candidate))) {
      return candidate;
    }
  }

  // 4. Sequential fallback if needed
  let counter = 2;
  while (await checkExists(`${prefix}-${counter}`)) {
    counter++;
  }
  return `${prefix}-${counter}`;
}
