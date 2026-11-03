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
  primaryCategory: z.string().optional(),
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
      include: {
        vendor: true,
        adsSeller: true,
        customer: true,
      },
    });

    // Generate unique slug for the vendor business
    const baseSlug = generateSlug(data.businessName);
    const slug = await generateUniqueSlug(baseSlug, async (s) => {
      const existing = await prisma.vendor.findUnique({ where: { slug: s } });
      return !!existing;
    });

    let resultUser: any = null;
    let resultVendor: any = null;

    if (existingUser) {
      // 1. If user already has a vendor profile
      if (existingUser.vendor) {
        if (existingUser.vendor.status === "PENDING") {
          return NextResponse.json(
            {
              success: false,
              alreadyRegistered: true,
              error: "A vendor registration with this email has already been submitted and is pending review. Please sign in to check status.",
            },
            { status: 409 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            alreadyRegistered: true,
            error: "An active vendor account already exists with this email address. Please sign in.",
          },
          { status: 409 }
        );
      }

      // 2. User exists (e.g. Customer, Ads Seller, or POS Guest) but DOES NOT have a Vendor profile
      // Check password if existing user has a real password set
      const isWalkIn =
        !existingUser.passwordHash ||
        existingUser.passwordHash === "POS_WALK_IN_NOPASSWORD" ||
        existingUser.passwordHash === "MARKETPLACE_GUEST_NOPASSWORD";

      if (!isWalkIn) {
        const passwordMatches = await passwordUtils.compare(
          data.password,
          existingUser.passwordHash!
        );
        if (!passwordMatches) {
          return NextResponse.json(
            {
              success: false,
              alreadyRegistered: true,
              error:
                "An account with this email already exists. Please enter your existing account password to add a Vendor store, or sign in.",
            },
            { status: 400 }
          );
        }
      }

      // Valid existing user upgrading or linking vendor profile
      const newPasswordHash = isWalkIn
        ? await passwordUtils.hash(data.password)
        : existingUser.passwordHash;

      const updatedData = await prisma.$transaction(async (tx) => {
        // Update user
        const u = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            firstName: existingUser.firstName || data.firstName,
            lastName: existingUser.lastName || data.lastName,
            passwordHash: newPasswordHash,
            role:
              existingUser.role === UserRole.ADMIN
                ? UserRole.ADMIN
                : UserRole.VENDOR,
          },
        });

        // Create Vendor profile
        const v = await tx.vendor.create({
          data: {
            userId: u.id,
            businessName: data.businessName,
            businessEmail: data.businessEmail,
            businessPhone: data.businessPhone,
            slug,
            primaryCategory: data.primaryCategory || null,
            status: "PENDING",
            isShopOpen: false,
          },
        });

        // Create Wallet if doesn't exist
        const existingWallet = await tx.wallet.findUnique({
          where: { vendorId: v.id },
        });
        if (!existingWallet) {
          await tx.wallet.create({
            data: { vendorId: v.id },
          });
        }

        return { user: u, vendor: v };
      });

      resultUser = updatedData.user;
      resultVendor = updatedData.vendor;
    } else {
      // 3. New user registration
      const passwordHash = await passwordUtils.hash(data.password);

      const createdData = await prisma.$transaction(async (tx) => {
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

        const vendor = await tx.vendor.create({
          data: {
            userId: user.id,
            businessName: data.businessName,
            businessEmail: data.businessEmail,
            businessPhone: data.businessPhone,
            slug,
            primaryCategory: data.primaryCategory || null,
            status: "PENDING",
            isShopOpen: false,
          },
        });

        await tx.wallet.create({
          data: {
            vendorId: vendor.id,
          },
        });

        return { user, vendor };
      });

      resultUser = createdData.user;
      resultVendor = createdData.vendor;
    }

    // Generate tokens so they can log in immediately
    const tokens = tokenUtils.generateTokenPair({
      userId: resultUser.id,
      email: resultUser.email!,
      role: resultUser.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Vendor application submitted successfully!",
      data: {
        user: {
          id: resultUser.id,
          email: resultUser.email,
          phone: resultUser.phone,
          role: resultUser.role,
          firstName: resultUser.firstName,
          lastName: resultUser.lastName,
          avatar: (resultUser as any).avatar,
          vendor: {
            id: resultVendor.id,
            status: resultVendor.status,
            businessName: resultVendor.businessName,
            isShopOpen: resultVendor.isShopOpen,
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
  } catch (error: any) {
    console.error("Vendor registration error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An error occurred during registration" },
      { status: 500 }
    );
  }
}
