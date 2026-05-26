"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  requestPayoutSchema,
  RequestPayoutInput,
  SRI_LANKAN_BANKS,
} from "@/lib/validations/wallet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils/formatters";
import { AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PayoutRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  hasPendingPayout: boolean;
  onSuccess: () => void;
}

export function PayoutRequestForm({
  open,
  onOpenChange,
  availableBalance,
  hasPendingPayout,
  onSuccess,
}: PayoutRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<RequestPayoutInput>({
    resolver: zodResolver(requestPayoutSchema),
    defaultValues: {
      amount: 0,
      bankName: undefined,
      accountNumber: "",
      accountHolder: "",
      branchCode: "",
      notes: "",
    },
  });

  const onSubmit = async (data: RequestPayoutInput) => {
    if (hasPendingPayout) {
      toast({
        title: "Cannot Request Payout",
        description: "You already have a pending payout request",
        variant: "destructive",
      });
      return;
    }

    if (data.amount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `Available balance is only ${formatCurrency(
          availableBalance
        )}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/vendor/wallet/payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to request payout");
      }

      toast({
        title: "Payout Requested",
        description: `Your payout request for ${formatCurrency(
          data.amount
        )} has been submitted successfully`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error requesting payout:", error);
      toast({
        title: "Request Failed",
        description: error.message || "Failed to request payout",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
          <DialogDescription>
            Withdraw funds from your available balance to your bank account.
          </DialogDescription>
        </DialogHeader>

        {hasPendingPayout && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You already have a pending payout request. Please wait for it to
              be processed or cancel it before requesting a new payout.
            </AlertDescription>
          </Alert>
        )}

        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-900 mb-4">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
            Available Balance
          </p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
            {formatCurrency(availableBalance)}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
            Minimum payout: Rs. 1,000
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Amount <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount (min Rs. 1,000)"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      disabled={isSubmitting || hasPendingPayout}
                      min={1000}
                      max={availableBalance}
                      step={0.01}
                    />
                  </FormControl>
                  <FormDescription>
                    Amount must be between Rs. 1,000 and{" "}
                    {formatCurrency(availableBalance)}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bank Name */}
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Bank Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting || hasPendingPayout}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your bank" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SRI_LANKAN_BANKS.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Account Number */}
            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Account Number <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter account number (8-20 digits)"
                      {...field}
                      disabled={isSubmitting || hasPendingPayout}
                    />
                  </FormControl>
                  <FormDescription>
                    Account number must be 8-20 digits
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Account Holder */}
            <FormField
              control={form.control}
              name="accountHolder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Account Holder Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter account holder name"
                      {...field}
                      disabled={isSubmitting || hasPendingPayout}
                    />
                  </FormControl>
                  <FormDescription>
                    Full name as shown on bank account
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Branch Code (Optional) */}
            <FormField
              control={form.control}
              name="branchCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch Code (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter 3-digit branch code"
                      {...field}
                      value={field.value || ""}
                      disabled={isSubmitting || hasPendingPayout}
                      maxLength={3}
                    />
                  </FormControl>
                  <FormDescription>
                    3-digit branch code (if applicable)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes (Optional) */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes for this payout request"
                      {...field}
                      value={field.value || ""}
                      disabled={isSubmitting || hasPendingPayout}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum 500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || hasPendingPayout}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Payout Request"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
