import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Plain string role type — avoids importing @prisma/client in Edge Runtime
type Role = "ADMIN" | "VENDOR" | "CUSTOMER" | "ADS_SELLER";

// Verify JWT using jose (Edge Runtime compatible)
async function verifyToken(token: string): Promise<{ userId: string; email: string; role: Role } | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

// Define route patterns and their required roles
const protectedRoutes: Record<string, Role[]> = {
  // ── Page routes ──────────────────────────────────────────────────────────
  "/admin": ["ADMIN"],
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
  "/api/admin": ["ADMIN"],
  "/api/vendor": ["VENDOR"],
  "/ads-seller": ["ADS_SELLER"],
  "/api/ads/seller": ["ADS_SELLER"],
  "/api/admin/ads-sellers": ["ADMIN"],
  "/api/admin/ads-plans": ["ADMIN"],
  "/api/admin/marketplace": ["ADMIN"],
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
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/i)
  ) {
    return NextResponse.next();
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
  const payload = await verifyToken(token);

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
    return response;
  }

  // Check if user has the required role for this route
  const requiredRoles = protectedRoutes[protectedRoute];
  if (!requiredRoles.includes(payload.role)) {
    const url = request.nextUrl.clone();
    url.pathname = "/403";
    return NextResponse.redirect(url);
  }

  // Authenticated & authorized — forward user info to route handlers via headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("X-User-Id", payload.userId);
  requestHeaders.set("X-User-Role", payload.role);
  requestHeaders.set("X-User-Email", payload.email);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
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
