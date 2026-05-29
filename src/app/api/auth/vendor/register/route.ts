import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { passwordUtils, tokenUtils } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";

// Sri Lankan phone number regex
const SL_PHONE_REGEX = /^(?:\+94|0)7[01245678]\d{7}$/;

const vendorRegisterSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters").max(100),
  businessEmail: z.string().email("Invalid email address").toLowerCase().trim(),
  businessPhone: z.string().regex(SL_PHONE_REGEX, "Invalid Sri Lankan phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = vendorRegisterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.businessEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await passwordUtils.hash(data.password);

    // Generate unique slug
    const baseSlug = generateSlug(data.businessName);
    const slug = await generateUniqueSlug(baseSlug, async (slug) => {
      const existing = await prisma.vendor.findUnique({ where: { slug } });
      return !!existing;
    });

    // Create vendor in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: data.businessEmail,
          passwordHash,
          role: UserRole.VENDOR,
          firstName: data.firstName,
          lastName: data.lastName,
          isActive: true,
          emailVerified: false,
        },
      });

      // 2. Create Vendor with PENDING status
      const vendor = await tx.vendor.create({
        data: {
          userId: user.id,
          businessName: data.businessName,
          businessEmail: data.businessEmail,
          businessPhone: data.businessPhone,
          slug,
          status: "PENDING",
          isShopOpen: false, // Don't open shop until approved
        },
      });

      // 3. Create Wallet
      await tx.wallet.create({
        data: {
          vendorId: vendor.id,
        },
      });

      return { user, vendor };
    });

    // Generate tokens so they can log in immediately (but will see pending view)
    const tokens = tokenUtils.generateTokenPair({
      userId: result.user.id,
      email: result.user.email!,
      role: result.user.role,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          phone: result.user.phone,
          role: result.user.role,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          avatar: (result.user as any).avatar,
          vendor: {
            id: result.vendor.id,
            status: result.vendor.status,
            businessName: result.vendor.businessName,
            isShopOpen: result.vendor.isShopOpen,
          },
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });

    // Set cookies
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
    console.error("Vendor registration error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
