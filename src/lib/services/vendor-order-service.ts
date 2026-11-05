import { prisma } from "@/lib/prisma";
import { orderFiltersSchema } from "@/lib/validations/order";

export interface VendorOrderFilters {
  page?: string;
  pageSize?: string;
  status?: string;
  source?: "all" | "tryme" | "website" | "pos" | "inquiries";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getVendorOrders(vendorId: string, filters: VendorOrderFilters) {
  const queryParams = {
    page: filters.page || "1",
    pageSize: filters.pageSize || "20",
    status: filters.status || undefined,
    source: filters.source || "tryme",
    search: filters.search || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  };

  const validation = orderFiltersSchema.safeParse(queryParams);

  if (!validation.success) {
    throw new Error(validation.error.issues[0].message);
  }

  const { page, pageSize, status, source = "tryme", search, dateFrom, dateTo } = validation.data;

  // Build dynamic WHERE clause for raw SQL
  let whereClause = `WHERE o."id" IN (SELECT DISTINCT "orderId" FROM "OrderItem" WHERE "vendorId" = $1)`;
  const queryParamsRaw: any[] = [vendorId];

  // Channel filter: TryMe Marketplace vs Direct Vendor Website vs POS
  if (source === "website") {
    whereClause += ` AND o."orderNumber" LIKE 'WEB-%'`;
  } else if (source === "pos") {
    whereClause += ` AND (o."orderNumber" LIKE 'POS-%' OR (o."shippingAddressJson"->>'orderSource' = 'POS_WALK_IN'))`;
  } else if (source === "tryme") {
    whereClause += ` AND o."orderNumber" NOT LIKE 'WEB-%' AND o."orderNumber" NOT LIKE 'POS-%' AND (o."shippingAddressJson"->>'orderSource' IS NULL OR o."shippingAddressJson"->>'orderSource' != 'POS_WALK_IN')`;
  }

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
    // For TryMe marketplace orders, exclude unpaid/cancelled by default;
    // For Website Direct and POS orders, show all relevant orders
    if (source === "tryme") {
      whereClause += ` AND o."status" NOT IN ('PENDING_PAYMENT'::"OrderStatus", 'PENDING_VERIFICATION'::"OrderStatus", 'CANCELLED'::"OrderStatus")`;
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

  // Get total count for pagination
  const countResult = await prisma.$queryRawUnsafe<any[]>(
    `SELECT count(*)::int as count FROM "Order" o ${whereClause}`,
    ...queryParamsRaw
  );
  const totalCount = countResult[0]?.count || 0;

  const totalPages = Math.ceil(totalCount / pageSize);
  const skip = (page - 1) * pageSize;

  // Fetch orders with vendor's items and payment info
  const fetchParams = [...queryParamsRaw, pageSize, skip];
  const ordersRaw = await prisma.$queryRawUnsafe<any[]>(
    `SELECT o.*, 
     json_build_object(
       'email', u."email",
       'firstName', u."firstName",
       'lastName', u."lastName"
     ) as "customer_user",
     (
       SELECT json_build_object(
         'paymentMethod', p."paymentMethod",
         'paymentSlipUrl', p."paymentSlipUrl",
         'status', p."status"::text
       )
       FROM "Payment" p
       WHERE p."orderId" = o."id"
       LIMIT 1
     ) as "payment_info",
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

  // Get channel counts (TryMe vs Website vs POS)
  const channelCountsRaw = await prisma.$queryRawUnsafe<any[]>(
    `SELECT
       COUNT(*) FILTER (WHERE o."orderNumber" NOT LIKE 'WEB-%' AND o."orderNumber" NOT LIKE 'POS-%' AND (o."shippingAddressJson"->>'orderSource' IS NULL OR o."shippingAddressJson"->>'orderSource' != 'POS_WALK_IN') AND o."status" NOT IN ('PENDING_PAYMENT'::"OrderStatus", 'PENDING_VERIFICATION'::"OrderStatus", 'CANCELLED'::"OrderStatus"))::int AS "trymeCount",
       COUNT(*) FILTER (WHERE o."orderNumber" LIKE 'WEB-%')::int AS "websiteCount",
       COUNT(*) FILTER (WHERE o."orderNumber" LIKE 'POS-%' OR (o."shippingAddressJson"->>'orderSource' = 'POS_WALK_IN'))::int AS "posCount"
     FROM "Order" o
     WHERE o."id" IN (SELECT DISTINCT "orderId" FROM "OrderItem" WHERE "vendorId" = $1)`,
    vendorId
  );

  // Get stats grouped by item status for the active source
  const sourceCondition =
    source === "website"
      ? `AND o."orderNumber" LIKE 'WEB-%'`
      : source === "pos"
      ? `AND (o."orderNumber" LIKE 'POS-%' OR (o."shippingAddressJson"->>'orderSource' = 'POS_WALK_IN'))`
      : source === "tryme"
      ? `AND o."orderNumber" NOT LIKE 'WEB-%' AND o."orderNumber" NOT LIKE 'POS-%' AND (o."shippingAddressJson"->>'orderSource' IS NULL OR o."shippingAddressJson"->>'orderSource' != 'POS_WALK_IN')`
      : "";

  const statusCountsRaw = await prisma.$queryRawUnsafe<any[]>(
    `SELECT i."status"::text as "status", COUNT(*)::int as "count"
     FROM "OrderItem" i
     JOIN "Order" o ON i."orderId" = o."id"
     WHERE i."vendorId" = $1 ${sourceCondition}
     GROUP BY i."status"`,
    vendorId
  );

  const stats = {
    total: totalCount,
    pendingVerification: 0,
    paymentConfirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
  };

  for (const stat of statusCountsRaw) {
    const count = stat.count;
    if (stat.status === "PENDING_VERIFICATION") {
      stats.pendingVerification += count;
    } else if (stat.status === "PAYMENT_CONFIRMED") {
      stats.paymentConfirmed += count;
    } else if (stat.status === "PROCESSING") {
      stats.processing += count;
    } else if (stat.status === "SHIPPED") {
      stats.shipped += count;
    } else if (["DELIVERED", "DELIVERY_CONFIRMED", "COMPLETED"].includes(stat.status)) {
      stats.delivered += count;
    }
  }

  // Fetch Website Inquiries from VendorWebsiteConfig
  const websiteConfig = await (prisma as any).vendorWebsiteConfig.findUnique({
    where: { vendorId },
    select: { contactSection: true },
  });
  const websiteInquiries: any[] = Array.isArray(websiteConfig?.contactSection?.inquiries)
    ? websiteConfig.contactSection.inquiries
    : [];

  // Format orders
  const formattedOrders = ordersRaw.map((order) => {
    const items = order.vendor_items || [];
    const vendorTotal = items.reduce((sum: number, item: any) => {
      return sum + Number(item.totalPrice);
    }, 0);
    const isPosOrder =
      String(order.orderNumber).startsWith("POS-") ||
      order.shippingAddressJson?.orderSource === "POS_WALK_IN";
    const isWebsiteOrder =
      String(order.orderNumber).startsWith("WEB-") ||
      order.shippingAddressJson?.orderSource === "VENDOR_WEBSITE";

    const paymentMethod =
      order.payment_info?.paymentMethod ||
      order.shippingAddressJson?.paymentMethod ||
      (isPosOrder ? "CASH" : isWebsiteOrder ? "COD" : "ONLINE");

    const paymentSlipUrl =
      order.payment_info?.paymentSlipUrl ||
      order.shippingAddressJson?.paymentSlipUrl ||
      null;

    const displayEmail =
      order.shippingAddressJson?.email ||
      (isPosOrder
        ? "POS Walk-In Customer"
        : order.customer_user?.email?.endsWith("@website.tryme.lk")
        ? order.shippingAddressJson?.phone || "Guest Customer"
        : order.customer_user?.email);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      orderSource: isPosOrder ? "POS_WALK_IN" : isWebsiteOrder ? "VENDOR_WEBSITE" : "TRYME_MARKETPLACE",
      paymentMethod,
      paymentSlipUrl,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      vendorTotal,
      createdAt: new Date(order.createdAt).toISOString(),
      customer: {
        email: displayEmail,
        fullName:
          order.shippingAddressJson?.fullName ||
          [order.customer_user?.firstName, order.customer_user?.lastName]
            .filter(Boolean)
            .join(" ") ||
          (isPosOrder ? "Walk-In Counter Customer" : "Customer"),
        phone: order.shippingAddressJson?.phone || "",
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
    websiteInquiries,
    channelCounts: {
      tryme: channelCountsRaw[0]?.trymeCount || 0,
      website: channelCountsRaw[0]?.websiteCount || 0,
      pos: channelCountsRaw[0]?.posCount || 0,
      inquiries: websiteInquiries.length,
    },
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
  const orderResults = await prisma.$queryRawUnsafe<any[]>(
    `SELECT o.*, u."email" as "customerEmail",
     (
       SELECT json_build_object(
         'paymentMethod', p."paymentMethod",
         'paymentSlipUrl', p."paymentSlipUrl",
         'status', p."status"::text,
         'notificationData', p."notificationData"
       )
       FROM "Payment" p
       WHERE p."orderId" = o."id"
       LIMIT 1
     ) as "paymentInfo"
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

  const allItems = await prisma.$queryRawUnsafe<any[]>(
    'SELECT "id", "vendorId", "totalPrice", "status"::text FROM "OrderItem" WHERE "orderId" = $1',
    orderId
  );

  let couponScopeVendorId: string | null = null;
  if (order.couponId) {
    const coupon = await prisma.coupon.findUnique({
      where: { id: order.couponId },
      select: { vendorId: true },
    });
    couponScopeVendorId = coupon?.vendorId || null;
  }

  const totalDiscount = Number(order.discountAmount);
  const eligibleItems = couponScopeVendorId
    ? allItems.filter((item) => item.vendorId === couponScopeVendorId)
    : allItems;

  const eligibleSubtotal = eligibleItems.reduce(
    (sum, item) => sum + Number(item.totalPrice),
    0
  );

  const vendorItems = vendorItemsRaw.map((item) => {
    let itemDiscount = 0;
    if (totalDiscount > 0 && eligibleSubtotal > 0) {
      const isEligible = couponScopeVendorId
        ? item.vendorId === couponScopeVendorId
        : true;
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

  const isPosOrder =
    String(order.orderNumber).startsWith("POS-") ||
    order.shippingAddressJson?.orderSource === "POS_WALK_IN";
  const isWebsiteOrder =
    String(order.orderNumber).startsWith("WEB-") ||
    order.shippingAddressJson?.orderSource === "VENDOR_WEBSITE";

  const paymentMethod =
    order.paymentInfo?.paymentMethod ||
    order.shippingAddressJson?.paymentMethod ||
    (isPosOrder ? "CASH" : isWebsiteOrder ? "COD" : "ONLINE");

  const paymentSlipUrl =
    order.paymentInfo?.paymentSlipUrl ||
    order.shippingAddressJson?.paymentSlipUrl ||
    null;

  const bankReference =
    order.paymentInfo?.notificationData?.bankReference ||
    order.shippingAddressJson?.bankReference ||
    null;

  const displayEmail =
    order.shippingAddressJson?.email ||
    (isPosOrder
      ? "POS Walk-In Customer"
      : order.customerEmail?.endsWith("@website.tryme.lk")
      ? order.shippingAddressJson?.phone || "Guest Customer"
      : order.customerEmail);

  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      orderSource: isPosOrder ? "POS_WALK_IN" : isWebsiteOrder ? "VENDOR_WEBSITE" : "TRYME_MARKETPLACE",
      paymentMethod,
      paymentSlipUrl,
      bankReference,
      paymentStatus: order.paymentInfo?.status || "PENDING",
      shippingAmount: Number(order.shippingAmount || 0),
      totalAmount: Number(order.totalAmount || 0),
      status: order.status,
      customerEmail: displayEmail,
      notes: order.notes,
      createdAt: new Date(order.createdAt).toISOString(),
    },
    vendorItems,
    shippingAddress: order.shippingAddressJson,
    vendor: await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        businessName: true,
        businessEmail: true,
        businessPhone: true,
        businessAddress: true,
        logo: true,
        slug: true,
        websiteConfig: {
          select: {
            heroSection: true,
            contactSection: true,
          },
        },
      },
    }),
  };
}
