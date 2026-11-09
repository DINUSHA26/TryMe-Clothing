import { NextRequest, NextResponse } from "next/server";
import { tokenUtils } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Logout endpoint - clears authentication cookies and deactivates admin session
 */
export async function POST(request: NextRequest) {
  try {
    // If an admin is logging out, mark their AdminSession as inactive
    const accessToken =
      request.cookies.get("accessToken")?.value ||
      request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    const refreshToken = request.cookies.get("refreshToken")?.value;

    const payload =
      (accessToken ? tokenUtils.decode(accessToken) : null) ||
      (refreshToken ? tokenUtils.decode(refreshToken) : null);

    if (payload?.sessionId) {
      await prisma.adminSession
        .update({
          where: { id: payload.sessionId },
          data: { isActive: false },
        })
        .catch(() => {});
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      data: {
        message: "Logged out successfully",
      },
    });

    // Clear authentication cookies
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred during logout",
      },
      { status: 500 }
    );
  }
}
