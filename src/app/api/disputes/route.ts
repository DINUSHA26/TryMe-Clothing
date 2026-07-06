import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCustomerProfile, handleAuthError, requireAuth } from '@/lib/auth-helpers';
import {
  createDisputeSchema,
  disputeFiltersSchema,
} from '@/lib/validations/dispute';
import {
  checkDisputeEligibility,
} from '@/lib/utils/dispute';
import { DisputeStatus } from '@/types/dispute';
import { createNotification } from '@/lib/notifications/notificationService';
import { NotificationType } from '@/types/notification';

/**
 * POST /api/disputes
 * Create a new dispute for an order
 * @access Customer only
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check - requires authentication to initiate disputes
    const user = await requireAuth(req);
    
    // Get/create customer profile
    const customer = await requireCustomerProfile(req);

    // Parse and validate request body
    const body = await req.json();
    const validation = createDisputeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { orderId, orderItemId, reason, description, evidence } = validation.data;

    // Check if dispute is eligible
    const eligibility = await checkDisputeEligibility(orderId, customer.id, orderItemId);
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          success: false,
          error: eligibility.reason,
          existingDisputeId: eligibility.existingDisputeId,
        },
        { status: 400 }
      );
    }

    // Fetch vendorId if orderItemId is provided
    let vendorId = null;
    if (orderItemId) {
      const orderItem = await prisma.orderItem.findUnique({
        where: { id: orderItemId },
        select: { vendorId: true },
      });
      vendorId = orderItem?.vendorId || null;
    }

    // Create dispute using raw SQL to bypass out-of-sync Prisma client runtime
    const disputeId = `disp_${Math.random().toString(36).substring(2, 15)}`;
    let dispute: any;

    try {
      // 1. Insert the record
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Dispute" (
          "id", "orderId", "orderItemId", "vendorId", "customerId", 
          "reason", "description", "evidence", "status", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::"DisputeStatus", NOW(), NOW())`,
        disputeId,
        orderId,
        orderItemId || null,
        vendorId || null,
        customer.id,
        reason,
        description,
        JSON.stringify(evidence || []),
        'OPEN'
      );

      // 2. Fetch the created dispute with relations (using any to bypass types)
      dispute = await prisma.dispute.findUnique({
        where: { id: disputeId },
        include: {
          order: {
            select: {
              orderNumber: true,
              totalAmount: true,
              status: true,
            },
          },
          customer: {
            include: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      } as any);
    } catch (createError: any) {
      console.error('[Disputes] Creation failed:', createError);
      throw new Error(`Failed to save dispute to database: ${createError.message}`);
    }

    // Update order/item status to DISPUTED (using raw SQL to bypass out-of-sync Prisma client runtime)
    try {
      if (orderItemId) {
        await prisma.$executeRawUnsafe(
          `UPDATE "OrderItem" SET "status" = 'DISPUTED'::"OrderStatus", "refundStatus" = 'PENDING'::"RefundStatus" WHERE "id" = $1`,
          orderItemId
        );

        // We only set order to DISPUTED if we want the global status to reflect it
        await prisma.$executeRawUnsafe(
          `UPDATE "Order" SET "status" = 'DISPUTED'::"OrderStatus" WHERE "id" = $1`,
          orderId
        );
      } else {
        await prisma.$executeRawUnsafe(
          `UPDATE "Order" SET "status" = 'DISPUTED'::"OrderStatus" WHERE "id" = $1`,
          orderId
        );
      }

      // Create order status history using raw SQL
      const historyId = `osh_${Math.random().toString(36).substring(2, 11)}`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO "OrderStatusHistory" ("id", "orderId", "status", "note", "createdAt") VALUES ($1, $2, $3::"OrderStatus", $4, NOW())`,
        historyId,
        orderId,
        'DISPUTED',
        `Dispute opened: ${reason}`
      );
    } catch (updateError) {
      console.error('[Disputes] Status update failed:', updateError);
      // We continue because the dispute record was already created
    }

    // Send notification to all admins about new dispute
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: NotificationType.DISPUTE_CREATED,
          title: 'New Dispute Filed',
          message: `A dispute has been filed for order ${dispute.order.orderNumber}. Reason: ${reason}`,
          link: `/admin/disputes/${dispute.id}`,
          metadata: {
            disputeId: dispute.id,
            orderId,
            orderNumber: dispute.order.orderNumber,
          },
        });
      }
    } catch (notifError) {
      console.error('Failed to send dispute notification to admin:', notifError);
    }

    return NextResponse.json({
      success: true,
      data: dispute,
      message: 'Dispute created successfully',
    });
  } catch (error: any) {
    console.error('Error creating dispute:', error);
    
    // Return detailed error in dev to help debugging
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create dispute',
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/disputes
 * List customer's disputes with filters and pagination
 * @access Customer only
 */
export async function GET(req: NextRequest) {
  try {
    // Auth check - allows any role with a customer profile
    const customer = await requireCustomerProfile(req);

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const queryParams: any = {
      status: searchParams.get('status') || undefined,
      reason: searchParams.get('reason') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    // Validate filters
    const validation = disputeFiltersSchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { status, reason, search, page, limit, sortBy, sortOrder } =
      validation.data;

    // Build where clause
    const where: any = {
      customerId: customer.id,
    };

    if (status) {
      where.status = Array.isArray(status) ? { in: status } : status;
    }

    if (reason) {
      where.reason = Array.isArray(reason) ? { in: reason } : reason;
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        {
          order: {
            orderNumber: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Count total disputes
    const total = await prisma.dispute.count({ where });

    // Fetch disputes with pagination
    const disputesRaw = await prisma.dispute.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            totalAmount: true,
            status: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Format disputes for response (convert Decimals to numbers)
    const disputes = disputesRaw.map((dispute) => ({
      ...dispute,
      order: {
        ...dispute.order,
        totalAmount: dispute.order.totalAmount.toNumber(),
      },
    }));

    // Calculate stats
    const stats = await prisma.dispute.groupBy({
      by: ['status'],
      where: { customerId: customer.id },
      _count: true,
    });

    const statusCounts = {
      total,
      open: 0,
      inReview: 0,
      resolvedCustomerFavor: 0,
      resolvedVendorFavor: 0,
      closed: 0,
    };

    stats.forEach((stat) => {
      const count = stat._count;
      switch (stat.status) {
        case DisputeStatus.OPEN:
          statusCounts.open = count;
          break;
        case DisputeStatus.IN_REVIEW:
          statusCounts.inReview = count;
          break;
        case DisputeStatus.RESOLVED_CUSTOMER_FAVOR:
          statusCounts.resolvedCustomerFavor = count;
          break;
        case DisputeStatus.RESOLVED_VENDOR_FAVOR:
          statusCounts.resolvedVendorFavor = count;
          break;
        case DisputeStatus.CLOSED:
          statusCounts.closed = count;
          break;
      }
    });

    return NextResponse.json({
      success: true,
      data: disputes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: statusCounts,
    });
  } catch (error) {
    console.error('Error fetching disputes:', error);

    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch disputes',
      },
      { status: 500 }
    );
  }
}
