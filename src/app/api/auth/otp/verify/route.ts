import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { otpUtils } from "@/lib/otp";
import { tokenUtils } from "@/lib/auth";
import { UserRole } from "@prisma/client";

// Validation schema supports email, phone or identifier
const verifyOTPSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  identifier: z.string().optional(),
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

    const { email, phone, identifier: rawIdentifier, code } = validation.data;
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

    // Verify OTP code in Redis & Database
    const verificationResult = await otpUtils.verify(identifier, code, "login");

    if (!verificationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: verificationResult.message || "Invalid or expired OTP",
        },
        { status: 400 }
      );
    }

    // Find user by email or phone
    let user = await prisma.user.findFirst({
      where: {
        OR: isEmail ? [{ email: identifier }] : [{ phone: identifier }],
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

    // If user doesn't exist, create new customer user
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: isEmail ? identifier : null,
          phone: !isEmail ? identifier : null,
          role: UserRole.CUSTOMER,
          emailVerified: isEmail,
          phoneVerified: !isEmail,
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
      // Ensure customer profile exists
      if (!user.customer) {
        await prisma.customer.create({
          data: {
            userId: user.id,
          },
        });
      }

      // Mark verified
      if (isEmail && !user.emailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        });
      } else if (!isEmail && !user.phoneVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { phoneVerified: true },
        });
      }
    }

    // Generate token pair
    const tokens = tokenUtils.generateTokenPair({
      userId: user.id,
      email: user.email || user.phone || identifier,
      role: user.role,
    });

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
          vendor: user.vendor,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });

    response.cookies.set("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3 * 24 * 60 * 60,
      path: "/",
    });

    response.cookies.set("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3 * 24 * 60 * 60,
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
