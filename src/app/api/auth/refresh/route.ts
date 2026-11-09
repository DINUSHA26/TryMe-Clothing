import { NextRequest, NextResponse } from "next/server";
import { tokenUtils } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Refresh access token using refresh token
 */
export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie or body
    const cookieRefreshToken = request.cookies.get("refreshToken")?.value;
    const body = await request.json().catch(() => ({}));
    const bodyRefreshToken = body.refreshToken;

    const refreshToken = cookieRefreshToken || bodyRefreshToken;

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Refresh token is required",
        },
        { status: 401 }
      );
    }

    // Verify refresh token
    const payload = tokenUtils.verifyRefreshToken(refreshToken);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired refresh token",
        },
        { status: 401 }
      );
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found or inactive",
        },
        { status: 401 }
      );
    }

    // Session validity check (Database-backed session management)
    let sessionId: string | undefined = payload.sessionId;
    if (sessionId) {
      const userSession = await prisma.userSession.findUnique({
        where: { id: sessionId },
      });

      if (!userSession || !userSession.isActive) {
        // Clear auth cookies on expired / revoked session
        const expiredResponse = NextResponse.json(
          {
            success: false,
            error: "Your session has expired or was revoked from another device.",
            sessionExpired: true,
          },
          { status: 401 }
        );
        expiredResponse.cookies.delete("accessToken");
        expiredResponse.cookies.delete("refreshToken");
        return expiredResponse;
      }

      // Update session activity time
      await prisma.userSession
        .update({
          where: { id: sessionId },
          data: { lastActiveAt: new Date() },
        })
        .catch(() => {});

      if (user.role === "ADMIN") {
        await prisma.adminSession
          .update({
            where: { id: sessionId },
            data: { lastActiveAt: new Date() },
          })
          .catch(() => {});
      }
    }

    // Generate new token pair
    const tokens = tokenUtils.generateTokenPair({
      userId: user.id,
      email: user.email!,
      role: user.role,
      ...(sessionId ? { sessionId } : {}),
    });

    // Create response
    const response = NextResponse.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });

    // Set new cookies
    response.cookies.set("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3 * 24 * 60 * 60, // 3 days
      path: "/",
    });

    response.cookies.set("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3 * 24 * 60 * 60, // 3 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while refreshing token",
      },
      { status: 500 }
    );
  }
}
