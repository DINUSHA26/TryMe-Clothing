import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { passwordUtils } from "@/lib/auth";
import { UserRole, VendorStatus, AdsPlanType, AdsSubscriptionStatus } from "@prisma/client";
import { emailService } from "@/lib/email";

// Sri Lankan phone number regex: accepts +947xxxxxxxx, 947xxxxxxxx, 07xxxxxxxx, 7xxxxxxxx (9 digits total for mobile number)
const phoneRegex = /^(?:\+94|94|0)?7[0-9]{8}$/;

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().refine((val) => phoneRegex.test(val), {
    message: "Invalid Sri Lankan mobile number. Must be a valid mobile number (e.g., 0771234567).",
  }),
  businessName: z.string().optional(),
  primaryCategory: z.string().min(1, "Primary category is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate inputs
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      businessName,
      primaryCategory,
      password,
    } = validation.data;

    // Check if email already exists in User table
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email address already exists.",
        },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingPhone) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this phone number already exists.",
        },
        { status: 400 }
      );
    }

    // Generate base slug
    const nameToSlugify = businessName || `${firstName} ${lastName}`;
    const baseSlug = nameToSlugify
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existingSeller = await prisma.adsSeller.findUnique({
        where: { slug },
      });
      if (!existingSeller) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Hash the password
    const passwordHash = await passwordUtils.hash(password);

    // Create the User and AdsSeller in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the User
      const user = await tx.user.create({
        data: {
          email,
          phone,
          passwordHash,
          role: UserRole.ADS_SELLER,
          firstName,
          lastName,
          isActive: true,
          emailVerified: false,
          phoneVerified: false,
        },
      });

      // 2. Create the AdsSeller
      const adsSeller = await tx.adsSeller.create({
        data: {
          userId: user.id,
          businessName: businessName || null,
          phone,
          primaryCategory,
          status: VendorStatus.PENDING,
          slug,
          aboutContent: businessName ? `Welcome to ${businessName} storefront.` : `Welcome to my storefront.`,
          contactInfo: {
            phone,
            whatsapp: phone,
          },
        },
      });

      // 3. Find the FREE plan
      const freePlan = await tx.adsPlan.findUnique({
        where: { type: AdsPlanType.FREE },
      });

      if (!freePlan) {
        throw new Error("FREE ads plan not found. Please contact admin.");
      }

      // 4. Enroll in the FREE subscription
      await tx.adsSubscription.create({
        data: {
          sellerId: adsSeller.id,
          planId: freePlan.id,
          status: AdsSubscriptionStatus.ACTIVE,
          expiresAt: null, // Free plan is lifetime/never expires
          startsAt: new Date(),
        },
      });

      return { user, adsSeller };
    });

    // Send notification email
    try {
      await emailService.sendAdsSellerRegistrationEmail(email, businessName || `${firstName} ${lastName}`);
    } catch (err) {
      console.error("Error sending registration email:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Registration successful! Your account is under review. You will receive an email once verified.",
      data: {
        userId: result.user.id,
        sellerId: result.adsSeller.id,
        slug: result.adsSeller.slug,
      },
    });

  } catch (error) {
    console.error("Ads seller registration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred during registration. Please try again.",
      },
      { status: 500 }
    );
  }
}
