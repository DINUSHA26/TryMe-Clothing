import { Prisma } from '@prisma/client';

// Dispute reason enum
export enum DisputeReason {
  DAMAGED_PRODUCT = 'DAMAGED_PRODUCT',
  WRONG_ITEM = 'WRONG_ITEM',
  NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED',
  NOT_RECEIVED = 'NOT_RECEIVED',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  OTHER = 'OTHER',
}

// Dispute status enum
export enum DisputeStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED_CUSTOMER_FAVOR = 'RESOLVED_CUSTOMER_FAVOR',
  RESOLVED_VENDOR_FAVOR = 'RESOLVED_VENDOR_FAVOR',
  CLOSED = 'CLOSED',
}

// Resolution type for admin actions
export enum ResolutionType {
  CUSTOMER_FAVOR = 'CUSTOMER_FAVOR',
  VENDOR_FAVOR = 'VENDOR_FAVOR',
  CLOSED_NO_ACTION = 'CLOSED_NO_ACTION',
}

// Dispute reason labels
export const DISPUTE_REASON_LABELS: Record<DisputeReason, string> = {
  [DisputeReason.DAMAGED_PRODUCT]: 'Product Damaged',
  [DisputeReason.WRONG_ITEM]: 'Wrong Item Received',
  [DisputeReason.NOT_AS_DESCRIBED]: 'Not as Described',
  [DisputeReason.NOT_RECEIVED]: 'Product Not Received',
  [DisputeReason.QUALITY_ISSUE]: 'Quality Issue',
  [DisputeReason.OTHER]: 'Other Issue',
};

// Dispute status labels
export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  [DisputeStatus.OPEN]: 'Open',
  [DisputeStatus.IN_REVIEW]: 'In Review',
  [DisputeStatus.RESOLVED_CUSTOMER_FAVOR]: 'Resolved - Customer Favor',
  [DisputeStatus.RESOLVED_VENDOR_FAVOR]: 'Resolved - Vendor Favor',
  [DisputeStatus.CLOSED]: 'Closed',
};

// Resolution type labels
export const RESOLUTION_TYPE_LABELS: Record<ResolutionType, string> = {
  [ResolutionType.CUSTOMER_FAVOR]: 'Resolve in Customer Favor (with refund)',
  [ResolutionType.VENDOR_FAVOR]: 'Resolve in Vendor Favor (no refund)',
  [ResolutionType.CLOSED_NO_ACTION]: 'Close without resolution',
};

// Dispute status colors for badges
export const DISPUTE_STATUS_COLORS: Record<
  DisputeStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  [DisputeStatus.OPEN]: 'destructive',
  [DisputeStatus.IN_REVIEW]: 'secondary',
  [DisputeStatus.RESOLVED_CUSTOMER_FAVOR]: 'default',
  [DisputeStatus.RESOLVED_VENDOR_FAVOR]: 'outline',
  [DisputeStatus.CLOSED]: 'outline',
};

// Dispute with relations type
export type DisputeWithRelations = Prisma.DisputeGetPayload<{
  include: {
    order: {
      include: {
        items: {
          include: {
            product: true;
            variant: true;
          };
        };
        shippingAddress: true;
      };
    };
    customer: {
      include: {
        user: {
          select: {
            email: true;
            phone: true;
          };
        };
      };
    };
    comments: {
      include: {
        user: {
          select: {
            id: true;
            email: true;
            role: true;
          };
        };
      };
      orderBy: {
        createdAt: 'asc';
      };
    };
  };
}>;

// Dispute comment type
export type DisputeCommentWithUser = Prisma.DisputeCommentGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        email: true;
        role: true;
        firstName: true;
        lastName: true;
      };
    };
  };
}>;

// Dispute list item (for table/list views)
export type DisputeListItem = Prisma.DisputeGetPayload<{
  include: {
    order: {
      select: {
        orderNumber: true;
        totalAmount: true;
        status: true;
      };
    };
    customer: {
      include: {
        user: {
          select: {
            email: true;
          };
        };
      };
    };
    _count: {
      select: {
        comments: true;
      };
    };
  };
}>;

// Create dispute payload
export interface CreateDisputePayload {
  orderId: string;
  reason: DisputeReason;
  description: string;
  evidence?: string[]; // Array of image URLs (Cloudinary)
}

// Add comment payload
export interface AddDisputeCommentPayload {
  disputeId: string;
  content: string;
  isAdminComment: boolean;
}

// Resolve dispute payload
export interface ResolveDisputePayload {
  disputeId: string;
  resolutionType: ResolutionType;
  adminNotes: string;
  refundAmount?: number; // Optional: custom refund amount
}

// Dispute filters
export interface DisputeFilters {
  status?: DisputeStatus | DisputeStatus[];
  reason?: DisputeReason | DisputeReason[];
  customerId?: string;
  orderId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string; // Search in order number, customer email, description
}

// Dispute pagination
export interface DisputePaginationParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// Dispute stats
export interface DisputeStats {
  total: number;
  open: number;
  inReview: number;
  resolvedCustomerFavor: number;
  resolvedVendorFavor: number;
  closed: number;
}

// Refund calculation result
export interface DisputeRefundCalculation {
  orderTotal: number;
  refundAmount: number;
  platformCommission: number; // Commission to be reversed
  vendorRefunds: Array<{
    vendorId: string;
    vendorName: string;
    amount: number;
    commissionReversed: number;
  }>;
}

// Dispute eligibility check result
export interface DisputeEligibilityResult {
  eligible: boolean;
  reason?: string;
  existingDisputeId?: string;
}

// Order statuses that allow dispute creation
export const DISPUTE_ELIGIBLE_ORDER_STATUSES = [
  'DELIVERED',
  'DELIVERY_CONFIRMED',
  'RETURNED',
  'RETURN_REQUESTED',
] as const;

// Dispute time window (days after delivery)
export const DISPUTE_WINDOW_DAYS = 1;

// Max evidence images per dispute
export const MAX_DISPUTE_EVIDENCE_IMAGES = 5;

// Max comment length
export const MAX_DISPUTE_COMMENT_LENGTH = 1000;
