import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, handleAuthError } from '@/lib/auth-helpers';
import { disputeFiltersSchema } from '@/lib/validations/dispute';
import { DisputeStatus } from '@/types/dispute';

/**
 * GET /api/admin/disputes
 * List all disputes with advanced filters and pagination
 * @access Admin only
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication - Admin only
    requireAdmin(req);

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const queryParams: any = {
      status: searchParams.get('status') || undefined,
      reason: searchParams.get('reason') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      orderId: searchParams.get('orderId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
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

    const {
      status,
      reason,
      customerId,
      orderId,
      dateFrom,
      dateTo,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = validation.data;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = Array.isArray(status) ? { in: status } : status;
    }

    if (reason) {
      where.reason = Array.isArray(reason) ? { in: reason } : reason;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (orderId) {
      where.orderId = orderId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        {
          order: {
            orderNumber: { contains: search, mode: 'insensitive' },
          },
        },
        {
          customer: {
            user: {
              email: { contains: search, mode: 'insensitive' },
            },
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
            createdAt: true,
          },
        },
        customer: {
          include: {
            user: {
              select: {
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
              },
            },
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

    // Calculate comprehensive stats
    const stats = await prisma.dispute.groupBy({
      by: ['status'],
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

    // Calculate recent activity (disputes opened in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = await prisma.dispute.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
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
      stats: {
        ...statusCounts,
        recentCount,
      },
    });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;

    console.error('Error fetching admin disputes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch disputes',
      },
      { status: 500 }
    );
  }
}
