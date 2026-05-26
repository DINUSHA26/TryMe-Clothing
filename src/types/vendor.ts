import { Vendor, User, Wallet } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Vendor with relations
export type VendorWithUser = Vendor & {
  user: Pick<User, "id" | "email" | "isActive" | "firstName" | "lastName">;
  wallet?: Pick<Wallet, "id" | "pendingBalance" | "availableBalance" | "totalEarnings">;
};

// API Response types
export interface VendorListResponse {
  vendors: VendorWithUser[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface VendorDetailsResponse {
  vendor: VendorWithUser & {
    wallet: Wallet;
    _count: {
      products: number;
      orderItems: number;
    };
  };
}

// Form data types
export interface CreateVendorFormData {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress?: string;
  description?: string;
  commissionRate?: number; // Optional, defaults to 10
}

export interface UpdateVendorFormData {
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;
  description?: string;
  commissionRate?: number;
  isShopOpen?: boolean;
  shopClosedReason?: string;
}

// API Request types
export interface VendorListQuery {
  page?: number;
  pageSize?: number;
  search?: string; // Search by businessName, businessEmail
  isActive?: "true" | "false"; // Filter by user.isActive
  isShopOpen?: "true" | "false"; // Filter by vendor.isShopOpen
  status?: "PENDING" | "ACTIVE" | "INACTIVE";
  sortBy?: "createdAt" | "businessName" | "commissionRate";
  sortOrder?: "asc" | "desc";
}
