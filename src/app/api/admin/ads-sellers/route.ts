import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { Prisma } from "@prisma/client";

/**
 * GET /api/admin/ads-sellers
 * List all ads sellers with search and status filters
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const admin = requireAdmin(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    // Build where clause
    const where: Prisma.AdsSellerWhereInput = {
      ...(search && {
        OR: [
          { businessName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          {
            user: {
              OR: [
                { email: { contains: search, mode: "insensitive" } },
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      }),
      ...(status && {
        status: status as any,
      }),
    };

    // Get count
    const totalCount = await prisma.adsSeller.count({ where });

    // Get sellers
    const sellers = await prisma.adsSeller.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
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
        subscriptions: {
          orderBy: { startsAt: "desc" },
          take: 1,
          include: {
            plan: {
              select: {
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sellers,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Error listing ads sellers:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while fetching ads sellers" },
      { status: 500 }
    );
  }
}
