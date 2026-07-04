"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { CategoryPicker } from "@/components/ads/CategoryPicker";
import { LocationPicker } from "@/components/ads/LocationPicker";
import { DynamicSpecsForm } from "@/components/ads/DynamicSpecsForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Megaphone,
  MapPin,
  FileText,
  DollarSign,
  UploadCloud,
  X,
  Loader2,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { compressImage } from "@/lib/utils/image";

export default function PostAdPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Multi-step states
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [fieldDefinitions, setFieldDefinitions] = useState<any[]>([]);

  const [district, setDistrict] = useState("");
  const [localArea, setLocalArea] = useState("");

  const [specifications, setSpecifications] = useState<Record<string, any>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [price, setPrice] = useState("");
  const [priceNegotiable, setPriceNegotiable] = useState(false);
  const [contactForPrice, setContactForPrice] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  // UI utility states
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default category / location if user changes them
  const handleCategorySelect = (
    catId: string,
    subId: string,
    catName: string,
    subName: string,
    fields: any[]
  ) => {
    setCategoryId(catId);
    setSubCategoryId(subId);
    setCategoryName(catName);
    setSubCategoryName(subName);
    setFieldDefinitions(fields);
    setSpecifications({});
  };

  const handleLocationSelect = (selectedDistrict: string, selectedArea: string) => {
    setDistrict(selectedDistrict);
    setLocalArea(selectedArea);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 6) {
      toast({
        variant: "destructive",
        title: "Limit Exceeded",
        description: "You can upload a maximum of 6 images.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const compressedFile = await compressImage(file);
        const formData = new FormData();
        formData.append("file", compressedFile);
        formData.append("folder", "classified_ads");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Upload failed");
        }
        return result.data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls]);
      toast({
        title: "Uploaded",
        description: `${uploadedUrls.length} image(s) uploaded successfully.`,
      });
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Failed to upload one or more images.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please upload at least one photo of your item.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        categoryId,
        subCategoryId,
        district,
        localArea,
        title,
        description,
        price: contactForPrice ? null : price,
        priceNegotiable,
        images,
        specifications,
      };

      const response = await fetch("/api/ads/seller/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        // Plan limit or no active plan — redirect to plans page
        if (response.status === 403) {
          toast({
            variant: "destructive",
            title: "Plan Limit Reached",
            description: "Redirecting you to choose a plan...",
          });
          setTimeout(() => router.push("/ads-seller/plans?reason=limit"), 1500);
          return;
        }
        toast({
          variant: "destructive",
          title: "Failed to Post Ad",
          description: result.error || "Failed to submit classified ad",
        });
        return;
      }

      toast({
        title: "Ad Posted",
        description: result.message || "Your classified ad has been submitted for moderation.",
      });

      router.push("/ads-seller/my-ads");
    } catch (error) {
      console.error("Submit ad error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred during submission.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Post a Classified Ad</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Publish your item or service to the TryMe marketplace in 4 simple steps.
        </p>
      </div>

      {/* Step Progress indicators */}
      <div className="flex items-center justify-start md:justify-between bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm text-sm font-semibold overflow-x-auto whitespace-nowrap gap-4 md:gap-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className={`flex items-center gap-1.5 shrink-0 ${step >= 1 ? "text-[#FF6600]" : "text-gray-400"}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${step >= 1 ? "bg-[#FF6600] text-white" : "bg-gray-100 text-gray-400"}`}>1</span>
          <span>Category</span>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
        <div className={`flex items-center gap-1.5 shrink-0 ${step >= 2 ? "text-[#FF6600]" : "text-gray-400"}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${step >= 2 ? "bg-[#FF6600] text-white" : "bg-gray-100 text-gray-400"}`}>2</span>
          <span>Location</span>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
        <div className={`flex items-center gap-1.5 shrink-0 ${step >= 3 ? "text-[#FF6600]" : "text-gray-400"}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${step >= 3 ? "bg-[#FF6600] text-white" : "bg-gray-100 text-gray-400"}`}>3</span>
          <span>Specifications</span>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
        <div className={`flex items-center gap-1.5 shrink-0 ${step >= 4 ? "text-[#FF6600]" : "text-gray-400"}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${step >= 4 ? "bg-[#FF6600] text-white" : "bg-gray-100 text-gray-400"}`}>4</span>
          <span>Media & Price</span>
        </div>
      </div>

      {/* Step 1: Category Picker */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="text-center py-6">
            <Megaphone className="h-12 w-12 text-[#FF6600] mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900">Choose Classified Category</h2>
            <p className="text-gray-500 text-xs mt-1">Select the correct subcategory to get appropriate specification forms.</p>
          </div>

          {subCategoryName ? (
            <div className="flex items-center justify-between p-4 border border-orange-100 bg-orange-50/10 rounded-xl">
              <div>
                <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider">Selected Category</span>
                <span className="font-bold text-gray-900">{categoryName} &gt; {subCategoryName}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsCategoryOpen(true)} className="rounded-xl text-xs">
                Change
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Button
                variant="default"
                onClick={() => setIsCategoryOpen(true)}
                className="bg-[#FF6600] hover:bg-[#e65c00] text-white rounded-xl shadow-md font-bold px-6"
              >
                Choose Category
              </Button>
            </div>
          )}

          {subCategoryName && (
            <div className="flex justify-end pt-4 border-t border-gray-50">
              <Button
                variant="default"
                onClick={() => setStep(2)}
                className="bg-black hover:bg-gray-900 text-white rounded-xl font-semibold"
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Location Picker */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="text-center py-6">
            <MapPin className="h-12 w-12 text-[#FF6600] mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900">Where is your item located?</h2>
            <p className="text-gray-500 text-xs mt-1">Providing an accurate location helps local buyers discover your listing.</p>
          </div>

          {district ? (
            <div className="flex items-center justify-between p-4 border border-orange-100 bg-orange-50/10 rounded-xl">
              <div>
                <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider">Selected Location</span>
                <span className="font-bold text-gray-900">{district} {localArea && `> ${localArea}`}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsLocationOpen(true)} className="rounded-xl text-xs">
                Change
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Button
                variant="default"
                onClick={() => setIsLocationOpen(true)}
                className="bg-[#FF6600] hover:bg-[#e65c00] text-white rounded-xl shadow-md font-bold px-6"
              >
                Choose Location
              </Button>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-gray-50">
            <Button variant="ghost" onClick={() => setStep(1)} className="rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back</span>
            </Button>
            {district && (
              <Button
                variant="default"
                onClick={() => setStep(3)}
                className="bg-black hover:bg-gray-900 text-white rounded-xl font-semibold"
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Specifications */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          {/* Breadcrumb info */}
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100 justify-between items-center">
            <div className="flex items-center gap-1">
              <span>{categoryName} &gt; {subCategoryName}</span>
              <button onClick={() => setStep(1)} className="text-[#FF6600] hover:underline ml-1">Edit</button>
            </div>
            <div className="flex items-center gap-1">
              <span>{district} &gt; {localArea}</span>
              <button onClick={() => setStep(2)} className="text-[#FF6600] hover:underline ml-1">Edit</button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-b border-gray-50 pb-2">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[#FF6600]" />
                <span>Specify Item Details</span>
              </h2>
            </div>

            {/* Dynamic Form fields */}
            <DynamicSpecsForm
              fieldDefinitions={fieldDefinitions}
              onChange={setSpecifications}
              initialValues={specifications}
            />

            {/* Title & Description */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <Label htmlFor="ad-title" className="text-sm font-semibold text-gray-800">Ad Title *</Label>
                </div>
                <Input
                  id="ad-title"
                  type="text"
                  placeholder="e.g. Brand New iPhone 15 Pro Max 256GB"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl border-gray-200"
                />
                <p className="text-[10px] text-gray-400">Keep it short, clear, and descriptive.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ad-description" className="text-sm font-semibold text-gray-800">Description *</Label>
                <Textarea
                  id="ad-description"
                  placeholder="Write a detailed description of your item, specifying conditions, usage history, features, accessories included, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[150px] rounded-xl border-gray-200"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-50">
            <Button variant="ghost" onClick={() => setStep(2)} className="rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back</span>
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (!title.trim() || !description.trim()) {
                  toast({
                    variant: "destructive",
                    title: "Validation Error",
                    description: "Please fill in the title and description.",
                  });
                  return;
                }
                setStep(4);
              }}
              className="bg-black hover:bg-gray-900 text-white rounded-xl font-semibold"
            >
              <span>Continue</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Images & Pricing */}
      {step === 4 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="space-y-5">
            {/* Price section */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5 border-b border-gray-50 pb-2">
                <DollarSign className="h-4 w-4 text-[#FF6600]" />
                <span>Price details</span>
              </h2>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800">Contact for Price</span>
                    <span className="text-[10px] text-gray-400 font-medium">Hide the price and request buyers to call you</span>
                  </div>
                  <Switch
                    checked={contactForPrice}
                    onCheckedChange={(checked) => {
                      setContactForPrice(checked);
                      if (checked) setPrice("");
                    }}
                    className="data-[state=checked]:bg-[#FF6600]"
                  />
                </div>

                {!contactForPrice && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="ad-price" className="text-xs font-bold text-gray-500 uppercase tracking-wide">Price (LKR) *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">Rs.</span>
                        <Input
                          id="ad-price"
                          type="number"
                          placeholder="Enter price"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="pl-9 rounded-xl border-gray-200"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        id="ad-negotiable"
                        type="checkbox"
                        checked={priceNegotiable}
                        onChange={(e) => setPriceNegotiable(e.target.checked)}
                        className="rounded border-gray-300 text-[#FF6600] focus:ring-[#FF6600] h-4 w-4"
                      />
                      <Label htmlFor="ad-negotiable" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                        Price is negotiable
                      </Label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Image uploads */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                <UploadCloud className="h-4.5 w-4.5 text-[#FF6600]" />
                <span>Upload Photos (Up to 6) *</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Upload Button */}
                {images.length < 6 && (
                  <label className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer hover:border-orange-100 hover:bg-orange-50/10 min-h-[110px] transition-colors relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-[#FF6600]" />
                    ) : (
                      <>
                        <UploadCloud className="h-6 w-6 text-gray-400 mb-1" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Add Photo</span>
                      </>
                    )}
                  </label>
                )}

                {/* Thumbnails */}
                {images.map((url, index) => (
                  <div key={url} className="border border-gray-100 rounded-2xl overflow-hidden min-h-[110px] relative group bg-gray-50">
                    <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black text-white rounded-full transition-colors shadow-sm"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <span className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-md font-semibold">
                      {index === 0 ? "Cover" : `Photo ${index + 1}`}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400">Supported formats: JPG, PNG. Max file size: 5MB. Upload high-quality, real photos of your items.</p>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-gray-50">
            <Button variant="ghost" onClick={() => setStep(3)} className="rounded-xl">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Back</span>
            </Button>
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={isSubmitting || isUploading}
              className="bg-[#FF6600] hover:bg-[#e65c00] text-white rounded-xl shadow-lg font-bold px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 mr-2 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Classified Ad</span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Pickers Modal Dialogs */}
      <CategoryPicker
        isOpen={isCategoryOpen}
        onClose={() => setIsCategoryOpen(false)}
        onSelect={handleCategorySelect}
      />
      <LocationPicker
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        onSelect={handleLocationSelect}
      />
    </div>
  );
}
