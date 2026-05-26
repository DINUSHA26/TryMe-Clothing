// Notification System Types & Configurations
// Defines all notification types, priorities, and default settings

export enum NotificationType {
  // Orders (7)
  ORDER_PAYMENT_CONFIRMED = 'ORDER_PAYMENT_CONFIRMED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_DELIVERY_CONFIRMED = 'ORDER_DELIVERY_CONFIRMED',
  ORDER_RETURN_REQUESTED = 'ORDER_RETURN_REQUESTED',
  ORDER_ITEM_PROCESSING = 'ORDER_ITEM_PROCESSING',
  ORDER_ITEM_SHIPPED = 'ORDER_ITEM_SHIPPED',
  ORDER_STATUS_OVERRIDE = 'ORDER_STATUS_OVERRIDE',

  // Disputes (4)
  DISPUTE_CREATED = 'DISPUTE_CREATED',
  DISPUTE_COMMENT_ADDED = 'DISPUTE_COMMENT_ADDED',
  DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',

  // Payouts (4)
  PAYOUT_REQUESTED = 'PAYOUT_REQUESTED',
  PAYOUT_APPROVED = 'PAYOUT_APPROVED',
  PAYOUT_COMPLETED = 'PAYOUT_COMPLETED',
  PAYOUT_FAILED = 'PAYOUT_FAILED',

  // Chat (1)
  CHAT_NEW_MESSAGE = 'CHAT_NEW_MESSAGE',

  // Vendor (1)
  VENDOR_PROFILE_UPDATED = 'VENDOR_PROFILE_UPDATED',

  // System (2)
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
}

export enum NotificationCategory {
  ORDER = 'ORDER',
  DISPUTE = 'DISPUTE',
  PAYOUT = 'PAYOUT',
  CHAT = 'CHAT',
  SYSTEM = 'SYSTEM',
}

export enum NotificationPriority {
  LOW = 'LOW',       // Chat, minor updates
  MEDIUM = 'MEDIUM', // Status changes, comments
  HIGH = 'HIGH',     // Payment, cancellation, dispute
  CRITICAL = 'CRITICAL', // Security, account issues
}

// Metadata interfaces for different notification types
export interface NotificationMetadata {
  // Order-related
  orderId?: string;
  orderNumber?: string;
  orderItemId?: string;
  amount?: number;
  vendorName?: string;
  productName?: string;
  trackingNumber?: string;
  trackingUrl?: string;

  // Dispute-related
  disputeId?: string;
  disputeReason?: string;
  resolutionType?: string;
  refundAmount?: number;
  commentId?: string;

  // Payout-related
  payoutId?: string;
  payoutAmount?: number;
  bankName?: string;
  accountNumber?: string; // Masked
  failureReason?: string;
  transactionRef?: string;

  // Chat-related
  roomId?: string;
  messagePreview?: string; // First 50 chars
  senderName?: string;

  // System-related
  announcementType?: string;
  maintenanceWindow?: string;

  // Vendor-related
  oldBusinessName?: string;
  newBusinessName?: string;

  // Common
  recipientRole?: string;
  actionRequired?: boolean;
  customerId?: string;
  reason?: string;
}

// Configuration for each notification type
export interface NotificationConfig {
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  emailTemplate: string;
  defaultEmailEnabled: boolean;
  defaultInAppEnabled: boolean;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
}

