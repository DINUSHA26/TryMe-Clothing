// Notification Templates
// Generates notification content (title, message, link) for each notification type

import {
  NotificationType,
  type NotificationMetadata,
} from "@/types/notification";

export interface NotificationContent {
  title: string;
  message: string;
  link: string | null;
}

/**
 * Generate notification content based on type and metadata
 */
export function generateNotificationContent(
  type: NotificationType,
  metadata?: NotificationMetadata
): NotificationContent {
  switch (type) {
    // ==================== ORDERS ====================

    case NotificationType.ORDER_PAYMENT_CONFIRMED:
      return {
        title: "Payment Confirmed",
        message: `Your payment for Order ${metadata?.orderNumber || "#N/A"} has been successfully processed. Your order is now being prepared.`,
        link: `/orders/${metadata?.orderId}`,
      };

    case NotificationType.ORDER_CANCELLED:
      return {
        title: "Order Cancelled",
        message: metadata?.amount
          ? `Order ${metadata?.orderNumber || "#N/A"} has been cancelled. Rs. ${metadata.amount.toFixed(2)} has been refunded to your wallet.`
          : `Order ${metadata?.orderNumber || "#N/A"} has been cancelled.`,
        link: `/orders/${metadata?.orderId}`,
      };

    case NotificationType.ORDER_DELIVERY_CONFIRMED:
      return {
        title: "Delivery Confirmed",
        message: `Order ${metadata?.orderNumber || "#N/A"} has been marked as delivered. Thank you for shopping with us!`,
        link: `/orders/${metadata?.orderId}`,
      };

    case NotificationType.ORDER_RETURN_REQUESTED:
      return {
        title: metadata?.recipientRole === "ADMIN" || metadata?.recipientRole === "VENDOR"
          ? "Return Request Received"
          : "Return Request Submitted",
        message: metadata?.recipientRole === "ADMIN" || metadata?.recipientRole === "VENDOR"
          ? `A return has been requested for Order ${metadata?.orderNumber || "#N/A"}. Please review the request.`
          : `Your return request for Order ${metadata?.orderNumber || "#N/A"} has been submitted and is under review.`,
        link: metadata?.recipientRole === "ADMIN"
          ? `/admin/orders/${metadata?.orderId}`
          : metadata?.recipientRole === "VENDOR"
            ? `/vendor/orders/${metadata?.orderId}`
            : `/orders/${metadata?.orderId}`,
      };

    case NotificationType.ORDER_ITEM_PROCESSING:
      return {
        title: "Order Item Processing",
        message: metadata?.productName
          ? `${metadata.vendorName || "Vendor"} is now processing your order for ${metadata.productName}.`
          : `${metadata?.vendorName || "Vendor"} is now processing your order item.`,
        link: `/orders/${metadata?.orderId}`,
      };

    case NotificationType.ORDER_ITEM_SHIPPED:
      return {
        title: "Order Item Shipped",
        message: metadata?.trackingNumber
          ? `${metadata?.vendorName || "Vendor"} has shipped your order${metadata.productName ? ` for ${metadata.productName}` : ""}. Tracking: ${metadata.trackingNumber}`
          : `${metadata?.vendorName || "Vendor"} has shipped your order${metadata?.productName ? ` for ${metadata.productName}` : ""}.`,
        link: `/orders/${metadata?.orderId}`,
      };

    case NotificationType.ORDER_STATUS_OVERRIDE:
      return {
        title: "Order Status Updated",
        message: `An administrator has updated the status of Order ${metadata?.orderNumber || "#N/A"}. Please check your order details.`,
        link: `/orders/${metadata?.orderId}`,
      };

    // ==================== DISPUTES ====================

    case NotificationType.DISPUTE_CREATED:
      return {
        title: metadata?.recipientRole === "ADMIN"
          ? "New Dispute Submitted"
          : "Dispute Created",
        message: metadata?.recipientRole === "ADMIN"
          ? `A new dispute has been filed for Order ${metadata?.orderNumber || "#N/A"}. Reason: ${metadata?.disputeReason || "Not specified"}. Immediate attention required.`
          : `Your dispute for Order ${metadata?.orderNumber || "#N/A"} has been submitted. Reason: ${metadata?.disputeReason || "Not specified"}`,
        link: metadata?.recipientRole === "ADMIN"
          ? `/admin/disputes/${metadata?.disputeId}`
          : `/orders/disputes/${metadata?.disputeId}`,
      };

    case NotificationType.DISPUTE_COMMENT_ADDED:
      return {
        title: "New Comment on Dispute",
        message: metadata?.recipientRole === "ADMIN"
          ? `The customer has added a comment to dispute for Order ${metadata?.orderNumber || "#N/A"}.`
          : `An administrator has responded to your dispute for Order ${metadata?.orderNumber || "#N/A"}.`,
        link: metadata?.recipientRole === "ADMIN"
          ? `/admin/disputes/${metadata?.disputeId}`
          : `/orders/disputes/${metadata?.disputeId}`,
      };

    case NotificationType.DISPUTE_RESOLVED:
      return {
        title: "Dispute Resolved",
        message: generateDisputeResolvedMessage(metadata),
        link: metadata?.recipientRole === "ADMIN" || metadata?.recipientRole === "VENDOR"
          ? `/admin/disputes/${metadata?.disputeId}`
          : `/orders/disputes/${metadata?.disputeId}`,
      };

    // ==================== PAYOUTS ====================

    case NotificationType.PAYOUT_REQUESTED:
      return {
        title: "Payout Request Received",
        message: metadata?.payoutAmount
          ? `${metadata?.vendorName || "A vendor"} has requested a payout of Rs. ${metadata.payoutAmount.toFixed(2)}. Please review and process.`
          : `${metadata?.vendorName || "A vendor"} has requested a payout. Please review and process.`,
        link: `/admin/payouts/${metadata?.payoutId || ""}`,
      };

    case NotificationType.PAYOUT_APPROVED:
      return {
        title: "Payout Approved",
        message: metadata?.payoutAmount
          ? `Your payout request of Rs. ${metadata.payoutAmount.toFixed(2)} has been approved and is being processed. Funds will be transferred to ${metadata?.bankName || "your bank"} shortly.`
          : `Your payout request has been approved and is being processed.`,
        link: `/vendor/wallet`,
      };

    case NotificationType.PAYOUT_COMPLETED:
      return {
        title: "Payout Completed",
        message: metadata?.payoutAmount && metadata?.transactionRef
          ? `Your payout of Rs. ${metadata.payoutAmount.toFixed(2)} has been successfully transferred to ${metadata?.bankName || "your bank"}. Transaction reference: ${metadata.transactionRef}`
          : metadata?.payoutAmount
            ? `Your payout of Rs. ${metadata.payoutAmount.toFixed(2)} has been successfully transferred.`
            : `Your payout has been successfully transferred.`,
        link: `/vendor/wallet`,
      };

    case NotificationType.PAYOUT_FAILED:
      return {
        title: "Payout Failed",
        message: metadata?.payoutAmount && metadata?.failureReason
          ? `Your payout request of Rs. ${metadata.payoutAmount.toFixed(2)} has failed. Reason: ${metadata.failureReason}. The amount has been returned to your available balance.`
          : metadata?.payoutAmount
            ? `Your payout request of Rs. ${metadata.payoutAmount.toFixed(2)} has failed. The amount has been returned to your available balance.`
            : `Your payout request has failed. Please try again or contact support.`,
        link: `/vendor/wallet`,
      };

    // ==================== CHAT ====================

    case NotificationType.CHAT_NEW_MESSAGE:
      return {
        title: metadata?.senderName
          ? `New message from ${metadata.senderName}`
          : "New message",
        message: metadata?.messagePreview
          ? metadata.messagePreview.substring(0, 100) + (metadata.messagePreview.length > 100 ? "..." : "")
          : "You have received a new message.",
        link: `/chat?roomId=${metadata?.roomId || ""}`,
      };

    // ==================== SYSTEM ====================

    case NotificationType.SYSTEM_ANNOUNCEMENT:
      return {
        title: metadata?.announcementType || "System Announcement",
        message: metadata?.messagePreview || "Important announcement from Try Me. Please read.",
        link: null, // No specific link for announcements
      };

    case NotificationType.SYSTEM_MAINTENANCE:
      return {
        title: "Scheduled Maintenance",
        message: metadata?.maintenanceWindow
          ? `Try Me will undergo scheduled maintenance on ${metadata.maintenanceWindow}. Some features may be temporarily unavailable.`
          : "Try Me will undergo scheduled maintenance. Some features may be temporarily unavailable.",
        link: null,
      };

    case NotificationType.VENDOR_PROFILE_UPDATED:
      return {
        title: "Vendor Profile Updated",
        message: metadata?.oldBusinessName && metadata?.newBusinessName && metadata?.oldBusinessName !== metadata.newBusinessName
          ? `Vendor "${metadata.oldBusinessName}" has changed their business name to "${metadata.newBusinessName}".`
          : `Vendor "${metadata?.vendorName || "A vendor"}" has updated their shop profile details.`,
        link: `/admin/vendors`,
      };

    // ==================== DEFAULT ====================

    default:
      return {
        title: "Notification",
        message: "You have a new notification.",
        link: null,
      };
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate dispute resolution message based on resolution type
 */
function generateDisputeResolvedMessage(metadata?: NotificationMetadata): string {
  const orderNumber = metadata?.orderNumber || "#N/A";
  const resolutionType = metadata?.resolutionType;
  const refundAmount = metadata?.refundAmount;

  // For admin/vendor
  if (metadata?.recipientRole === "ADMIN" || metadata?.recipientRole === "VENDOR") {
    if (resolutionType === "CUSTOMER_FAVOR" && refundAmount) {
      return `Dispute for Order ${orderNumber} resolved in customer's favor. Refund of Rs. ${refundAmount.toFixed(2)} issued.`;
    }
    if (resolutionType === "VENDOR_FAVOR") {
      return `Dispute for Order ${orderNumber} resolved in vendor's favor. No refund issued.`;
    }
    return `Dispute for Order ${orderNumber} has been resolved.`;
  }

  // For customer
  if (resolutionType === "CUSTOMER_FAVOR" && refundAmount) {
    return `Your dispute for Order ${orderNumber} has been resolved in your favor. A refund of Rs. ${refundAmount.toFixed(2)} has been credited to your wallet.`;
  }
  if (resolutionType === "VENDOR_FAVOR") {
    return `Your dispute for Order ${orderNumber} has been resolved in the vendor's favor. No refund will be issued.`;
  }
  if (resolutionType === "CLOSED") {
    return `Your dispute for Order ${orderNumber} has been closed without action.`;
  }

  return `Your dispute for Order ${orderNumber} has been resolved. Please check the details.`;
}

/**
 * Format currency (helper for templates)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
