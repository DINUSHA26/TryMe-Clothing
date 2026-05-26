/**
 * Environment utility to handle base URLs and other environment-specific logic
 */

export function getAppUrl(): string {
  // 1. Check for NEXT_PUBLIC_APP_URL (user defined)
  // In production on Vercel, this should be the full domain
  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL !== 'http://localhost:3000') {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 2. Check for VERCEL_URL (provided by Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Fallback to localhost for development
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
