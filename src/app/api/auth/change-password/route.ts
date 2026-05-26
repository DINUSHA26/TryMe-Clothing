import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { passwordUtils, tokenUtils, getTokenFromHeaders } from "@/lib/auth";
import { emailService } from "@/lib/email";

// Validation schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&*]/,
      "Password must contain at least one special character (!@#$%^&*)"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword, confirmPassword } = validation.data;

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "New password and confirm password do not match",
        },
        { status: 400 }
      );
    }

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

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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

    // Verify current password
    if (!user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: "Password not set for this account",
        },
        { status: 500 }
      );
    }

    const isCurrentPasswordValid = await passwordUtils.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Current password is incorrect",
        },
        { status: 400 }
      );
    }

    // Check if new password is same as current
    const isSamePassword = await passwordUtils.compare(
      newPassword,
      user.passwordHash
    );

    if (isSamePassword) {
      return NextResponse.json(
        {
          success: false,
          error: "New password must be different from current password",
        },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await passwordUtils.hash(newPassword);

    // Update password and clear mustChangePassword flag
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        mustChangePassword: false,
      },
    });

    // Send password changed notification email
    if (user.email) {
      const userName = user.firstName
        ? `${user.firstName} ${user.lastName || ""}`.trim()
        : user.email;
      await emailService.sendPasswordChangedEmail(user.email, userName);
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "Password changed successfully",
      },
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while changing password",
      },
      { status: 500 }
    );
  }
}
