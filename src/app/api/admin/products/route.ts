import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productListQuerySchema } from "@/lib/validations/product";
import { Prisma } from "@prisma/client";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { getCategoryFamily } from "@/lib/utils/categories";

/**
 * GET /api/admin/products
 * List all products (all vendors) with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const admin = requireAdmin(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryValidation = productListQuerySchema.safeParse(
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

    // Recursive category resolution
    const categoryIds = await getCategoryFamily(query.categoryId);

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { description: { contains: query.search, mode: "insensitive" } },
          { sku: { contains: query.search, mode: "insensitive" } },
        ],
      }),
      ...(query.vendorId && { vendorId: query.vendorId }),
      ...(categoryIds && { categoryId: { in: categoryIds } }),
      ...(query.isActive !== undefined && {
        isActive: query.isActive === "true",
      }),
      ...(query.isDisabledByAdmin !== undefined && {
        isDisabledByAdmin: query.isDisabledByAdmin === "true",
      }),
    };

    // Build orderBy clause
    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [query.sortBy]: query.sortOrder,
    };

    // Get total count
    const totalCount = await prisma.product.count({ where });

    // Get products with pagination
    const products = await prisma.product.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          select: {
            url: true,
            altText: true,
          },
          orderBy: { position: "asc" },
          take: 1, // Only first image for list view
        },
        variants: {
          select: {
            id: true,
            name: true,
            value: true,
            stock: true,
            sku: true,
          },
          orderBy: { name: "asc" },
        },
        _count: {
          select: {
            variants: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / query.pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Error listing products:", error);

    // Handle auth errors
    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while fetching products",
      },
      { status: 500 }
    );
  }
}
