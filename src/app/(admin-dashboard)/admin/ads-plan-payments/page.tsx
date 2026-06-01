"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Building2,
  FileImage,
  X,
  User,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistance } from "date-fns";

/* ── Types ───────────────────────────────────────────────────────────────────── */
interface PaymentRecord {
  id: string;
  amount: string;
  currency: string;
  status: string;
  paymentMethod: string;
  bankSlipUrl: string | null;
  paidAt: string | null;
  createdAt: string;
  subscription: {
    id: string;
    adsUsed: number;
    plan: {
      name: string;
      price: string;
      billingCycle: string;
    };
    seller: {
      businessName: string | null;
      user: {
        email: string;
        firstName: string | null;
        lastName: string | null;
      };
    };
  };
}

/* ── Slip Preview Modal ───────────────────────────────────────────────────────── */
function SlipPreviewModal({ url, onClose }: { url: string; onClose: () => void }) {
  const isPdf = url.toLowerCase().includes(".pdf");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <FileImage className="h-4 w-4 text-[#FF6600]" />
            Bank Transfer Slip
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">
          {isPdf ? (
            <div className="text-center py-8">
              <FileImage className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-3">PDF file — click below to open</p>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#FF6600] text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-[#e65c00]"
              >
                <Eye className="h-4 w-4" />
                Open PDF
              </a>
            </div>
          ) : (
            <img
              src={url}
              alt="Payment slip"
              className="max-h-[60vh] w-full object-contain rounded-xl border border-gray-100"
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Reject Reason Dialog ───────────────────────────────────────────────────── */
function RejectDialog({
  paymentId,
  onClose,
  onDone,
}: {
  paymentId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/ads-plan-payments/${paymentId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "Payment not verified." }),
      });
      const result = await res.json();
      if (!result.success) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: "Payment Rejected", description: "Subscription has been cancelled." });
      onDone();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          Reject Payment
        </h3>
        <p className="text-sm text-gray-500">
          Optionally provide a reason for rejection. The subscription will be cancelled.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Rejection reason (optional)..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-red-200"
        />
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            disabled={isSubmitting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
          >
            {isSubmitting ? "Rejecting..." : "Confirm Reject"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Status Badge ────────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING_APPROVAL: { label: "Pending Approval", className: "bg-amber-50 text-amber-700 border-amber-200" },
    COMPLETED: { label: "Approved", className: "bg-green-50 text-green-700 border-green-200" },
    REJECTED: { label: "Rejected", className: "bg-red-50 text-red-700 border-red-200" },
    PENDING: { label: "Pending", className: "bg-gray-50 text-gray-600 border-gray-200" },
    FAILED: { label: "Failed", className: "bg-red-50 text-red-700 border-red-200" },
  };
  const cfg = map[status] || { label: status, className: "bg-gray-50 text-gray-600 border-gray-200" };
  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────────── */
export default function AdminAdsPlanPaymentsPage() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING_APPROVAL");
  const [slipPreviewUrl, setSlipPreviewUrl] = useState<string | null>(null);
  const [rejectPaymentId, setRejectPaymentId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: pagination.page.toString(),
        pageSize: "15",
      });
      const res = await fetch(`/api/admin/ads-plan-payments?${params}`);
      const result = await res.json();
      if (!result.success) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      setPayments(result.data.payments);
      setPagination((p) => ({ ...p, ...result.data.pagination }));
      if (result.data.counts) {
        setCounts(result.data.counts);
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load payments" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, pagination.page]);

  const handleApprove = async (paymentId: string) => {
    setApprovingId(paymentId);
    try {
      const res = await fetch(`/api/admin/ads-plan-payments/${paymentId}/approve`, { method: "POST" });
      const result = await res.json();
      if (!result.success) {
        toast({ variant: "destructive", title: "Error", description: result.error });
        return;
      }
      toast({ title: "✅ Approved!", description: result.message });
      fetchPayments();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to approve payment" });
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-[#FF6600]" />
            Plan Payment Approvals
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Review bank transfer slips and activate seller subscriptions upon verification.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPagination((p) => ({ ...p, page: 1 })); }}>
            <SelectTrigger className="w-[180px] bg-white rounded-xl border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
              <SelectItem value="COMPLETED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="all">All Payments</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={fetchPayments}
            disabled={isLoading}
            className="rounded-xl border-gray-200 hover:bg-gray-50 bg-white"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending Review", value: counts.pending, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Approved", value: counts.approved, color: "text-green-600", bg: "bg-green-50" },
          { label: "Rejected", value: counts.rejected, color: "text-red-600", bg: "bg-red-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 border border-gray-100`}>
            <p className="text-xs font-semibold text-gray-500">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF6600] border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading payments...</p>
          </div>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Clock className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">No {statusFilter === "PENDING_APPROVAL" ? "pending" : ""} payments found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => {
            const sellerName = [payment.subscription.seller.user.firstName, payment.subscription.seller.user.lastName]
              .filter(Boolean).join(" ") || payment.subscription.seller.user.email;
            const businessName = payment.subscription.seller.businessName;

            return (
              <div
                key={payment.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Left: Seller + Plan info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#FF6600]/10 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-[#FF6600]" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{sellerName}</p>
                          {businessName && <p className="text-xs text-gray-400">{businessName}</p>}
                        </div>
                      </div>
                      <StatusBadge status={payment.status} />
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-gray-400 text-xs font-medium block">Plan</span>
                        <span className="font-bold text-gray-900">{payment.subscription.plan.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs font-medium block">Amount</span>
                        <span className="font-bold text-gray-900">
                          Rs. {parseFloat(payment.amount).toLocaleString("en-LK")}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs font-medium block">Billing</span>
                        <span className="font-semibold text-gray-700 capitalize">
                          {payment.subscription.plan.billingCycle.toLowerCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs font-medium block">Method</span>
                        <span className="font-semibold text-gray-700 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {payment.paymentMethod?.replace("_", " ") || "Bank Transfer"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs font-medium block">Submitted</span>
                        <span className="font-semibold text-gray-700 flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDistance(new Date(payment.createdAt), new Date(), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* View slip */}
                    {payment.bankSlipUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSlipPreviewUrl(payment.bankSlipUrl!)}
                        className="rounded-xl border-gray-200 text-xs font-semibold"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View Slip
                      </Button>
                    )}

                    {payment.status === "PENDING_APPROVAL" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(payment.id)}
                          disabled={approvingId === payment.id}
                          className="bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold"
                        >
                          {approvingId === payment.id ? (
                            <><div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" /> Approving...</>
                          ) : (
                            <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRejectPaymentId(payment.id)}
                          className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {payment.status === "COMPLETED" && (
                      <span className="flex items-center gap-1.5 text-green-600 font-bold text-sm bg-green-50 px-3 py-1.5 rounded-xl border border-green-200">
                        <CheckCircle2 className="h-4 w-4" /> Activated
                      </span>
                    )}
                    {payment.status === "REJECTED" && (
                      <span className="flex items-center gap-1.5 text-red-600 font-bold text-sm bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
                        <XCircle className="h-4 w-4" /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 bg-white"
            >Previous</button>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 bg-white"
            >Next</button>
          </div>
        </div>
      )}

      {/* Modals */}
      {slipPreviewUrl && (
        <SlipPreviewModal url={slipPreviewUrl} onClose={() => setSlipPreviewUrl(null)} />
      )}
      {rejectPaymentId && (
        <RejectDialog
          paymentId={rejectPaymentId}
          onClose={() => setRejectPaymentId(null)}
          onDone={() => { setRejectPaymentId(null); fetchPayments(); }}
        />
      )}
    </div>
  );
}
