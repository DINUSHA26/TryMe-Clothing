import { prisma } from "@/lib/prisma";
import { orderFiltersSchema } from "@/lib/validations/order";

export interface AdminOrderFilters {
  page?: string;
  pageSize?: string;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  vendorId?: string;
  minAmount?: string;
  maxAmount?: string;
}

export async function getAdminOrders(filters: AdminOrderFilters) {
  // Parse and validate query parameters
  const queryParams = {
    page: filters.page || "1",
    pageSize: filters.pageSize || "20",
    status: filters.status || undefined,
    search: filters.search || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    vendorId: filters.vendorId || undefined,
    minAmount: filters.minAmount || undefined,
    maxAmount: filters.maxAmount || undefined,
  };

  const validation = orderFiltersSchema.safeParse(queryParams);

  if (!validation.success) {
    throw new Error(validation.error.issues[0].message);
  }

  const {
    page,
    pageSize,
    status,
    search,
    dateFrom,
    dateTo,
    vendorId,
    minAmount,
    maxAmount,
  } = validation.data;

  // Build dynamic WHERE clause for raw SQL
  let whereClause = "WHERE 1=1";
  const queryParamsRaw: any[] = [];

  if (status) {
    if (status === "SHIPPED") {
      whereClause += ` AND o."status" = 'SHIPPED'::"OrderStatus"`;
    } else if (status === "DELIVERY_CONFIRMED" || status === "COMPLETED") {
      whereClause += ` AND o."status" IN ('DELIVERY_CONFIRMED'::"OrderStatus", 'COMPLETED'::"OrderStatus")`;
    } else if (status === "DISPUTED") {
      whereClause += ` AND (o."status" = 'DISPUTED'::"OrderStatus" OR EXISTS (SELECT 1 FROM "OrderItem" i WHERE i."orderId" = o."id" AND i."status" = 'DISPUTED'::"OrderStatus"))`;
    } else if (status === "RETURN_REQUESTED") {
      whereClause += ` AND (o."status" = 'RETURN_REQUESTED'::"OrderStatus" OR EXISTS (SELECT 1 FROM "OrderItem" i WHERE i."orderId" = o."id" AND i."status" = 'RETURN_REQUESTED'::"OrderStatus"))`;
    } else {
      queryParamsRaw.push(status);
      whereClause += ` AND o."status" = $${queryParamsRaw.length}::"OrderStatus"`;
    }
  }

  if (search) {
    queryParamsRaw.push(`%${search}%`);
    whereClause += ` AND (o."orderNumber" ILIKE $${queryParamsRaw.length} OR u."email" ILIKE $${queryParamsRaw.length})`;
  }

  if (dateFrom) {
    queryParamsRaw.push(new Date(dateFrom));
    whereClause += ` AND o."createdAt" >= $${queryParamsRaw.length}`;
  }

  if (dateTo) {
    queryParamsRaw.push(new Date(dateTo));
    whereClause += ` AND o."createdAt" <= $${queryParamsRaw.length}`;
  }

  if (vendorId) {
    queryParamsRaw.push(vendorId);
    whereClause += ` AND EXISTS (SELECT 1 FROM "OrderItem" i WHERE i."orderId" = o."id" AND i."vendorId" = $${queryParamsRaw.length})`;
  }

  if (minAmount !== undefined) {
    queryParamsRaw.push(Number(minAmount));
    whereClause += ` AND o."totalAmount" >= $${queryParamsRaw.length}`;
  }

  if (maxAmount !== undefined) {
    queryParamsRaw.push(Number(maxAmount));
    whereClause += ` AND o."totalAmount" <= $${queryParamsRaw.length}`;
  }

  // Get total count for pagination using raw SQL
  const countResult = await prisma.$queryRawUnsafe<any[]>(
    `SELECT count(*)::int as count FROM "Order" o 
     JOIN "Customer" c ON o."customerId" = c."id"
     JOIN "User" u ON c."userId" = u."id" 
     ${whereClause}`,
    ...queryParamsRaw
  );
  const totalCount = countResult[0]?.count || 0;

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / pageSize);
  const skip = (page - 1) * pageSize;

  // Fetch orders with all related data using raw SQL
  const fetchParams = [...queryParamsRaw, pageSize, skip];
  const ordersRaw = await prisma.$queryRawUnsafe<any[]>(
    `SELECT o.*, u."email" as "customerEmail",
     (
       SELECT cp."vendorId" 
       FROM "Coupon" cp 
       WHERE cp."id" = o."couponId"
       LIMIT 1
     ) as "coupon_vendor_id",
     (
       SELECT json_agg(json_build_object(
         'id', i."id",
         'status', i."status"::text,
         'totalPrice', i."totalPrice",
         'vendor', json_build_object(
           'id', v."id",
           'businessName', v."businessName",
           'commissionRate', v."commissionRate"
         )
       ))
       FROM "OrderItem" i
       JOIN "Vendor" v ON i."vendorId" = v."id"
       WHERE i."orderId" = o."id"
     ) as "order_items",
     (
       SELECT json_build_object(
         'status', p."status"::text,
         'paymentMethod', p."paymentMethod",
         'paidAt', p."paidAt"
       )
       FROM "Payment" p
       WHERE p."orderId" = o."id"
       LIMIT 1
     ) as "payment_data",
     (SELECT count(*)::int FROM "OrderItem" WHERE "orderId" = o."id") as "total_item_count"
     FROM "Order" o
     JOIN "Customer" c ON o."customerId" = c."id"
     JOIN "User" u ON c."userId" = u."id"
     ${whereClause}
     ORDER BY o."createdAt" DESC
     LIMIT $${fetchParams.length - 1} OFFSET $${fetchParams.length}`,
    ...fetchParams
  );

  // Calculate stats using raw SQL
  const statusCountsRaw = await prisma.$queryRawUnsafe<any[]>(
    'SELECT "status"::text, COUNT(*)::int as "count" FROM "Order" GROUP BY "status"'
  );

  const stats = {
    total: totalCount,
    pendingPayment: 0,
    pendingVerification: 0,
    paymentConfirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    deliveryConfirmed: 0,
    completed: 0,
    cancelled: 0,
    returnRequested: 0,
  };

  for (const stat of statusCountsRaw) {
    const count = stat.count;
    const status = stat.status;
    
    if (status === "SHIPPED" || status === "DELIVERED") {
      stats.shipped += count;
    } else if (status === "DELIVERY_CONFIRMED" || status === "COMPLETED") {
      stats.deliveryConfirmed += count;
    } else {
      const key = status.toLowerCase().replace(/_([a-z])/g, (g: string) => g[1].toUpperCase());
      if (key in stats) {
        (stats as any)[key] += count;
      }
    }
  }

  // Calculate total revenue using raw SQL
  const revenueResult = await prisma.$queryRawUnsafe<any[]>(
    `SELECT SUM("totalAmount")::float as "totalRevenue" FROM "Order" 
     WHERE "status" IN ('PAYMENT_CONFIRMED'::"OrderStatus", 'PROCESSING'::"OrderStatus", 'SHIPPED'::"OrderStatus", 'PARTIALLY_SHIPPED'::"OrderStatus", 'DELIVERED'::"OrderStatus", 'DELIVERY_CONFIRMED'::"OrderStatus", 'COMPLETED'::"OrderStatus")`
  );

  const totalRevenue = revenueResult[0]?.totalRevenue || 0;

  // Format orders
  const formattedOrders = ordersRaw.map((order) => {
    const items = order.order_items || [];
    const couponVendorId = order.coupon_vendor_id || null;
    const discountAmount = Number(order.discountAmount) || 0;

    const commissionEarned = items.reduce((sum: number, item: any) => {
      let itemTotal = Number(item.totalPrice);

      if (couponVendorId === item.vendor.id && discountAmount > 0) {
        const vendorSubtotal = items
          .filter((i: any) => i.vendor.id === couponVendorId)
          .reduce((s: number, i: any) => s + Number(i.totalPrice), 0);
        
        if (vendorSubtotal > 0) {
          const itemDiscount = (itemTotal / vendorSubtotal) * discountAmount;
          itemTotal = Math.max(0, itemTotal - itemDiscount);
        }
      }

      const commission = (itemTotal * Number(item.vendor.commissionRate)) / 100;
      return sum + commission;
    }, 0);

    const vendors = [...new Set(items.map((item: any) => item.vendor.businessName))];

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      commissionEarned,
      createdAt: new Date(order.createdAt).toISOString(),
      customer: {
        email: order.customerEmail,
      },
      vendors: vendors as string[],
      itemCount: order.total_item_count,
      items: items.map((item: any) => ({ status: item.status })),
      payment: order.payment_data
        ? {
            status: order.payment_data.status,
            method: order.payment_data.paymentMethod,
            paidAt: order.payment_data.paidAt ? new Date(order.payment_data.paidAt).toISOString() : null,
          }
        : null,
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
    stats: {
      ...stats,
      totalRevenue,
    },
  };
}
