/**
 * NotificationIcon Component
 * Dynamic icon based on notification type
 */

import { NotificationType } from "@/types/notification";
import {
  ShoppingBag,
  XCircle,
  Truck,
  RotateCcw,
  Package,
  AlertTriangle,
  MessageSquare,
  DollarSign,
  CheckCircle,
  XOctagon,
  Bell,
  Info,
  Settings,
} from "lucide-react";

interface NotificationIconProps {
  type: NotificationType;
  className?: string;
}

export function NotificationIcon({
  type,
  className = "w-5 h-5",
}: NotificationIconProps) {
  const iconMap: Record<NotificationType, React.ReactNode> = {
    // Order notifications
    ORDER_PAYMENT_CONFIRMED: (
      <CheckCircle className={`${className} text-green-600`} />
    ),
    ORDER_CANCELLED: <XCircle className={`${className} text-red-600`} />,
    ORDER_DELIVERY_CONFIRMED: (
      <CheckCircle className={`${className} text-green-600`} />
    ),
    ORDER_RETURN_REQUESTED: (
      <RotateCcw className={`${className} text-amber-600`} />
    ),
    ORDER_ITEM_PROCESSING: (
      <Package className={`${className} text-blue-600`} />
    ),
    ORDER_ITEM_SHIPPED: <Truck className={`${className} text-green-600`} />,
    ORDER_STATUS_OVERRIDE: (
      <AlertTriangle className={`${className} text-amber-600`} />
    ),

    // Dispute notifications
    DISPUTE_CREATED: (
      <AlertTriangle className={`${className} text-red-600`} />
    ),
    DISPUTE_COMMENT_ADDED: (
      <MessageSquare className={`${className} text-blue-600`} />
    ),
    DISPUTE_RESOLVED: (
      <CheckCircle className={`${className} text-green-600`} />
    ),

    // Payout notifications
    PAYOUT_REQUESTED: (
      <DollarSign className={`${className} text-blue-600`} />
    ),
    PAYOUT_APPROVED: (
      <CheckCircle className={`${className} text-green-600`} />
    ),
    PAYOUT_COMPLETED: (
      <CheckCircle className={`${className} text-green-600`} />
    ),
    PAYOUT_FAILED: <XOctagon className={`${className} text-red-600`} />,

    // Chat notifications
    CHAT_NEW_MESSAGE: (
      <MessageSquare className={`${className} text-blue-600`} />
    ),

    // System notifications
    SYSTEM_ANNOUNCEMENT: <Bell className={`${className} text-purple-600`} />,
    SYSTEM_MAINTENANCE: <Info className={`${className} text-amber-600`} />,
    VENDOR_PROFILE_UPDATED: (
      <Settings className={`${className} text-blue-600`} />
    ),
  };

  return iconMap[type] || <Bell className={`${className} text-gray-600`} />;
}
