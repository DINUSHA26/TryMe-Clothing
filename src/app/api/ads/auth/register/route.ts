import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { passwordUtils } from "@/lib/auth";
import {
  UserRole,
  VendorStatus,
  AdsPlanType,
  AdsPlanBillingCycle,
  AdsSubscriptionStatus,
} from "@prisma/client";
import { emailService } from "@/lib/email";

// Sri Lankan phone number regex: accepts +947xxxxxxxx, 947xxxxxxxx, 07xxxxxxxx, 7xxxxxxxx (9 digits total for mobile number)
const phoneRegex = /^(?:\+94|94|0)?7[0-9]{8}$/;

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
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
      include: {
        adsSeller: true,
        vendor: true,
      },
    });

    // Check if phone already exists under another user
    const existingPhone = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingPhone && (!existingUser || existingPhone.id !== existingUser.id)) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this phone number already exists under a different user.",
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

    let resultUser: any = null;
    let resultSeller: any = null;

    if (existingUser) {
      // 1. If user already has an AdsSeller profile
      if (existingUser.adsSeller) {
        if (existingUser.adsSeller.status === VendorStatus.PENDING) {
          return NextResponse.json(
            {
              success: false,
              alreadyRegistered: true,
              error: "An ads seller application with this email has already been submitted and is pending review. Please sign in.",
            },
            { status: 400 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            alreadyRegistered: true,
            error: "An ads seller account with this email address already exists. Please sign in.",
          },
          { status: 400 }
        );
      }

      // 2. Existing user (e.g. Vendor, Customer, or Walk-in) adding AdsSeller profile
      const isWalkIn =
        !existingUser.passwordHash ||
        existingUser.passwordHash === "POS_WALK_IN_NOPASSWORD" ||
        existingUser.passwordHash === "MARKETPLACE_GUEST_NOPASSWORD";

      if (!isWalkIn) {
        const passwordMatches = await passwordUtils.compare(
          password,
          existingUser.passwordHash!
        );
        if (!passwordMatches) {
          return NextResponse.json(
            {
              success: false,
              alreadyRegistered: true,
              error:
                "An account with this email already exists. Please enter your existing account password to add an Ads Seller profile, or sign in.",
            },
            { status: 400 }
          );
        }
      }

      const newPasswordHash = isWalkIn
        ? await passwordUtils.hash(password)
        : existingUser.passwordHash;

      const updatedData = await prisma.$transaction(async (tx) => {
        // Update user
        const u = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            firstName: existingUser.firstName || firstName,
            lastName: existingUser.lastName || lastName,
            phone: existingUser.phone || phone,
            passwordHash: newPasswordHash,
          },
        });

        // Create AdsSeller
        const adsSeller = await tx.adsSeller.create({
          data: {
            userId: u.id,
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

        // Find or create FREE plan
        let freePlan = await tx.adsPlan.findUnique({
          where: { type: AdsPlanType.FREE },
        });

        if (!freePlan) {
          freePlan = await tx.adsPlan.create({
            data: {
              name: "Free Plan",
              type: AdsPlanType.FREE,
              price: 0,
              maxAds: 5,
              billingCycle: AdsPlanBillingCycle.LIFETIME,
              features: ["Post up to 5 ads", "Storefront access", "Basic support"],
              isActive: true,
            },
          });
        }

        // Enroll in FREE subscription
        await tx.adsSubscription.create({
          data: {
            sellerId: adsSeller.id,
            planId: freePlan.id,
            status: AdsSubscriptionStatus.ACTIVE,
            expiresAt: null,
            startsAt: new Date(),
          },
        });

        return { user: u, adsSeller };
      });

      resultUser = updatedData.user;
      resultSeller = updatedData.adsSeller;
    } else {
      // 3. New User Registration
      const passwordHash = await passwordUtils.hash(password);

      const createdData = await prisma.$transaction(async (tx) => {
        // Create user
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

        // Create AdsSeller
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

        // Find or create FREE plan
        let freePlan = await tx.adsPlan.findUnique({
          where: { type: AdsPlanType.FREE },
        });

        if (!freePlan) {
          freePlan = await tx.adsPlan.create({
            data: {
              name: "Free Plan",
              type: AdsPlanType.FREE,
              price: 0,
              maxAds: 5,
              billingCycle: AdsPlanBillingCycle.LIFETIME,
              features: ["Post up to 5 ads", "Storefront access", "Basic support"],
              isActive: true,
            },
          });
        }

        // Enroll in FREE subscription
        await tx.adsSubscription.create({
          data: {
            sellerId: adsSeller.id,
            planId: freePlan.id,
            status: AdsSubscriptionStatus.ACTIVE,
            expiresAt: null,
            startsAt: new Date(),
          },
        });

        return { user, adsSeller };
      });

      resultUser = createdData.user;
      resultSeller = createdData.adsSeller;
    }

    // Send notification email
    try {
      await emailService.sendAdsSellerRegistrationEmail(
        email,
        businessName || `${firstName} ${lastName}`
      );
    } catch (err) {
      console.error("Error sending registration email:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Registration successful! Your account is under review. You will receive an email once verified.",
      data: {
        userId: resultUser.id,
        sellerId: resultSeller.id,
        slug: resultSeller.slug,
      },
    });
  } catch (error: any) {
    console.error("Ads seller registration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred during registration. Please try again.",
      },
      { status: 500 }
    );
  }
}
