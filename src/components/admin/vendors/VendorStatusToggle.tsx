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
        description: `Vendor login access has been ${pendingStatus ? "enabled (allowed)" : "disabled (blocked)"} successfully`,
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
      <div className="flex items-center gap-2.5">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Switch
            checked={isActive}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-emerald-600"
          />
        )}
        <div className="flex flex-col">
          <span
            className={`text-xs font-semibold leading-tight ${
              isActive ? "text-emerald-700" : "text-rose-600"
            }`}
          >
            {isActive ? "Allowed" : "Blocked"}
          </span>
          <span className="text-[10px] text-muted-foreground leading-tight">
            {isActive ? "Can log in" : "Login blocked"}
          </span>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus ? "Allow Login Access?" : "Block Login Access?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus
                ? `Are you sure you want to allow login access for ${businessName}? They will be able to log in to their account.`
                : `Are you sure you want to block login access for ${businessName}? They will immediately be prevented from logging into the platform.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatus(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              className={pendingStatus ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"}
            >
              {pendingStatus ? "Confirm Allow" : "Confirm Block"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
