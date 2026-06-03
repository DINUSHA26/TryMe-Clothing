"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  Crown,
  Zap,
  Star,
  Sparkles,
  CreditCard,
  Upload,
  X,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Clock,
  BadgeCheck,
  Building2,
  FileImage,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface AdsPlan {
  id: string;
  name: string;
  type: "FREE" | "BASIC" | "PRO" | "PREMIUM";
  maxAds: number;
  price: string;
  billingCycle: "LIFETIME" | "MONTHLY" | "YEARLY";
  features: string[] | null;
  isActive: boolean;
}

interface ActiveSubscription {
  planId: string;
  status: string;
  expiresAt: string | null;
  adsUsed: number;
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */
const PLAN_ICONS: Record<string, React.ReactNode> = {
  FREE: <Zap className="h-5 w-5" />,
  BASIC: <Star className="h-5 w-5" />,
  PRO: <Sparkles className="h-5 w-5" />,
  PREMIUM: <Crown className="h-5 w-5" />,
};

const PLAN_COLORS: Record<string, { bg: string; border: string; badge: string; btn: string; icon: string }> = {
  FREE: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    badge: "bg-gray-100 text-gray-600",
    btn: "bg-gray-800 hover:bg-gray-900",
    icon: "text-gray-500",
  },
  BASIC: {
    bg: "bg-blue-50/40",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    btn: "bg-blue-600 hover:bg-blue-700",
    icon: "text-blue-500",
  },
  PRO: {
    bg: "bg-orange-50/40",
    border: "border-[#FF6600]/40",
    badge: "bg-[#FF6600]/10 text-[#FF6600]",
    btn: "bg-[#FF6600] hover:bg-[#e65c00]",
    icon: "text-[#FF6600]",
  },
  PREMIUM: {
    bg: "bg-purple-50/40",
    border: "border-purple-300",
    badge: "bg-purple-100 text-purple-700",
    btn: "bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900",
    icon: "text-purple-500",
  },
};

function formatPrice(price: string, cycle: string) {
  const n = parseFloat(price);
  if (n === 0) return "Free";
  return `Rs. ${n.toLocaleString("en-LK")}`;
}

function formatCycle(cycle: string) {
  if (cycle === "LIFETIME") return "One-time";
  if (cycle === "MONTHLY") return "/ month";
  if (cycle === "YEARLY") return "/ year";
  return "";
}

