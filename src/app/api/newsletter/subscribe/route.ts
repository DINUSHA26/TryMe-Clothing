import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subscribeContact } from "@/lib/services/zoho-campaigns";

/**
 * POST /api/newsletter/subscribe
 * Public endpoint to subscribe an email to the newsletter.
 * Saves to local DB and pushes to Zoho Campaigns.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // 1. Save to local database
    let subscriber;
    try {
      subscriber = await prisma.newsletterSubscriber.upsert({
        where: { email: trimmedEmail },
        update: { updatedAt: new Date() },
        create: { email: trimmedEmail },
      });
    } catch (e: any) {
      console.error("Database save failed for subscriber:", e);
      return NextResponse.json(
        { success: false, error: "Failed to save subscription to database." },
        { status: 500 }
      );
    }

    // 2. Sync to Zoho Campaigns
    const zohoResult = await subscribeContact(trimmedEmail);

    if (!zohoResult.success) {
      console.warn(`Zoho Campaigns sync skipped/failed for ${trimmedEmail}: ${zohoResult.message}`);
      return NextResponse.json({
        success: true,
        data: {
          subscriber,
          synced: false,
          message: "Subscribed successfully! (Saved locally; Zoho sync pending setup/configuration)"
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        subscriber,
        synced: true,
        message: "Subscribed successfully and synced to Zoho Campaigns!"
      }
    });
  } catch (error: any) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during subscription." },
      { status: 500 }
    );
  }
}
