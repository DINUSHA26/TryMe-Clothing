import { headers } from "next/headers";
import { getAppUrl } from "./env";

/**
 * Gets the base application URL for Server Components dynamically.
 * Resolves the port issue in development where the server might not run on 3000.
 */
export async function getServerAppUrl(): Promise<string> {
  // First, try to get the host from headers (most reliable for current environment)
  try {
    const headersList = await headers();
    const host = headersList.get("host");
    if (host) {
      const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
      return `${protocol}://${host}`;
    }
  } catch (error) {
    // Ignore error and fallback
  }

  // Fallback to configured URL or Vercel URL
  if (
    (process.env.NEXT_PUBLIC_APP_URL &&
      process.env.NEXT_PUBLIC_APP_URL !== "http://localhost:3000") ||
    process.env.VERCEL_URL
  ) {
    return getAppUrl();
  }

  return getAppUrl();
}
