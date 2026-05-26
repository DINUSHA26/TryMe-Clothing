import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { markOrderDelivered } from '@/lib/utils/markOrderDelivered';

/**
 * Vercel Cron Job API
 * GET /api/cron/track-orders
 * 
 * Periodically checks carrier tracking numbers via AfterShip API.
 * When a carrier marks a package as "Delivered", the order is automatically
 * set to DELIVERED status and vendor funds are released from escrow.
 */

const AFTERSHIP_API_URL = "https://api.aftership.com/v4";
const AFTERSHIP_API_KEY = process.env.AFTERSHIP_API_KEY;

// AfterShip tag values for delivered state
const DELIVERED_TAGS = ["Delivered"];

interface AfterShipTracking {
  tag: string;
  slug: string;
  tracking_number: string;
}

interface AfterShipResponse {
  meta: { code: number; message: string };
  data?: { tracking?: AfterShipTracking };
}

/**
 * Create or retrieve a tracking in AfterShip.
 */
async function getTrackingTag(trackingNumber: string): Promise<string | null> {
  if (!AFTERSHIP_API_KEY) return null;

  try {
    const response = await fetch(`${AFTERSHIP_API_URL}/trackings`, {
      method: "POST",
      headers: {
        "aftership-api-key": AFTERSHIP_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tracking: { tracking_number: trackingNumber },
      }),
    });

    const data = (await response.json()) as AfterShipResponse;

    if (data.data?.tracking?.tag) {
      return data.data.tracking.tag;
    }

    if (data.data?.tracking?.slug) {
      const slug = data.data.tracking.slug;
      const getResponse = await fetch(
        `${AFTERSHIP_API_URL}/trackings/${slug}/${encodeURIComponent(trackingNumber)}`,
        {
          headers: { "aftership-api-key": AFTERSHIP_API_KEY },
        }
      );
      const getData = (await getResponse.json()) as AfterShipResponse;
      return getData.data?.tracking?.tag ?? null;
    }

    return null;
  } catch (err) {
    console.error(`[Cron] Error checking tracking ${trackingNumber}:`, err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  // 1. Security Check (Optional: check for Vercel Cron Secret)
  const authHeader = request.headers.get('Authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!AFTERSHIP_API_KEY) {
    return NextResponse.json({ 
      success: false, 
      message: 'AFTERSHIP_API_KEY not set' 
    }, { status: 500 });
  }

  try {
    console.log("[Cron] Starting tracking poll cycle...");

    // 2. Find SHIPPED order items with tracking numbers
    const shippedItems = await prisma.orderItem.findMany({
      where: {
        status: "SHIPPED",
        trackingNumber: { not: null },
        order: {
          status: "SHIPPED",
          deliveryConfirmedAt: null,
        },
      },
      select: {
        id: true,
        orderId: true,
        trackingNumber: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    });

    if (shippedItems.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No shipped orders to check' 
      });
    }

    // 3. Process items (Deduplicate by orderId)
    const processedOrderIds = new Set<string>();
    const results = [];

    for (const item of shippedItems) {
      if (processedOrderIds.has(item.orderId)) continue;

      const tag = await getTrackingTag(item.trackingNumber!);
      
      if (tag && DELIVERED_TAGS.includes(tag)) {
        const result = await markOrderDelivered(item.orderId, "tracking");
        if (result.success) {
          processedOrderIds.add(item.orderId);
          results.push({ orderNumber: item.order.orderNumber, status: 'DELIVERED' });
        }
      }

      // Small delay to avoid AfterShip rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return NextResponse.json({
      success: true,
      processedCount: results.length,
      updates: results,
      totalChecked: shippedItems.length
    });

  } catch (error: any) {
    console.error('[Cron] Error processing tracking updates:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
