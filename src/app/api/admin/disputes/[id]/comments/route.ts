import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, handleAuthError } from '@/lib/auth-helpers';
import { addDisputeCommentSchema } from '@/lib/validations/dispute';
import { DisputeStatus } from '@/types/dispute';
import { createNotification } from '@/lib/notifications/notificationService';
import { NotificationType } from '@/types/notification';

/**
 * POST /api/admin/disputes/[id]/comments
 * Admin adds a comment to a dispute
 * @access Admin only
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const disputeId = id.toLowerCase();

    // Verify authentication - Admin only
    const user = requireAdmin(req);

    // Fetch dispute to check status and get customer info
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: {
          select: {
            orderNumber: true,
            customer: {
              select: {
                user: {
                  select: { id: true },
                },
              },
            },
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

    // Admins can comment on any dispute except closed ones
    if (
      dispute.status === DisputeStatus.RESOLVED_CUSTOMER_FAVOR ||
      dispute.status === DisputeStatus.RESOLVED_VENDOR_FAVOR ||
      dispute.status === DisputeStatus.CLOSED
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot add comments to resolved or closed disputes',
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = addDisputeCommentSchema.safeParse(body);

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

    const { content, isInternal } = validation.data;

    // Create comment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create comment
      const comment = await tx.disputeComment.create({
        data: {
          disputeId,
          userId: user.userId,
          comment: content,
          isAdmin: true,
          isInternal: isInternal ?? false,
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
      });

      // If this is the first admin comment and dispute is OPEN, update to IN_REVIEW
      if (dispute.status === DisputeStatus.OPEN) {
        await tx.dispute.update({
          where: { id: disputeId },
          data: {
            status: DisputeStatus.IN_REVIEW,
            updatedAt: new Date(),
          },
        });
      }

      return comment;
    });

    // Notify customer about admin comment
    try {
      await createNotification({
        userId: dispute.order.customer.user.id,
        type: NotificationType.DISPUTE_COMMENT_ADDED,
        title: 'New Dispute Comment',
        message: `Admin has added a comment to your dispute for order ${dispute.order.orderNumber}.`,
        link: `/orders/disputes/${disputeId}`,
        metadata: {
          disputeId,
          commentId: result.id,
          orderNumber: dispute.order.orderNumber,
        },
      });
    } catch (notifError) {
      console.error('[Admin Dispute Comments API] Failed to send notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Admin comment added successfully',
    });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;

    console.error('Error adding admin comment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add comment',
      },
      { status: 500 }
    );
  }
}
