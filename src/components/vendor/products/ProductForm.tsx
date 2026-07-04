"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, FileText, X, Eye, Ruler, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CategorySelector } from "@/components/admin/categories/CategorySelector";
import { LinkedCategorySelector } from "./LinkedCategorySelector";
import { ImageUploader } from "./ImageUploader";
import { ImageGallery } from "./ImageGallery";
import { VariantManager, ProductVariant, type VariantSettingsInfo } from "./VariantManager";
import type { ProductFormData } from "@/types/product";
import { createProductSchema } from "@/lib/validations/product";
import { compressImage } from "@/lib/utils/image";

interface ProductFormProps {
  mode: "create" | "edit";
  initialData?: Partial<ProductFormData> & { id?: string };
  onSuccess?: () => void;
}

export function ProductForm({ mode, initialData, onSuccess }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingSizeChart, setIsUploadingSizeChart] = useState(false);

  const handleSizeChartFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Only Images are supported for size charts",
      });
      return;
    }

    setIsUploadingSizeChart(true);
    try {
      const compressedFile = await compressImage(file);

      if (compressedFile.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: "File size must be less than 5MB",
        });
        setIsUploadingSizeChart(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("folder", "size-charts");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: result.error || "Failed to upload size chart",
        });
        return;
      }

      form.setValue("sizeChart", result.data.url, { shouldDirty: true });
      toast({
        title: "Success",
        description: "Size guide uploaded successfully",
      });
    } catch (error) {
      console.error("Size chart upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: "An unexpected error occurred during upload",
      });
    } finally {
      setIsUploadingSizeChart(false);
      e.target.value = "";
    }
  };

  // Local state for images and variants (held outside RHF to avoid continuous re-renders of the whole form)
  const [images, setImages] = useState<ProductFormData["images"]>(
    initialData?.images || []
  );
  const [variants, setVariants] = useState<ProductVariant[]>(
    initialData?.variants || []
  );

  // Derive initial variant settings from existing data
  const [variantSettings, setVariantSettings] = useState<VariantSettingsInfo>(() => {
    const hasVariants = (initialData?.variants?.length ?? 0) > 0;
    const variantPrices = initialData?.variants?.map(v => Number(v.priceAdjustment) || 0) || [];
    const pricesVary = hasVariants && variantPrices.some(p => p !== variantPrices[0]);

    return {
      hasVariants,
      pricesVary,
      quantitiesVary: hasVariants, // Usually true if we have variants
      typeNames: hasVariants ? initialData?.variants?.[0]?.name.split(" / ") || [] : [],
    };
  });

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      categoryId: initialData?.categoryId || "",
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      compareAtPrice: initialData?.compareAtPrice,
      sku: initialData?.sku || "",
      stock: initialData?.stock || 0,
      lowStockThreshold: initialData?.lowStockThreshold || 5,
      images: initialData?.images || [],
      variants: initialData?.variants || [],
      sizeChart: initialData?.sizeChart || "",
    },
  });

  // CRITICAL: Sync form with initialData when it arrives (or changes)
  useEffect(() => {
    if (initialData && mode === "edit") {
      const hasVariants = (initialData.variants?.length ?? 0) > 0;
      const variantPrices = initialData.variants?.map(v => Number(v.priceAdjustment) || 0) || [];
      const pricesVary = hasVariants && variantPrices.some(p => p !== variantPrices[0]);

      // Reset RHF internal state
      form.reset({
        categoryId: initialData.categoryId || "",
        name: initialData.name || "",
        description: initialData.description || "",
        price: initialData.price || 0,
        compareAtPrice: initialData.compareAtPrice,
        sku: initialData.sku || "",
        stock: initialData.stock || 0,
        lowStockThreshold: initialData.lowStockThreshold || 5,
        images: initialData.images || [],
        variants: initialData.variants || [],
        sizeChart: initialData.sizeChart || "",
      });

      // Update local states
      setImages(initialData.images || []);
      setVariants(initialData.variants || []);
      setVariantSettings({
        hasVariants,
        pricesVary,
        quantitiesVary: hasVariants,
        typeNames: hasVariants ? initialData.variants?.[0]?.name.split(" / ") || [] : [],
      });
    }
  }, [initialData, mode, form]);

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form.formState.isDirty]);

  const handleImagesUploaded = (newImages: ProductFormData["images"]) => {
    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    form.setValue("images", updatedImages, { shouldDirty: true });
  };

  const handleImagesReordered = (reorderedImages: ProductFormData["images"]) => {
    setImages(reorderedImages);
    form.setValue("images", reorderedImages, { shouldDirty: true });
  };

  const handleImageDelete = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    // Re-index positions
    const reindexed = updatedImages.map((img, idx) => ({
      ...img,
      position: idx,
    }));
    setImages(reindexed);
    form.setValue("images", reindexed, { shouldDirty: true });
  };

  const handleVariantsChange = (newVariants: ProductVariant[]) => {
    setVariants(newVariants);
    form.setValue("variants", newVariants, { shouldDirty: true });
  };

  // Intercept form submission so we can derive the base price from variants
  // at submit time — NOT during typing (which caused premature wrong prices).
  const handleFormSubmit = (isDraft: boolean = false) => {
    if (variantSettings.hasVariants && variants.length > 0) {
      const currentBase = form.getValues("price") || 0;
      if (currentBase < 0.01) {
        // priceAdjustment was computed with basePrice=0, so it equals the absolute price
        const absolutePrices = variants.map((v) => v.priceAdjustment ?? 0);
        const minAbsolutePrice = Math.min(...absolutePrices);

        if (minAbsolutePrice < 0.01) {
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Variant prices must be at least Rs. 0.01",
          });
          return;
        }

        // Set base price = lowest variant price, recompute adjustments relative to it
        form.setValue("price", minAbsolutePrice, { shouldValidate: false });
        const adjustedVariants = variants.map((v, i) => ({
          ...v,
          priceAdjustment: absolutePrices[i] - minAbsolutePrice,
        }));
        setVariants(adjustedVariants);
        form.setValue("variants", adjustedVariants, { shouldValidate: false });
      }
    }

    form.handleSubmit((data) => onSubmit(data, isDraft))();
  };

  const onSubmit = async (data: ProductFormData, isDraft = false) => {
    // Validate images
    if (images.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "At least one product image is required",
      });
      return;
    }

    // Validate variants if any
    if (data.variants && data.variants.length > 0) {
      const invalidVariants = data.variants.filter(
        (v) => !v.name || !v.value || v.stock < 0
      );
      if (invalidVariants.length > 0) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "All variants must have name, value, and valid stock",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...data,
        isDraft: isDraft,
        images: data.images,
        variants: data.variants && data.variants.length > 0 ? data.variants : undefined,
      };

      const url =
        mode === "create"
          ? "/api/vendor/products"
          : `/api/vendor/products/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || `Failed to ${mode} product`,
        });
        return;
      }

      toast({
        title: "Success",
        description: `Product ${mode === "create" ? "created" : "updated"} successfully`,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/vendor/products");
      }
    } catch (error) {
      console.error(`Error ${mode}ing product:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleFormSubmit(false);
        }}
        className="space-y-8"
      >
        {/* Basic Information Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Basic Information</h2>
            <p className="text-muted-foreground">
              Essential product details and category
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Premium Cotton T-Shirt"
                      {...field}
                      maxLength={200}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/200 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <FormControl>
                    <LinkedCategorySelector
                      value={field.value}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SKU */}
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU (Stock Keeping Unit)</FormLabel>
                  <FormControl>
                    <Input placeholder="TSHIRT-001" {...field} maxLength={100} />
                  </FormControl>
                  <FormDescription>Optional unique identifier</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed product description..."
                      className="resize-none"
                      rows={5}
                      {...field}
                      maxLength={5000}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/5000 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Pricing Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Pricing</h2>
            <p className="text-muted-foreground">Set product pricing</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (Rs.) *</FormLabel>
                  {variantSettings.hasVariants ? (
                    <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                      <p className="font-medium text-muted-foreground">
                        {variantSettings.pricesVary
                          ? `Prices vary for each ${variantSettings.typeNames.join(" and ")}`
                          : `Price is set in variations`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Edit in variations ↓
                      </p>
                    </div>
                  ) : (
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="999.99"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Compare At Price */}
            <FormField
              control={form.control}
              name="compareAtPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compare at Price (Rs.)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="1499.99"
                      value={field.value || ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Original price for showing discounts
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Inventory Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Inventory</h2>
            <p className="text-muted-foreground">Manage stock levels</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stock */}
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity *</FormLabel>
                  {variantSettings.hasVariants ? (
                    <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                      <p className="font-medium text-muted-foreground">
                        {variantSettings.quantitiesVary
                          ? `Quantities vary for each ${variantSettings.typeNames.join(" and ")}`
                          : `Stock is set in variations`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Edit in variations ↓
                      </p>
                    </div>
                  ) : (
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="100"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                  )}
                  <FormDescription>
                    {!variantSettings.hasVariants && "Available quantity"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Low Stock Threshold */}
            <FormField
              control={form.control}
              name="lowStockThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Low Stock Alert Threshold</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="5"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Get alerts when stock falls below this level
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Images Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Product Images *</h2>
            <p className="text-muted-foreground">
              Upload and arrange product photos (1-10 images)
            </p>
          </div>

          <ImageUploader
            onImagesUploaded={handleImagesUploaded}
            currentImageCount={images.length}
            maxImages={10}
          />

          {images.length > 0 && (
            <ImageGallery
              images={images}
              onReorder={handleImagesReordered}
              onDelete={handleImageDelete}
              minImages={0}
            />
          )}

          {images.length === 0 && (
            <p className="text-sm text-destructive">
              At least one image is required
            </p>
          )}
        </div>

        <Separator />

        {/* Size Guide Section */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Size Guide</h2>
            </div>
            <p className="text-muted-foreground">
              Optional: Add a size chart image so customers can find their perfect fit
            </p>
          </div>

          <FormField
            control={form.control}
            name="sizeChart"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel>Size Guide Image</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {!field.value ? (
                      <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 hover:bg-accent/50 cursor-pointer transition-colors relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSizeChartFileChange}
                          disabled={isUploadingSizeChart}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center justify-center text-center space-y-2 pointer-events-none">
                          {isUploadingSizeChart ? (
                            <>
                              <Loader2 className="h-8 w-8 text-primary animate-spin" />
                              <p className="text-sm font-medium text-muted-foreground">Uploading size chart...</p>
                            </>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-muted-foreground" />
                              <p className="text-sm font-medium text-muted-foreground">
                                Click or drag to upload a size chart image
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Supports JPEG, PNG or WEBP (max 5MB)
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 text-primary rounded">
                            <Ruler className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold truncate max-w-[250px] md:max-w-md">
                              {field.value.split("/").pop() || "Size Guide Image"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Image File
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a
                              href={field.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5"
                            >
                              <Eye className="h-4 w-4" />
                              Preview
                            </a>
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => field.onChange("")}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Variants Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Product Variants</h2>
            <p className="text-muted-foreground">
              Optional: Add size, color, or other variations
            </p>
          </div>

          <VariantManager
            variants={variants}
            onChange={handleVariantsChange}
            basePrice={form.watch("price") || 0}
            productImages={images}
            onSettingsChange={setVariantSettings}
          />
        </div>

        <Separator />

        {/* Form Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleFormSubmit(true)}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save as Draft
          </Button>

          <Button type="submit" onClick={(e) => { e.preventDefault(); handleFormSubmit(false); }} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Create Product" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
