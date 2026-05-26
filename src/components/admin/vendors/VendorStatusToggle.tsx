"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface VendorStatusToggleProps {
  vendorId: string;
  isActive: boolean;
  businessName: string;
  onStatusChanged: () => void;
}

export function VendorStatusToggle({
  vendorId,
  isActive,
  businessName,
  onStatusChanged,
}: VendorStatusToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
  const { toast } = useToast();

  const handleToggle = (checked: boolean) => {
    setPendingStatus(checked);
    setShowConfirmDialog(true);
  };

  const confirmStatusChange = async () => {
    if (pendingStatus === null) return;

    setIsLoading(true);
    setShowConfirmDialog(false);

    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: pendingStatus }),
      });

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to update vendor status",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Vendor ${pendingStatus ? "enabled" : "disabled"} successfully`,
      });

      onStatusChanged();
    } catch (error) {
      console.error("Error updating vendor status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
      setPendingStatus(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Switch checked={isActive} onCheckedChange={handleToggle} />
        )}
        <span className={isActive ? "text-green-600" : "text-muted-foreground"}>
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus ? "Enable" : "Disable"} Vendor?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus
                ? `Are you sure you want to enable ${businessName}? They will be able to log in and manage their products.`
                : `Are you sure you want to disable ${businessName}? They will not be able to log in or sell products.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatus(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
