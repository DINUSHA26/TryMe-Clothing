import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { tokenUtils } from "@/lib/auth";
import { UserRole } from "@prisma/client";

const verifyPhoneSchema = z.object({
  idToken: z.string({ message: "Firebase ID token is required" }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = verifyPhoneSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { idToken } = validation.data;

    // Verify the Firebase ID token using Google's public endpoint
    const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!firebaseApiKey) {
      console.error("Missing NEXT_PUBLIC_FIREBASE_API_KEY env variable");
      return NextResponse.json(
        { success: false, error: "Firebase configuration error on server" },
        { status: 500 }
      );
    }
    
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData.users || verifyData.users.length === 0) {
      console.error("Firebase verify error:", verifyData);
      return NextResponse.json(
        { success: false, error: "Invalid Firebase token" },
        { status: 401 }
      );
    }

    const firebaseUser = verifyData.users[0];
    const phone = firebaseUser.phoneNumber;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "No phone number linked to this token" },
        { status: 400 }
      );
    }

    // Find or create customer user
    let user = await prisma.user.findUnique({
      where: { phone },
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

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          role: UserRole.CUSTOMER,
          phoneVerified: true,
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
      if (!user.customer) {
        await prisma.customer.create({
          data: { userId: user.id },
        });
      }
      if (!user.phoneVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { phoneVerified: true },
        });
      }
      // Re-fetch since user was updated
      user = await prisma.user.findUnique({
        where: { id: user.id },
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
      }) || user;
    }

    // Generate tokens
    const tokens = tokenUtils.generateTokenPair({
      userId: user.id,
      email: user.email || phone, // Ensure email fallback for token if required
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
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
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    response.cookies.set("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Verify phone OTP error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while verifying phone OTP" },
      { status: 500 }
    );
  }
}
