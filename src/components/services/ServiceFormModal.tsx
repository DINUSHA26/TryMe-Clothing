"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, X, UploadCloud, CheckCircle2, MapPin, Store, Car, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/utils/image";
import { SL_LOCATIONS } from "@/lib/ads-locations";
import { cn } from "@/lib/utils";

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: any | null; // null for create, object for edit
  onSaved: () => void;
}

export function ServiceFormModal({
  isOpen,
  onClose,
  service,
  onSaved,
}: ServiceFormModalProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [priceType, setPriceType] = useState<string>("FIXED");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [deliveryType, setDeliveryType] = useState<string>("BOTH");
  const [district, setDistrict] = useState<string>("Colombo");
  const [city, setCity] = useState<string>("");
  const [serviceArea, setServiceArea] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [showOnMarketplace, setShowOnMarketplace] = useState(true);
  const [showOnWebsite, setShowOnWebsite] = useState(true);

  // Load categories
  useEffect(() => {
    if (isOpen) {
      setIsLoadingCategories(true);
      fetch("/api/vendor/services/categories")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setCategories(data.data.filter((c: any) => c.isActive !== false));
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingCategories(false));
    }
  }, [isOpen]);

  // Populate on edit
  useEffect(() => {
    if (service) {
      setName(service.name || "");
      setCategoryId(service.categoryId || "");
      setSubCategoryId(service.subCategoryId || "");
      setPriceType(service.priceType || "FIXED");
      setPrice(service.price != null ? String(service.price) : "");
      setDuration(service.duration || "");
      setDeliveryType(service.deliveryType || "BOTH");
      setDistrict(service.district || "Colombo");
      setCity(service.city || "");
      setServiceArea(service.serviceArea || "");
      setAddress(service.address || "");
      setShortDesc(service.shortDesc || "");
      setDescription(service.description || "");
      setImages(Array.isArray(service.images) ? service.images : []);
      setFeatures(Array.isArray(service.features) ? service.features : []);
      setIsFeatured(Boolean(service.isFeatured));
      setShowOnMarketplace(service.showOnMarketplace !== undefined ? Boolean(service.showOnMarketplace) : true);
      setShowOnWebsite(service.showOnWebsite !== undefined ? Boolean(service.showOnWebsite) : true);
    } else {
      setName("");
      setCategoryId("");
      setSubCategoryId("");
      setPriceType("FIXED");
      setPrice("");
      setDuration("");
      setDeliveryType("BOTH");
      setDistrict("Colombo");
      setCity("");
      setServiceArea("");
      setAddress("");
      setShortDesc("");
      setDescription("");
      setImages([]);
      setFeatures([]);
      setIsFeatured(false);
      setShowOnMarketplace(true);
      setShowOnWebsite(true);
    }
  }, [service, isOpen]);

  const handleAddFeature = () => {
    const trimmed = newFeature.trim();
    if (trimmed && !features.includes(trimmed)) {
      setFeatures([...features, trimmed]);
      setNewFeature("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      toast({
        variant: "destructive",
        title: "Limit Exceeded",
        description: "You can upload a maximum of 5 photos per service.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          toast({
            variant: "destructive",
            title: "File Too Large",
            description: `${file.name} exceeds 5MB limit.`,
          });
          continue;
        }

        const compressed = await compressImage(file);
        const formData = new FormData();
        formData.append("file", compressed);
        formData.append("folder", "services");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        const uploadedUrl = json.data?.url || json.data?.secure_url || json.url || json.secure_url;

        if (json.success && uploadedUrl) {
          uploadedUrls.push(uploadedUrl);
        } else {
          toast({
            variant: "destructive",
            title: `Upload Failed: ${file.name}`,
            description: json.error || "Failed to upload image",
          });
        }
      }

      if (uploadedUrls.length > 0) {
        setImages((prev) => [...prev, ...uploadedUrls]);
        toast({
          title: "Images Uploaded",
          description: `Successfully uploaded ${uploadedUrls.length} image(s).`,
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err.message || "Failed to upload image.",
      });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Service name is required." });
      return;
    }
    if (!categoryId) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please select a category." });
      return;
    }
    if (!description.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Service description is required." });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        categoryId,
        subCategoryId: subCategoryId && subCategoryId !== "none" ? subCategoryId : null,
        priceType,
        price: priceType === "CONTACT_FOR_PRICE" || !price ? null : parseFloat(price),
        duration: duration.trim() || null,
        deliveryType,
        district: district && district !== "All Islandwide" ? district : "Islandwide",
        city: city && city !== "none" ? city.trim() : null,
        serviceArea: serviceArea.trim() || null,
        address: address.trim() || null,
        shortDesc: shortDesc.trim() || null,
        description: description.trim(),
        images,
        features,
        isFeatured,
        showOnMarketplace,
        showOnWebsite,
      };

      const url = service ? `/api/vendor/services/${service.id}` : "/api/vendor/services";
      const method = service ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";
      let data: any;
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        await res.text();
        throw new Error(res.statusText || "Server returned an unexpected response.");
      }
      if (!data.success) {
        throw new Error(data.error || "Failed to save service");
      }

      toast({
        title: service ? "Service Updated" : "Service Created",
        description: service
          ? "Your service has been updated on your website."
          : "Your new service is now live on your website!",
      });

      onSaved();
      onClose();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategoryObj = categories.find((c) => c.id === categoryId);
  const availableSubCategories = selectedCategoryObj?.subCategories || [];

  const districtList = Object.keys(SL_LOCATIONS);
  const availableCities = (district && SL_LOCATIONS[district]?.all) || [];

  const handleCategoryChange = (val: string) => {
    setCategoryId(val);
    setSubCategoryId("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden w-[95vw] sm:w-full rounded-2xl sm:rounded-3xl">
        <DialogHeader className="p-4 sm:p-6 pb-2 border-b border-gray-100">
          <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
            {service ? "Edit Service" : "Add New Service"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-gray-500">
            Manage service details, pricing, gallery, and visibility on TryMe Marketplace and your personal website.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 text-left">
          {/* Service Name */}
          <div className="space-y-1.5">
            <Label htmlFor="srv-name" className="text-xs font-bold text-gray-700">
              Service Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="srv-name"
              placeholder="e.g. Tailored Suit Stitching, Ceramic Car Coating, Screen Replacement"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl text-sm"
              required
            />
          </div>

          {/* Category & Subcategory Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                Service Category <span className="text-red-500">*</span>
              </Label>
              <Select value={categoryId} onValueChange={handleCategoryChange} disabled={isLoadingCategories}>
                <SelectTrigger className="rounded-xl text-sm">
                  <SelectValue placeholder={isLoadingCategories ? "Loading..." : "Select category"} />
                </SelectTrigger>
                <SelectContent className="max-h-60 rounded-xl">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-xs sm:text-sm">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                Subcategory <span className="text-gray-400 font-normal">(Optional)</span>
              </Label>
              <Select
                value={subCategoryId}
                onValueChange={setSubCategoryId}
                disabled={!categoryId || availableSubCategories.length === 0}
              >
                <SelectTrigger className="rounded-xl text-sm">
                  <SelectValue
                    placeholder={
                      !categoryId
                        ? "Select category first"
                        : availableSubCategories.length === 0
                        ? "No subcategories"
                        : "Select subcategory"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-60 rounded-xl">
                  <SelectItem value="none" className="text-xs sm:text-sm text-gray-400 italic">
                    -- No specific subcategory --
                  </SelectItem>
                  {availableSubCategories.map((sub: any) => (
                    <SelectItem key={sub.id} value={sub.id} className="text-xs sm:text-sm">
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing Model & Price Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Pricing Type</Label>
              <Select value={priceType} onValueChange={setPriceType}>
                <SelectTrigger className="rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="FIXED">Fixed Price (e.g. Rs. 2,500)</SelectItem>
                  <SelectItem value="STARTING_FROM">Starting From (e.g. From Rs. 1,500)</SelectItem>
                  <SelectItem value="HOURLY">Hourly Rate (e.g. Rs. 1,000 / hr)</SelectItem>
                  <SelectItem value="CONTACT_FOR_PRICE">Contact For Price / Free Quote</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="srv-price" className="text-xs font-bold text-gray-700">
                Price (LKR) {priceType !== "CONTACT_FOR_PRICE" && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="srv-price"
                type="number"
                min="0"
                step="0.01"
                placeholder={priceType === "CONTACT_FOR_PRICE" ? "Contact for price" : "e.g. 3500"}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={priceType === "CONTACT_FOR_PRICE"}
                className="rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label htmlFor="srv-duration" className="text-xs font-bold text-gray-700">
              Estimated Duration <span className="text-gray-400 font-normal">(Optional)</span>
            </Label>
            <Input
              id="srv-duration"
              placeholder="e.g. 45 Mins, 2 Hours, 1 - 2 Days"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="rounded-xl text-sm"
            />
          </div>

          {/* ================= SERVICE DELIVERY & LOCATION SECTION ================= */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/25 border border-orange-200/80 dark:border-orange-900/50 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF6600]" />
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                Service Delivery Mode & Location
              </span>
            </div>

            {/* Delivery Mode: Customer visits / Doorstep / Both */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Where is this service provided? <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* At Vendor */}
                <button
                  type="button"
                  onClick={() => setDeliveryType("AT_VENDOR")}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all flex flex-col gap-1",
                    deliveryType === "AT_VENDOR"
                      ? "border-[#FF6600] bg-white dark:bg-slate-900 ring-2 ring-orange-400/30 shadow-xs"
                      : "border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-slate-900/50 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 dark:text-gray-100">
                    <Store className="w-3.5 h-3.5 text-[#FF6600]" />
                    <span>Customer Visits Location</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight">
                    Customer visits your store, studio, or workshop.
                  </p>
                </button>

                {/* Doorstep / Home Service */}
                <button
                  type="button"
                  onClick={() => setDeliveryType("DOORSTEP")}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all flex flex-col gap-1",
                    deliveryType === "DOORSTEP"
                      ? "border-[#FF6600] bg-white dark:bg-slate-900 ring-2 ring-orange-400/30 shadow-xs"
                      : "border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-slate-900/50 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 dark:text-gray-100">
                    <Car className="w-3.5 h-3.5 text-[#FF6600]" />
                    <span>Doorstep / Home Visit</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight">
                    You travel to the customer&apos;s home or office.
                  </p>
                </button>

                {/* Both Available */}
                <button
                  type="button"
                  onClick={() => setDeliveryType("BOTH")}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all flex flex-col gap-1",
                    deliveryType === "BOTH"
                      ? "border-[#FF6600] bg-white dark:bg-slate-900 ring-2 ring-orange-400/30 shadow-xs"
                      : "border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-slate-900/50 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900 dark:text-gray-100">
                    <RefreshCw className="w-3.5 h-3.5 text-[#FF6600]" />
                    <span>Both Options Available</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight">
                    Customer can visit you, or you can visit them.
                  </p>
                </button>
              </div>
            </div>

            {/* District & City Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Primary District / Region <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={district}
                  onValueChange={(val) => {
                    setDistrict(val);
                    setCity("");
                  }}
                >
                  <SelectTrigger className="rounded-xl text-sm bg-white dark:bg-slate-900">
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 rounded-xl">
                    <SelectItem value="All Islandwide" className="font-semibold text-[#FF6600]">
                      🇱🇰 All Islandwide / Across Sri Lanka
                    </SelectItem>
                    {districtList.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  City / Main Town <span className="text-gray-400 font-normal">(Optional)</span>
                </Label>
                {availableCities.length > 0 ? (
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="rounded-xl text-sm bg-white dark:bg-slate-900">
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 rounded-xl">
                      <SelectItem value="none" className="text-gray-400 italic">
                        -- Entire District --
                      </SelectItem>
                      {availableCities.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="e.g. Nugegoda, Negombo, Kandy City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="rounded-xl text-sm bg-white dark:bg-slate-900"
                  />
                )}
              </div>
            </div>

            {/* Service Coverage / Radius */}
            <div className="space-y-1.5">
              <Label htmlFor="srv-coverage" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Service Coverage Area / Radius
              </Label>
              <Input
                id="srv-coverage"
                placeholder="e.g. Within 15km of Colombo, Western Province, or All Suburbs"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                className="rounded-xl text-sm bg-white dark:bg-slate-900"
              />
            </div>

            {/* Workshop Address (if customer visits) */}
            {(deliveryType === "AT_VENDOR" || deliveryType === "BOTH") && (
              <div className="space-y-1.5 animate-fadeIn">
                <Label htmlFor="srv-address" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Workshop / Store Address <span className="text-gray-400 font-normal">(Where customer visits)</span>
                </Label>
                <Input
                  id="srv-address"
                  placeholder="e.g. No. 45/B, High Level Road, Nugegoda"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="rounded-xl text-sm bg-white dark:bg-slate-900"
                />
              </div>
            )}
          </div>

          {/* Short Summary */}
          <div className="space-y-1.5">
            <Label htmlFor="srv-short" className="text-xs font-bold text-gray-700">
              Short Teaser (For Service Cards)
            </Label>
            <Input
              id="srv-short"
              placeholder="One line highlight (e.g. Premium stitching with 3 fitting adjustments included)"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              className="rounded-xl text-sm"
            />
          </div>

          {/* Full Description */}
          <div className="space-y-1.5">
            <Label htmlFor="srv-desc" className="text-xs font-bold text-gray-700">
              Full Description & Process <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="srv-desc"
              rows={4}
              placeholder="Describe your service in detail, what the customer should prepare, warranties, materials used, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl text-sm resize-none"
              required
            />
          </div>

          {/* What's Included / Key Features (Tag list) */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gray-700">What's Included / Key Features</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Free Inspection, Genuine Parts, 6 Months Warranty"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                className="rounded-xl text-xs sm:text-sm"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddFeature}
                className="rounded-xl shrink-0 px-3 border-gray-200"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            {features.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {features.map((feat, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="bg-gray-50 border-gray-200 text-gray-700 pl-2.5 pr-1.5 py-1 text-xs rounded-lg flex items-center gap-1 font-normal"
                  >
                    <span>{feat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="hover:text-red-600 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Service Photos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-gray-700">Service Photos (Up to 5)</Label>
              <span className="text-[10px] text-gray-400">{images.length} / 5 photos</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group bg-gray-50">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full shadow transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded font-bold">
                    #{idx + 1}
                  </span>
                </div>
              ))}

              {images.length < 5 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-gray-50 cursor-pointer flex flex-col items-center justify-center p-2 text-center transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  ) : (
                    <>
                      <UploadCloud className="h-5 w-5 text-gray-400 mb-1" />
                      <span className="text-[10px] font-bold text-gray-500">Upload</span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Channel Visibility */}
          <div className="space-y-3 p-3.5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50/60 dark:bg-neutral-900/60">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Channel Visibility
            </Label>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">🛒 TryMe Marketplace</span>
                <span className="text-[10px] text-gray-500 block">List in the public TryMe.lk Services directory.</span>
              </div>
              <Switch checked={showOnMarketplace} onCheckedChange={setShowOnMarketplace} />
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-gray-200 dark:border-neutral-800">
              <div>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">🌐 Personal Website</span>
                <span className="text-[10px] text-gray-500 block">Display on your standalone online store/profile.</span>
              </div>
              <Switch checked={showOnWebsite} onCheckedChange={setShowOnWebsite} />
            </div>
          </div>

          {/* Featured on Home Page Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/50">
            <div>
              <span className="text-xs font-bold text-gray-800 block">Feature on Website Homepage</span>
              <span className="text-[10px] text-gray-500 block">Showcase this service prominently in the homepage services section.</span>
            </div>
            <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
          </div>

          <DialogFooter className="pt-3 border-t border-gray-100 flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-xl border-gray-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="w-full sm:w-auto bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold rounded-xl shadow-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <span>{service ? "Update Service" : "Publish Service"}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
