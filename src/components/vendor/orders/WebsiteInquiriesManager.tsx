"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Mail,
  Phone,
  CheckCircle2,
  Trash2,
  Clock,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";

interface Inquiry {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  itemType: string;
  itemName: string;
  itemPrice?: string;
  quantity?: number;
  message: string;
  status: "NEW" | "CONTACTED" | "COMPLETED";
  createdAt: string;
}

export function WebsiteInquiriesManager({
  initialInquiries,
}: {
  initialInquiries: Inquiry[];
}) {
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries || []);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleUpdateStatus = async (
    inquiryId: string,
    status: "NEW" | "CONTACTED" | "COMPLETED"
  ) => {
    setLoadingId(inquiryId);
    try {
      const res = await fetch("/api/vendor/website/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiryId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setInquiries(data.data.inquiries);
        toast.success(`Inquiry marked as ${status.toLowerCase()}`);
      } else {
        toast.error(data.error || "Failed to update inquiry");
      }
    } catch {
      toast.error("Failed to update inquiry");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (inquiryId: string) => {
    if (!confirm("Delete this inquiry?")) return;
    setLoadingId(inquiryId);
    try {
      const res = await fetch("/api/vendor/website/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiryId, action: "DELETE" }),
      });
      const data = await res.json();
      if (data.success) {
        setInquiries(data.data.inquiries);
        toast.success("Inquiry deleted");
      }
    } catch {
      toast.error("Failed to delete inquiry");
    } finally {
      setLoadingId(null);
    }
  };

  if (inquiries.length === 0) {
    return (
      <div className="text-center py-16 border rounded-xl bg-muted/10 space-y-3">
        <Inbox className="w-14 h-14 mx-auto text-muted-foreground" />
        <h3 className="text-xl font-bold">No Website Inquiries Yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          When customers send product or service inquiries from your 1-Page or Multi-Page website, they will appear right here for easy management.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {inquiries.map((inq) => {
        const cleanPhone = (inq.customerPhone || "").replace(/[^0-9]/g, "");
        return (
          <div
            key={inq.id}
            className="border rounded-xl p-5 bg-card shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={
                    inq.status === "NEW"
                      ? "bg-amber-500/15 text-amber-700 border-amber-500/30 font-bold"
                      : inq.status === "CONTACTED"
                      ? "bg-blue-500/15 text-blue-700 border-blue-500/30 font-bold"
                      : "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 font-bold"
                  }
                >
                  {inq.status}
                </Badge>
                <Badge variant="outline" className="font-bold text-xs">
                  {inq.itemType || "INQUIRY"}
                </Badge>
                <span className="font-bold text-base text-foreground">
                  {inq.itemName}
                </span>
                {inq.itemPrice && (
                  <span className="text-xs font-extrabold text-primary">
                    ({inq.itemPrice})
                  </span>
                )}
                {inq.quantity && inq.quantity > 1 && (
                  <Badge variant="secondary">Qty: {inq.quantity}</Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground bg-muted/40 p-3 rounded-lg">
                &ldquo;{inq.message}&rdquo;
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="font-bold text-foreground">
                  Customer: {inq.customerName}
                </span>
                {inq.customerPhone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {inq.customerPhone}
                  </span>
                )}
                {inq.customerEmail && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {inq.customerEmail}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(inq.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `Hello ${inq.customerName}, thank you for your inquiry regarding "${inq.itemName}" on our website!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                    Reply on WhatsApp
                  </Button>
                </a>
              )}

              {inq.customerEmail && (
                <a
                  href={`mailto:${inq.customerEmail}?subject=${encodeURIComponent(
                    `Re: Your Inquiry about ${inq.itemName}`
                  )}`}
                >
                  <Button size="sm" variant="outline" className="text-xs font-bold">
                    <Mail className="w-3.5 h-3.5 mr-1.5" />
                    Email
                  </Button>
                </a>
              )}

              {inq.status !== "CONTACTED" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loadingId === inq.id}
                  onClick={() => handleUpdateStatus(inq.id, "CONTACTED")}
                  className="text-xs font-bold"
                >
                  Mark Contacted
                </Button>
              )}

              {inq.status !== "COMPLETED" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loadingId === inq.id}
                  onClick={() => handleUpdateStatus(inq.id, "COMPLETED")}
                  className="text-xs font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Complete
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                disabled={loadingId === inq.id}
                onClick={() => handleDelete(inq.id)}
                className="text-rose-600 hover:text-rose-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

