/**
 * Pure Frontend Compatibility Shim
 * Decouples Next.js frontend entirely from @prisma/client runtime and database schemas.
 * Provides all exact enums, interfaces, and types required by frontend components.
 */

export enum UserRole {
  ADMIN = "ADMIN",
  VENDOR = "VENDOR",
  CUSTOMER = "CUSTOMER",
  ADS_SELLER = "ADS_SELLER",
  STAFF = "STAFF",
}

export enum OrderStatus {
  PENDING_PAYMENT = "PENDING_PAYMENT",
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  PARTIALLY_SHIPPED = "PARTIALLY_SHIPPED",
  DELIVERED = "DELIVERED",
  DELIVERY_CONFIRMED = "DELIVERY_CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  RETURN_REQUESTED = "RETURN_REQUESTED",
  RETURNED = "RETURNED",
  DISPUTED = "DISPUTED",
  REFUNDED = "REFUNDED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum WalletTransactionType {
  CREDIT = "CREDIT",
  DEBIT = "DEBIT",
  COMMISSION = "COMMISSION",
  PAYOUT = "PAYOUT",
  REFUND = "REFUND",
  HOLD = "HOLD",
  RELEASE = "RELEASE",
}

export enum DisputeStatus {
  OPEN = "OPEN",
  IN_REVIEW = "IN_REVIEW",
  RESOLVED_CUSTOMER_FAVOR = "RESOLVED_CUSTOMER_FAVOR",
  RESOLVED_VENDOR_FAVOR = "RESOLVED_VENDOR_FAVOR",
  CLOSED = "CLOSED",
}

export enum CouponType {
  FLAT = "FLAT",
  PERCENTAGE = "PERCENTAGE",
}

export enum CouponApplicableTo {
  BOTH = "BOTH",
  TRYME = "TRYME",
  OWN_WEBSITE = "OWN_WEBSITE",
}

export enum PayoutStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum RefundStatus {
  NONE = "NONE",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
}

export enum NotificationType {
  ORDER_PAYMENT_CONFIRMED = "ORDER_PAYMENT_CONFIRMED",
  ORDER_CANCELLED = "ORDER_CANCELLED",
  ORDER_DELIVERY_CONFIRMED = "ORDER_DELIVERY_CONFIRMED",
  ORDER_RETURN_REQUESTED = "ORDER_RETURN_REQUESTED",
  ORDER_ITEM_PROCESSING = "ORDER_ITEM_PROCESSING",
  ORDER_ITEM_SHIPPED = "ORDER_ITEM_SHIPPED",
  ORDER_STATUS_OVERRIDE = "ORDER_STATUS_OVERRIDE",
  DISPUTE_CREATED = "DISPUTE_CREATED",
  DISPUTE_COMMENT_ADDED = "DISPUTE_COMMENT_ADDED",
  DISPUTE_RESOLVED = "DISPUTE_RESOLVED",
  PAYOUT_REQUESTED = "PAYOUT_REQUESTED",
  PAYOUT_APPROVED = "PAYOUT_APPROVED",
  PAYOUT_COMPLETED = "PAYOUT_COMPLETED",
  PAYOUT_FAILED = "PAYOUT_FAILED",
  CHAT_NEW_MESSAGE = "CHAT_NEW_MESSAGE",
  VENDOR_PROFILE_UPDATED = "VENDOR_PROFILE_UPDATED",
  SYSTEM_ANNOUNCEMENT = "SYSTEM_ANNOUNCEMENT",
  SYSTEM_MAINTENANCE = "SYSTEM_MAINTENANCE",
}

export enum NotificationCategory {
  ORDER = "ORDER",
  DISPUTE = "DISPUTE",
  PAYOUT = "PAYOUT",
  CHAT = "CHAT",
  SYSTEM = "SYSTEM",
}

export enum NotificationPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum VendorStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum AdStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  REJECTED = "REJECTED",
  PAUSED = "PAUSED",
}

export enum AdsPlanType {
  FREE = "FREE",
  BASIC = "BASIC",
  PRO = "PRO",
  PREMIUM = "PREMIUM",
}

