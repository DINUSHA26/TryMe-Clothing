"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AdsSellerData {
  id: string;
  businessName: string | null;
  phone: string;
  primaryCategory: string;
  status: "PENDING" | "ACTIVE" | "INACTIVE";
  user: {
    email: string;
  };
}

interface EditAdsSellerDialogProps {
  seller: AdsSellerData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditAdsSellerDialog({
  seller,
  open,
  onOpenChange,
  onSuccess,
}: EditAdsSellerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [businessName, setBusinessName] = useState(seller.businessName || "");
  const [email, setEmail] = useState(seller.user.email || "");
  const [phone, setPhone] = useState(seller.phone || "");
  const [primaryCategory, setPrimaryCategory] = useState(seller.primaryCategory || "General");
  const [status, setStatus] = useState<"PENDING" | "ACTIVE" | "INACTIVE">(seller.status);

  useEffect(() => {
    setBusinessName(seller.businessName || "");
    setEmail(seller.user.email || "");
    setPhone(seller.phone || "");
    setPrimaryCategory(seller.primaryCategory || "General");
    setStatus(seller.status);
  }, [seller]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/ads-sellers/${seller.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName,
          email,
          phone,
          primaryCategory,
          status,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to update ads seller",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Ads Seller details updated successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating ads seller:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Ads Seller</DialogTitle>
          <DialogDescription>
            Update business profile and status for this ads seller
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business / Display Name</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. TechMart Suppliers"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Account Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="077XXXXXXX"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryCategory">Primary Category</Label>
            <Input
              id="primaryCategory"
              value={primaryCategory}
              onChange={(e) => setPrimaryCategory(e.target.value)}
              placeholder="e.g. Electronics, Vehicles, Mobiles"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Account Status</Label>
            <Select
              value={status}
              onValueChange={(val: "PENDING" | "ACTIVE" | "INACTIVE") => setStatus(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending Approval</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive / Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
