import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { otpUtils } from "@/lib/otp";
import { emailService } from "@/lib/email";
import { UserRole } from "@prisma/client";

// Validation schema
const sendOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const OTP_EXPIRY_MINUTES = parseInt(
  process.env.OTP_EXPIRY_MINUTES || "5",
  10
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = sendOTPSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Check rate limit
    const isAllowed = await otpUtils.checkRateLimit(email);
    if (!isAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many OTP requests. Please try again later.",
        },
        { status: 429 }
      );
    }

    // Check if email already exists and belongs to Admin or Vendor
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (
        existingUser.role === UserRole.ADMIN ||
        existingUser.role === UserRole.VENDOR
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This email is registered for a different account type. Please use the appropriate login page.",
          },
          { status: 400 }
        );
      }

      // Check if account is active
      if (!existingUser.isActive) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Your account has been deactivated. Please contact support.",
          },
          { status: 403 }
        );
      }
    }

    // Generate OTP
    const otpCode = otpUtils.generateCode();

    // Store OTP in Redis
    await otpUtils.store(email, otpCode, "login");

    // Send OTP email
    const emailResult = await emailService.sendOTPEmail(
      email,
      otpCode,
      OTP_EXPIRY_MINUTES
    );

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send OTP email. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "OTP sent successfully",
        expiryMinutes: OTP_EXPIRY_MINUTES,
      },
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while sending OTP",
      },
      { status: 500 }
    );
  }
}
