import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { orderFiltersSchema } from "@/lib/validations/order";

export interface OrderFilters {
  page?: string;
  pageSize?: string;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getCustomerOrders(customerId: string, filters: OrderFilters) {
  // Auto-complete delivered/delivery_confirmed orders that have expired the 24h window
  try {
    const thresholdDate = new Date();
    thresholdDate.setHours(thresholdDate.getHours() - 24);

    const ordersToComplete = await prisma.order.findMany({
      where: {
        customerId,
        status: { in: ["DELIVERED", "DELIVERY_CONFIRMED"] },
        deliveryConfirmedAt: { lte: thresholdDate },
      },
      select: { id: true },
    });

    if (ordersToComplete.length > 0) {
      const { autoCompleteEligibleItems } = await import("@/lib/utils/orderCompletion");
      for (const order of ordersToComplete) {
        await autoCompleteEligibleItems(order.id, 24);
      }
    }
  } catch (err) {
    console.error("[getCustomerOrders] Auto-completion check failed:", err);
  }

  // Parse and validate query parameters
  const queryParams = {
    page: filters.page || "1",
    pageSize: filters.pageSize || "20",
    status: filters.status || undefined,
    search: filters.search || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  };

  const validation = orderFiltersSchema.safeParse(queryParams);

  if (!validation.success) {
    throw new Error(validation.error.issues[0].message);
  }

  const { page, pageSize, status, search, dateFrom, dateTo } = validation.data;

  // Build dynamic WHERE clause for raw SQL
  let whereClause = 'WHERE o."customerId" = $1';
  const queryParamsRaw: any[] = [customerId];

  if (status) {
    if (status === "SHIPPED") {
      whereClause += ` AND (o."status" = 'SHIPPED'::"OrderStatus" OR EXISTS (SELECT 1 FROM "OrderItem" i WHERE i."orderId" = o."id" AND i."status" = 'SHIPPED'::"OrderStatus"))`;
    } else if (status === "DELIVERY_CONFIRMED" || status === "COMPLETED") {
      whereClause += ` AND o."status" IN ('DELIVERY_CONFIRMED'::"OrderStatus", 'COMPLETED'::"OrderStatus")`;
    } else {
      queryParamsRaw.push(status);
      whereClause += ` AND o."status" = $${queryParamsRaw.length}::"OrderStatus"`;
    }
  }

  if (search) {
    queryParamsRaw.push(`%${search}%`);
    whereClause += ` AND o."orderNumber" ILIKE $${queryParamsRaw.length}`;
  }

  if (dateFrom) {
    queryParamsRaw.push(new Date(dateFrom));
    whereClause += ` AND o."createdAt" >= $${queryParamsRaw.length}`;
  }

  if (dateTo) {
    queryParamsRaw.push(new Date(dateTo));
    whereClause += ` AND o."createdAt" <= $${queryParamsRaw.length}`;
  }

  // Get total count for pagination using raw SQL
  const countResult = await prisma.$queryRawUnsafe<any[]>(
    `SELECT count(*)::int as count FROM "Order" o ${whereClause}`,
    ...queryParamsRaw
  );
  const totalCount = countResult[0]?.count || 0;

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize);
  const skip = (page - 1) * pageSize;

  // Fetch orders with items (for display) using raw SQL to bypass enum errors
  const fetchParams = [...queryParamsRaw, pageSize, skip];
  const ordersRaw = await prisma.$queryRawUnsafe<any[]>(
    `SELECT o.*, 
     (
       SELECT json_agg(json_build_object(
         'id', i."id",
         'productSnapshot', i."productSnapshot",
         'variantSnapshot', i."variantSnapshot",
         'quantity', i."quantity",
         'unitPrice', i."unitPrice",
         'totalPrice', i."totalPrice",
         'status', i."status"::text
       ))
       FROM (
         SELECT * FROM "OrderItem" 
         WHERE "orderId" = o."id" 
         ORDER BY "createdAt" ASC 
         LIMIT 3
       ) i
     ) as "preview_items",
     (SELECT count(*)::int FROM "OrderItem" WHERE "orderId" = o."id") as "total_item_count"
     FROM "Order" o
     ${whereClause}
     ORDER BY o."createdAt" DESC
     LIMIT $${fetchParams.length - 1} OFFSET $${fetchParams.length}`,
    ...fetchParams
  );

  // Calculate stats (counts by status) using raw SQL
  const statusCountsRaw = await prisma.$queryRawUnsafe<any[]>(
    'SELECT "status"::text, COUNT(*)::int as "count" FROM "Order" WHERE "customerId" = $1 GROUP BY "status"',
    customerId
  );

  const stats = {
    total: totalCount,
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
  };

