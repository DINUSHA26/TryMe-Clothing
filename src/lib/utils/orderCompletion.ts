/**
 * Order Completion Logic
 * Handles transitions to the COMPLETED state for both OrderItems and Orders.
 */

import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

/**
 * Checks if an individual OrderItem is eligible for auto-completion.
 * An item is eligible if it's DELIVERED/DELIVERY_CONFIRMED and the dispute window has passed.
 */
export async function autoCompleteEligibleItems(orderId: string, hoursThreshold: number = 24) {
  const thresholdDate = new Date();
  thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);

  // Find items in this order that are delivered but not yet completed/disputed/returned
  // and where the order's deliveryConfirmedAt is older than the threshold
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { deliveryConfirmedAt: true, status: true }
  });

  if (!order || !order.deliveryConfirmedAt || order.deliveryConfirmedAt > thresholdDate) {
    return { success: false, reason: "Order not yet eligible for auto-completion" };
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Update all eligible items to COMPLETED
    // Use raw SQL to bypass Prisma Client's JS-level validation
    const updatedCount = await tx.$executeRawUnsafe(
      `UPDATE "OrderItem" SET "status" = 'COMPLETED'::"OrderStatus" 
       WHERE "orderId" = $1 AND "status" IN ('DELIVERED', 'DELIVERY_CONFIRMED')`,
      orderId
    );

    if (updatedCount > 0) {
      await tx.$executeRawUnsafe(
        'INSERT INTO "OrderStatusHistory" ("id", "orderId", "status", "note", "createdAt", "createdBy") VALUES ($1, $2, \'COMPLETED\'::"OrderStatus", $3, NOW(), \'SYSTEM\')',
        `osh_${Math.random().toString(36).substring(2, 11)}`,
        orderId,
        `Auto-completed ${updatedCount} item(s) after ${hoursThreshold}-hour dispute window expired.`
      );
    }

    // 2. Check if the whole order can now be COMPLETED
    // Use raw SQL to bypass the engine's enum mapping error
    const allItems = await tx.$queryRawUnsafe<any[]>(
      'SELECT "id", "status"::text FROM "OrderItem" WHERE "orderId" = $1',
      orderId
    );

    const allFinalized = allItems.every(item => 
      [
        "COMPLETED",
        "CANCELLED",
        "RETURNED",
        "REFUNDED"
      ].includes(item.status)
    );

    if (allFinalized && (order.status as any) !== "COMPLETED") {
      await tx.$executeRawUnsafe(
        'UPDATE "Order" SET "status" = \'COMPLETED\'::"OrderStatus" WHERE "id" = $1',
        orderId
      );

      await tx.$executeRawUnsafe(
        'INSERT INTO "OrderStatusHistory" ("id", "orderId", "status", "note", "createdAt", "createdBy") VALUES ($1, $2, \'COMPLETED\'::"OrderStatus", $3, NOW(), \'SYSTEM\')',
        `osh_${Math.random().toString(36).substring(2, 11)}`,
        orderId,
        "Whole order automatically marked as COMPLETED as all items are finalized."
      );
    }

    return { success: true, updatedCount, orderCompleted: allFinalized };
  });
}

/**
 * Reconciles an order's status based on its items' statuses.
 * Useful after a review is submitted or a dispute is resolved.
 */
export async function reconcileOrderStatus(orderId: string) {
  // Use raw SQL for fetching to bypass the engine's enum mapping error
  const items = await prisma.$queryRawUnsafe<any[]>(
    'SELECT "status"::text FROM "OrderItem" WHERE "orderId" = $1',
    orderId
  );

  if (items.length === 0) return;

  const allFinalized = items.every(item => 
    [
      "COMPLETED",
      "CANCELLED",
      "RETURNED",
      "REFUNDED"
    ].includes(item.status)
  );

  if (allFinalized) {
    const orderQueryResult = await prisma.$queryRawUnsafe<any[]>(
      'SELECT "status"::text FROM "Order" WHERE "id" = $1',
      orderId
    );
    const currentOrderStatus = orderQueryResult[0]?.status;

    if (currentOrderStatus && currentOrderStatus !== "COMPLETED") {
      await prisma.$transaction([
        prisma.$executeRawUnsafe(
          'UPDATE "Order" SET "status" = \'COMPLETED\'::"OrderStatus" WHERE "id" = $1',
          orderId
        ),
        prisma.$executeRawUnsafe(
          'INSERT INTO "OrderStatusHistory" ("id", "orderId", "status", "note", "createdAt", "createdBy") VALUES ($1, $2, \'COMPLETED\'::"OrderStatus", $3, NOW(), \'SYSTEM\')',
          `osh_${Math.random().toString(36).substring(2, 11)}`,
          orderId,
          "Order transitioned to COMPLETED as all line items are finalized."
        )
      ]);
    }
  }
}

/**
 * Manually completes the order and all non-finalized items.
 */
export async function manualCompleteOrder(orderId: string, userId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Update all eligible items to COMPLETED
    await tx.$executeRawUnsafe(
      `UPDATE "OrderItem" SET "status" = 'COMPLETED'::"OrderStatus" 
       WHERE "orderId" = $1 AND "status" NOT IN ('CANCELLED', 'RETURNED', 'REFUNDED', 'COMPLETED')`,
      orderId
    );

    // 2. Update the Order status to COMPLETED
    await tx.$executeRawUnsafe(
      'UPDATE "Order" SET "status" = \'COMPLETED\'::"OrderStatus" WHERE "id" = $1',
      orderId
    );

    // 3. Add order status history
    await tx.$executeRawUnsafe(
      'INSERT INTO "OrderStatusHistory" ("id", "orderId", "status", "note", "createdAt", "createdBy") VALUES ($1, $2, \'COMPLETED\'::"OrderStatus", $3, NOW(), $4)',
      `osh_${Math.random().toString(36).substring(2, 11)}`,
      orderId,
      "Order manually completed early by the customer.",
      userId
    );

    return { success: true };
  });
}
