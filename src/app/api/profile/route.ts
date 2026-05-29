import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tokenUtils, getTokenFromHeaders } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  try {
    // Get user ID from middleware headers
    const userId = request.headers.get("X-User-Id");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { firstName, lastName, avatar } = body;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName !== undefined ? firstName : undefined,
        lastName: lastName !== undefined ? lastName : undefined,
        avatar: avatar !== undefined ? avatar : undefined,
      } as any,
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

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          avatar: (updatedUser as any).avatar,
          emailVerified: updatedUser.emailVerified,
          phoneVerified: updatedUser.phoneVerified,
          mustChangePassword: updatedUser.mustChangePassword,
          isActive: updatedUser.isActive,
          vendor: updatedUser.vendor,
          customer: updatedUser.customer,
          createdAt: updatedUser.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile information." },
      { status: 500 }
    );
  }
}
