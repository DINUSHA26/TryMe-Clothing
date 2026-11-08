import { prisma } from "@/lib/prisma";

export interface AdminCustomerFilters {
  page?: string | number;
  pageSize?: string | number;
  source?: "all" | "tryme" | "website" | "pos" | string;
  vendorId?: string;
  search?: string;
  sortBy?: "recent" | "orders" | "spent" | "name" | string;
}

export async function getAdminCustomersData(filters: AdminCustomerFilters = {}) {
  const page = Math.max(1, Number(filters.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 20));
  const skip = (page - 1) * pageSize;
  const source = filters.source && filters.source !== "all" ? filters.source.toLowerCase() : undefined;
  const vendorId = filters.vendorId && filters.vendorId !== "all" ? filters.vendorId : undefined;
  const search = filters.search?.trim();
  const sortBy = filters.sortBy || "recent";

  // Build base user/customer query filter
  const customerWhere: any = {};

  if (search) {
    customerWhere.OR = [
      { user: { firstName: { contains: search, mode: "insensitive" } } },
      { user: { lastName: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { phone: { contains: search, mode: "insensitive" } } },
    ];
  }

  // If filtered by vendor, the customer must have at least one order containing an item from this vendor
  if (vendorId) {
    customerWhere.orders = {
      some: {
        items: {
          some: {
            vendorId,
          },
        },
      },
    };
  }

  // If filtered by source
  if (source === "tryme") {
    customerWhere.orders = {
      ...(customerWhere.orders || {}),
      some: {
        ...(customerWhere.orders?.some || {}),
        orderNumber: { not: { startsWith: "WEB-" } },
        AND: [
          { orderNumber: { not: { startsWith: "POS-" } } },
          { orderNumber: { not: { startsWith: "POS-AD-" } } },
        ],
      },
    };
  } else if (source === "website") {
    customerWhere.orders = {
      ...(customerWhere.orders || {}),
      some: {
        ...(customerWhere.orders?.some || {}),
        orderNumber: { startsWith: "WEB-" },
      },
    };
  } else if (source === "pos") {
    customerWhere.orders = {
      ...(customerWhere.orders || {}),
      some: {
        ...(customerWhere.orders?.some || {}),
        OR: [
          { orderNumber: { startsWith: "POS-" } },
          { orderNumber: { startsWith: "POS-AD-" } },
        ],
      },
    };
  }

  // Parallel fetch: Total count, paginated customers with all orders, global statistics, vendors list
  const [totalFilteredCount, rawCustomers, allCustomersForStats, vendorsList] = await Promise.all([
    // 1. Filtered count
    prisma.customer.count({ where: customerWhere }),

    // 2. Customers with order histories
    prisma.customer.findMany({
      where: customerWhere,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            createdAt: true,
            lastSeenAt: true,
          },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
            shippingAddressJson: true,
            items: {
              select: {
                id: true,
                vendorId: true,
                totalPrice: true,
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
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    // 3. Aggregate all orders globally for channel breakdown stats
    prisma.order.findMany({
      select: {
        customerId: true,
        orderNumber: true,
        totalAmount: true,
        shippingAddressJson: true,
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

  // Compute Global Stats across all customers
  const trymeCustomerIds = new Set<string>();
  const websiteCustomerIds = new Set<string>();
  const posCustomerIds = new Set<string>();
  let totalPlatformSpend = 0;

  for (const ord of allCustomersForStats) {
    const cid = ord.customerId;
    const amount = Number(ord.totalAmount) || 0;
    totalPlatformSpend += amount;

    const ordNum = ord.orderNumber || "";
    const addr = typeof ord.shippingAddressJson === "object" && ord.shippingAddressJson ? (ord.shippingAddressJson as any) : {};
    const src = addr.orderSource || "";

    if (ordNum.startsWith("POS-") || src === "POS_WALK_IN") {
      posCustomerIds.add(cid);
    } else if (ordNum.startsWith("WEB-") || src === "VENDOR_WEBSITE") {
      websiteCustomerIds.add(cid);
    } else {
      trymeCustomerIds.add(cid);
    }
  }

  const totalRegisteredCustomers = await prisma.customer.count();

  // Process & format customers list
  const formattedCustomers = rawCustomers.map((c) => {
    const user = c.user;
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Customer";
    const isFakePosEmail = user.email ? user.email.includes("@pos.tryme.lk") : false;
    const displayEmail = isFakePosEmail ? null : user.email;

    let totalSpent = 0;
    const channelsSet = new Set<"TRYME" | "WEBSITE" | "POS">();
    const storeMap = new Map<string, { vendorId: string; vendorName: string; vendorSlug: string; count: number }>();

    for (const ord of c.orders) {
      totalSpent += Number(ord.totalAmount) || 0;

      const ordNum = ord.orderNumber || "";
      const addr = typeof ord.shippingAddressJson === "object" && ord.shippingAddressJson ? (ord.shippingAddressJson as any) : {};
      const src = addr.orderSource || "";

      let channelType: "TRYME" | "WEBSITE" | "POS" = "TRYME";
      if (ordNum.startsWith("POS-") || src === "POS_WALK_IN") {
        channelType = "POS";
      } else if (ordNum.startsWith("WEB-") || src === "VENDOR_WEBSITE") {
        channelType = "WEBSITE";
      }
      channelsSet.add(channelType);

      // Track stores customer interacted with
      for (const item of ord.items) {
        if (item.vendorId && item.vendor) {
          const existing = storeMap.get(item.vendorId);
          if (existing) {
            existing.count += 1;
          } else {
            storeMap.set(item.vendorId, {
              vendorId: item.vendorId,
              vendorName: item.vendor.businessName,
              vendorSlug: item.vendor.slug,
              count: 1,
            });
          }
        }
      }
    }

    const lastOrder = c.orders[0];

    return {
      id: c.id,
      userId: user.id,
      fullName,
      email: displayEmail,
      phone: user.phone || null,
      avatar: user.avatar || null,
      createdAt: new Date(user.createdAt).toISOString(),
      lastSeenAt: user.lastSeenAt ? new Date(user.lastSeenAt).toISOString() : null,
      channels: Array.from(channelsSet),
      totalOrders: c.orders.length,
      totalSpent,
      lastOrderAt: lastOrder ? new Date(lastOrder.createdAt).toISOString() : null,
      stores: Array.from(storeMap.values()),
      recentOrders: c.orders.slice(0, 5).map((ord) => {
        const ordNum = ord.orderNumber || "";
        const addr = typeof ord.shippingAddressJson === "object" && ord.shippingAddressJson ? (ord.shippingAddressJson as any) : {};
        const src = addr.orderSource || "";
        let channel: "TRYME" | "WEBSITE" | "POS" = "TRYME";
        if (ordNum.startsWith("POS-") || src === "POS_WALK_IN") channel = "POS";
        else if (ordNum.startsWith("WEB-") || src === "VENDOR_WEBSITE") channel = "WEBSITE";

        const storeNames = Array.from(new Set(ord.items.map((i) => i.vendor?.businessName).filter(Boolean)));

        return {
          id: ord.id,
          orderNumber: ord.orderNumber,
          channel,
          status: ord.status,
          totalAmount: Number(ord.totalAmount) || 0,
          createdAt: new Date(ord.createdAt).toISOString(),
          stores: storeNames,
          itemCount: ord.items.length,
        };
      }),
    };
  });

  // Sort customers
  formattedCustomers.sort((a, b) => {
    if (sortBy === "spent") {
      return b.totalSpent - a.totalSpent;
    }
    if (sortBy === "orders") {
      return b.totalOrders - a.totalOrders;
    }
    if (sortBy === "name") {
      return a.fullName.localeCompare(b.fullName);
    }
    // Default: recent (by last order, or join date)
    const timeA = a.lastOrderAt ? new Date(a.lastOrderAt).getTime() : new Date(a.createdAt).getTime();
    const timeB = b.lastOrderAt ? new Date(b.lastOrderAt).getTime() : new Date(b.createdAt).getTime();
    return timeB - timeA;
  });

  // Apply pagination on in-memory sorted array
  const paginatedCustomers = formattedCustomers.slice(skip, skip + pageSize);

  return {
    stats: {
      totalCustomers: totalRegisteredCustomers,
      trymeCustomersCount: trymeCustomerIds.size,
      websiteCustomersCount: websiteCustomerIds.size,
      posCustomersCount: posCustomerIds.size,
      totalPlatformSpend,
    },
    customers: paginatedCustomers,
    vendorsList: vendorsList.map((v) => ({ id: v.id, businessName: v.businessName, slug: v.slug })),
    pagination: {
      page,
      pageSize,
      totalCount: totalFilteredCount,
      totalPages: Math.ceil(totalFilteredCount / pageSize),
    },
  };
}
