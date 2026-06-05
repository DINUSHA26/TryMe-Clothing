import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { subscribeContact } from "@/lib/services/zoho-campaigns";

/**
 * GET /api/admin/newsletter/subscribers
 * Admin only - Get all newsletter subscribers with search and pagination
 */
export async function GET(request: NextRequest) {
  try {
    requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where = search
      ? {
          email: {
            contains: search,
            mode: "insensitive" as const,
          },
        }
      : {};

    const [subscribers, total] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.newsletterSubscriber.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        subscribers,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("Error fetching newsletter subscribers:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while fetching subscribers." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/newsletter/subscribers
 * Admin only - Manually add a subscriber and sync to Zoho Campaigns
 */
export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // 1. Upsert local database
    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email: trimmedEmail },
      update: { updatedAt: new Date() },
      create: { email: trimmedEmail },
    });

    // 2. Sync to Zoho Campaigns
    const zohoResult = await subscribeContact(trimmedEmail);

    return NextResponse.json({
      success: true,
      data: {
        subscriber,
        synced: zohoResult.success,
        message: zohoResult.success
          ? "Subscriber added and successfully synced to Zoho Campaigns!"
          : `Subscriber saved locally. Zoho Campaigns sync failed: ${zohoResult.message}`,
      },
    });
  } catch (error: any) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("Error adding subscriber manually:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while adding the subscriber." },
      { status: 500 }
    );
  }
}
