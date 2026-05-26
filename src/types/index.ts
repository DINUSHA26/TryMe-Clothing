// Re-export Prisma types for convenience
export type {
  User,
  Vendor,
  Customer,
  Product,
  Category,
  Order,
  OrderItem,
  Payment,
  Wallet,
  WalletTransaction,
  ChatRoom,
  ChatMessage,
  Dispute,
  Coupon,
  Notification,
} from "@prisma/client";

export {
  UserRole,
  OrderStatus,
  PaymentStatus,
  WalletTransactionType,
  DisputeStatus,
  CouponType,
  PayoutStatus,
} from "@prisma/client";

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// Auth types
export interface JWTPayload {
  userId: string;
  email?: string;
  role: "ADMIN" | "VENDOR" | "CUSTOMER";
  vendorId?: string;
  customerId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Product types
export interface ProductWithDetails {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  images: { url: string; altText?: string }[];
  variants: { id: string; name: string; value: string; priceAdjustment?: number; stock: number }[];
  category: { id: string; name: string; slug: string };
  vendor: { id: string; businessName: string; slug: string };
  isActive: boolean;
}

// Cart types
export interface CartItemWithProduct {
  id: string;
  productId: string;
  quantity: number;
  variantId?: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    images: { url: string }[];
    vendor: { businessName: string };
  };
  variant?: {
    id: string;
    name: string;
    value: string;
    priceAdjustment?: number;
  };
}

// Order types
export interface OrderWithDetails {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  items: OrderItemWithProduct[];
  payment?: {
    status: string;
    paidAt?: Date;
  };
  createdAt: Date;
}

export interface OrderItemWithProduct {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  productSnapshot: {
    name: string;
    image?: string;
  };
  vendor: {
    businessName: string;
  };
}

// Wallet types
export interface WalletSummary {
  pendingBalance: number;
  availableBalance: number;
  totalEarnings: number;
  totalWithdrawn: number;
}

// Dashboard stats types
export interface AdminDashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalVendors: number;
  totalCustomers: number;
  pendingPayouts: number;
  openDisputes: number;
  recentOrders: OrderWithDetails[];
}

export interface VendorDashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  walletBalance: WalletSummary;
  recentOrders: OrderWithDetails[];
}