  for (const stat of statusCountsRaw) {
    const count = stat.count;
    if (["PENDING_PAYMENT", "PAYMENT_CONFIRMED"].includes(stat.status)) {
      stats.pending += count;
    } else if (["PROCESSING", "SHIPPED", "DELIVERED"].includes(stat.status)) {
      stats.processing += count;
    } else if (["DELIVERY_CONFIRMED", "COMPLETED"].includes(stat.status)) {
      stats.completed += count;
    } else if (["CANCELLED", "RETURNED", "REFUNDED"].includes(stat.status)) {
      stats.cancelled += count;
    }
  }

  // Format orders for response
  const formattedOrders = ordersRaw.map((order) => {
    const previewItems = order.preview_items || [];
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      shippingAmount: Number(order.shippingAmount),
      totalAmount: Number(order.totalAmount),
      itemCount: order.total_item_count,
      itemImages: previewItems.map((item: any) => {
        const snapshot = item.productSnapshot as any;
        return snapshot?.image || null;
      }),
      previewItems: previewItems.map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      createdAt: new Date(order.createdAt).toISOString(),
    };
  });

  return {
    orders: formattedOrders,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
    },
    stats,
  };
}

export async function getOrderDetails(orderId: string, auth: { userId: string; role: string; customerId?: string; vendorId?: string }) {
  // Check if order is eligible for 24-hour auto-completion
  try {
    const orderCheck = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, deliveryConfirmedAt: true },
    });

    if (orderCheck && ["DELIVERED", "DELIVERY_CONFIRMED"].includes(orderCheck.status) && orderCheck.deliveryConfirmedAt) {
      const hoursSinceDelivery = (Date.now() - new Date(orderCheck.deliveryConfirmedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceDelivery > 24) {
        const { autoCompleteEligibleItems } = await import("@/lib/utils/orderCompletion");
        await autoCompleteEligibleItems(orderId, 24);
      }
    }
  } catch (err) {
    console.error("[getOrderDetails] Auto-completion check failed:", err);
  }

  // Fetch order with all related data using raw SQL to bypass enum errors
  const orderResults = await prisma.$queryRawUnsafe<any[]>(
    `SELECT o.*, u."email" as "customerEmail",
     (SELECT json_build_object(
       'id', p."id",
       'status', p."status"::text,
       'paymentMethod', p."paymentMethod",
       'paidAt', p."paidAt",
       'paymentSlipUrl', p."paymentSlipUrl"
     ) FROM "Payment" p WHERE p."orderId" = o."id" LIMIT 1) as "payment_data"
     FROM "Order" o
     JOIN "Customer" c ON o."customerId" = c."id"
     JOIN "User" u ON c."userId" = u."id"
     WHERE o."id" = $1`,
    orderId
  );

  const rawOrder = orderResults[0];

  if (!rawOrder) {
    throw new Error("Order not found");
  }

  // Fetch items with vendor and chat room info
  const rawItems = await prisma.$queryRawUnsafe<any[]>(
    `SELECT i.*, v."businessName" as "vendorName", cr."id" as "chatRoomId"
     FROM "OrderItem" i
     JOIN "Vendor" v ON i."vendorId" = v."id"
     LEFT JOIN "ChatRoom" cr ON i."id" = cr."orderItemId"
     WHERE i."orderId" = $1
     ORDER BY i."createdAt" ASC`,
    orderId
  );

  // Fetch status history
  const rawHistory = await prisma.$queryRawUnsafe<any[]>(
    'SELECT "id", "status"::text, "note", "createdAt", "createdBy" FROM "OrderStatusHistory" WHERE "orderId" = $1 ORDER BY "createdAt" DESC',
    orderId
  );

  // Authorization check
  if (auth.role === "CUSTOMER") {
    if (rawOrder.customerId !== auth.customerId) {
      throw new Error("Order does not belong to you");
    }
  } else if (auth.role === "VENDOR") {
    const hasVendorItems = rawItems.some((item) => item.vendorId === auth.vendorId);
    if (!hasVendorItems) {
      throw new Error("Order does not contain your items");
    }
  }

  const { calculateOrderActions } = await import("@/lib/utils/order");

  // Calculate available actions for customer
  const actions = calculateOrderActions({
    status: rawOrder.status,
    createdAt: rawOrder.createdAt,
    deliveryConfirmedAt: rawOrder.deliveryConfirmedAt,
  });

  // Fetch reviews if customer
  let reviewMap: Record<string, any> = {};
  if (auth.role === "CUSTOMER") {
    const reviews = await prisma.productReview.findMany({
      where: { orderItemId: { in: rawItems.map((i) => i.id) } },
      select: { id: true, orderItemId: true, rating: true, comment: true },
    });
    reviewMap = reviews.reduce(
      (acc, r) => ({ ...acc, [r.orderItemId]: { id: r.id, rating: r.rating, comment: r.comment } }),
      {}
    );
  }

  // Calculate discounts
  const totalDiscount = Number(rawOrder.discountAmount);

  // Fetch coupon if applied
  let couponSnapshot: { code: string; discountType: string; discountValue: number } | null = null;
  let couponScopeVendorId: string | null = null;
  if (rawOrder.couponId) {
    const coupon = await prisma.coupon.findUnique({
      where: { id: rawOrder.couponId },
      select: { code: true, type: true, value: true, vendorId: true },
    });
    if (coupon) {
      couponScopeVendorId = coupon.vendorId || null;
      couponSnapshot = {
        code: coupon.code,
        discountType: coupon.type,
        discountValue: Number(coupon.value),
      };
    }
  }

  const eligibleItems = couponScopeVendorId
    ? rawItems.filter((item: any) => item.vendorId === couponScopeVendorId)
    : rawItems;

  const eligibleSubtotal = eligibleItems.reduce(
    (sum: number, item: any) => sum + Number(item.totalPrice),
    0
  );

  const itemsWithDiscounts = rawItems.map((item: any) => {
    let itemDiscount = 0;
    if (totalDiscount > 0 && eligibleSubtotal > 0) {
      const isEligible = couponScopeVendorId ? item.vendorId === couponScopeVendorId : true;
      if (isEligible) {
        itemDiscount = (Number(item.totalPrice) / eligibleSubtotal) * totalDiscount;
        itemDiscount = Math.round(itemDiscount * 100) / 100;
      }
    }
    
    return {
      id: item.id,
      productSnapshot: item.productSnapshot,
      variantSnapshot: item.variantSnapshot,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      totalPrice: Number(item.totalPrice),
      discountAmount: itemDiscount,
      discountedTotalPrice: Math.max(0, Number(item.totalPrice) - itemDiscount),
      status: item.status,
      refundStatus: item.refundStatus,
      disputeId: item.disputeId,
      isReturnable: item.isReturnable,
      trackingNumber: item.trackingNumber,
      trackingUrl: item.trackingUrl,
      shippedAt: item.shippedAt ? new Date(item.shippedAt).toISOString() : null,
      chatRoomId: item.chatRoomId,
      review: reviewMap[item.id] || null,
      vendor: {
        id: item.vendorId,
        businessName: item.vendorName,
      },
    };
  });

  // Group by vendor
  const itemsByVendorGroups = itemsWithDiscounts.reduce((acc: any, item: any) => {
    const vId = item.vendor.id;
    if (!acc[vId]) {
      acc[vId] = {
        vendorId: vId,
        vendorName: item.vendor.businessName,
        items: [],
        status: item.status,
      };
    }
    acc[vId].items.push(item);
    return acc;
  }, {} as any);

  return {
    order: {
      id: rawOrder.id,
      orderNumber: rawOrder.orderNumber,
      status: rawOrder.status,
      subtotal: Number(rawOrder.subtotal),
      discountAmount: Number(rawOrder.discountAmount),
      shippingAmount: Number(rawOrder.shippingAmount),
      totalAmount: Number(rawOrder.totalAmount),
      shippingAddress: rawOrder.shippingAddressJson,
      notes: rawOrder.notes,
      cancelReason: rawOrder.cancelReason,
      cancelledAt: rawOrder.cancelledAt ? new Date(rawOrder.cancelledAt).toISOString() : null,
      deliveryConfirmedAt: rawOrder.deliveryConfirmedAt ? new Date(rawOrder.deliveryConfirmedAt).toISOString() : null,
      couponSnapshot,
      createdAt: new Date(rawOrder.createdAt).toISOString(),
      customer: {
        email: rawOrder.customerEmail,
      },
      items: itemsWithDiscounts,
      itemsByVendor: Object.values(itemsByVendorGroups),
      payment: rawOrder.payment_data
        ? {
            id: rawOrder.payment_data.id,
            status: rawOrder.payment_data.status,
            method: rawOrder.payment_data.paymentMethod,
            paidAt: rawOrder.payment_data.paidAt ? new Date(rawOrder.payment_data.paidAt).toISOString() : null,
            paymentSlipUrl: rawOrder.payment_data.paymentSlipUrl,
          }
        : null,
      statusHistory: rawHistory.map((h: any) => ({
        id: h.id,
        status: h.status,
        note: h.note,
        createdAt: new Date(h.createdAt).toISOString(),
        createdBy: h.createdBy || null,
      })),
      actions: (auth.role === "CUSTOMER" || (auth.customerId && rawOrder.customerId === auth.customerId)) ? actions : undefined,
    },
  };
}
