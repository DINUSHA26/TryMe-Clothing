import { NextRequest, NextResponse, NextFetchEvent } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import {
  AdminAccessInfo,
  StoreAccessInfo,
  hasRoutePermission,
  hasStoreRoutePermission,
  resolveRouteRequirement,
  resolveVendorRouteRequirement,
  resolveAdsSellerRouteRequirement,
} from "@/lib/permissions";

// Plain string role type — avoids importing @prisma/client in Edge Runtime
type Role = "ADMIN" | "VENDOR" | "CUSTOMER" | "ADS_SELLER";

// ── Admin & Store RBAC: per-isolate cache of permissions (short TTL) ──────────
const ACCESS_CACHE_TTL_MS = 15_000;
const accessCache = new Map<string, { exp: number; data: AdminAccessInfo }>();
const storeAccessCache = new Map<string, { exp: number; data: StoreAccessInfo }>();

/**
 * Look up Admin RBAC permissions through the internal Node endpoint
 * (Edge runtime cannot use Prisma). Returns null when the lookup fails.
 */
async function fetchAdminAccess(
  origin: string,
  userId: string,
  sessionId?: string
): Promise<AdminAccessInfo | null> {
  const cacheKey = sessionId ? `${userId}:${sessionId}` : userId;
  const cached = accessCache.get(cacheKey);
  if (cached && cached.exp > Date.now()) return cached.data;

  try {
    const url = `${origin}/api/internal/admin-access?userId=${encodeURIComponent(userId)}${
      sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : ""
    }`;
    const res = await fetch(url, {
      headers: { "x-internal-secret": process.env.JWT_SECRET || "" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 401) {
      return { isSuper: false, isActive: false, permissions: [], sessionExpired: true };
    }
    if (!res.ok) return null;
    const data = (await res.json()) as AdminAccessInfo;
    if (accessCache.size > 500) accessCache.clear();
    accessCache.set(cacheKey, { exp: Date.now() + ACCESS_CACHE_TTL_MS, data });
    return data;
  } catch {
    return null;
  }
}

/**
 * Look up Store (Vendor / Ads Seller) RBAC permissions through the internal Node endpoint.
 */
async function fetchStoreAccess(
  origin: string,
  userId: string,
  scope: "VENDOR" | "ADS_SELLER"
): Promise<StoreAccessInfo | null> {
  const cacheKey = `${scope}:${userId}`;
  const cached = storeAccessCache.get(cacheKey);
  if (cached && cached.exp > Date.now()) return cached.data;

  try {
    const res = await fetch(
      `${origin}/api/internal/store-access?userId=${encodeURIComponent(userId)}&scope=${scope}`,
      {
        headers: { "x-internal-secret": process.env.JWT_SECRET || "" },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as StoreAccessInfo;
    if (storeAccessCache.size > 1000) storeAccessCache.clear();
    storeAccessCache.set(cacheKey, { exp: Date.now() + ACCESS_CACHE_TTL_MS, data });
    return data;
  } catch {
    return null;
  }
}

// Verify JWT using jose (Edge Runtime compatible)
async function verifyToken(token: string): Promise<{ userId: string; email: string; role: Role; sessionId?: string } | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as Role,
      sessionId: payload.sessionId as string | undefined,
    };
  } catch {
    return null;
  }
}

// Verify Refresh JWT using jose (Edge Runtime compatible)
async function verifyRefreshToken(token: string): Promise<{ userId: string; email: string; role: Role; sessionId?: string } | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || "");
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as Role,
      sessionId: payload.sessionId as string | undefined,
    };
  } catch {
    return null;
  }
}

// Generate new access token in Next.js middleware (Edge Runtime compatible)
async function generateAccessToken(payload: { userId: string; email: string; role: Role; sessionId?: string }): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("3d") // 3 days
    .sign(secret);
}

// Generate new refresh token in Next.js middleware (Edge Runtime compatible)
async function generateRefreshToken(payload: { userId: string; email: string; role: Role; sessionId?: string }): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || "");
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("3d") // 3 days
    .sign(secret);
}

