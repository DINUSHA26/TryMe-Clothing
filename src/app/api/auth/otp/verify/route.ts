import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { otpUtils } from "@/lib/otp";
import { tokenUtils } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// Validation schema
const verifyOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "OTP must be 6 digits"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = verifyOTPSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { email, code } = validation.data;

    // Verify OTP
    const verificationResult = await otpUtils.verify(email, code, "login");

    if (!verificationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: verificationResult.message || "Invalid or expired OTP",
        },
        { status: 400 }
      );
    }

    // Find or create customer user
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        customer: true,
        vendor: {
          select: {
            id: true,
            status: true,
            businessName: true,
          },
        },
      },
    });

    // If user doesn't exist, create new customer
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          role: UserRole.CUSTOMER,
          emailVerified: true,
          isActive: true,
          customer: {
            create: {},
          },
        },
        include: {
          customer: true,
          vendor: {
            select: {
              id: true,
              status: true,
              businessName: true,
            },
          },
        },
      });
    } else {
      // Ensure user has customer profile
      if (!user.customer) {
        await prisma.customer.create({
          data: {
            userId: user.id,
          },
        });
      }

      // Mark email as verified
      if (!user.emailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        });
      }
    }

    // Generate tokens
    const tokens = tokenUtils.generateTokenPair({
      userId: user.id,
      email: user.email!,
      role: user.role,
    });

    // Create response with user data and tokens
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          mustChangePassword: user.mustChangePassword,
          vendor: user.vendor,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });

    // Set cookies for middleware authentication
    // accessToken - httpOnly for security, 24 hours expiry
    response.cookies.set("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // refreshToken - httpOnly for security, 7 days expiry
    response.cookies.set("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days (matches JWT_REFRESH_EXPIRY)
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while verifying OTP",
      },
      { status: 500 }
    );
  }
}
