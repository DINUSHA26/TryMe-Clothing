"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Briefcase,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
  ExternalLink,
  Loader2,
  Globe,
  AlertCircle,
  Mail,
  Store,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ServiceFormModal } from "@/components/services/ServiceFormModal";
import { ServiceInquiriesManager } from "@/components/services/ServiceInquiriesManager";

export default function AdsSellerServicesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"services" | "inquiries">("services");
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/vendor/services");
      const data = await res.json();
      if (data.success) {
        setServices(data.data || []);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to load services",
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
    fetchServices();
  }, []);

  const handleToggleChannel = async (
    serviceId: string,
    channel: "marketplace" | "website",
    currentValue: boolean
  ) => {
    const field = channel === "marketplace" ? "showOnMarketplace" : "showOnWebsite";
    const nextValue = !currentValue;

    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, [field]: nextValue } : s))
    );

    try {
      const res = await fetch(`/api/vendor/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: nextValue }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Visibility Updated",
        description: `${channel === "marketplace" ? "TryMe Marketplace" : "Personal Website"} visibility ${
          nextValue ? "enabled" : "disabled"
        }.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message,
      });
      fetchServices();
    }
  };

  const handleToggleActive = async (serviceId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, isActive: nextStatus } : s))
    );

    try {
      const res = await fetch(`/api/vendor/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Status Updated",
        description: `Service is now ${nextStatus ? "active and visible" : "hidden"}.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message,
      });
      fetchServices();
    }
  };

  const handleDelete = async (serviceId: string, serviceName: string) => {
    if (!confirm(`Are you sure you want to delete "${serviceName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/vendor/services/${serviceId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Service Deleted",
        description: `"${serviceName}" was deleted successfully.`,
      });
      fetchServices();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: err.message,
      });
    }
  };

  const formatPrice = (service: any) => {
    if (service.priceType === "CONTACT_FOR_PRICE" || service.price == null) {
      return "Contact for price";
    }
    const num = Number(service.price).toLocaleString("en-LK");
    if (service.priceType === "STARTING_FROM") {
      return `From Rs. ${num}`;
    }
    if (service.priceType === "HOURLY") {
      return `Rs. ${num} / hr`;
    }
    return `Rs. ${num}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-orange-50 via-white to-orange-50/30 p-4 sm:p-6 rounded-2xl border border-orange-100/60 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#FF6600]/10 text-[#FF6600] rounded-xl">
              <Briefcase className="h-5 w-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              My Services
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 max-w-xl">
            List professional services on TryMe.lk Marketplace and your personal store website. Manage customer leads with source attribution.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingService(null);
            setIsModalOpen(true);
          }}
          className="bg-[#FF6600] hover:bg-[#e65c00] text-white rounded-xl shadow-md font-bold text-xs sm:text-sm h-11 px-5 shrink-0 self-start sm:self-auto w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add New Service
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab("services")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "services"
              ? "border-[#FF6600] text-[#FF6600]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Services</span>
          <Badge variant="secondary" className="text-xs px-2 py-0">
            {services.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("inquiries")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "inquiries"
              ? "border-[#FF6600] text-[#FF6600]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Service Inquiries &amp; Leads</span>
        </button>
      </div>

      {/* Tab 1: Services List */}
      {activeTab === "services" && (
        <>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF6600] mb-3" />
              <p className="text-sm font-medium text-gray-500">Loading your services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center p-8 sm:p-14 bg-white rounded-2xl border border-dashed border-gray-200 space-y-4">
              <div className="w-14 h-14 bg-orange-50 text-[#FF6600] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Briefcase className="h-7 w-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">No Services Added Yet</h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  Publish repair, detailing, consulting, installation, or tailoring services to TryMe.lk Marketplace and your personal website!
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingService(null);
                  setIsModalOpen(true);
                }}
                className="bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold rounded-xl text-xs sm:text-sm"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Create Your First Service
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                    <TableHead className="w-[80px]">Photo</TableHead>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Channel Visibility</TableHead>
                    <TableHead>Active Status</TableHead>
                    <TableHead className="w-[60px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((srv) => {
                    const isMktLive = srv.showOnMarketplace !== false;
                    const isWebLive = srv.showOnWebsite !== false;

                    return (
                      <TableRow key={srv.id} className="hover:bg-gray-50/40">
                        {/* Image */}
                        <TableCell>
                          <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden relative shrink-0">
                            {srv.images?.[0] ? (
                              <img src={srv.images[0]} alt={srv.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Briefcase className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Name */}
                        <TableCell>
                          <div className="max-w-[240px]">
                            <span className="font-bold text-sm text-gray-900 block truncate">{srv.name}</span>
                            {(srv.district || srv.city) && (
                              <span className="text-[11px] text-gray-500 block truncate font-medium">
                                📍 {[srv.city, srv.district].filter(Boolean).join(", ")} •{" "}
                                {srv.deliveryType === "DOORSTEP"
                                  ? "Doorstep"
                                  : srv.deliveryType === "AT_VENDOR"
                                  ? "In-Store"
                                  : "Store & Doorstep"}
                              </span>
                            )}
                            {srv.shortDesc && !srv.district && (
                              <span className="text-xs text-gray-500 block truncate">{srv.shortDesc}</span>
                            )}
                            {srv.isFeatured && (
                              <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-700 border-amber-200 text-[9px] font-bold py-0 h-4">
                                ⭐ Featured on Homepage
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs font-medium">
                            {srv.category?.name || "Uncategorized"}
                          </Badge>
                          {srv.subCategory && (
                            <span className="block text-[11px] text-[#FF6600] font-medium mt-0.5">
                              ↳ {srv.subCategory.name}
                            </span>
                          )}
                        </TableCell>

                        {/* Price */}
                        <TableCell>
                          <span className="font-bold text-sm text-gray-900 block">{formatPrice(srv)}</span>
                          {srv.duration && (
                            <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {srv.duration}
                            </span>
                          )}
                        </TableCell>

                        {/* Channel Visibility Toggles */}
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            {/* TryMe Marketplace Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleChannel(srv.id, "marketplace", isMktLive)}
                              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors w-fit ${
                                isMktLive
                                  ? "bg-orange-50 text-orange-700 border-orange-200 hover:bg-red-50 hover:text-red-700"
                                  : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-orange-50 hover:text-orange-700"
                              }`}
                              title="Click to toggle Marketplace visibility"
                            >
                              <span>🛒</span>
                              <span>Marketplace: {isMktLive ? "Live" : "Off"}</span>
                            </button>

                            {/* My Website Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleChannel(srv.id, "website", isWebLive)}
                              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors w-fit ${
                                isWebLive
                                  ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-red-50 hover:text-red-700"
                                  : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-blue-50 hover:text-blue-700"
                              }`}
                              title="Click to toggle Website visibility"
                            >
                              <span>🌐</span>
                              <span>Website: {isWebLive ? "Live" : "Off"}</span>
                            </button>
                          </div>
                        </TableCell>

                        {/* Status Switch */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={srv.isActive}
                              onCheckedChange={() => handleToggleActive(srv.id, srv.isActive)}
                            />
                            <span className={`text-[11px] font-bold ${srv.isActive ? "text-emerald-600" : "text-gray-400"}`}>
                              {srv.isActive ? "Active" : "Hidden"}
                            </span>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingService(srv);
                                  setIsModalOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Service
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                asChild
                                className="cursor-pointer"
                              >
                                <Link href={`/services/${srv.slug || srv.id}`} target="_blank">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View on TryMe
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(srv.id, srv.name)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Service
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* Tab 2: Service Inquiries & Leads */}
      {activeTab === "inquiries" && <ServiceInquiriesManager />}

      {/* Service Modal */}
      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingService(null);
        }}
        service={editingService}
        onSaved={fetchServices}
      />
    </div>
  );
}
