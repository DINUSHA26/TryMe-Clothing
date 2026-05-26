/**
 * Coupon form component for creating and editing coupons
 */

"use client";

import { useState, useEffect } from "react";
import { Coupon, CouponType } from "@prisma/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { createCouponSchema } from "@/lib/validations/coupon";

type CouponFormData = z.infer<typeof createCouponSchema>;

interface CouponFormProps {
  coupon?: Coupon;
  onSubmit: (data: CouponFormData) => Promise<void>;
  onCancel: () => void;
  showVendorSelect?: boolean;
  vendors?: { id: string; businessName: string }[];
}

export function CouponForm({
  coupon,
  onSubmit,
  onCancel,
  showVendorSelect = false,
  vendors = [],
}: CouponFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<any>({
    resolver: zodResolver(createCouponSchema),
    defaultValues: {
      code: coupon?.code || "",
      type: coupon?.type || CouponType.PERCENTAGE,
      value: coupon?.value ? Number(coupon.value) : 0,
      minOrderAmount: coupon?.minOrderAmount ? Number(coupon.minOrderAmount) : undefined,
      maxDiscount: coupon?.maxDiscount ? Number(coupon.maxDiscount) : undefined,
      usageLimit: coupon?.usageLimit || undefined,
      perUserLimit: coupon?.perUserLimit || 1,
      vendorId: coupon?.vendorId || null,
      isActive: coupon?.isActive ?? true,
      isFeatured: (coupon as any)?.isFeatured ?? false,
      validFrom: coupon?.validFrom
        ? new Date(coupon.validFrom).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      validUntil: coupon?.validUntil
        ? new Date(coupon.validUntil).toISOString().slice(0, 16)
        : undefined,
    },
  });

  const couponType = form.watch("type");

  const handleSubmit = async (data: CouponFormData) => {
    try {
      setLoading(true);
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control as any}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coupon Code</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="SUMMER2024"
                    className="uppercase"
                  />
                </FormControl>
                <FormDescription>
                  Uppercase letters, numbers, hyphens, and underscores only
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={CouponType.PERCENTAGE}>
                      Percentage
                    </SelectItem>
                    <SelectItem value={CouponType.FLAT}>
                      Flat Amount (Rs.)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {couponType === CouponType.PERCENTAGE
                    ? "Percentage (%)"
                    : "Amount (Rs.)"}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step={couponType === CouponType.PERCENTAGE ? "1" : "0.01"}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  {couponType === CouponType.PERCENTAGE
                    ? "Enter percentage (1-100)"
                    : "Enter flat discount amount"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="minOrderAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Order Amount (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                  />
                </FormControl>
                <FormDescription>
                  Minimum cart value to use this coupon
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {couponType === CouponType.PERCENTAGE && (
            <FormField
              control={form.control as any}
              name="maxDiscount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Discount (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Cap the maximum discount for percentage coupons
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control as any}
            name="usageLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Usage Limit (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                  />
                </FormControl>
                <FormDescription>
                  Maximum number of times this coupon can be used
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="perUserLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Per User Limit</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Maximum uses per customer (default: 1)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="validFrom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valid From</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="validUntil"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valid Until (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>Leave empty for no expiry</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {showVendorSelect && vendors.length > 0 && (
            <FormField
              control={form.control as any}
              name="vendorId"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Vendor (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Platform-wide (all vendors)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">
                        Platform-wide (all vendors)
                      </SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.businessName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Leave as platform-wide or select a specific vendor
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control as any}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active</FormLabel>
                  <FormDescription>
                    Enable or disable this coupon for customers
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="isFeatured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Featured on Deals Page</FormLabel>
                  <FormDescription>
                    Show this coupon publicly on the Deals page for all customers to discover
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {coupon ? "Update" : "Create"} Coupon
          </Button>
        </div>
      </form>
    </Form>
  );
}