// Full configuration mapping for all 18 notification types
export const NOTIFICATION_CONFIGS: Record<NotificationType, NotificationConfig> = {
  // ==================== ORDERS ====================
  [NotificationType.ORDER_PAYMENT_CONFIRMED]: {
    type: NotificationType.ORDER_PAYMENT_CONFIRMED,
    category: NotificationCategory.ORDER,
    priority: NotificationPriority.HIGH,
    emailTemplate: 'orderPaymentConfirmed',
    defaultEmailEnabled: true,
    defaultInAppEnabled: true,
    icon: 'CheckCircle',
    color: 'text-green-600',
  },
  [NotificationType.ORDER_CANCELLED]: {
    type: NotificationType.ORDER_CANCELLED,
    category: NotificationCategory.ORDER,
    priority: NotificationPriority.HIGH,
    emailTemplate: 'orderCancelled',
    defaultEmailEnabled: true,
    defaultInAppEnabled: true,
    icon: 'XCircle',
    color: 'text-red-600',
  },
  [NotificationType.ORDER_DELIVERY_CONFIRMED]: {
    type: NotificationType.ORDER_DELIVERY_CONFIRMED,
    category: NotificationCategory.ORDER,
    priority: NotificationPriority.HIGH,
    emailTemplate: 'orderDeliveryConfirmed',
    defaultEmailEnabled: true,
    defaultInAppEnabled: true,
    icon: 'Package',
    color: 'text-green-600',
  },
  [NotificationType.ORDER_RETURN_REQUESTED]: {
    type: NotificationType.ORDER_RETURN_REQUESTED,
    category: NotificationCategory.ORDER,
    priority: NotificationPriority.HIGH,
    emailTemplate: 'orderReturnRequested',
    defaultEmailEnabled: true,
    defaultInAppEnabled: true,
    icon: 'RotateCcw',
    color: 'text-amber-600',
  },
  [NotificationType.ORDER_ITEM_PROCESSING]: {
    type: NotificationType.ORDER_ITEM_PROCESSING,
    category: NotificationCategory.ORDER,
    priority: NotificationPriority.MEDIUM,
    emailTemplate: 'orderItemProcessing',
    defaultEmailEnabled: false, // In-app only for minor updates
    defaultInAppEnabled: true,
    icon: 'Clock',
    color: 'text-blue-600',
  },
  [NotificationType.ORDER_ITEM_SHIPPED]: {
    type: NotificationType.ORDER_ITEM_SHIPPED,
    category: NotificationCategory.ORDER,
    priority: NotificationPriority.MEDIUM,
    emailTemplate: 'orderItemShipped',
    defaultEmailEnabled: true, // Include tracking info
    defaultInAppEnabled: true,
    icon: 'Truck',
    color: 'text-blue-600',
  },
  [NotificationType.ORDER_STATUS_OVERRIDE]: {
    type: NotificationType.ORDER_STATUS_OVERRIDE,
    category: NotificationCategory.ORDER,
    priority: NotificationPriority.HIGH,
    emailTemplate: 'orderStatusOverride',
    defaultEmailEnabled: true,
    defaultInAppEnabled: true,
    icon: 'AlertTriangle',
    color: 'text-amber-600',
  },

  // ==================== DISPUTES ====================
  [NotificationType.DISPUTE_CREATED]: {
    type: NotificationType.DISPUTE_CREATED,
    category: NotificationCategory.DISPUTE,
    priority: NotificationPriority.HIGH,
    emailTemplate: 'disputeCreated',
    defaultEmailEnabled: true,
    defaultInAppEnabled: true,
    icon: 'AlertCircle',
    color: 'text-red-600',
  },
  [NotificationType.DISPUTE_COMMENT_ADDED]: {
    type: NotificationType.DISPUTE_COMMENT_ADDED,
    category: NotificationCategory.DISPUTE,
    priority: NotificationPriority.MEDIUM,
    emailTemplate: 'disputeCommentAdded',
    defaultEmailEnabled: false, // In-app only for comments
    defaultInAppEnabled: true,
    icon: 'MessageSquare',
    color: 'text-blue-600',
  },
  [NotificationType.DISPUTE_RESOLVED]: {
    type: NotificationType.DISPUTE_RESOLVED,
    category: NotificationCategory.DISPUTE,
    priority: NotificationPriority.HIGH,
    emailTemplate: 'disputeResolved',
    defaultEmailEnabled: true,
    defaultInAppEnabled: true,
    icon: 'CheckCircle',
    color: 'text-green-600',
  },

  // ==================== PAYOUTS ====================
  [NotificationType.PAYOUT_REQUESTED]: {
    type: NotificationType.PAYOUT_REQUESTED,
    category: NotificationCategory.PAYOUT,
    priority: NotificationPriority.MEDIUM,
    emailTemplate: 'payoutRequested',
    defaultEmailEnabled: true,
    defaultInAppEnabled: true,
    icon: 'DollarSign',
    color: 'text-blue-600',
  },
  [NotificationType.PAYOUT_APPROVED]: {
    type: NotificationType.PAYOUT_APPROVED,
    category: NotificationCategory.PAYOUT,
    priority: NotificationPriority.HIGH,
    emailTemplate: 'payoutApproved',
    defaultEmailEnabled: true,
    defaultInAppEnabled: true,
    icon: 'CheckCircle',
    color: 'text-green-600',
  },
  [NotificationType.PAYOUT_COMPLETED]: {
    type: NotificationType.PAYOUT_COMPLETED,
    category: NotificationCategory.PAYOUT,
    priority: NotificationPriority.HIGH,
    emailTemplate: 'payoutCompleted',
    defaultEmailEnabled: true,
    defaultInAppEnabled: true,
    icon: 'CheckCircle',
    color: 'text-green-600',
  },
  [NotificationType.PAYOUT_FAILED]: {
    type: NotificationType.PAYOUT_FAILED,
    category: NotificationCategory.PAYOUT,
    priority: NotificationPriority.HIGH,
    emailTemplate: 'payoutFailed',
    defaultEmailEnabled: true,
    defaultInAppEnabled: true,
    icon: 'XCircle',
    color: 'text-red-600',
  },

  // ==================== CHAT ====================
  [NotificationType.CHAT_NEW_MESSAGE]: {
    type: NotificationType.CHAT_NEW_MESSAGE,
    category: NotificationCategory.CHAT,
    priority: NotificationPriority.LOW,
    emailTemplate: 'chatNewMessage',
    defaultEmailEnabled: false, // In-app only, avoid email spam
    defaultInAppEnabled: true,
    icon: 'MessageCircle',
    color: 'text-purple-600',
  },

  // ==================== SYSTEM ====================
  [NotificationType.SYSTEM_ANNOUNCEMENT]: {
    type: NotificationType.SYSTEM_ANNOUNCEMENT,
    category: NotificationCategory.SYSTEM,
    priority: NotificationPriority.MEDIUM,
    emailTemplate: 'systemAnnouncement',
    defaultEmailEnabled: true,
    defaultInAppEnabled: true,
    icon: 'Megaphone',
    color: 'text-indigo-600',
  },
  [NotificationType.SYSTEM_MAINTENANCE]: {
    type: NotificationType.SYSTEM_MAINTENANCE,
    category: NotificationCategory.SYSTEM,
    priority: NotificationPriority.MEDIUM,
    emailTemplate: 'systemMaintenance',
    defaultEmailEnabled: true,
    defaultInAppEnabled: true,
    icon: 'Wrench',
    color: 'text-amber-600',
  },
  [NotificationType.VENDOR_PROFILE_UPDATED]: {
    type: NotificationType.VENDOR_PROFILE_UPDATED,
    category: NotificationCategory.SYSTEM,
    priority: NotificationPriority.MEDIUM,
    emailTemplate: 'vendorProfileUpdated',
    defaultEmailEnabled: true,
    defaultInAppEnabled: true,
    icon: 'Settings',
    color: 'text-blue-600',
  },
};

