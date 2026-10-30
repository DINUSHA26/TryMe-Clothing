import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/payhere";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    if (!merchantSecret) {
      console.error("PAYHERE_MERCHANT_SECRET is not configured");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      {
        merchant_id: payload.merchant_id || "",
        order_id: payload.order_id || "",
        payhere_amount: payload.payhere_amount || "",
        payhere_currency: payload.payhere_currency || "",
        status_code: payload.status_code || "",
        md5sig: payload.md5sig || "",
      },
      merchantSecret
    );
    if (!isValid) {
      console.error("Invalid PayHere signature for website subscription:", payload);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const { order_id, payment_id, status_code } = payload;
    // Format: WEB-SUB-<id>
    const subId = order_id.replace(/^WEB-SUB-/, "");

    const subscription = await (prisma as any).vendorWebsiteSubscription.findUnique({
      where: { id: subId },
    });

    if (!subscription) {
      console.error("Subscription not found for PayHere order:", order_id);
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // status_code 2 = Success in PayHere
    if (status_code === "2") {
      const startsAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days active

      await (prisma as any).vendorWebsiteSubscription.update({
        where: { id: subId },
        data: {
          status: "ACTIVE",
          paymentId: payment_id,
          startsAt,
          expiresAt,
        },
      });

      console.log(`Website subscription ${subId} successfully activated via PayHere!`);
    } else {
      console.warn(`PayHere payment not successful for subscription ${subId}. Code: ${status_code}`);
    }

    return NextResponse.json({ status: "OK" });
  } catch (error: any) {
    console.error("PayHere webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
