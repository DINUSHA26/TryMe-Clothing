import { NextRequest, NextResponse } from "next/server";
import { tokenUtils, TokenPayload } from "./auth";
import { UserRole } from "@prisma/client";

/**
 * Auth error response
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Get authenticated user from request cookies
 * Checks both cookie and Authorization header
 */
export function getAuthUser(request: NextRequest): TokenPayload | null {
  // 1. Check for headers set by middleware first (trusting internal middleware verification)
  const headerUserId = request.headers.get("X-User-Id");
  const headerUserRole = request.headers.get("X-User-Role");
  const headerUserEmail = request.headers.get("X-User-Email");

  if (headerUserId && headerUserRole && headerUserEmail) {
    return {
      userId: headerUserId,
      role: headerUserRole as UserRole,
      email: headerUserEmail,
    };
  }

  // 2. Fallback to token verification from cookie or Authorization header
  const tokenFromCookie = request.cookies.get("accessToken")?.value;

  // Fallback to Authorization header
  const authHeader = request.headers.get("Authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  const token = tokenFromCookie || tokenFromHeader;

  if (!token) {
    return null;
  }

  // Verify and return payload
  return tokenUtils.verifyAccessToken(token);
}

/**
 * Require authentication - returns user or throws 401
 */
export function requireAuth(request: NextRequest): TokenPayload {
  const user = getAuthUser(request);

  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }

  return user;
}

/**
 * Require admin role - returns admin user or throws 403
 */
export function requireAdmin(request: NextRequest): TokenPayload {
  const user = requireAuth(request);

  if (user.role !== UserRole.ADMIN) {
    throw new AuthError("Forbidden: Admin access required", 403);
  }

  return user;
}

/**
 * Require vendor role - returns vendor user or throws 403
 */
export function requireVendor(request: NextRequest): TokenPayload {
  const user = requireAuth(request);

  if (user.role !== UserRole.VENDOR) {
    throw new AuthError("Forbidden: Vendor access required", 403);
  }

  return user;
}

/**
 * Require customer role - returns customer user or throws 403
 */
export function requireCustomer(request: NextRequest): TokenPayload {
  const user = requireAuth(request);

  if (user.role !== UserRole.CUSTOMER) {
    throw new AuthError("Forbidden: Customer access required", 403);
  }

  return user;
}

/**
 * Require ads seller role - returns ads seller user or throws 403
 */
export function requireAdsSeller(request: NextRequest): TokenPayload {
  const user = requireAuth(request);

  if (user.role !== (UserRole as any).ADS_SELLER && (user.role as string) !== "ADS_SELLER") {
    throw new AuthError("Forbidden: Ads Seller access required", 403);
  }

  return user;
}

import { prisma } from "./prisma";

/**
 * Check if user has any of the specified roles
 */
export function requireAnyRole(
  request: NextRequest,
  roles: UserRole[]
): TokenPayload {
  const user = requireAuth(request);

  if (!roles.includes(user.role)) {
    throw new AuthError(
      `Forbidden: Required roles: ${roles.join(", ")}`,
      403
    );
  }

  return user;
}

/**
 * Require a database customer record for the authenticated user.
 * Allows any authenticated role (Admin, Vendor, Customer) to have a customer profile.
 * Automatically creates a profile if it doesn't exist.
 */
export async function requireCustomerProfile(request: NextRequest) {
  const user = requireAuth(request);

  let customer = await prisma.customer.findUnique({
    where: { userId: user.userId },
  });

  if (!customer) {
    try {
      customer = await prisma.customer.create({
        data: { userId: user.userId },
      });
    } catch (e) {
      console.error("Failed to create customer profile for staff:", e);
      throw new AuthError("Failed to initialize customer profile", 500);
    }
  }

  return customer;
}

/**
 * Handle auth errors in catch blocks
 * Returns appropriate NextResponse for auth errors, or null for other errors
 */
export function handleAuthError(error: unknown): NextResponse | null {
  if (error instanceof AuthError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: error.statusCode }
    );
  }
  return null;
}
