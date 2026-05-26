const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { format } = require("date-fns");

async function test() {
  try {
    // Find all vendors to check
    const vendors = await prisma.vendor.findMany();
    console.log(`Found ${vendors.length} vendors in database`);

    for (const vendor of vendors) {
      const vendorId = vendor.id;
      console.log(`\nTesting with vendorId: ${vendorId} (${vendor.businessName})`);

      const filters = {
        dateFrom: "2026-04-24",
        dateTo: "2026-05-23"
      };

      const whereClause = {
        vendorId,
        order: {
          status: {
            in: [
              "PAYMENT_CONFIRMED",
              "PROCESSING",
              "SHIPPED",
              "DELIVERY_CONFIRMED",
              "DELIVERED",
            ],
          },
        },
      };

      if (filters.dateFrom) {
        whereClause.order.createdAt = { gte: new Date(filters.dateFrom) };
      }

      if (filters.dateTo) {
        const dateToObj = new Date(filters.dateTo);
        dateToObj.setHours(23, 59, 59, 999);
        whereClause.order.createdAt = {
          ...whereClause.order.createdAt,
          lte: dateToObj,
        };
      }

      const orderItems = await prisma.orderItem.findMany({
        where: whereClause,
        select: {
          order: {
            select: {
              orderNumber: true,
              createdAt: true,
              customer: {
                select: {
                  user: {
                    select: {
                      email: true,
                    },
                  },
                },
              },
            },
          },
          productSnapshot: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          status: true,
        },
      });

      console.log(`Query returned ${orderItems.length} items.`);
      if (orderItems.length === 0) continue;

      const data = orderItems.map((item) => {
        const snapshot = item.productSnapshot;
        return {
          orderNumber: item.order.orderNumber,
          date: format(new Date(item.order.createdAt), "yyyy-MM-dd HH:mm:ss"),
          customer: item.order.customer.user.email,
          product: snapshot?.name || "Unknown",
          quantity: item.quantity,
          unitPrice: item.unitPrice.toNumber(),
          totalPrice: item.totalPrice.toNumber(),
          status: item.status,
        };
      });
      console.log("Mapping succeeded for this vendor!");
    }
  } catch (err) {
    console.error("ERROR ENCOUNTERED:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
