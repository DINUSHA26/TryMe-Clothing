import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { passwordUtils } from "@/lib/auth";
import { emailService } from "@/lib/email";
import { generateSlug, generateUniqueSlug } from "@/lib/utils/slug";
import {
  createVendorSchema,
  vendorListQuerySchema,
} from "@/lib/validations/vendor";
import { Prisma, UserRole } from "@prisma/client";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

/**
 * POST /api/admin/vendors
 * Create a new vendor with auto-generated credentials
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const admin = requireAdmin(request);

    // Parse and validate request body
    const body = await request.json();
    const validation = createVendorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
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
        {
          success: false,
          error: "A user with this email already exists",
        },
        { status: 409 }
      );
    }

    // Generate credentials
    const tempPassword = passwordUtils.generateRandom(12);
    const passwordHash = await passwordUtils.hash(tempPassword);

    // Generate unique slug
    const baseSlug = generateSlug(data.businessName);
    const slug = await generateUniqueSlug(baseSlug, async (slug) => {
      const existing = await prisma.vendor.findUnique({ where: { slug } });
      return !!existing;
    });

    // Create vendor in transaction (User + Vendor + Wallet)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: data.businessEmail,
          passwordHash,
          role: UserRole.VENDOR,
          mustChangePassword: true,
          isActive: true,
        },
      });

      // 2. Create Vendor
      const vendor = await tx.vendor.create({
        data: {
          userId: user.id,
          businessName: data.businessName,
          businessEmail: data.businessEmail,
          businessPhone: data.businessPhone,
          businessAddress: data.businessAddress,
          description: data.description,
          slug,
          commissionRate: data.commissionRate,
          status: "ACTIVE",
          isShopOpen: true,
        },
      });

      // 3. Create Wallet
      const wallet = await tx.wallet.create({
        data: {
          vendorId: vendor.id,
          pendingBalance: 0,
          availableBalance: 0,
          totalEarnings: 0,
          totalWithdrawn: 0,
        },
      });

      return { user, vendor, wallet };
    });

    // Send welcome email (non-blocking)
    let emailSent = false;
    try {
      await emailService.sendVendorWelcomeEmail(
        data.businessEmail,
        data.businessName,
        data.businessEmail,
        tempPassword
      );
      emailSent = true;
    } catch (error) {
      console.error("Failed to send vendor welcome email:", error);
      // Don't fail the request if email fails
      // In development, we'll return the password in the response
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        vendor: {
          id: result.vendor.id,
          businessName: result.vendor.businessName,
          businessEmail: result.vendor.businessEmail,
          slug: result.vendor.slug,
          commissionRate: result.vendor.commissionRate,
          user: {
            id: result.user.id,
            email: result.user.email,
            isActive: result.user.isActive,
          },
        },
        emailSent,
        // Include temp password if email failed (for development/testing)
        ...((!emailSent || process.env.NODE_ENV === 'development') && {
          tempPassword,
          warning: !emailSent
            ? "Email failed to send. Please provide these credentials to the vendor manually."
            : "Development mode: Credentials shown for testing purposes.",
        }),
      },
    });
  } catch (error) {
    console.error("Error creating vendor:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while creating the vendor",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/vendors
 * List all vendors with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const admin = requireAdmin(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryValidation = vendorListQuerySchema.safeParse(
      Object.fromEntries(searchParams)
    );

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: queryValidation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const query = queryValidation.data;

    // Build where clause
    const where: Prisma.VendorWhereInput = {
      ...(query.search && {
        OR: [
          { businessName: { contains: query.search, mode: "insensitive" } },
          { businessEmail: { contains: query.search, mode: "insensitive" } },
        ],
      }),
      ...(query.isActive !== undefined && {
        user: {
          isActive: query.isActive === "true",
        },
      }),
      ...(query.isShopOpen !== undefined && {
        isShopOpen: query.isShopOpen === "true",
      }),
      ...(query.status && {
        status: query.status as any,
      }),
    };

    // Build orderBy clause
    const orderBy: Prisma.VendorOrderByWithRelationInput = {
      [query.sortBy]: query.sortOrder,
    };

    // Get total count
    const totalCount = await prisma.vendor.count({ where });

    // Get vendors with pagination
    const vendors = await prisma.vendor.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            firstName: true,
            lastName: true,
          },
        },
        wallet: {
          select: {
            id: true,
            pendingBalance: true,
            availableBalance: true,
            totalEarnings: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        vendors,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / query.pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Error listing vendors:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while fetching vendors",
      },
      { status: 500 }
    );
  }
}
