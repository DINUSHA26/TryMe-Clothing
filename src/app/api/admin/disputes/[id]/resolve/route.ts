import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, handleAuthError } from '@/lib/auth-helpers';
import { resolveDisputeSchema } from '@/lib/validations/dispute';
import {
  processDisputeRefund,
  getDisputeStatusFromResolution,
  validateDisputeStatusTransition,
  processDisputeReleaseToVendor,
} from '@/lib/utils/dispute';
import { DisputeStatus, ResolutionType } from '@/types/dispute';
import { createNotification } from '@/lib/notifications/notificationService';
import { NotificationType } from '@/types/notification';

/**
 * PATCH /api/admin/disputes/[id]/resolve
 * Resolve a dispute (customer favor, vendor favor, or close)
 * CRITICAL: Triggers automatic refunds when resolved in customer's favor
 * @access Admin only
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const disputeId = id.toLowerCase();

    // Verify authentication - Admin only
    const user = requireAdmin(req);

    // Parse and validate request body
    const body = await req.json();
    const validation = resolveDisputeSchema.safeParse(body);

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

    const { resolutionType, adminNotes, refundAmount } = validation.data;

    // Fetch dispute with order details
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
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

    // Check if dispute can be resolved (not already resolved)
    if (
      dispute.status === DisputeStatus.RESOLVED_CUSTOMER_FAVOR ||
      dispute.status === DisputeStatus.RESOLVED_VENDOR_FAVOR ||
      dispute.status === DisputeStatus.CLOSED
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dispute is already resolved',
        },
        { status: 400 }
      );
    }

    // Get new status based on resolution type
    const newStatus = getDisputeStatusFromResolution(resolutionType);

    // Validate status transition
    const transitionValidation = validateDisputeStatusTransition(
      dispute.status as DisputeStatus,
      newStatus
    );
    if (!transitionValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: transitionValidation.error,
        },
        { status: 400 }
      );
    }

    // Validate refund amount if provided
    if (
      refundAmount !== undefined &&
      refundAmount > dispute.order.totalAmount.toNumber()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Refund amount cannot exceed order total (Rs. ${dispute.order.totalAmount.toNumber().toFixed(2)})`,
        },
        { status: 400 }
      );
    }

    // Process resolution in a transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // Update dispute status
        const updatedDispute = await tx.dispute.update({
          where: { id: disputeId },
          data: {
            status: newStatus,
            resolution: adminNotes,
            resolvedBy: user.userId,
            resolvedAt: new Date(),
          },
          include: {
            order: {
              select: {
                orderNumber: true,
                totalAmount: true,
              },
            },
            customer: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        });

        // Add system comment about resolution
        await tx.disputeComment.create({
          data: {
            disputeId,
            userId: user.userId,
            comment: `Dispute resolved: ${resolutionType}\n\n${adminNotes}`,
            isAdmin: true,
          },
        });

        // Log status transition in audit log
        await tx.disputeAuditLog.create({
          data: {
            disputeId,
            oldStatus: dispute.status,
            newStatus,
            changedById: user.userId,
            reason: `Dispute resolved: ${resolutionType}`,
          },
        });

        return updatedDispute;
      },
      {
        maxWait: 10000, // 10 seconds
        timeout: 30000, // 30 seconds
      }
    );

    // CRITICAL: Process refund if resolved in customer's favor
    // This is done OUTSIDE the transaction to avoid long-running transactions
    if (resolutionType === ResolutionType.CUSTOMER_FAVOR) {
      try {
        await processDisputeRefund(
          dispute.orderId,
          disputeId,
          refundAmount
        );

        // Add success comment
        await prisma.disputeComment.create({
          data: {
            disputeId,
            userId: user.userId,
            comment: `Refund processed successfully. Amount: Rs. ${(refundAmount || dispute.order.totalAmount.toNumber()).toFixed(2)}`,
            isAdmin: true,
          },
        });
      } catch (refundError) {
        console.error('Error processing refund:', refundError);

        // Log refund failure
        await prisma.disputeComment.create({
          data: {
            disputeId,
            userId: user.userId,
            comment: `⚠️ Refund processing failed. Please process manually. Error: ${refundError instanceof Error ? refundError.message : 'Unknown error'}`,
            isAdmin: true,
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: 'Dispute resolved but refund processing failed',
            details: refundError instanceof Error ? refundError.message : 'Unknown error',
            data: result,
          },
          { status: 500 }
        );
      }
    } else if (resolutionType === ResolutionType.VENDOR_FAVOR) {
      try {
        await processDisputeReleaseToVendor(dispute.orderId, disputeId);

        // Add success comment
        await prisma.disputeComment.create({
          data: {
            disputeId,
            userId: user.userId,
            comment: `Funds released to vendor payout pipeline successfully.`,
            isAdmin: true,
          },
        });
      } catch (releaseError) {
        console.error('Error releasing vendor funds:', releaseError);

        // Log release failure
        await prisma.disputeComment.create({
          data: {
            disputeId,
            userId: user.userId,
            comment: `⚠️ Vendor fund release failed. Please process manually. Error: ${releaseError instanceof Error ? releaseError.message : 'Unknown error'}`,
            isAdmin: true,
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: 'Dispute resolved but vendor fund release failed',
            details: releaseError instanceof Error ? releaseError.message : 'Unknown error',
            data: result,
          },
          { status: 500 }
        );
      }
    }

    // Send notification to customer about dispute resolution
    try {
      await createNotification({
        userId: result.customer.user.id,
        type: NotificationType.DISPUTE_RESOLVED,
        title: 'Dispute Resolved',
        message: `Your dispute for order ${dispute.order.orderNumber} has been resolved: ${resolutionType}${resolutionType === ResolutionType.CUSTOMER_FAVOR && refundAmount ? `. Refund of Rs. ${refundAmount.toFixed(2)} has been processed.` : '.'}`,
        link: `/orders/disputes/${disputeId}`,
        metadata: {
          disputeId,
          orderId: dispute.orderId,
          orderNumber: dispute.order.orderNumber,
          resolutionType,
          refundAmount: resolutionType === ResolutionType.CUSTOMER_FAVOR ? refundAmount || dispute.order.totalAmount.toNumber() : undefined,
        },
      });
    } catch (notifError) {
      console.error('Failed to send dispute resolution notification to customer:', notifError);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Dispute resolved: ${resolutionType}`,
      refundProcessed: resolutionType === ResolutionType.CUSTOMER_FAVOR,
    });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;

    console.error('Error resolving dispute:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resolve dispute',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
