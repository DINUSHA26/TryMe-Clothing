/**
 * Address types for shipping address management
 */

/**
 * Client-side address representation
 */
export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Address snapshot for order (immutable)
 */
export interface AddressSnapshot {
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

/**
 * API response for address operations
 */
export interface AddressResponse {
  success: boolean;
  data?: {
    address: Address;
  };
  error?: string;
}

export interface AddressListResponse {
  success: boolean;
  data?: {
    addresses: Address[];
    defaultAddress?: Address | null;
  };
  error?: string;
}

/**
 * Sri Lankan provinces (for dropdown)
 */
export const SRI_LANKAN_PROVINCES = [
  "Western",
  "Central",
  "Southern",
  "Northern",
  "Eastern",
  "North Western",
  "North Central",
  "Uva",
  "Sabaragamuwa",
] as const;

export type SriLankanProvince = (typeof SRI_LANKAN_PROVINCES)[number];