// Define route patterns and their required roles
const protectedRoutes: Record<string, Role[]> = {
  // ── Page routes ──────────────────────────────────────────────────────────
  "/admin": ["ADMIN"],
  "/vendor/website-builder": ["VENDOR", "ADS_SELLER", "ADMIN"],
  "/vendor": ["VENDOR"],
  "/orders": ["CUSTOMER", "ADMIN", "VENDOR", "ADS_SELLER"],
  "/checkout": ["CUSTOMER", "VENDOR", "ADMIN", "ADS_SELLER"],
  "/payment": ["CUSTOMER", "VENDOR", "ADMIN", "ADS_SELLER"],
  "/profile": ["CUSTOMER", "ADMIN", "VENDOR", "ADS_SELLER"],
  "/notifications": ["CUSTOMER", "ADMIN", "VENDOR", "ADS_SELLER"],
  "/my-disputes": ["CUSTOMER", "ADMIN", "VENDOR", "ADS_SELLER"],
  // ── Customer API routes ───────────────────────────────────────────────────
  "/api/cart": ["CUSTOMER", "VENDOR", "ADMIN", "ADS_SELLER"],
  "/api/addresses": ["CUSTOMER", "VENDOR", "ADMIN", "ADS_SELLER"],
  "/api/checkout": ["CUSTOMER", "VENDOR", "ADMIN", "ADS_SELLER"],
  "/api/orders": ["CUSTOMER", "ADMIN", "VENDOR", "ADS_SELLER"],
  "/api/disputes": ["CUSTOMER", "VENDOR", "ADMIN", "ADS_SELLER"],
  "/api/reviews": ["CUSTOMER", "VENDOR", "ADMIN", "ADS_SELLER"],
  "/api/payments/initiate": ["CUSTOMER", "VENDOR", "ADMIN", "ADS_SELLER"],
  "/api/payments/bank-transfer": ["CUSTOMER", "VENDOR", "ADMIN", "ADS_SELLER"],
  "/api/coupons": ["CUSTOMER", "VENDOR", "ADMIN", "ADS_SELLER"],
  // ── Shared API routes ─────────────────────────────────────────────────────
  "/api/chat": ["CUSTOMER", "VENDOR", "ADMIN", "ADS_SELLER"],
  "/api/pusher/auth": ["CUSTOMER", "VENDOR", "ADMIN", "ADS_SELLER"],
  "/api/upload": ["CUSTOMER", "VENDOR", "ADMIN", "ADS_SELLER"],
  "/api/notifications": ["CUSTOMER", "ADMIN", "VENDOR", "ADS_SELLER"],
  "/api/profile": ["CUSTOMER", "VENDOR", "ADMIN", "ADS_SELLER"],
  // ── Role-restricted API routes ────────────────────────────────────────────
  "/api/vendor/services": ["VENDOR", "ADS_SELLER", "ADMIN"],
  "/api/vendor/website": ["VENDOR", "ADS_SELLER", "ADMIN"],
  "/api/vendor/reports": ["VENDOR", "ADS_SELLER", "ADMIN"],
  "/api/admin/services/categories": ["ADMIN", "VENDOR", "ADS_SELLER"],
  "/api/admin/website-subscriptions": ["ADMIN"],
  "/api/admin/ads-sellers": ["ADMIN"],
  "/api/admin/ads-plans": ["ADMIN"],
  "/api/admin/marketplace": ["ADMIN"],
  "/api/admin": ["ADMIN"],
  "/api/vendor": ["VENDOR"],
  "/ads-seller": ["ADS_SELLER"],
  "/api/ads/seller": ["ADS_SELLER"],
  "/api/ads-seller": ["ADS_SELLER", "VENDOR", "ADMIN"],
};

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/staff/login",
  "/products",
  "/categories",
  "/vendors",
  "/deals",
  "/api/deals",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/refresh",
  "/api/auth/otp",
  "/api/payments/webhook", // PayHere webhook must be public
  "/api/ads/seller/payment/payhere/webhook", // PayHere ads webhook must be public
  "/api/products",
  "/api/categories",
  "/api/vendors",
  "/shipping",
  "/returns",
  "/terms",
  "/privacy",
  "/help",
  "/contact",
  "/cookies",
  "/new-arrivals",
  "/vendor/register",
  "/cart",
  "/marketplace",
  "/ads-seller/register",
  "/api/ads/public",
  "/api/ads/auth",
  "/site",
  "/site-preview",
  "/api/site",
  "/services",
  "/api/services",
  "/api/diag",
  "/api/ping",
  "/api/vendor/website/subscribe/payhere-webhook",
];

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and images
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot|webp)$/i)
  ) {
    return NextResponse.next();
  }

  // ── Custom Domain Multi-Tenant Rewrite (Vercel for Platforms) ──
  const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const host = rawHost.toLowerCase().replace(/:\d+$/, "");
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "tryme.lk").toLowerCase().replace(/^www\./, "");

  // Main TryMe platform hosts:
  // - tryme.lk, www.tryme.lk, *.tryme.lk
  // - try-me-clothing.vercel.app (and git preview branches of try-me-clothing)
  // - localhost, 127.0.0.1
  const isTryMeHost =
    host === rootDomain ||
    host === `www.${rootDomain}` ||
    host.endsWith(`.${rootDomain}`) ||
    host === "try-me-clothing.vercel.app" ||
    (host.startsWith("try-me-clothing") && host.endsWith(".vercel.app")) ||
    host.includes("localhost") ||
    host === "127.0.0.1";

  if (!isTryMeHost) {
    // Custom domain request! e.g., fashiondora.lk, apple26.vercel.app, coolworld.vercel.app
    const cleanHost = host.replace(/^www\./, "");
    // If browser URL accidentally contains /site/<domain> on a custom domain, redirect cleanly to "/"
    // so the browser address bar directly shows ONLY the website domain name!
    if (pathname.startsWith("/site/")) {
      const cleanUrl = request.nextUrl.clone();
      const remainder = pathname.replace(/^\/site\/[^/]+/, "") || "/";
      cleanUrl.pathname = remainder;
      return NextResponse.redirect(cleanUrl, 308);
    }
    // If request on custom domain is for /products/<slug>, redirect to /?page=product&item=<slug>
    if (pathname.startsWith("/products/")) {
      const productSlug = pathname.replace(/^\/products\//, "");
      const cleanUrl = request.nextUrl.clone();
      cleanUrl.pathname = "/";
      cleanUrl.searchParams.set("page", "product");
      cleanUrl.searchParams.set("item", productSlug);
      return NextResponse.redirect(cleanUrl, 307);
    }
    if (!pathname.startsWith("/site") && !pathname.startsWith("/api")) {
      const url = request.nextUrl.clone();
      url.pathname = `/site/${cleanHost}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Maintenance mode (disabled by default)
  if (process.env.MAINTENANCE_MODE === "true") {
    if (pathname === "/maintenance") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/") || pathname === route
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if route is protected — use exact match or trailing slash to avoid
  // /api/vendors being matched by /api/vendor prefix
  const protectedRoute = Object.keys(protectedRoutes).find(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (!protectedRoute) {
    // Route not in protected list, allow access
    return NextResponse.next();
  }

  // Get token from cookie or Authorization header
  const tokenFromCookie = request.cookies.get("accessToken")?.value;
  const authHeader = request.headers.get("Authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  const token = tokenFromCookie || tokenFromHeader;

  // No token — redirect to the appropriate login page
  if (!token) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    if (pathname.startsWith("/admin") || pathname.startsWith("/vendor") || pathname.startsWith("/ads-seller")) {
      url.pathname = "/staff/login";
    } else {
      url.pathname = "/login";
    }
    url.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Verify token (jose — Edge Runtime compatible)
  let payload = await verifyToken(token);
  let isRefreshed = false;
  let newAccessToken = "";
  let newRefreshToken = "";

  if (!payload) {
    // Access token is expired or invalid. Check if refresh token is present.
    const refreshToken = request.cookies.get("refreshToken")?.value;
    if (refreshToken) {
      const refreshPayload = await verifyRefreshToken(refreshToken);
      if (refreshPayload) {
        // Valid refresh token! Generate new tokens.
        payload = {
          userId: refreshPayload.userId,
          email: refreshPayload.email,
          role: refreshPayload.role,
          sessionId: refreshPayload.sessionId,
        };
        try {
          newAccessToken = await generateAccessToken(payload);
          newRefreshToken = await generateRefreshToken(payload);
          isRefreshed = true;
        } catch (err) {
          console.error("Failed to generate tokens in middleware:", err);
          payload = null;
        }
      }
    }
  }

  if (!payload) {
    // Invalid / expired token — return 401 for API or redirect to login for pages
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    if (pathname.startsWith("/admin") || pathname.startsWith("/vendor") || pathname.startsWith("/ads-seller")) {
      url.pathname = "/staff/login";
    } else {
      url.pathname = "/login";
    }
    url.searchParams.set("returnUrl", pathname);
    const response = NextResponse.redirect(url);
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
  }

  // Check if user has the required role for this route
  const requiredRoles = protectedRoutes[protectedRoute];
  if (!requiredRoles.includes(payload.role)) {
    const url = request.nextUrl.clone();
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }
    url.pathname = "/403";
    return NextResponse.redirect(url);
  }

  // ── Admin RBAC: staff members only get the permissions of their role ──────
  // Super Admins (ADMIN users without a StaffMember record) pass every check.
  // Set RBAC_ENFORCE=false in the environment to disable (emergency switch).
  const isAdminArea =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/api/admin" ||
    pathname.startsWith("/api/admin/");

  if (payload.role === "ADMIN" && isAdminArea && process.env.RBAC_ENFORCE !== "false") {
    const isApi = pathname.startsWith("/api");
    const deny = (status: number, message: string) => {
      if (isApi) return NextResponse.json({ error: message }, { status });
      const forbiddenUrl = request.nextUrl.clone();
      forbiddenUrl.pathname = "/403";
      forbiddenUrl.search = "";
      return NextResponse.redirect(forbiddenUrl);
    };

    const requirement = resolveRouteRequirement(pathname, request.method);
    const access = await fetchAdminAccess(request.nextUrl.origin, payload.userId, payload.sessionId);

    if (access?.sessionExpired) {
      if (isApi) {
        return NextResponse.json(
          {
            error: "session_limit_exceeded",
            message: "Your session has expired because your admin account was logged into 2 other devices.",
          },
          { status: 401 }
        );
      }
      const expiredUrl = request.nextUrl.clone();
      expiredUrl.pathname = "/staff/login";
      expiredUrl.searchParams.set("error", "session_limit_exceeded");
      const resp = NextResponse.redirect(expiredUrl);
      resp.cookies.delete("accessToken");
      resp.cookies.delete("refreshToken");
      return resp;
    }

    if (!access) {
      // Fail closed: if we cannot verify permissions we do not let the request through
      return deny(503, "Unable to verify permissions. Please try again.");
    }
    if (!access.isActive) {
      return deny(403, "Forbidden: your staff account is disabled");
    }
    if (!hasRoutePermission(access.permissions, access.isSuper, requirement)) {
      const needed = requirement.type === "permission" ? requirement.permission : "super-admin";
      return deny(403, `Forbidden: missing permission (${needed})`);
    }

    // Record admin write actions in the audit log (fire-and-forget).
    // Staff / role changes are audited with richer detail by their own routes.
    const isMutation = !["GET", "HEAD", "OPTIONS"].includes(request.method);
    const isOwnAudited =
      requirement.type === "permission" &&
      (requirement.feature === "staff" || requirement.feature === "roles");
    if (isMutation && isApi && !isOwnAudited) {
      event.waitUntil(
        fetch(`${request.nextUrl.origin}/api/internal/audit`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-internal-secret": process.env.JWT_SECRET || "",
          },
          body: JSON.stringify({
            userId: payload.userId,
            email: payload.email,
            method: request.method,
            path: pathname,
            permission: requirement.type === "permission" ? requirement.permission : null,
            ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
          }),
        }).catch(() => undefined)
      );
    }
  }

  // ── Vendor RBAC: staff members only get their store permissions ────────────
  const isVendorArea =
    pathname === "/vendor" ||
    pathname.startsWith("/vendor/") ||
    pathname === "/api/vendor" ||
    pathname.startsWith("/api/vendor/");

  if (payload.role === "VENDOR" && isVendorArea && process.env.RBAC_ENFORCE !== "false") {
    const isApi = pathname.startsWith("/api");
    const deny = (status: number, message: string) => {
      if (isApi) return NextResponse.json({ error: message }, { status });
      const forbiddenUrl = request.nextUrl.clone();
      forbiddenUrl.pathname = "/403";
      forbiddenUrl.search = "";
      return NextResponse.redirect(forbiddenUrl);
    };

    const requirement = resolveVendorRouteRequirement(pathname, request.method);
    const access = await fetchStoreAccess(request.nextUrl.origin, payload.userId, "VENDOR");

    if (!access) {
      return deny(503, "Unable to verify store permissions. Please try again.");
    }
    if (!access.isOwner && !access.isActive) {
      return deny(403, "Forbidden: your store staff account is disabled");
    }
    if (!hasStoreRoutePermission(access.permissions, access.isOwner, requirement)) {
      const needed = requirement.type === "permission" ? requirement.permission : "store-owner";
      return deny(403, `Forbidden: missing permission (${needed})`);
    }

    const isMutation = !["GET", "HEAD", "OPTIONS"].includes(request.method);
    const isOwnAudited =
      requirement.type === "permission" &&
      (requirement.feature === "staff" || requirement.feature === "roles");
    if (isMutation && isApi && !isOwnAudited) {
      event.waitUntil(
        fetch(`${request.nextUrl.origin}/api/internal/audit`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-internal-secret": process.env.JWT_SECRET || "",
          },
          body: JSON.stringify({
            userId: payload.userId,
            email: payload.email,
            method: request.method,
            path: pathname,
            permission: requirement.type === "permission" ? requirement.permission : null,
            ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
            scope: "VENDOR",
            vendorId: access.storeId || null,
          }),
        }).catch(() => undefined)
      );
    }
  }

  // ── Ads Seller RBAC: staff members only get their store permissions ────────
  const isAdsSellerArea =
    pathname === "/ads-seller" ||
    pathname.startsWith("/ads-seller/") ||
    pathname === "/api/ads-seller" ||
    pathname.startsWith("/api/ads-seller/") ||
    pathname.startsWith("/api/ads/seller");

  if (payload.role === "ADS_SELLER" && isAdsSellerArea && process.env.RBAC_ENFORCE !== "false") {
    const isApi = pathname.startsWith("/api");
    const deny = (status: number, message: string) => {
      if (isApi) return NextResponse.json({ error: message }, { status });
      const forbiddenUrl = request.nextUrl.clone();
      forbiddenUrl.pathname = "/403";
      forbiddenUrl.search = "";
      return NextResponse.redirect(forbiddenUrl);
    };

    const requirement = resolveAdsSellerRouteRequirement(pathname, request.method);
    const access = await fetchStoreAccess(request.nextUrl.origin, payload.userId, "ADS_SELLER");

    if (!access) {
      return deny(503, "Unable to verify store permissions. Please try again.");
    }
    if (!access.isOwner && !access.isActive) {
      return deny(403, "Forbidden: your store staff account is disabled");
    }
    if (!hasStoreRoutePermission(access.permissions, access.isOwner, requirement)) {
      const needed = requirement.type === "permission" ? requirement.permission : "store-owner";
      return deny(403, `Forbidden: missing permission (${needed})`);
    }

    const isMutation = !["GET", "HEAD", "OPTIONS"].includes(request.method);
    const isOwnAudited =
      requirement.type === "permission" &&
      (requirement.feature === "staff" || requirement.feature === "roles");
    if (isMutation && isApi && !isOwnAudited) {
      event.waitUntil(
        fetch(`${request.nextUrl.origin}/api/internal/audit`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-internal-secret": process.env.JWT_SECRET || "",
          },
          body: JSON.stringify({
            userId: payload.userId,
            email: payload.email,
            method: request.method,
            path: pathname,
            permission: requirement.type === "permission" ? requirement.permission : null,
            ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
            scope: "ADS_SELLER",
            adsSellerId: access.storeId || null,
          }),
        }).catch(() => undefined)
      );
    }
  }

  // Authenticated & authorized — forward user info to route handlers via headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("X-User-Id", payload.userId);
  requestHeaders.set("X-User-Role", payload.role);
  requestHeaders.set("X-User-Email", payload.email);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (isRefreshed) {
    // Set the new cookies so they are persisted on the browser
    response.cookies.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3 * 24 * 60 * 60, // 3 days
      path: "/",
    });
    response.cookies.set("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3 * 24 * 60 * 60, // 3 days
      path: "/",
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth  (public auth endpoints)
     * - _next/static / _next/image (Next.js internals)
     * - favicon.ico
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
