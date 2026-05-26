/**
 * Address card component for displaying shipping addresses
 */

"use client";

import { Address } from "@/types/address";
import { formatAddressMultiLine } from "@/lib/utils/address";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Edit, Trash2, Check } from "lucide-react";

interface AddressCardProps {
  address: Address;
  isSelected?: boolean;
  onSelect?: (addressId: string) => void;
  onEdit?: (address: Address) => void;
  onDelete?: (addressId: string) => void;
  showActions?: boolean;
}

export function AddressCard({
  address,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  showActions = true,
}: AddressCardProps) {
  const addressLines = formatAddressMultiLine(address);

  return (
    <Card
      className={`p-4 cursor-pointer transition-all ${
        isSelected
          ? "border-primary border-2 bg-primary/5"
          : "border-border hover:border-primary/50"
      }`}
      onClick={() => onSelect?.(address.id)}
    >
      <div className="space-y-3">
        {/* Header with label and default badge */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{address.label}</h3>
            {address.isDefault && (
              <Badge variant="default" className="text-xs">
                Default
              </Badge>
            )}
            {isSelected && (
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground">
                <Check className="w-3 h-3" />
              </div>
            )}
          </div>

          {/* Action buttons */}
          {showActions && (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(address)}
                  className="h-8 w-8"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && !address.isDefault && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(address.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Address lines */}
        <div className="text-sm text-muted-foreground space-y-1">
          {addressLines.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      </div>
    </Card>
  );
}
