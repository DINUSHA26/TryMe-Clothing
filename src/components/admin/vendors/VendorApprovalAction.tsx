"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VendorApprovalActionProps {
  vendorId: string;
  status: string;
  businessName: string;
  onActionComplete: () => void;
}

export function VendorApprovalAction({
  vendorId,
  status,
  businessName,
  onActionComplete,
}: VendorApprovalActionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdateStatus = async (newStatus: "ACTIVE" | "INACTIVE") => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || `Failed to ${newStatus === 'ACTIVE' ? 'approve' : 'reject'} vendor`,
        });
        return;
      }

      toast({
        title: "Success",
        description: `Vendor ${businessName} has been ${newStatus === 'ACTIVE' ? 'approved' : 'rejected'}.`,
      });
      onActionComplete();
    } catch (error) {
      console.error("Error updating vendor status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (status !== "PENDING") return null;

  return (
    <div className="flex items-center gap-1.5 pt-1">
      <Button
        size="sm"
        className="bg-emerald-600 hover:bg-emerald-700 h-7 px-2.5 text-xs shadow-none"
        onClick={() => handleUpdateStatus("ACTIVE")}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-7 px-2.5 text-xs"
        onClick={() => handleUpdateStatus("INACTIVE")}
        disabled={isLoading}
      >
        <XCircle className="h-3 w-3 mr-1" />
        Reject
      </Button>
    </div>
  );
}
