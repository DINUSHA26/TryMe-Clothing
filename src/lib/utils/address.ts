/**
 * Address utility functions
 */

import { Address, AddressSnapshot } from "@/types/address";

/**
 * Convert database address to client format
 */
export function formatAddress(address: any): Address {
  return {
    id: address.id,
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: address.isDefault,
    createdAt: new Date(address.createdAt),
    updatedAt: new Date(address.updatedAt),
  };
}

/**
 * Create address snapshot for order (removes ID and timestamps)
 */
export function createAddressSnapshot(address: Address): AddressSnapshot {
  return {
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    country: address.country,
  };
}

/**
 * Format address for display (single line)
 */
export function formatAddressOneLine(
  address: Address | AddressSnapshot
): string {
  const line2 = address.addressLine2 ? `, ${address.addressLine2}` : "";
  return `${address.addressLine1}${line2}, ${address.city}, ${address.province} ${address.postalCode}`;
}

/**
 * Format address for display (multi-line)
 */
export function formatAddressMultiLine(
  address: Address | AddressSnapshot
): string[] {
  const lines = [address.fullName, address.addressLine1];

  if (address.addressLine2) {
    lines.push(address.addressLine2);
  }

  lines.push(`${address.city}, ${address.province} ${address.postalCode}`);
  lines.push(address.country);
  lines.push(address.phone);

  return lines;
}

/**
 * Validate if address is complete for checkout
 */
export function isAddressComplete(address: Partial<Address>): boolean {
  return !!(
    address.fullName &&
    address.phone &&
    address.addressLine1 &&
    address.city &&
    address.province &&
    address.postalCode
  );
}