/* ── Payment Modal (PayHere + Bank Transfer) ─────────────────────────────────── */
function PaymentModal({
  plan,
  onClose,
  onSuccess,
}: {
  plan: AdsPlan;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  
  // Bank Transfer States
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // PayHere States
  const [payhereData, setPayhereData] = useState<{
    payhereUrl: string;
    paymentData: Record<string, string>;
  } | null>(null);
  const payhereFormRef = useRef<HTMLFormElement>(null);

  // Bank Transfer Handlers
  const handleFile = (file: File) => {
    const valid = ["image/jpeg", "image/png", "application/pdf"];
    if (!valid.includes(file.type)) {
      toast({ variant: "destructive", title: "Invalid file", description: "Only JPG, PNG, or PDF allowed." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Max file size is 5MB." });
      return;
    }
    setSlipFile(file);
    if (file.type !== "application/pdf") {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleBankSubmit = async () => {
    if (!slipFile) {
      toast({ variant: "destructive", title: "Missing slip", description: "Please upload your bank transfer slip." });
      return;
    }
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("planId", plan.id);
      fd.append("slip", slipFile);

      const res = await fetch("/api/ads/seller/payment/bank-transfer", {
        method: "POST",
        body: fd,
      });
      const result = await res.json();

      if (!result.success) {
        toast({ variant: "destructive", title: "Submission Failed", description: result.error });
        return;
      }

      toast({ title: "Slip Submitted!", description: "Admin will verify and activate your plan within 24 hours." });
      onSuccess();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // PayHere Handler
  const handlePayHereSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/ads/seller/payment/payhere/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId: plan.id }),
      });
      const result = await res.json();

      if (!result.success) {
        toast({ variant: "destructive", title: "Failed to initiate payment", description: result.error });
        setIsSubmitting(false);
        return;
      }

      setPayhereData({
        payhereUrl: result.data.payhereUrl,
        paymentData: result.data.paymentData,
      });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
      setIsSubmitting(false);
    }
  };

  // Submit PayHere form automatically once state is populated
  useEffect(() => {
    if (payhereData && payhereFormRef.current) {
      payhereFormRef.current.submit();
    }
  }, [payhereData]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors" disabled={isSubmitting}>
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Select Payment Method</h2>
              <p className="text-gray-300 text-sm">Upgrading to {plan.name}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="p-6">
          <Tabs defaultValue="online" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-1 rounded-2xl">
              <TabsTrigger value="online" disabled={isSubmitting} className="rounded-xl py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <CreditCard className="w-4 h-4 mr-2" />
                Online Payment
              </TabsTrigger>
              <TabsTrigger value="bank" disabled={isSubmitting} className="rounded-xl py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Building2 className="w-4 h-4 mr-2" />
                Bank Transfer
              </TabsTrigger>
            </TabsList>

            {/* Online Payment Content */}
            <TabsContent value="online" className="space-y-6 focus-visible:outline-none">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
                <CreditCard className="h-10 w-10 mx-auto text-[#FF6600] mb-4" />
                <h3 className="text-base font-bold text-gray-900 mb-1">Pay securely with PayHere</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-6">
                  You will be redirected to a secure payment page to complete your order using Visa, MasterCard, Frimi, etc.
                </p>
                
                <Button 
                  onClick={handlePayHereSubmit} 
                  disabled={isSubmitting} 
                  className="w-full bg-[#FF6600] hover:bg-[#e65c00] text-white rounded-xl font-bold py-2.5 shadow"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting...</>
                  ) : (
                    "Proceed to PayHere"
                  )}
                </Button>

                {/* Supported Badges */}
                <div className="flex items-center justify-center gap-4 pt-6 mt-6 border-t border-gray-150">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Supported by:</div>
                  <div className="flex gap-2 text-[10px] font-bold text-gray-500">
                    <span className="rounded border bg-white px-2 py-1">VISA</span>
                    <span className="rounded border bg-white px-2 py-1">MasterCard</span>
                    <span className="rounded border bg-white px-2 py-1">Frimi</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Bank Transfer Content */}
            <TabsContent value="bank" className="space-y-5 focus-visible:outline-none">
              {/* Bank Details */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-sm text-blue-900 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4" /> Bank Account Details
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ["Bank", "Commercial Bank of Ceylon"],
                    ["Account Name", "TryMe Marketplace (Pvt) Ltd"],
                    ["Account No.", "8001234567"],
                    ["Branch", "Colombo Main"],
                    ["Amount (LKR)", `Rs. ${parseFloat(plan.price).toLocaleString("en-LK")}`],
                  ].map(([label, value]) => (
                    <div key={label} className="col-span-1">
                      <span className="text-gray-400 font-medium text-xs block">{label}</span>
                      <span className="font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-blue-700 bg-blue-100 rounded-xl p-2.5 font-medium">
                  💡 Please include your registered email as the payment reference so we can identify your transfer.
                </p>
              </div>

              {/* Slip Upload */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <FileImage className="h-4 w-4 text-[#FF6600]" />
                  Upload Payment Slip *
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all
                    ${isDragging ? "border-[#FF6600] bg-orange-50/30" : slipFile ? "border-green-400 bg-green-50/20" : "border-gray-200 hover:border-orange-200 hover:bg-orange-50/10"}`}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                  {preview ? (
                    <div className="space-y-2">
                      <img src={preview} alt="Slip preview" className="max-h-40 mx-auto rounded-xl object-contain border border-gray-100" />
                      <p className="text-xs text-green-700 font-semibold">{slipFile?.name}</p>
                    </div>
                  ) : slipFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileImage className="h-10 w-10 text-green-500" />
                      <p className="text-sm font-semibold text-green-700">{slipFile.name}</p>
                      <p className="text-xs text-gray-400">PDF uploaded</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-gray-300" />
                      <p className="text-sm font-semibold text-gray-600">Drag & drop or click to upload</p>
                      <p className="text-xs text-gray-400">JPG, PNG, or PDF • Max 5MB</p>
                    </div>
                  )}
                </div>
                {slipFile && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSlipFile(null); setPreview(null); }}
                    className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                    disabled={isSubmitting}
                  >
                    <X className="h-3 w-3" /> Remove file
                  </button>
                )}
              </div>

              {/* Note */}
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  After submitting, your plan will be activated within 24 hours upon admin verification. You will receive a notification once approved.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl" disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  onClick={handleBankSubmit}
                  disabled={isSubmitting || !slipFile}
                  className="flex-1 bg-[#FF6600] hover:bg-[#e65c00] text-white rounded-xl font-bold shadow"
                >
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" /> Submit Slip</>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hidden form for PayHere redirect */}
      {payhereData && (
        <form
          ref={payhereFormRef}
          action={payhereData.payhereUrl}
          method="POST"
          style={{ display: "none" }}
        >
          {Object.entries(payhereData.paymentData).map(([key, value]) => (
            <input key={key} name={key} value={value} readOnly />
          ))}
        </form>
      )}
    </div>
  );
}

/* ── Success / Activation State Banner ───────────────────────────────────────── */
function PaymentSuccessBanner({
  planName,
  isOnline,
  onDismiss,
}: {
  planName: string;
  isOnline: boolean;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {isOnline ? (
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-white text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <BadgeCheck className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black">Payment Successful!</h2>
            <p className="text-white/90 mt-2 text-sm">Your {planName} plan is now active</p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-8 text-white text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black">Pending Approval</h2>
            <p className="text-white/90 mt-2 text-sm">Your {planName} plan payment is under review</p>
          </div>
        )}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {isOnline ? (
              [
                "Payment successfully verified via PayHere",
                "Your classified ad listing limit has been upgraded",
                "You can now start posting and promoting ads",
                "Receipt has been sent to your email",
              ].map((step) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{step}</span>
                </div>
              ))
            ) : (
              [
                "Bank slip uploaded and received by our team",
                "Admin will verify within 24 hours",
                "You'll be notified once your plan activates",
                "Your existing ads remain live while waiting",
              ].map((step) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-amber-600" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{step}</span>
                </div>
              ))
            )}
          </div>
          <Button
            onClick={onDismiss}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold mt-2"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
function AdsSellerPlansPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [plans, setPlans] = useState<AdsPlan[]>([]);
  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<AdsPlan | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPlanName, setSuccessPlanName] = useState("");
  const [successIsOnline, setSuccessIsOnline] = useState(false);

  // Fetch plans + current subscription
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [plansRes, subRes] = await Promise.all([
        fetch("/api/ads/public/plans"),
        fetch("/api/ads/seller/subscription"),
      ]);
      const plansData = await plansRes.json();
      const subData = await subRes.json();

      if (plansData.success) setPlans(plansData.data);
      if (subData.success) {
        // subData.data has planName, maxAds, adsUsed — we need planId for badge
        setActiveSub({
          planId: subData.data?.planId || "",
          status: subData.data?.status || "ACTIVE",
          expiresAt: subData.data?.expiresAt || null,
          adsUsed: subData.data?.adsUsed || 0,
        });
        if (subData.data?.planName) {
          setSuccessPlanName(subData.data.planName);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle URL redirect query parameters from PayHere checkout redirect
  useEffect(() => {
    const paymentParam = searchParams.get("payment");
    if (paymentParam === "success") {
      setSuccessIsOnline(true);
      setSuccessPlanName("Selected Plan");
      setShowSuccess(true);
      router.replace("/ads-seller/plans");
    } else if (paymentParam === "cancelled") {
      toast({
        variant: "destructive",
        title: "Payment Cancelled",
        description: "You cancelled the online payment process.",
      });
      router.replace("/ads-seller/plans");
    }
  }, [searchParams]);

  const handleSelectPlan = (plan: AdsPlan) => {
    const price = parseFloat(plan.price);
    if (price === 0) {
      toast({ title: "Free Plan", description: "You already have access to the free tier." });
      return;
    }
    setSelectedPlan(plan);
  };

  const handlePaymentSuccess = (planName: string) => {
    setSelectedPlan(null);
    setSuccessPlanName(planName);
    setSuccessIsOnline(false);
    setShowSuccess(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6600] border-t-transparent" />
          <p className="text-sm">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="rounded-xl text-gray-500">
              <Link href="/ads-seller">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Choose Your Plan</h1>
          <p className="text-gray-500 text-sm max-w-xl">
            Upgrade to post more listings and get priority visibility in the TryMe marketplace.
          </p>
        </div>

        {/* Plan Limit Alert Banner */}
        {reason === "limit" && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">You've reached your plan's listing limit!</p>
              <p className="text-xs text-red-600 mt-0.5">
                Upgrade to a higher plan to post more classified ads and continue selling on TryMe Marketplace.
              </p>
            </div>
          </div>
        )}

        {/* Current plan alert */}
        {activeSub && activeSub.planId && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
            <BadgeCheck className="h-5 w-5 text-green-600 shrink-0" />
            <p className="text-sm font-semibold text-green-800">
              You have an active subscription.
              {activeSub.expiresAt && (
                <span className="text-green-600 font-normal ml-1">
                  Expires {new Date(activeSub.expiresAt).toLocaleDateString("en-LK", { year: "numeric", month: "long", day: "numeric" })}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Plans Grid */}
        {plans.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No plans configured yet.</p>
            <p className="text-gray-400 text-sm mt-1">Please contact the administrator.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const colors = PLAN_COLORS[plan.type] || PLAN_COLORS.FREE;
              const isCurrentPlan = activeSub?.planId === plan.id;
              const isPro = plan.type === "PRO";
              const isPremium = plan.type === "PREMIUM";

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl border-2 overflow-hidden flex flex-col transition-shadow hover:shadow-lg
                    ${colors.bg} ${colors.border}
                    ${isPro ? "ring-2 ring-[#FF6600]/30 shadow-md" : ""}
                    ${isPremium ? "ring-2 ring-purple-300/50 shadow-md" : ""}`}
                >
                  {/* Popular / Best Value Badges */}
                  {isPro && (
                    <div className="absolute top-0 inset-x-0 flex justify-center">
                      <span className="bg-[#FF6600] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-b-xl shadow">
                        Most Popular
                      </span>
                    </div>
                  )}
                  {isPremium && (
                    <div className="absolute top-0 inset-x-0 flex justify-center">
                      <span className="bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-b-xl shadow">
                        Best Value
                      </span>
                    </div>
                  )}

                  <div className={`p-6 flex flex-col gap-4 flex-1 ${(isPro || isPremium) ? "pt-10" : ""}`}>
                    {/* Plan Icon + Name */}
                    <div className="flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors.badge}`}>
                        <span className={colors.icon}>{PLAN_ICONS[plan.type]}</span>
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900 text-base">{plan.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
                          {plan.type}
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="space-y-0.5">
                      <div className="flex items-end gap-1.5">
                        <span className="text-3xl font-black text-gray-900">{formatPrice(plan.price, plan.billingCycle)}</span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium">
                        {parseFloat(plan.price) === 0 ? "Forever free" : formatCycle(plan.billingCycle)}
                      </p>
                    </div>

                    {/* Ad slots */}
                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${colors.badge}`}>
                      <span className="text-xl font-black">{plan.maxAds}</span>
                      <span className="text-xs font-bold">Listing Slots Included</span>
                    </div>

                    {/* Feature list */}
                    <ul className="space-y-2 flex-1">
                      {(plan.features as string[] || [`Post up to ${plan.maxAds} ads`, "Classified listing", "Seller storefront"]).map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className={`h-4 w-4 mt-0.5 shrink-0 ${colors.icon}`} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div className="pt-2">
                      {isCurrentPlan ? (
                        <div className="w-full text-center py-2.5 px-4 rounded-xl bg-green-50 border border-green-200 text-green-700 font-bold text-sm flex items-center justify-center gap-1.5">
                          <BadgeCheck className="h-4 w-4" />
                          Current Plan
                        </div>
                      ) : parseFloat(plan.price) === 0 ? (
                        <div className="w-full text-center py-2.5 px-4 rounded-xl bg-gray-100 text-gray-500 font-semibold text-sm">
                          Free Tier
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSelectPlan(plan)}
                          className={`w-full py-2.5 px-4 rounded-xl text-white font-bold text-sm transition-all active:scale-95 shadow-sm ${colors.btn}`}
                        >
                          Upgrade Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Payment info section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#FF6600]" />
            How Payment Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Crown className="h-5 w-5 text-[#FF6600]" />,
                title: "1. Choose a Plan",
                desc: "Select the plan that fits your listing needs. Higher tiers unlock more slots and priority visibility.",
              },
              {
                icon: <CreditCard className="h-5 w-5 text-blue-500" />,
                title: "2. Secure Checkout",
                desc: "Pay instantly online via PayHere or submit a manual bank transfer slip.",
              },
              {
                icon: <BadgeCheck className="h-5 w-5 text-green-500" />,
                title: "3. Auto-Activation",
                desc: "Online payments activate instantly. Bank transfers are activated within 24 hours after admin approval.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onSuccess={() => {
            handlePaymentSuccess(selectedPlan.name);
          }}
        />
      )}

      {/* Success / Pending Banner */}
      {showSuccess && (
        <PaymentSuccessBanner
          planName={successPlanName}
          isOnline={successIsOnline}
          onDismiss={() => {
            setShowSuccess(false);
            router.push("/ads-seller");
          }}
        />
      )}
    </>
  );
}

export default function AdsSellerPlansPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6600] border-t-transparent" />
          <p className="text-sm">Loading pricing plans...</p>
        </div>
      </div>
    }>
      <AdsSellerPlansPageContent />
    </Suspense>
  );
}
