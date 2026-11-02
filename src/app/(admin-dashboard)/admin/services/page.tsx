"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Briefcase,
  Search,
  Filter,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  Store,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminServicesPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Moderation modal
  const [moderatingService, setModeratingService] = useState<any | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/services/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        search,
        categoryId,
        status,
      });

      const res = await fetch(`/api/admin/services?${params}`);
      const data = await res.json();
      if (data.success) {
        setServices(data.data.services || []);
        setTotalPages(data.data.pagination.totalPages || 1);
      } else {
        toast({ variant: "destructive", title: "Error", description: data.error });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Network Error", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchServices();
  }, [page, categoryId, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchServices();
  };

  const handleModerate = async (disable: boolean) => {
    if (!moderatingService) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/services/${moderatingService.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isDisabledByAdmin: disable,
          adminNote: adminNote.trim() || null,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      toast({
        title: "Moderation Decision Saved",
        description: data.message,
      });

      setModeratingService(null);
      fetchServices();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Action Failed", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (service: any) => {
    if (service.priceType === "CONTACT_FOR_PRICE" || service.price == null) {
      return "Contact for price";
    }
    const num = Number(service.price).toLocaleString("en-LK");
    if (service.priceType === "STARTING_FROM") return `From Rs. ${num}`;
    if (service.priceType === "HOURLY") return `Rs. ${num} / hr`;
    return `Rs. ${num}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-[#FF6600]" />
            Website Services Moderation
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Overview and moderation of all services published on Vendor & Ads Seller standalone websites.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar - Responsive */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search service name, description, or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl text-xs sm:text-sm h-10"
            />
          </div>
          <Button type="submit" className="bg-[#FF6600] hover:bg-[#e65c00] text-white rounded-xl h-10 px-5 text-xs sm:text-sm font-semibold shrink-0">
            Search
          </Button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div>
            <Select value={categoryId} onValueChange={(val) => { setCategoryId(val); setPage(1); }}>
              <SelectTrigger className="rounded-xl text-xs h-9">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="max-h-60 rounded-xl">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-xs">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
              <SelectTrigger className="rounded-xl text-xs h-9">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active on Site</SelectItem>
                <SelectItem value="inactive">Hidden by Seller</SelectItem>
                <SelectItem value="disabled">Disabled by Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" />
        </div>
      ) : services.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-sm text-gray-500">No services match your filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60">
                  <TableHead className="w-[80px]">Photo</TableHead>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Provider / Store</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((srv) => {
                  const owner = srv.vendor || srv.adsSeller;
                  const ownerType = srv.vendor ? "VENDOR" : "ADS SELLER";

                  return (
                    <TableRow key={srv.id} className="hover:bg-gray-50/40">
                      <TableCell>
                        <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden relative shrink-0">
                          {srv.images?.[0] ? (
                            <img src={srv.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Briefcase className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="max-w-[220px]">
                          <span className="font-bold text-sm text-gray-900 block truncate">{srv.name}</span>
                          <span className="text-xs text-gray-500 block truncate">{srv.shortDesc || srv.description}</span>
                          {srv.duration && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock className="h-2.5 w-2.5" /> {srv.duration}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <span className="font-semibold text-xs text-gray-800 block">
                            {owner?.businessName || "Unnamed Store"}
                          </span>
                          <span className="text-[10px] text-gray-400 block font-mono">
                            /{owner?.slug}
                          </span>
                          <Badge variant="outline" className="text-[9px] font-bold py-0 h-4 mt-0.5 bg-gray-50">
                            {ownerType}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
                          {srv.category?.name}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span className="font-bold text-xs text-gray-900">{formatPrice(srv)}</span>
                      </TableCell>

                      <TableCell>
                        {srv.isDisabledByAdmin ? (
                          <Badge variant="destructive" className="text-[10px] font-bold">
                            Disabled by Admin
                          </Badge>
                        ) : srv.isActive ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                            Live on Site
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200 text-[10px]">
                            Hidden by Seller
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setModeratingService(srv);
                            setAdminNote(srv.adminNote || "");
                          }}
                          className={`rounded-xl text-xs h-8 ${
                            srv.isDisabledByAdmin
                              ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              : "border-red-200 text-red-600 hover:bg-red-50"
                          }`}
                        >
                          {srv.isDisabledByAdmin ? "Re-enable" : "Moderate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile & Tablet Card Layout */}
          <div className="lg:hidden space-y-3">
            {services.map((srv) => {
              const owner = srv.vendor || srv.adsSeller;
              const ownerType = srv.vendor ? "VENDOR" : "ADS SELLER";

              return (
                <div key={srv.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden relative shrink-0">
                      {srv.images?.[0] ? (
                        <img src={srv.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Briefcase className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-sm text-gray-900 block truncate">{srv.name}</span>
                      <span className="text-xs font-bold text-[#FF6600] block">{formatPrice(srv)}</span>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[10px] text-gray-500 font-semibold">{owner?.businessName}</span>
                        <Badge variant="outline" className="text-[9px] py-0 h-4 bg-gray-50">
                          {ownerType}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <div>
                      {srv.isDisabledByAdmin ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Disabled by Admin
                        </Badge>
                      ) : srv.isActive ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                          Live on Site
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200 text-[10px]">
                          Hidden
                        </Badge>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setModeratingService(srv);
                        setAdminNote(srv.adminNote || "");
                      }}
                      className="rounded-xl text-xs h-8 border-gray-200"
                    >
                      {srv.isDisabledByAdmin ? "Re-enable" : "Moderate"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-xl text-xs"
              >
                Previous
              </Button>
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-xl text-xs"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Moderation Dialog */}
      <Dialog open={!!moderatingService} onOpenChange={(open) => !open && setModeratingService(null)}>
        <DialogContent className="max-w-md w-[92vw] sm:w-full rounded-2xl sm:rounded-3xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Moderate Website Service
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Service: <span className="font-semibold text-gray-800">{moderatingService?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="p-3 bg-gray-50 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Provider:</span>
                <span className="font-semibold text-gray-800">
                  {moderatingService?.vendor?.businessName || moderatingService?.adsSeller?.businessName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pricing:</span>
                <span className="font-semibold text-gray-800">{moderatingService && formatPrice(moderatingService)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Current Status:</span>
                <span className="font-semibold text-gray-800">
                  {moderatingService?.isDisabledByAdmin ? "Disabled by Admin" : "Active on Website"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Internal Admin Note / Reason</label>
              <Textarea
                rows={3}
                placeholder="Reason for disabling or notes about this service..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="rounded-xl text-xs resize-none"
              />
            </div>

            <DialogFooter className="pt-2 flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setModeratingService(null)}
                className="w-full sm:w-auto rounded-xl"
              >
                Cancel
              </Button>
              {moderatingService?.isDisabledByAdmin ? (
                <Button
                  onClick={() => handleModerate(false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  Re-enable Service
                </Button>
              ) : (
                <Button
                  onClick={() => handleModerate(true)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  Disable Service
                </Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

