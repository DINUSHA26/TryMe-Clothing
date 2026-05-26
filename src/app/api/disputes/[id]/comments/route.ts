import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, handleAuthError } from '@/lib/auth-helpers';
import { addDisputeCommentSchema } from '@/lib/validations/dispute';
import { canViewDispute, canAddDisputeComment } from '@/lib/utils/dispute';
import { createNotification } from '@/lib/notifications/notificationService';
import { NotificationType } from '@/types/notification';
import { UserRole } from '@prisma/client';
import { DisputeStatus } from '@/types/dispute';

/**
 * POST /api/disputes/[id]/comments
 * Add a comment to a dispute
 * @access Customer (own disputes) and Admin
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const disputeId = id.toLowerCase();

    // Verify authentication
    const user = requireAuth(req);

    // Check if user can view this dispute
    const hasAccess = await canViewDispute(disputeId, user.userId, user.role);
    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'You do not have permission to comment on this dispute',
        },
        { status: 403 }
      );
    }

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

    // Check if user can add comments based on dispute status
    const canComment = canAddDisputeComment(user.role, dispute.status as DisputeStatus);
    if (!canComment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot add comments to resolved disputes',
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

    // Create comment
    const comment = await prisma.disputeComment.create({
      data: {
        disputeId,
        userId: user.userId,
        comment: content,
        isAdmin: user.role === 'ADMIN',
        isInternal: user.role === 'ADMIN' ? (isInternal ?? false) : false,
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

    // If this is the first admin comment, update dispute status to IN_REVIEW
    if (user.role === 'ADMIN' && dispute.status === 'OPEN') {
      await prisma.dispute.update({
        where: { id: disputeId },
        data: { status: 'IN_REVIEW' },
      });
    }

    // Send notification to other party
    try {
      if (user.role === 'ADMIN') {
        // Admin commented, notify customer
        await createNotification({
          userId: dispute.order.customer.user.id,
          type: NotificationType.DISPUTE_COMMENT_ADDED,
          title: 'New Dispute Comment',
          message: `Admin has added a comment to your dispute for order ${dispute.order.orderNumber}.`,
          link: `/orders/disputes/${disputeId}`,
          metadata: {
            disputeId,
            commentId: comment.id,
            orderNumber: dispute.order.orderNumber,
          },
        });
      } else {
        // Customer commented, notify all admins
        const admins = await prisma.user.findMany({
          where: { role: UserRole.ADMIN },
          select: { id: true },
        });

        for (const admin of admins) {
          await createNotification({
            userId: admin.id,
            type: NotificationType.DISPUTE_COMMENT_ADDED,
            title: 'New Dispute Comment',
            message: `Customer has added a comment to dispute for order ${dispute.order.orderNumber}.`,
            link: `/admin/disputes/${disputeId}`,
            metadata: {
              disputeId,
              commentId: comment.id,
              orderNumber: dispute.order.orderNumber,
              customerId: user.userId,
            },
          });
        }
      }
    } catch (notifError) {
      console.error('[Dispute Comments API] Failed to send notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      data: comment,
      message: 'Comment added successfully',
    });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;

    console.error('Error adding dispute comment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add comment',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/disputes/[id]/comments
 * Get all comments for a dispute
 * @access Customer (own disputes) and Admin
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: disputeId } = await params;

    // Verify authentication
    const user = requireAuth(req);

    // Check if user can view this dispute
    const hasAccess = await canViewDispute(disputeId, user.userId, user.role);
    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: 'You do not have permission to view these comments',
        },
        { status: 403 }
      );
    }

    // Fetch comments
    const comments = await prisma.disputeComment.findMany({
      where: { disputeId },
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
    });

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;

    console.error('Error fetching dispute comments:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch comments',
      },
      { status: 500 }
    );
  }
}
