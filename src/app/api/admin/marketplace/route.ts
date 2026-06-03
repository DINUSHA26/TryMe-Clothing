import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { Prisma } from "@prisma/client";

/**
 * GET /api/admin/marketplace
 * List all marketplace classified ads with pagination and filters for admin
 */
export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const isTopAd = searchParams.get("isTopAd");
    const categoryId = searchParams.get("categoryId") || "";
    const sellerId = searchParams.get("sellerId") || "";
    const location = searchParams.get("location") || "";
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : null;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : null;
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const where: Prisma.ClassifiedAdWhereInput = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          {
            seller: {
              OR: [
                { businessName: { contains: search, mode: "insensitive" } },
                {
                  user: {
                    OR: [
                      { email: { contains: search, mode: "insensitive" } },
                      { firstName: { contains: search, mode: "insensitive" } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      }),
      ...(status && {
        status: status as any,
      }),
      ...(isTopAd !== null && {
        isTopAd: isTopAd === "true",
      }),
      ...(categoryId && {
        categoryId,
      }),
      ...(sellerId && {
        sellerId,
      }),
      ...(location && {
        district: { equals: location, mode: "insensitive" },
      }),
      ...((minPrice !== null || maxPrice !== null) && {
        price: {
          ...(minPrice !== null && { gte: minPrice }),
          ...(maxPrice !== null && { lte: maxPrice }),
        },
      }),
      ...((startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
    };

    const totalCount = await prisma.classifiedAd.count({ where });

    const ads = await prisma.classifiedAd.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: { name: true, icon: true },
        },
        subCategory: {
          select: { name: true },
        },
        seller: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ads,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Error listing marketplace ads:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "An error occurred while listing marketplace ads" },
      { status: 500 }
    );
  }
}
