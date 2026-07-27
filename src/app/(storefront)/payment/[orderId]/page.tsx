"use client";

import { useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, AlertCircle, Building, Upload, Copy, CheckCircle2, ShieldCheck, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PaymentPageProps {
  params: Promise<{ orderId: string }>;
}

export default function PaymentPage({ params }: PaymentPageProps) {
  const { orderId } = use(params);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<{
    payhereUrl: string;
    paymentData: Record<string, string>;
  } | null>(null);
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [triedToSubmit, setTriedToSubmit] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [bankInfo, setBankInfo] = useState({
    bankName: "Seylan Bank",
    accountName: "Fashion Dora",
    accountNumber: "1230-13526365-001",
    branch: "Main Branch",
  });

  // Fetch official bank details
  useEffect(() => {
    async function fetchBankDetails() {
      try {
        const res = await fetch("/api/bank-details");
        const json = await res.json();
        if (json.success && json.data) {
          setBankInfo({
            bankName: json.data.bankName || "Seylan Bank",
            accountName: json.data.accountName || "Fashion Dora",
            accountNumber: json.data.accountNumber || "1230-13526365-001",
            branch: json.data.branch || "Main Branch",
          });
        }
      } catch (err) {
        console.error("Failed to load bank details:", err);
      }
    }
    fetchBankDetails();
  }, []);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Fetch order details
  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error || "Failed to fetch order");
          setLoading(false);
          return;
        }

        const order = result.data.order;

        // Check if order already paid or pending verification
        if (order.status !== "PENDING_PAYMENT") {
          router.push(`/orders/${orderId}`);
          return;
        }

        setOrderDetails(order);
        setLoading(false);
      } catch (err) {
        setError("Failed to load order details");
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId, router]);

  const initiatePayHere = async () => {
    setProcessing(true);
    try {
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Failed to initiate payment");
        setProcessing(false);
        return;
      }

      setPaymentData({
        payhereUrl: result.data.payhereUrl,
        paymentData: result.data.paymentData,
      });
      
    } catch (err) {
      setError("Failed to initiate payment. Please try again.");
      setProcessing(false);
    }
  };

  // Auto-submit form once payment data is ready
  useEffect(() => {
    if (paymentData && formRef.current) {
      formRef.current.submit();
    }
  }, [paymentData]);

  const handleBankTransfer = async () => {
    if (!slipFile) {
      setTriedToSubmit(true);
      toast.error("Please upload your bank transfer slip to proceed.");
      return;
    }

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("slip", slipFile);

      const response = await fetch("/api/payments/bank-transfer", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || "Failed to submit bank transfer.");
        setProcessing(false);
        return;
      }

      toast.success("Bank transfer slip submitted successfully! Awaiting verification.");
      router.push(`/orders/${orderId}`);
    } catch (error) {
      toast.error("An error occurred while submitting the slip.");
      setProcessing(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="container mx-auto flex max-w-3xl justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Payment Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-3">
              <Button onClick={handleRetry} className="flex-1">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/cart")}
                className="flex-1"
              >
                Return to Cart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Order Summary */}
      {orderDetails && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order Number:</span>
              <span className="font-medium">{orderDetails.orderNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items:</span>
              <span className="font-medium">{orderDetails.items.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">
                Rs. {orderDetails.subtotal.toLocaleString()}
              </span>
            </div>
            {orderDetails.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount:</span>
                <span>-Rs. {orderDetails.discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping:</span>
              <span className="font-medium">
                Rs. {orderDetails.shippingAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-t pt-3 text-lg font-bold">
              <span>Total:</span>
              <span>Rs. {orderDetails.totalAmount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Payment Method</CardTitle>
          <CardDescription>Choose how you would like to pay for your order</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bank_transfer" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="bank_transfer" disabled={processing}>
                <Building className="w-4 h-4 mr-2" />
                Bank Transfer
              </TabsTrigger>
              <TabsTrigger value="payhere" disabled={processing}>
                <CreditCard className="w-4 h-4 mr-2" />
                Online Payment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bank_transfer" className="space-y-6">
              <div className="rounded-lg border bg-slate-50 p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    Bank Account Details
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Verified Official Account
                  </span>
                </div>

                <div className="space-y-3 mb-4 bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex justify-between items-center border-b pb-2 text-sm">
                    <span className="text-muted-foreground font-medium">Bank Name:</span>
                    <span className="font-semibold text-slate-800">{bankInfo.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2 text-sm">
                    <span className="text-muted-foreground font-medium">Account Name:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{bankInfo.accountName}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(bankInfo.accountName, "Account Name")}
                        className="text-slate-400 hover:text-primary transition-colors p-1"
                        title="Copy Account Name"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2 text-sm">
                    <span className="text-muted-foreground font-medium">Account Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono text-base tracking-wide">{bankInfo.accountNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(bankInfo.accountNumber, "Account Number")}
                        className="text-slate-400 hover:text-primary transition-colors p-1"
                        title="Copy Account Number"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Branch:</span>
                    <span className="font-semibold text-slate-800">{bankInfo.branch}</span>
                  </div>
                </div>

                {/* Reference Note */}
                <div className="bg-amber-50/90 border border-amber-200/90 rounded-lg p-3 mb-6 text-xs text-amber-900 flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Transfer Remark / Reference:</strong> Please include your Order Number{" "}
                    <strong className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-950">{orderDetails?.orderNumber}</strong>{" "}
                    in your bank transfer remark so we can verify your payment instantly.
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="slip-upload" className="block mb-2 font-medium">
                      Upload Bank Slip <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Please transfer the exact amount (Rs. {orderDetails?.totalAmount.toLocaleString()}) and upload a photo or PDF of your deposit slip.
                    </p>
                    <div className="flex flex-col gap-2">
                      <Input
                        id="slip-upload"
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => {
                          setSlipFile(e.target.files?.[0] || null);
                          if (e.target.files?.[0]) setTriedToSubmit(false);
                        }}
                        disabled={processing}
                        className={cn(
                          "cursor-pointer",
                          triedToSubmit && !slipFile && "border-red-500 bg-red-50"
                        )}
                      />
                      {triedToSubmit && !slipFile && (
                        <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          A bank slip is required to verify your payment.
                        </p>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={handleBankTransfer} 
                    disabled={processing} 
                    className="w-full bg-[#FF6600] hover:bg-[#e65c00]"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Submit Bank Slip
                      </>
                    )}
                  </Button>

                  <div className="text-[11px] text-slate-500 bg-slate-100 p-2.5 rounded border text-center flex items-center justify-center gap-1.5 mt-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Notice: TryMe.lk is an official brand operated by Fashion Dora. Please transfer ONLY to the official Fashion Dora bank account shown above.</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payhere" className="space-y-6">
              <div className="rounded-lg border bg-slate-50 p-8 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600 mb-1">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800 bg-amber-100 rounded-full mb-2">
                    Under Development
                  </span>
                  <h3 className="text-xl font-bold text-slate-800">Online Payment (Coming Soon)</h3>
                </div>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Online Card and Gateway payments (VISA, MasterCard, Frimi, KOKO) are currently under development. Please use <strong>Bank Transfer</strong> to complete your order today.
                </p>

                {/* Supported Logos */}
                <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-200 mt-6">
                  <div className="text-xs text-slate-400">Will support:</div>
                  <div className="flex gap-2 text-xs font-medium text-slate-500">
                    <span className="rounded border bg-white px-2.5 py-1 shadow-sm">VISA</span>
                    <span className="rounded border bg-white px-2.5 py-1 shadow-sm">MasterCard</span>
                    <span className="rounded border bg-white px-2.5 py-1 shadow-sm">Frimi</span>
                    <span className="rounded border bg-white px-2.5 py-1 shadow-sm">KOKO</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Hidden form for PayHere redirect */}
      {paymentData && (
        <form
          ref={formRef}
          action={paymentData.payhereUrl}
          method="POST"
          style={{ display: "none" }}
        >
          {Object.entries(paymentData.paymentData).map(([key, value]) => (
            <input key={key} name={key} value={value} readOnly />
          ))}
        </form>
      )}
    </div>
  );
}
