"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  MessageCircle,
  Phone,
  CheckCircle2,
  Trash2,
  Clock,
  Briefcase,
  Store,
  Globe,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface ServiceInquiryItem {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  message: string;
  preferredChannel: string;
  source: string; // "TRYME_MARKETPLACE" | "VENDOR_WEBSITE"
  status: "NEW" | "CONTACTED" | "COMPLETED";
  createdAt: string;
  service?: {
    id: string;
    name: string;
    slug: string;
    price?: number | null;
    images?: string[];
  } | null;
}

export function ServiceInquiriesManager() {
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<ServiceInquiryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/vendor/services/inquiries");
      const data = await res.json();
      if (data.success) {
        setInquiries(data.data || []);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to load service inquiries",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleUpdateStatus = async (
    inquiryId: string,
    status: "NEW" | "CONTACTED" | "COMPLETED"
  ) => {
    setLoadingId(inquiryId);
    try {
      const res = await fetch("/api/vendor/services/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiryId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setInquiries((prev) =>
          prev.map((inq) => (inq.id === inquiryId ? { ...inq, status } : inq))
        );
        toast({
          title: "Status Updated",
          description: `Inquiry marked as ${status.toLowerCase()}.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: data.error,
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (inquiryId: string) => {
    if (!confirm("Are you sure you want to delete this service inquiry?")) return;
    setLoadingId(inquiryId);
    try {
      const res = await fetch("/api/vendor/services/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inquiryId, action: "DELETE" }),
      });
      const data = await res.json();
      if (data.success) {
        setInquiries((prev) => prev.filter((inq) => inq.id !== inquiryId));
        toast({ title: "Deleted", description: "Inquiry removed successfully." });
      } else {
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: data.error,
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setLoadingId(null);
    }
  };

  // WhatsApp reply
  const handleReplyWhatsApp = (inq: ServiceInquiryItem) => {
    const phone = inq.customerPhone || "";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const sourceLabel =
      inq.source === "TRYME_MARKETPLACE" ? "TryMe.lk Marketplace" : "our website";
    const text = encodeURIComponent(
      `Hello ${inq.customerName}, thank you for your inquiry about "${
        inq.service?.name || "our service"
      }" on ${sourceLabel}!`
    );
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith("94") ? cleanPhone : "94" + cleanPhone.replace(/^0/, "")}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  };

  // Stats
  const totalCount = inquiries.length;
  const newCount = inquiries.filter((i) => i.status === "NEW").length;
  const trymeMarketplaceCount = inquiries.filter(
    (i) => i.source === "TRYME_MARKETPLACE"
  ).length;
  const websiteCount = inquiries.filter((i) => i.source === "VENDOR_WEBSITE").length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            Total Inquiries
          </p>
          <p className="text-2xl font-extrabold text-foreground mt-1">{totalCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            New / Uncontacted
          </p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{newCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            🛒 TryMe Marketplace
          </p>
          <p className="text-2xl font-extrabold text-[#FF6600] mt-1">
            {trymeMarketplaceCount}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            🌐 My Website (Direct)
          </p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{websiteCount}</p>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-44">Inquiry Source</TableHead>
              <TableHead className="w-56">Customer Details</TableHead>
              <TableHead className="min-w-[180px]">Service Inquired</TableHead>
              <TableHead className="min-w-[220px]">Customer Message</TableHead>
              <TableHead className="w-32 text-center">Status</TableHead>
              <TableHead className="w-36 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin text-[#FF6600]" />
                    <span>Loading service inquiries...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : inquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                    <Mail className="w-8 h-8 text-muted-foreground/40" />
                    <p className="font-semibold text-foreground">No service inquiries yet</p>
                    <p className="text-xs max-w-sm">
                      Customer inquiries from the public TryMe.lk Marketplace and your personal website will appear here with source tracking.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              inquiries.map((inq) => {
                const isTryMe = inq.source === "TRYME_MARKETPLACE";

                return (
                  <TableRow key={inq.id} className="hover:bg-muted/20">
                    {/* Source Badge Column */}
                    <TableCell className="align-top py-3.5">
                      <div className="space-y-1">
                        {isTryMe ? (
                          <Badge
                            variant="secondary"
                            className="bg-orange-50 text-[#FF6600] border-orange-200 font-bold text-[10px] px-2 py-0.5 shadow-xs flex items-center gap-1 w-fit"
                          >
                            <span>🛒</span> TryMe Marketplace
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-[10px] px-2 py-0.5 shadow-xs flex items-center gap-1 w-fit"
                          >
                            <span>🌐</span> Website (Direct)
                          </Badge>
                        )}
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(inq.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </TableCell>

                    {/* Customer Details */}
                    <TableCell className="align-top py-3.5">
                      <div className="space-y-1">
                        <p className="font-bold text-sm text-foreground">
                          {inq.customerName}
                        </p>
                        {inq.customerPhone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <a
                              href={`tel:${inq.customerPhone}`}
                              className="hover:underline font-mono"
                            >
                              {inq.customerPhone}
                            </a>
                          </p>
                        )}
                        {inq.customerEmail && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-blue-600" />
                            <a
                              href={`mailto:${inq.customerEmail}`}
                              className="hover:underline truncate max-w-[170px]"
                            >
                              {inq.customerEmail}
                            </a>
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Service Inquired */}
                    <TableCell className="align-top py-3.5">
                      {inq.service ? (
                        <div className="flex items-start gap-2.5">
                          <div className="w-10 h-10 rounded-lg border bg-muted/60 overflow-hidden relative shrink-0">
                            {inq.service.images && inq.service.images.length > 0 ? (
                              <Image
                                src={inq.service.images[0]}
                                alt={inq.service.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <Briefcase className="w-5 h-5 text-muted-foreground/40 m-auto mt-2.5" />
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/services/${inq.service.slug || inq.service.id}`}
                              target="_blank"
                              className="font-semibold text-xs text-foreground hover:text-[#FF6600] flex items-center gap-1 line-clamp-2"
                            >
                              {inq.service.name}
                              <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
                            </Link>
                            {inq.service.price != null && (
                              <p className="text-[11px] font-bold text-[#FF6600] mt-0.5">
                                Rs. {Number(inq.service.price).toLocaleString("en-LK")}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          General Service Inquiry
                        </span>
                      )}
                    </TableCell>

                    {/* Message */}
                    <TableCell className="align-top py-3.5">
                      <div className="p-2.5 rounded-lg bg-muted/30 border border-muted text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap max-w-sm">
                        {inq.message}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="align-top text-center py-3.5">
                      <Select
                        value={inq.status}
                        onValueChange={(val: any) => handleUpdateStatus(inq.id, val)}
                        disabled={loadingId === inq.id}
                      >
                        <SelectTrigger className="h-8 text-xs font-semibold w-28 mx-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NEW">
                            <span className="text-amber-600 font-bold">New</span>
                          </SelectItem>
                          <SelectItem value="CONTACTED">
                            <span className="text-blue-600 font-bold">Contacted</span>
                          </SelectItem>
                          <SelectItem value="COMPLETED">
                            <span className="text-emerald-600 font-bold">Completed</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Action buttons */}
                    <TableCell className="align-top text-right py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {inq.customerPhone && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReplyWhatsApp(inq)}
                            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                            title="Reply on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(inq.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          title="Delete Inquiry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
