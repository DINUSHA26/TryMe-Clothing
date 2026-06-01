"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { AdsPlanEditor } from "@/components/admin/ads/AdsPlanEditor";
import { CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminAdsPlansPage() {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/ads-plans");
      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to fetch ads pricing plans",
        });
        return;
      }

      setPlans(result.data);
    } catch (error) {
      console.error("Error fetching ads plans:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-[#FF6600]" />
            <span>Ads Pricing Plans</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage pricing tiers, limit details, billing cycles, and feature configurations for classified ads.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchPlans}
          disabled={isLoading}
          className="rounded-xl flex items-center gap-2 border-gray-200 hover:bg-gray-50 bg-white"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </Button>
      </div>

      {/* Editor component */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6600] border-t-transparent" />
            <p className="text-sm">Loading ads plans...</p>
          </div>
        </div>
      ) : (
        <AdsPlanEditor plans={plans} onPlanUpdated={fetchPlans} />
      )}
    </div>
  );
}
