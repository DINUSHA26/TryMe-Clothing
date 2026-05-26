import { prisma } from "@/lib/prisma";
import { orderFiltersSchema } from "@/lib/validations/order";

export interface VendorOrderFilters {
  page?: string;
  pageSize?: string;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getVendorOrders(vendorId: string, filters: VendorOrderFilters) {
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
  let whereClause = `WHERE o."id" IN (SELECT DISTINCT "orderId" FROM "OrderItem" WHERE "vendorId" = $1)`;
  const queryParamsRaw: any[] = [vendorId];

  if (status) {
    if (status === "DELIVERED") {
      whereClause += ` AND o."status" = 'DELIVERED'::"OrderStatus"`;
    } else if (status === "COMPLETED") {
      whereClause += ` AND o."status" IN ('DELIVERY_CONFIRMED'::"OrderStatus", 'COMPLETED'::"OrderStatus")`;
    } else if (status === "DISPUTED") {
      whereClause += ` AND (o."status" = 'DISPUTED'::"OrderStatus" OR EXISTS (SELECT 1 FROM "OrderItem" i WHERE i."orderId" = o."id" AND i."status" = 'DISPUTED'::"OrderStatus"))`;
    } else if (status === "RETURN_REQUESTED") {
      whereClause += ` AND (o."status" = 'RETURN_REQUESTED'::"OrderStatus" OR EXISTS (SELECT 1 FROM "OrderItem" i WHERE i."orderId" = o."id" AND i."status" = 'RETURN_REQUESTED'::"OrderStatus"))`;
    } else {
      queryParamsRaw.push(status);
      whereClause += ` AND o."status" = $${queryParamsRaw.length}::"OrderStatus"`;
    }
  } else {
    // Default view: exclude certain statuses
    whereClause += ` AND o."status" NOT IN ('PENDING_PAYMENT'::"OrderStatus", 'PENDING_VERIFICATION'::"OrderStatus", 'CANCELLED'::"OrderStatus")`;
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

  // Fetch orders with vendor's items only
  const fetchParams = [...queryParamsRaw, pageSize, skip];
  const ordersRaw = await prisma.$queryRawUnsafe<any[]>(
    `SELECT o.*, 
     json_build_object(
       'email', u."email"
     ) as "customer_user",
     (
       SELECT json_agg(json_build_object(
         'id', i."id",
         'productSnapshot', i."productSnapshot",
         'variantSnapshot', i."variantSnapshot",
         'quantity', i."quantity",
         'unitPrice', i."unitPrice",
         'totalPrice', i."totalPrice",
         'status', i."status"::text,
         'trackingNumber', i."trackingNumber",
         'trackingUrl', i."trackingUrl",
         'shippedAt', i."shippedAt"
       ))
       FROM "OrderItem" i
       WHERE i."orderId" = o."id" AND i."vendorId" = $1
     ) as "vendor_items",
     (SELECT count(*)::int FROM "OrderItem" WHERE "orderId" = o."id") as "total_item_count"
     FROM "Order" o
     JOIN "Customer" c ON o."customerId" = c."id"
     JOIN "User" u ON c."userId" = u."id"
     ${whereClause}
     ORDER BY o."createdAt" DESC
     LIMIT $${fetchParams.length - 1} OFFSET $${fetchParams.length}`,
    ...fetchParams
  );

  // Get stats grouped by item status for this vendor using raw SQL
  const statusCountsRaw = await prisma.$queryRawUnsafe<any[]>(
    'SELECT "status"::text, COUNT(*)::int as "count" FROM "OrderItem" WHERE "vendorId" = $1 GROUP BY "status"',
    vendorId
  );

  const stats = {
    total: totalCount,
    paymentConfirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
  };

  for (const stat of statusCountsRaw) {
    const count = stat.count;
    if (stat.status === "PAYMENT_CONFIRMED") {
      stats.paymentConfirmed += count;
    } else if (stat.status === "PROCESSING") {
      stats.processing += count;
    } else if (stat.status === "SHIPPED") {
      stats.shipped += count;
    } else if (["DELIVERED", "DELIVERY_CONFIRMED", "COMPLETED"].includes(stat.status)) {
      stats.delivered += count;
    }
  }

  // Format orders
  const formattedOrders = ordersRaw.map((order) => {
    const items = order.vendor_items || [];
    const vendorTotal = items.reduce((sum: number, item: any) => {
      return sum + Number(item.totalPrice);
    }, 0);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      vendorTotal,
      createdAt: new Date(order.createdAt).toISOString(),
      customer: {
        email: order.customer_user.email,
      },
      vendorItems: items.map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        shippedAt: item.shippedAt ? new Date(item.shippedAt).toISOString() : null,
      })),
      shippingAddress: order.shippingAddressJson,
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

export async function getVendorOrderDetail(vendorId: string, orderId: string) {
  // Fetch order with vendor's items only using raw SQL
  const orderResults = await prisma.$queryRawUnsafe<any[]>(
    `SELECT o.*, u."email" as "customerEmail"
     FROM "Order" o
     JOIN "Customer" c ON o."customerId" = c."id"
     JOIN "User" u ON c."userId" = u."id"
     WHERE o."id" = $1`,
    orderId
  );

  const order = orderResults[0];

  if (!order) {
    throw new Error("Order not found");
  }

  // Fetch this vendor's items for this order using raw SQL
  const vendorItemsRaw = await prisma.$queryRawUnsafe<any[]>(
    `SELECT i.*, cr."id" as "chatRoomId"
     FROM "OrderItem" i
     LEFT JOIN "ChatRoom" cr ON i."id" = cr."orderItemId"
     WHERE i."orderId" = $1 AND i."vendorId" = $2
     ORDER BY i."createdAt" ASC`,
    orderId,
    vendorId
  );

  if (vendorItemsRaw.length === 0) {
    throw new Error("Order does not contain your items");
  }

  // Fetch all items of the order to calculate pro-rata discount correctly
  const allItems = await prisma.$queryRawUnsafe<any[]>(
    'SELECT "id", "vendorId", "totalPrice", "status"::text FROM "OrderItem" WHERE "orderId" = $1',
    orderId
  );

  // Fetch coupon if applied
  let couponScopeVendorId: string | null = null;
  if (order.couponId) {
    const coupon = await prisma.coupon.findUnique({
      where: { id: order.couponId },
      select: { vendorId: true }
    });
    couponScopeVendorId = coupon?.vendorId || null;
  }

  // Calculate pro-rata discount
  const totalDiscount = Number(order.discountAmount);
  const eligibleItems = couponScopeVendorId 
    ? allItems.filter(item => item.vendorId === couponScopeVendorId)
    : allItems;
  
  const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);

  const vendorItems = vendorItemsRaw.map((item) => {
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
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      discountAmount: itemDiscount,
      discountedTotalPrice: Math.max(0, Number(item.totalPrice) - itemDiscount),
      status: item.status,
      trackingNumber: item.trackingNumber,
      trackingUrl: item.trackingUrl,
      shippedAt: item.shippedAt ? new Date(item.shippedAt).toISOString() : null,
      chatRoomId: item.chatRoomId,
    };
  });

  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      customerEmail: order.customerEmail,
      notes: order.notes,
      createdAt: new Date(order.createdAt).toISOString(),
    },
    vendorItems,
    shippingAddress: order.shippingAddressJson,
  };
}
