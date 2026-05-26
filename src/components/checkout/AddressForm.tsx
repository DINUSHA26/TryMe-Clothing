/**
 * Address form dialog for creating/editing shipping addresses
 */

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Address, SRI_LANKAN_PROVINCES } from "@/types/address";
import {
  createAddressSchema,
  CreateAddressInput,
} from "@/lib/validations/address";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AddressFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (address: Address) => void;
  initialData?: Address | null;
  mode?: "create" | "edit";
}

export function AddressForm({
  open,
  onOpenChange,
  onSuccess,
  initialData = null,
  mode = "create",
}: AddressFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<any>({
    resolver: zodResolver(createAddressSchema),
    defaultValues: initialData
      ? {
        ...initialData,
        firstName: initialData.fullName.split(" ")[0] || "",
        lastName: initialData.fullName.split(" ").slice(1).join(" ") || "",
      }
      : {
        label: "Home",
        firstName: "",
        lastName: "",
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        province: "Western",
        postalCode: "",
        isDefault: true,
      },
  });

  const firstName = form.watch("firstName");
  const lastName = form.watch("lastName");

  useEffect(() => {
    form.setValue("fullName", `${firstName || ""} ${lastName || ""}`.trim());
  }, [firstName, lastName, form]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    const { firstName: _f, lastName: _l, ...apiData } = data;

    try {
      const url =
        mode === "edit" && initialData
          ? `/api/addresses/${initialData.id}`
          : "/api/addresses";
      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to save address",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Address ${mode === "edit" ? "updated" : "created"} successfully`,
      });

      onSuccess(result.data.address);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving address:", error);
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
      <DialogContent className="sm:max-w-[600px] max-h-[95vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold">Delivery</DialogTitle>
          <DialogDescription>
            Enter your shipping details below
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 pt-2">
          <div className="grid grid-cols-2 gap-0 mb-6 bg-gray-100 p-1 rounded-xl">
            <Button
              variant="ghost"
              className="bg-white shadow-sm rounded-lg py-6 flex items-center justify-center gap-2 font-semibold"
            >
              <div className="w-5 h-5 flex items-center justify-center border-2 border-primary rounded-full p-0.5">
                <div className="w-full h-full bg-primary rounded-full" />
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-package"
              >
                <path d="m7.5 4.27 9 5.15" />
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.27 6.96 8.73 5.05 8.73-5.05" />
                <path d="M12 22.08V12" />
              </svg>
              Ship
            </Button>
            <Button
              variant="ghost"
              disabled
              className="py-6 flex items-center justify-center gap-2 text-muted-foreground opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-map-pin"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Pickup
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider leading-none">Country/Region</Label>
                <Select disabled defaultValue="Sri Lanka">
                  <SelectTrigger className="h-12 bg-white text-base">
                    <SelectValue placeholder="Sri Lanka" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="First name"
                          className="h-12 text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Last name"
                          className="h-12 text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="addressLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Address"
                        className="h-12 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="addressLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Apartment, suite, etc. (optional)"
                        className="h-12 text-base"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="City" className="h-12 text-base" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 bg-white text-base">
                            <SelectValue placeholder="Province" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SRI_LANKAN_PROVINCES.map((province) => (
                            <SelectItem key={province} value={province}>
                              {province}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Postal code (optional)"
                          className="h-12 text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Phone"
                            className="h-12 pr-10 text-base"
                            {...field}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-help">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-help-circle"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="leading-none">
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        Save this information for next time
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 h-12 text-lg font-semibold"
                >
                  {isSubmitting
                    ? "Saving..."
                    : mode === "edit"
                      ? "Update Address"
                      : "Add Address"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto h-12 px-8"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
