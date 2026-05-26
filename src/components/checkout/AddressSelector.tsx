/**
 * Address selector component for checkout
 */

"use client";

import { Address } from "@/types/address";
import { AddressCard } from "@/components/address/AddressCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddressSelectorProps {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (addressId: string) => void;
  onAddNew: () => void;
  onEdit?: (address: Address) => void;
  onDelete?: (addressId: string) => void;
}

export function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
  onEdit,
  onDelete,
}: AddressSelectorProps) {
  // Sort addresses: default first, then by creation date
  const sortedAddresses = [...addresses].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (addresses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-lg">
        <p className="text-muted-foreground mb-4">
          No addresses found. Add your first address to continue.
        </p>
        <Button onClick={onAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Address
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Address cards grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sortedAddresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            isSelected={selectedId === address.id}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
            showActions={true}
          />
        ))}
      </div>

      {/* Add new address button */}
      <Button
        variant="outline"
        onClick={onAddNew}
        className="w-full sm:w-auto"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add New Address
      </Button>
    </div>
  );
}
