"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { AdminProductListItem } from "@/types/product";

interface DisableProductDialogProps {
  product: AdminProductListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DisableProductDialog({
  product,
  open,
  onOpenChange,
  onSuccess,
}: DisableProductDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState(product.adminDisableReason || "");
  const { toast } = useToast();

  const isDisabling = !product.isDisabledByAdmin;

  const handleSubmit = async () => {
    // Validate reason if disabling
    if (isDisabling && reason.trim().length < 10) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Reason must be at least 10 characters",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/admin/products/${product.id}/disable`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isDisabledByAdmin: isDisabling,
            adminDisableReason: isDisabling ? reason.trim() : null,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to update product",
        });
        return;
      }

      toast({
        title: "Success",
        description: result.data.message,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isDisabling ? "Disable Product" : "Enable Product"}
          </DialogTitle>
          <DialogDescription>
            {isDisabling
              ? `Disabling "${product.name}" will hide it from the storefront and prevent the vendor from making changes.`
              : `Enabling "${product.name}" will allow it to be visible on the storefront again.`}
          </DialogDescription>
        </DialogHeader>

        {isDisabling && (
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Disabling *
            </Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for disabling this product..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/500 characters (minimum 10 required)
            </p>
          </div>
        )}

        {!isDisabling && product.adminDisableReason && (
          <div className="space-y-2">
            <Label>Previous Disable Reason:</Label>
            <div className="p-3 bg-muted rounded-lg text-sm">
              {product.adminDisableReason}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={isDisabling ? "destructive" : "default"}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDisabling ? "Disable Product" : "Enable Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
