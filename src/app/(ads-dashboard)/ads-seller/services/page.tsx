"use client";

import { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ServiceFormModal } from "@/components/services/ServiceFormModal";

export default function AdsSellerServicesPage() {
  const { toast } = useToast();
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
      if (!data.success) {
        throw new Error(data.error);
      }
      toast({
        title: "Status Updated",
        description: `Service is now ${nextStatus ? "active and visible" : "hidden"} on your website.`,
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
      if (!data.success) {
        throw new Error(data.error);
      }
      toast({
        title: "Service Deleted",
        description: `"${serviceName}" was deleted from your website.`,
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
      {/* Header Banner - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-orange-50 via-white to-orange-50/30 p-4 sm:p-6 rounded-2xl border border-orange-100/60 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#FF6600]/10 text-[#FF6600] rounded-xl">
              <Briefcase className="h-5 w-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              My Website Services
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 max-w-xl">
            Offer repair, inspection, maintenance, or consultation services on your personal website with direct WhatsApp bookings.
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

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6600] mb-3" />
          <p className="text-sm font-medium text-gray-500">Loading your website services...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center p-8 sm:p-14 bg-white rounded-2xl border border-dashed border-gray-200 space-y-4">
          <div className="w-14 h-14 bg-orange-50 text-[#FF6600] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Briefcase className="h-7 w-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">No Services Added Yet</h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Create services like auto repairs, phone fixing, home servicing, or consultations that will be featured on your standalone website.
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
        <>
          {/* Desktop & Tablet Table (Hidden on small mobile) */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
                  <TableHead className="w-[80px]">Photo</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Website Status</TableHead>
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((srv) => (
                  <TableRow key={srv.id} className="hover:bg-gray-50/40">
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

                    <TableCell>
                      <div className="max-w-[240px]">
                        <span className="font-bold text-sm text-gray-900 block truncate">{srv.name}</span>
                        {srv.shortDesc && (
                          <span className="text-xs text-gray-500 block truncate">{srv.shortDesc}</span>
                        )}
                        {srv.isFeatured && (
                          <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-700 border-amber-200 text-[9px] font-bold py-0 h-4">
                            ⭐ Featured on Homepage
                          </Badge>
                        )}
                      </div>
                    </TableCell>

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

                    <TableCell>
                      <span className="font-bold text-sm text-gray-900 block">{formatPrice(srv)}</span>
                    </TableCell>

                    <TableCell>
                      {srv.duration ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 border border-gray-200/60 px-2 py-0.5 rounded-md">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {srv.duration}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {srv.isDisabledByAdmin ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Disabled by Admin
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={srv.isActive}
                            onCheckedChange={() => handleToggleActive(srv.id, srv.isActive)}
                          />
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold py-0.5 px-2 ${
                              srv.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-gray-100 text-gray-500 border-gray-200"
                            }`}
                          >
                            {srv.isActive ? "Live" : "Hidden"}
                          </Badge>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingService(srv);
                              setIsModalOpen(true);
                            }}
                            className="cursor-pointer text-xs"
                          >
                            <Edit className="h-3.5 w-3.5 mr-2 text-blue-600" />
                            Edit Service
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(srv.id, srv.name)}
                            className="cursor-pointer text-xs text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2 text-red-600" />
                            Delete Service
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List (Visible strictly on small mobile screens) */}
          <div className="md:hidden space-y-3">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden relative shrink-0">
                    {srv.images?.[0] ? (
                      <img src={srv.images[0]} alt={srv.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Briefcase className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-sm text-gray-900 block truncate">{srv.name}</span>
                    <span className="text-xs font-semibold text-[#FF6600] block mt-0.5">{formatPrice(srv)}</span>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <Badge variant="outline" className="bg-gray-50 text-gray-600 text-[10px] py-0 h-4.5">
                        {srv.category?.name}
                      </Badge>
                      {srv.subCategory && (
                        <Badge variant="secondary" className="bg-orange-50 text-[#FF6600] text-[10px] py-0 h-4.5 border-0">
                          {srv.subCategory.name}
                        </Badge>
                      )}
                      {srv.duration && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5 text-gray-400" /> {srv.duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {srv.shortDesc && (
                  <p className="text-xs text-gray-600 line-clamp-2 bg-gray-50/70 p-2.5 rounded-xl">
                    {srv.shortDesc}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={srv.isActive}
                      onCheckedChange={() => handleToggleActive(srv.id, srv.isActive)}
                      disabled={srv.isDisabledByAdmin}
                    />
                    <span className="text-xs font-medium text-gray-700">
                      {srv.isDisabledByAdmin ? "Disabled by Admin" : srv.isActive ? "Live on Site" : "Hidden"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingService(srv);
                        setIsModalOpen(true);
                      }}
                      className="h-8 px-2.5 text-xs rounded-xl border-gray-200"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(srv.id, srv.name)}
                      className="h-8 px-2 text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Service Create / Edit Modal */}
      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        service={editingService}
        onSaved={fetchServices}
      />
    </div>
  );
}

