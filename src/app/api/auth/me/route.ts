import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tokenUtils, getTokenFromHeaders } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get token from headers
    const token = getTokenFromHeaders(request.headers);
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Verify token
    const payload = tokenUtils.verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired token",
        },
        { status: 401 }
      );
    }

    // Get user with relations
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            logo: true,
            status: true,
            isShopOpen: true,
          },
        },
        customer: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Your account has been deactivated",
        },
        { status: 403 }
      );
    }

    // Return user data
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          mustChangePassword: user.mustChangePassword,
          isActive: user.isActive,
          vendor: user.vendor,
          customer: user.customer,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while fetching user data",
      },
      { status: 500 }
    );
  }
}
