import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/auth-helpers';
import { canViewDispute } from '@/lib/utils/dispute';

/**
 * GET /api/disputes/[id]
 * Get dispute details with order context and comments
 * @access Customer only (own disputes)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const disputeId = id.toLowerCase();

    // Auth check
    const user = requireAuth(req);

    // Check if user can view this dispute
    const hasAccess = await canViewDispute(disputeId, user.userId, user.role);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to view this dispute' },
        { status: 403 }
      );
    }

    // Fetch dispute with full details
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    images: true,
                  },
                },
              },
            },
            payment: {
              select: {
                amount: true,
                paymentMethod: true,
                paidAt: true,
              },
            },
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
        comments: {
          where: {
            isInternal: false,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { success: false, error: 'Dispute not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dispute,
    });
  } catch (error) {
    console.error('Error fetching dispute:', error);

    const authError = handleAuthError(error);
    if (authError) return authError;

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dispute details',
      },
      { status: 500 }
    );
  }
}
