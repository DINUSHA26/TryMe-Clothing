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
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700 h-8"
        onClick={() => handleUpdateStatus("ACTIVE")}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-red-600 hover:text-red-700 h-8"
        onClick={() => handleUpdateStatus("INACTIVE")}
        disabled={isLoading}
      >
        <XCircle className="h-3 w-3 mr-1" />
        Reject
      </Button>
    </div>
  );
}
