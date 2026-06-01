"use client";

import { useState } from "react";
import { Edit, Save, X, Check, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface AdsPlan {
  id: string;
  name: string;
  type: "FREE" | "BASIC" | "PRO" | "PREMIUM";
  maxAds: number;
  price: number;
  billingCycle: "LIFETIME" | "MONTHLY" | "YEARLY";
  isActive: boolean;
  features: string[] | any;
  createdAt: string;
}

interface AdsPlanEditorProps {
  plans: AdsPlan[];
  onPlanUpdated: () => void;
}

export function AdsPlanEditor({ plans, onPlanUpdated }: AdsPlanEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Temporary inline form states
  const [editPrice, setEditPrice] = useState<string>("");
  const [editMaxAds, setEditMaxAds] = useState<string>("");
  const [editIsActive, setEditIsActive] = useState<boolean>(true);

  const startEditing = (plan: AdsPlan) => {
    setEditingId(plan.id);
    setEditPrice(plan.price.toString());
    setEditMaxAds(plan.maxAds.toString());
    setEditIsActive(plan.isActive);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const savePlan = async (planId: string) => {
    // Validate inputs
    const priceVal = parseFloat(editPrice);
    const maxAdsVal = parseInt(editMaxAds);

    if (isNaN(priceVal) || priceVal < 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid positive price.",
      });
      return;
    }

    if (isNaN(maxAdsVal) || maxAdsVal < 1) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid positive number of ads.",
      });
      return;
    }

    setSavingId(planId);
    try {
      const response = await fetch(`/api/admin/ads-plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: priceVal,
          maxAds: maxAdsVal,
          isActive: editIsActive,
        }),
      });
      const result = await response.json();
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Save Failed",
          description: result.error || "Failed to update plan details",
        });
        return;
      }
      toast({
        title: "Success",
        description: "Plan updated successfully",
      });
      setEditingId(null);
      onPlanUpdated();
    } catch (error) {
      console.error("Error saving ads plan:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleStatus = async (plan: AdsPlan, checked: boolean) => {
    try {
      const response = await fetch(`/api/admin/ads-plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: checked,
        }),
      });
      const result = await response.json();
      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Status Update Failed",
          description: result.error || "Failed to update plan status",
        });
        return;
      }
      toast({
        title: "Success",
        description: `Plan "${plan.name}" is now ${checked ? "Active" : "Inactive"}`,
      });
      onPlanUpdated();
    } catch (error) {
      console.error("Error toggling plan status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    }
  };

  const formatLKR = (val: number) => {
    return `Rs. ${Number(val).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Max Ads Allowed</TableHead>
            <TableHead>Price (LKR)</TableHead>
            <TableHead>Billing Cycle</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => {
            const isEditing = editingId === plan.id;
            return (
              <TableRow key={plan.id} className={isEditing ? "bg-orange-50/20" : ""}>
                <TableCell className="font-semibold text-gray-900">{plan.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-gray-100 text-gray-800">
                    {plan.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editMaxAds}
                      onChange={(e) => setEditMaxAds(e.target.value)}
                      className="max-w-[120px] bg-white"
                      min={1}
                    />
                  ) : (
                    <span className="font-medium">{plan.maxAds}</span>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <div className="relative max-w-[150px]">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rs.</span>
                      <Input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="pl-8 bg-white"
                        min={0}
                        step={100}
                      />
                    </div>
                  ) : (
                    <span className="font-semibold text-[#FF6600]">{formatLKR(plan.price)}</span>
                  )}
                </TableCell>
                <TableCell className="text-sm font-medium text-gray-600">
                  {plan.billingCycle}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editIsActive}
                        onCheckedChange={setEditIsActive}
                        className="data-[state=checked]:bg-[#FF6600]"
                      />
                      <span className="text-xs">{editIsActive ? "Active" : "Inactive"}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={plan.isActive}
                        onCheckedChange={(checked) => handleToggleStatus(plan, checked)}
                        className="data-[state=checked]:bg-[#FF6600]"
                      />
                      <Badge variant={plan.isActive ? "default" : "secondary"} className="text-xs">
                        {plan.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {isEditing ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-[#FF6600] hover:bg-[#e65c00] text-white flex items-center gap-1.5"
                        onClick={() => savePlan(plan.id)}
                        disabled={savingId === plan.id}
                      >
                        {savingId === plan.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                        <span>Save</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEditing}>
                        <X className="h-3 w-3" />
                        <span>Cancel</span>
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(plan)}
                      className="text-gray-600 hover:text-black"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      <span>Edit Row</span>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
