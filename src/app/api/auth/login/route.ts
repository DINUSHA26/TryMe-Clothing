import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { passwordUtils, tokenUtils } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { parseUserAgent } from "@/lib/user-agent";
import { logAudit } from "@/lib/rbac";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    let user;

    // Handle hardcoded admin
    if (email === "admin@fashiondora.lk" && password === "admin123") {
      // Check if admin already exists in DB
      let dbAdmin = await prisma.user.findUnique({
        where: { email: "admin@fashiondora.lk" },
        include: {
          vendor: true,
          adsSeller: true,
          staffMember: {
            include: {
              role: true,
              vendor: true,
              adsSeller: true,
            },
          },
        },
      });

      if (!dbAdmin) {
        // Create admin in DB so they have a real ID for cart/etc
        dbAdmin = await prisma.user.create({
          data: {
            email: "admin@fashiondora.lk",
            role: UserRole.ADMIN,
            firstName: "System",
            lastName: "Admin",
            isActive: true,
            passwordHash: await passwordUtils.hash("admin123"),
          },
          include: {
            vendor: true,
            adsSeller: true,
            staffMember: {
              include: {
                role: true,
                vendor: true,
                adsSeller: true,
              },
            },
          },
        });
      }
      user = dbAdmin;
    } else {
      // Find normal user
      user = await prisma.user.findUnique({
        where: { email },
        include: {
          vendor: true,
          adsSeller: true,
          staffMember: {
            include: {
              role: true,
              vendor: true,
              adsSeller: true,
            },
          },
        },
      });

      // Verify password
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Invalid email or password" },
          { status: 401 }
        );
      }

      if (!user.passwordHash) {
        return NextResponse.json(
          { success: false, error: "Password not set for this account" },
          { status: 500 }
        );
      }

      const isPasswordValid = await passwordUtils.compare(
        password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        // Record failed login in AuditLog
        await logAudit({
          request,
          actorEmail: email,
          actorRole: user.role,
          action: "auth.failed_login",
          entity: "User",
          entityId: user.id,
          metadata: { reason: "Invalid password attempt" },
          scope: user.role === UserRole.ADMIN ? "ADMIN" : user.role === UserRole.VENDOR ? "VENDOR" : "ADS_SELLER",
        });

        return NextResponse.json(
          { success: false, error: "Invalid email or password" },
          { status: 401 }
        );
      }
    }

    // Check if user is Admin, Vendor or Ads Seller
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.VENDOR && user.role !== UserRole.ADS_SELLER) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid login method for this account type",
        },
        { status: 403 }
      );
    }

    // Check if account is active
    if (!user.isActive || (user.staffMember && !user.staffMember.isActive)) {
      return NextResponse.json(
        {
          success: false,
          error: "Your account has been deactivated. Please contact support or your store owner.",
        },
        { status: 403 }
      );
    }

    // (Password verification was already handled earlier)

    // Parse Device & User-Agent Information
    const rawUserAgent = request.headers.get("user-agent") || "";
    const parsedUa = parseUserAgent(rawUserAgent);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

    // Database-backed Session Management
    // Limits: Admin = max 2 devices, Vendor / Ads Seller = max 5 devices
    let sessionId: string | undefined;

    const maxConcurrentSessions = user.role === UserRole.ADMIN ? 2 : 5;

    // 1. Fetch current active UserSessions
    const activeUserSessions = await prisma.userSession.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    // 2. Revoke oldest sessions if at or above limit
    if (activeUserSessions.length >= maxConcurrentSessions) {
      const sessionsToRevoke = activeUserSessions.slice(maxConcurrentSessions - 1);
      await prisma.userSession.updateMany({
        where: { id: { in: sessionsToRevoke.map((s) => s.id) } },
        data: { isActive: false },
      });
    }

    // 3. Create the new UserSession
    const newUserSession = await prisma.userSession.create({
      data: {
        userId: user.id,
        device: parsedUa.device,
        browser: parsedUa.browser,
        os: parsedUa.os,
        ip,
        isActive: true,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      },
    });
    sessionId = newUserSession.id;

    // 4. For Admin, also maintain AdminSession table for middleware checks
    if (user.role === UserRole.ADMIN) {
      const activeAdminSessions = await prisma.adminSession.findMany({
        where: { userId: user.id, isActive: true },
        orderBy: { createdAt: "desc" },
      });
      if (activeAdminSessions.length >= 2) {
        const adminSessionsToRevoke = activeAdminSessions.slice(1);
        await prisma.adminSession.updateMany({
          where: { id: { in: adminSessionsToRevoke.map((s) => s.id) } },
          data: { isActive: false },
        });
      }
      await prisma.adminSession.create({
        data: {
          id: newUserSession.id, // Match ID for seamless lookup
          userId: user.id,
          device: parsedUa.device,
          ip,
          isActive: true,
        },
      });
    }

    // 5. Record successful login in AuditLog
    await logAudit({
      request,
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: "auth.login",
      entity: "User",
      entityId: user.id,
      metadata: {
        sessionId,
        device: parsedUa.device,
        browser: parsedUa.browser,
        os: parsedUa.os,
        ip,
      },
      scope: user.role === UserRole.ADMIN ? "ADMIN" : user.role === UserRole.VENDOR ? "VENDOR" : "ADS_SELLER",
      vendorId: user.vendor?.id || user.staffMember?.vendorId || null,
      adsSellerId: (user as any).adsSeller?.id || user.staffMember?.adsSellerId || null,
    });

    // Generate tokens
    const tokens = tokenUtils.generateTokenPair({
      userId: user.id,
      email: user.email!,
      role: user.role,
      ...(sessionId ? { sessionId } : {}),
    });

    // Create response with user data and tokens
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: (user as any).avatar,
          mustChangePassword: user.mustChangePassword,
          vendor: user.vendor || user.staffMember?.vendor || null,
          adsSeller: (user as any).adsSeller || user.staffMember?.adsSeller || null,
          staffMember: user.staffMember
            ? {
                id: user.staffMember.id,
                role: user.staffMember.role,
                isActive: user.staffMember.isActive,
              }
            : null,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });

    // Set cookies for middleware authentication
    // accessToken - httpOnly for security, 3 days expiry
    response.cookies.set("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3 * 24 * 60 * 60, // 3 days
      path: "/",
    });

    // refreshToken - httpOnly for security, 3 days expiry
    response.cookies.set("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3 * 24 * 60 * 60, // 3 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred during login",
      },
      { status: 500 }
    );
  }
}
