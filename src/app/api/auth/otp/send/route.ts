import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { otpUtils } from "@/lib/otp";
import { emailService } from "@/lib/email";
import { UserRole } from "@prisma/client";

// Validation schema supports either email or phone (or identifier)
const sendOTPSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
  identifier: z.string().optional(),
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

    const { email, phone, identifier: rawIdentifier } = validation.data;
    const targetIdentifier = email || phone || rawIdentifier;

    if (!targetIdentifier) {
      return NextResponse.json(
        { success: false, error: "Email or phone number is required" },
        { status: 400 }
      );
    }

    const isEmail = targetIdentifier.includes("@");

    // Format phone if applicable
    let identifier = targetIdentifier.trim();
    if (!isEmail) {
      const cleaned = identifier.replace(/[\s\-\(\)]/g, "");
      if (cleaned.startsWith("+94")) {
        identifier = cleaned;
      } else if (cleaned.startsWith("0")) {
        identifier = "+94" + cleaned.substring(1);
      } else {
        identifier = "+94" + cleaned;
      }
    }

    // Check rate limit
    const isAllowed = await otpUtils.checkRateLimit(identifier);
    if (!isAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many OTP requests. Please try again later.",
        },
        { status: 429 }
      );
    }

    // Check existing user role & status
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: isEmail ? [{ email: identifier }] : [{ phone: identifier }],
      },
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
              "This account is registered for a different account type. Please use the appropriate login page.",
          },
          { status: 400 }
        );
      }

      if (!existingUser.isActive) {
        return NextResponse.json(
          {
            success: false,
            error: "Your account has been deactivated. Please contact support.",
          },
          { status: 403 }
        );
      }
    }

    // Generate 6-digit OTP
    const otpCode = otpUtils.generateCode();

    // Store OTP in Redis and Database
    await otpUtils.store(identifier, otpCode, "login");

    if (isEmail) {
      // Send OTP via Email
      const emailResult = await emailService.sendOTPEmail(
        identifier,
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
    } else {
      // Phone OTP logging/server delivery
      console.log(`========================================`);
      console.log(`[SMS OTP SERVER] Sent to ${identifier}: ${otpCode}`);
      console.log(`========================================`);
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "OTP sent successfully",
        expiryMinutes: OTP_EXPIRY_MINUTES,
        otpCode: process.env.NODE_ENV === "development" ? otpCode : undefined,
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