// Helper: Get configuration for a notification type
export function getNotificationConfig(type: NotificationType): NotificationConfig {
  return NOTIFICATION_CONFIGS[type];
}

// Helper: Get all notification types by category
export function getNotificationTypesByCategory(
  category: NotificationCategory
): NotificationType[] {
  return Object.values(NotificationType).filter(
    (type) => NOTIFICATION_CONFIGS[type].category === category
  );
}

// Helper: Get all HIGH/CRITICAL priority notification types
export function getHighPriorityNotificationTypes(): NotificationType[] {
  return Object.values(NotificationType).filter((type) => {
    const priority = NOTIFICATION_CONFIGS[type].priority;
    return priority === NotificationPriority.HIGH || priority === NotificationPriority.CRITICAL;
  });
}

// Notification preference structure (JSON stored in DB)
export interface CategoryPreferences {
  email: boolean;
  inApp: boolean;
  priority: NotificationPriority;
}

export interface NotificationPreferences {
  ORDER: CategoryPreferences;
  DISPUTE: CategoryPreferences;
  PAYOUT: CategoryPreferences;
  CHAT: CategoryPreferences;
  SYSTEM: CategoryPreferences;
}

// Default preferences
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  ORDER: {
    email: true,
    inApp: true,
    priority: NotificationPriority.HIGH,
  },
  DISPUTE: {
    email: true,
    inApp: true,
    priority: NotificationPriority.HIGH,
  },
  PAYOUT: {
    email: true,
    inApp: true,
    priority: NotificationPriority.HIGH,
  },
  CHAT: {
    email: false, // Avoid email spam for chat messages
    inApp: true,
    priority: NotificationPriority.LOW,
  },
  SYSTEM: {
    email: true,
    inApp: true,
    priority: NotificationPriority.MEDIUM,
  },
};
