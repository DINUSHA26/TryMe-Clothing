import { prisma } from "@/lib/prisma";

export interface AdminPosFilters {
  page?: string | number;
  pageSize?: string | number;
  vendorId?: string;
  paymentMethod?: string;
  dateRange?: string; // "all" | "today" | "week" | "month" | "year"
  search?: string;
}

export async function getAdminPosData(filters: AdminPosFilters = {}) {
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 20));
  const skip = (page - 1) * pageSize;
  const vendorId = filters.vendorId && filters.vendorId !== "all" ? filters.vendorId : undefined;
  const paymentMethod = filters.paymentMethod && filters.paymentMethod !== "all" ? filters.paymentMethod.toUpperCase() : undefined;
  const search = filters.search?.trim();

  // Date boundary calculation
  let dateFilter: Date | undefined;
  const now = new Date();
  if (filters.dateRange === "today") {
    dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (filters.dateRange === "week") {
    dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (filters.dateRange === "month") {
    dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (filters.dateRange === "year") {
    dateFilter = new Date(now.getFullYear(), 0, 1);
  }

  // Base Prisma WHERE condition for POS orders
  const whereClause: any = {
    OR: [
      { orderNumber: { startsWith: "POS-" } },
      { orderNumber: { startsWith: "POS-AD-" } },
      { notes: { contains: "POS" } },
    ],
  };

  if (dateFilter) {
    whereClause.createdAt = { gte: dateFilter };
  }

  if (vendorId) {
    whereClause.items = {
      some: {
        vendorId,
      },
    };
  }

  if (search) {
    whereClause.AND = [
      ...(whereClause.AND || []),
      {
        OR: [
          { orderNumber: { contains: search, mode: "insensitive" } },
          { customer: { user: { firstName: { contains: search, mode: "insensitive" } } } },
          { customer: { user: { lastName: { contains: search, mode: "insensitive" } } } },
          { customer: { user: { phone: { contains: search, mode: "insensitive" } } } },
          { customer: { user: { email: { contains: search, mode: "insensitive" } } } },
          { notes: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  // Parallel fetch: Total count, Paginated orders, All POS orders for stats, and Active Vendors
  const [totalCount, ordersRaw, allPosOrders, vendorsList] = await Promise.all([
    // 1. Total count
    prisma.order.count({ where: whereClause }),

    // 2. Paginated POS orders
    prisma.order.findMany({
      where: whereClause,
      include: {
        customer: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        payment: true,
        items: {
          include: {
            vendor: {
              select: {
                id: true,
                businessName: true,
                slug: true,
                logo: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),

    // 3. Aggregate all POS orders (unpaginated) for high-level statistics & shop breakdowns
    prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { startsWith: "POS-" } },
          { orderNumber: { startsWith: "POS-AD-" } },
          { notes: { contains: "POS" } },
        ],
        ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        subtotal: true,
        discountAmount: true,
        createdAt: true,
        shippingAddressJson: true,
        payment: {
          select: {
            paymentMethod: true,
            amount: true,
            status: true,
          },
        },
        items: {
          select: {
            quantity: true,
            totalPrice: true,
            vendorId: true,
            vendor: {
              select: {
                id: true,
                businessName: true,
                slug: true,
                logo: true,
              },
            },
          },
        },
      },
    }),

    // 4. Vendors List for filter dropdown
    prisma.vendor.findMany({
      select: {
        id: true,
        businessName: true,
        slug: true,
        logo: true,
      },
      orderBy: { businessName: "asc" },
    }),
  ]);

  // Compute Overall Stats
  let totalRevenue = 0;
  let totalItemsCount = 0;
  const paymentBreakdown: Record<string, { count: number; total: number }> = {
    CASH: { count: 0, total: 0 },
    CARD: { count: 0, total: 0 },
    OTHER: { count: 0, total: 0 },
  };

  // Vendor Sales Aggregation (Shop by Shop Breakdown)
  const vendorSalesMap = new Map<
    string,
    {
      vendorId: string;
      businessName: string;
      slug: string;
      logo: string | null;
      posOrdersCount: number;
      posTotalRevenue: number;
      posItemsCount: number;
      lastSaleAt: string | null;
    }
  >();

  // Initialize with all vendors
  for (const v of vendorsList) {
    vendorSalesMap.set(v.id, {
      vendorId: v.id,
      businessName: v.businessName,
      slug: v.slug,
      logo: v.logo || null,
      posOrdersCount: 0,
      posTotalRevenue: 0,
      posItemsCount: 0,
      lastSaleAt: null,
    });
  }

  for (const ord of allPosOrders) {
    const amount = Number(ord.totalAmount) || 0;
    totalRevenue += amount;

    // Payment breakdown
    const addr = typeof ord.shippingAddressJson === "object" && ord.shippingAddressJson ? (ord.shippingAddressJson as any) : {};
    const method = String(ord.payment?.paymentMethod || addr.paymentMethod || "CASH").toUpperCase();
    if (method === "CASH") {
      paymentBreakdown.CASH.count += 1;
      paymentBreakdown.CASH.total += amount;
    } else if (method === "CARD") {
      paymentBreakdown.CARD.count += 1;
      paymentBreakdown.CARD.total += amount;
    } else {
      paymentBreakdown.OTHER.count += 1;
      paymentBreakdown.OTHER.total += amount;
    }

    // Items and vendor attribution
    let orderVendorId: string | null = null;
    let orderVendorName = "";
    let orderVendorSlug = "";
    let orderVendorLogo: string | null = null;

    for (const item of ord.items) {
      totalItemsCount += Number(item.quantity) || 0;
      if (item.vendorId) {
        orderVendorId = item.vendorId;
        orderVendorName = item.vendor?.businessName || "Unknown Shop";
        orderVendorSlug = item.vendor?.slug || "";
        orderVendorLogo = item.vendor?.logo || null;
      }
    }

    if (orderVendorId) {
      let existing = vendorSalesMap.get(orderVendorId);
      if (!existing) {
        existing = {
          vendorId: orderVendorId,
          businessName: orderVendorName,
          slug: orderVendorSlug,
          logo: orderVendorLogo,
          posOrdersCount: 0,
          posTotalRevenue: 0,
          posItemsCount: 0,
          lastSaleAt: null,
        };
        vendorSalesMap.set(orderVendorId, existing);
      }
      existing.posOrdersCount += 1;
      existing.posTotalRevenue += amount;
      existing.posItemsCount += ord.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
      if (!existing.lastSaleAt || new Date(ord.createdAt) > new Date(existing.lastSaleAt)) {
        existing.lastSaleAt = new Date(ord.createdAt).toISOString();
      }
    }
  }

  // Filter vendor sales list: sort vendors with sales first, by revenue descending
  const vendorSales = Array.from(vendorSalesMap.values()).sort((a, b) => {
    if (b.posTotalRevenue !== a.posTotalRevenue) {
      return b.posTotalRevenue - a.posTotalRevenue;
    }
    return b.posOrdersCount - a.posOrdersCount;
  });

  const activeVendorsWithPos = vendorSales.filter((v) => v.posOrdersCount > 0).length;

  // Format the paginated orders for clean client consumption
  const formattedOrders = ordersRaw.map((ord) => {
    const addr = typeof ord.shippingAddressJson === "object" && ord.shippingAddressJson ? (ord.shippingAddressJson as any) : {};
    const primaryVendor = ord.items[0]?.vendor;

    const customerUser = ord.customer?.user;
    const isFakeWalkInEmail = customerUser?.email?.includes("@pos.tryme.lk");

    const customerInfo = {
      fullName: addr.fullName || (customerUser ? `${customerUser.firstName || ""} ${customerUser.lastName || ""}`.trim() : "Walk-in Customer"),
      phone: addr.phone || customerUser?.phone || null,
      email: isFakeWalkInEmail ? null : customerUser?.email || null,
    };

    const paymentInfo = {
      method: (ord.payment?.paymentMethod || addr.paymentMethod || "CASH").toUpperCase(),
      status: ord.payment?.status || "COMPLETED",
      cashReceived: Number(addr.cashReceived) || (ord.payment?.paymentMethod === "CASH" ? Number(ord.totalAmount) : 0),
      changeDue: Number(addr.changeDue) || 0,
    };

    return {
      id: ord.id,
      orderNumber: ord.orderNumber,
      createdAt: new Date(ord.createdAt).toISOString(),
      subtotal: Number(ord.subtotal) || Number(ord.totalAmount),
      discountAmount: Number(ord.discountAmount) || 0,
      totalAmount: Number(ord.totalAmount) || 0,
      status: ord.status,
      notes: ord.notes || "",
      cashier: addr.cashier || primaryVendor?.businessName || "Store Cashier",
      customer: customerInfo,
      payment: paymentInfo,
      vendor: {
        id: primaryVendor?.id || "",
        businessName: primaryVendor?.businessName || "Store",
        slug: primaryVendor?.slug || "",
        logo: primaryVendor?.logo || null,
      },
      itemCount: ord.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
      items: ord.items.map((item) => {
        const pSnap = typeof item.productSnapshot === "object" && item.productSnapshot ? (item.productSnapshot as any) : {};
        const vSnap = typeof item.variantSnapshot === "object" && item.variantSnapshot ? (item.variantSnapshot as any) : null;
        return {
          id: item.id,
          name: pSnap.name || "Item",
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          unit: pSnap.unit || "PCS",
          variant: vSnap ? `${vSnap.name ? `${vSnap.name}: ` : ""}${vSnap.value || ""}`.trim() : null,
          image: pSnap.images?.[0] || pSnap.image || null,
          sku: vSnap?.sku || pSnap.sku || null,
        };
      }),
    };
  });

  return {
    stats: {
      totalRevenue,
      totalOrders: allPosOrders.length,
      totalItemsCount,
      activeVendorsWithPos,
      paymentBreakdown,
    },
    vendorSales,
    orders: formattedOrders,
    vendorsList: vendorsList.map((v) => ({ id: v.id, businessName: v.businessName, slug: v.slug })),
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    },
  };
}
