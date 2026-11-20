import { cookies, headers } from "next/headers";

/**
 * Returns the backend base URL.
 * Server-side calls prefer INTERNAL_BACKEND_URL or NEXT_PUBLIC_BACKEND_URL,
 * falling back to http://localhost:4000 (dedicated NestJS backend port).
 */
export function getBackendUrl(): string {
  if (typeof window === "undefined") {
    return (
      process.env.INTERNAL_BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "http://localhost:4000"
    );
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || "";
}

/**
 * Server-side API fetch utility for Next.js Server Components, Layouts, and Server Actions.
 * Decouples frontend from direct database access by delegating all queries and mutations
 * to the dedicated NestJS backend over REST HTTP.
 *
 * Automatically forwards:
 * - Session cookies (accessToken, refreshToken, etc.)
 * - Bearer authorization header if accessToken cookie is present
 * - Client IP and User-Agent headers
 * - Internal secret for privileged Edge/Gateway communication
 */
export async function serverApiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getBackendUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const requestHeaders = new Headers(options.headers || {});

  // Default content-type for JSON if body is provided and not FormData
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !requestHeaders.has("Content-Type")
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  // Attempt to forward incoming cookies & auth headers in Next.js Server environment
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader && !requestHeaders.has("cookie")) {
      requestHeaders.set("cookie", cookieHeader);
    }

    const accessToken = cookieStore.get("accessToken")?.value;
    if (accessToken && !requestHeaders.has("Authorization")) {
      requestHeaders.set("Authorization", `Bearer ${accessToken}`);
    }

    const incomingHeaders = await headers();
    const xUserId = incomingHeaders.get("x-user-id");
    const xUserRole = incomingHeaders.get("x-user-role");
    if (xUserId && !requestHeaders.has("x-user-id")) {
      requestHeaders.set("x-user-id", xUserId);
    }
    if (xUserRole && !requestHeaders.has("x-user-role")) {
      requestHeaders.set("x-user-role", xUserRole);
    }

    // Set internal secret if available
    if (process.env.JWT_SECRET && !requestHeaders.has("x-internal-secret")) {
      requestHeaders.set("x-internal-secret", process.env.JWT_SECRET);
    }
  } catch {
    // If called outside Next.js request context (e.g. build time or worker), safely ignore
  }

  const res = await fetch(url, {
    ...options,
    headers: requestHeaders,
    cache: options.cache || "no-store",
  });

  if (!res.ok) {
    let errorBody: any = null;
    try {
      errorBody = await res.json();
    } catch {
      // Not JSON
    }
    const errorMessage =
      errorBody?.message ||
      errorBody?.error ||
      `Backend HTTP Error ${res.status}: ${res.statusText}`;
    const error: any = new Error(errorMessage);
    error.status = res.status;
    error.data = errorBody;
    throw error;
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  return (await res.text()) as unknown as T;
}
