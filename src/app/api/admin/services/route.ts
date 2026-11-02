import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "20"));

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { vendor: { businessName: { contains: search, mode: "insensitive" } } },
        { adsSeller: { businessName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId;
    }

    if (status === "disabled") {
      where.isDisabledByAdmin = true;
    } else if (status === "active") {
      where.isActive = true;
      where.isDisabledByAdmin = false;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const [services, totalCount] = await Promise.all([
      (prisma as any).websiteService.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          category: {
            select: { id: true, name: true, slug: true, icon: true },
          },
          subCategory: {
            select: { id: true, name: true, slug: true },
          },
          vendor: {
            select: { id: true, businessName: true, slug: true, logo: true, user: { select: { email: true } } },
          },
          adsSeller: {
            select: { id: true, businessName: true, slug: true, user: { select: { email: true } } },
          },
        },
      }),
      (prisma as any).websiteService.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        services,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching admin services:", error);
    const authError = handleAuthError(error);
    if (authError) return authError;
    return NextResponse.json(
      { success: false, error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