export enum AdsPlanBillingCycle {
  LIFETIME = "LIFETIME",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

export enum AdsSubscriptionStatus {
  ACTIVE = "ACTIVE",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export enum AdsPaymentStatus {
  PENDING = "PENDING",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  REJECTED = "REJECTED",
}

export enum AdFieldType {
  TEXT = "TEXT",
  TEXTAREA = "TEXTAREA",
  SELECT = "SELECT",
  RADIO = "RADIO",
  CHECKBOX = "CHECKBOX",
  NUMBER = "NUMBER",
}

export class Decimal {
  private val: number;
  constructor(value: number | string | Decimal) {
    this.val = typeof value === "number" ? value : Number(value);
  }
  toNumber(): number {
    return this.val;
  }
  toString(): string {
    return this.val.toString();
  }
  toFixed(digits?: number): string {
    return this.val.toFixed(digits);
  }
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatar?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  [key: string]: any;
}

export interface Customer {
  id: string;
  userId: string;
  phone?: string | null;
  addresses?: any[];
  orders?: any[];
  createdAt: Date | string;
  updatedAt: Date | string;
  [key: string]: any;
}

export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  businessEmail?: string | null;
  businessPhone?: string | null;
  businessAddress?: string | null;
  slug: string;
  description?: string | null;
  logo?: string | null;
  banner?: string | null;
  status: VendorStatus;
  isShopOpen: boolean;
  commissionRate?: number | Decimal;
  phone?: string | null;
  address?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  [key: string]: any;
}

export interface Wallet {
  id: string;
  vendorId?: string | null;
  adsSellerId?: string | null;
  balance: number | Decimal;
  pendingBalance: number | Decimal;
  availableBalance: number | Decimal;
  totalEarnings: number | Decimal;
  escrowBalance?: number | Decimal;
  currency: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  [key: string]: any;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isActive: boolean;
  [key: string]: any;
}

export interface Product {
  id: string;
  vendorId: string;
  categoryId: string;
  title: string;
  name?: string;
  slug: string;
  description?: string | null;
  price: number | Decimal;
  compareAtPrice?: number | Decimal | null;
  costPerItem?: number | Decimal | null;
  sku?: string | null;
  barcode?: string | null;
  trackQuantity: boolean;
  quantity: number;
  stock?: number;
  lowStockThreshold?: number | null;
  adminDisableReason?: string | null;
  isActive: boolean;
  isDraft: boolean;
  isDisabledByAdmin: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  [key: string]: any;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  position: number;
  altText?: string | null;
  [key: string]: any;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  priceAdjustment: number | Decimal;
  quantity: number;
  sku?: string | null;
  [key: string]: any;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string | null;
  type: CouponType;
  value: number | Decimal;
  minOrderAmount?: number | Decimal | null;
  maxDiscount?: number | Decimal | null;
  applicableTo: CouponApplicableTo;
  usageLimit?: number | null;
  usedCount: number;
  perUserLimit?: number | null;
  vendorId?: string | null;
  validFrom: Date | string;
  validUntil?: Date | string | null;
  startDate?: Date | string;
  endDate?: Date | string | null;
  isActive: boolean;
  [key: string]: any;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  subtotal: number | Decimal;
  discount: number | Decimal;
  shippingFee: number | Decimal;
  total: number | Decimal;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  shippingAddressId?: string | null;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  [key: string]: any;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  vendorId: string;
  title: string;
  price: number | Decimal;
  quantity: number;
  status: OrderStatus;
  refundStatus?: RefundStatus | null;
  variantId?: string | null;
  image?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  [key: string]: any;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number | Decimal;
  currency: string;
  method: string;
  status: PaymentStatus;
  transactionId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  [key: string]: any;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number | Decimal;
  balanceBefore: number | Decimal;
  balanceAfter: number | Decimal;
  description?: string | null;
  referenceId?: string | null;
  createdAt: Date | string;
  [key: string]: any;
}

export interface ChatRoom {
  id: string;
  orderItemId: string;
  customerId: string;
  vendorId: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: Date | string;
  [key: string]: any;
}

export interface Dispute {
  id: string;
  orderId: string;
  customerId: string;
  reason: string;
  description?: string | null;
  status: DisputeStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  priority?: string | null;
  readAt?: Date | string | null;
  metadata?: any;
  data?: any;
  isRead: boolean;
  createdAt: Date | string;
  [key: string]: any;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  [key: string]: any;
}

export namespace Prisma {
  export type Decimal = InstanceType<typeof Decimal>;
  export type JsonValue = string | number | boolean | { [key: string]: any } | any[] | null;
  export type DisputeGetPayload<T = any> = any;
  export type DisputeCommentGetPayload<T = any> = any;
}

export class PrismaClient {
  constructor() {
    throw new Error(
      "PrismaClient is disabled on Next.js Frontend. All database operations are decoupled to the NestJS dedicated backend."
    );
  }
}

export default {
  UserRole,
  OrderStatus,
  PaymentStatus,
  WalletTransactionType,
  DisputeStatus,
  CouponType,
  CouponApplicableTo,
  PayoutStatus,
  RefundStatus,
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  VendorStatus,
  AdStatus,
  AdsPlanType,
  AdsPlanBillingCycle,
  AdsSubscriptionStatus,
  AdsPaymentStatus,
  AdFieldType,
  Decimal,
  PrismaClient,
};
