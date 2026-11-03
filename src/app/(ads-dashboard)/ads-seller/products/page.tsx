"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { BarcodeGeneratorModal } from "@/components/products/BarcodeGeneratorModal";
import {
  Package,
  Plus,
  Search,
  ScanBarcode,
  Layers,
  AlertTriangle,
  ExternalLink,
  Store,
  Globe,
  Loader2,
  Trash2,
  Edit,
  CheckCircle,
  Eye,
  Tag,
  UploadCloud,
  X,
  RefreshCw,
  ShoppingBag,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { compressImage } from "@/lib/utils/image";

interface ProductItem {
  id: string;
  name: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  sku: string;
  barcode: string;
  stock: number;
  categoryName: string;
  categoryId: string;
  subCategoryName: string;
  subCategoryId?: string;
  images: string[];
  imageUrl: string | null;
  variants: Array<{
    id: string;
    name: string;
    value: string;
    sku: string;
    barcode: string;
    stock: number;
    price: number;
    priceAdjustment?: number;
    imageUrl?: string | null;
  }>;
  isStandalone: boolean;
  source: "AD" | "DIRECT";
  showOnWebsite: boolean;
  showOnMarketplace: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CategoryOption {
  id: string;
  name: string;
  subCategories: Array<{ id: string; name: string }>;
}

export default function AdsSellerProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<"all" | "marketplace" | "website" | "low_stock">("all");

  // Create Product Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newComparePrice, setNewComparePrice] = useState("");
  const [newStock, setNewStock] = useState("10");
  const [newSku, setNewSku] = useState("");
  const [newBarcode, setNewBarcode] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newSubCategoryId, setNewSubCategoryId] = useState("");
  const [newImages, setNewImages] = useState<string[]>([]);
  const [newShowWebsite, setNewShowWebsite] = useState(true);
  const [newShowMarketplace, setNewShowMarketplace] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Edit Modal State
  const [editProduct, setEditProduct] = useState<ProductItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editBarcode, setEditBarcode] = useState("");
  const [editShowWebsite, setEditShowWebsite] = useState(true);
  const [editShowMarketplace, setEditShowMarketplace] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete State
  const [deleteProduct, setDeleteProduct] = useState<ProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggling state tracker
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Fetch Products
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ads-seller/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data.products || []);
        setCategories(data.data.categories || []);
        if (data.data.categories?.length > 0 && !newCategoryId) {
          setNewCategoryId(data.data.categories[0].id);
          if (data.data.categories[0].subCategories?.length > 0) {
            setNewSubCategoryId(data.data.categories[0].subCategories[0].id);
          }
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error loading products",
          description: data.error || "Failed to load inventory",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: err.message || "Failed to reach server",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === "all" || p.categoryId === selectedCategory;

      let matchesTab = true;
      if (activeTab === "marketplace") {
        matchesTab = p.showOnMarketplace;
      } else if (activeTab === "website") {
        matchesTab = p.showOnWebsite;
      } else if (activeTab === "low_stock") {
        matchesTab = p.stock <= 5;
      }

      return matchesSearch && matchesCategory && matchesTab;
    });
  }, [products, search, selectedCategory, activeTab]);

  // Stats
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.status === "ACTIVE").length;
    const lowStock = products.filter((p) => p.stock <= 5).length;
    const marketplaceLive = products.filter((p) => p.showOnMarketplace).length;
    const websiteLive = products.filter((p) => p.showOnWebsite).length;
    return { total, active, lowStock, marketplaceLive, websiteLive };
  }, [products]);

  // Channel Toggle Handler
  const handleToggleChannel = async (
    productId: string,
    channel: "marketplace" | "website",
    currentVal: boolean
  ) => {
    const newVal = !currentVal;
    setTogglingId(`${productId}-${channel}`);

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              showOnMarketplace: channel === "marketplace" ? newVal : p.showOnMarketplace,
              showOnWebsite: channel === "website" ? newVal : p.showOnWebsite,
            }
          : p
      )
    );

    try {
      const res = await fetch(`/api/ads-seller/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [channel === "marketplace" ? "showOnMarketplace" : "showOnWebsite"]: newVal,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Update failed");
      }
      toast({
        title: "Channel Updated",
        description: `${channel === "marketplace" ? "TryMe Marketplace" : "Website"} visibility set to ${
          newVal ? "LIVE" : "OFF"
        }.`,
      });
    } catch (err: any) {
      // Revert optimistic update
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                showOnMarketplace: channel === "marketplace" ? currentVal : p.showOnMarketplace,
                showOnWebsite: channel === "website" ? currentVal : p.showOnWebsite,
              }
            : p
        )
      );
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message || "Failed to update channel",
      });
    } finally {
      setTogglingId(null);
    }
  };

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (newImages.length + files.length > 5) {
      toast({
        variant: "destructive",
        title: "Limit Exceeded",
        description: "You can upload a maximum of 5 images per product.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const compressedFile = await compressImage(file);
        const formData = new FormData();
        formData.append("file", compressedFile);
        formData.append("folder", "products");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || "Upload failed");
        }
        return result.data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setNewImages((prev) => [...prev, ...uploadedUrls]);
      toast({
        title: "Images Uploaded",
        description: `${uploadedUrls.length} image(s) uploaded successfully.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err.message || "Could not upload image",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Create Product Submit
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast({ variant: "destructive", title: "Product name required" });
      return;
    }
    if (!newPrice || isNaN(Number(newPrice)) || Number(newPrice) < 0) {
      toast({ variant: "destructive", title: "Valid price required" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/ads-seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTitle.trim(),
          description: newDescription.trim() || newTitle.trim(),
          price: Number(newPrice),
          compareAtPrice: newComparePrice ? Number(newComparePrice) : null,
          stock: parseInt(newStock) || 0,
          sku: newSku.trim() || undefined,
          barcode: newBarcode.trim() || undefined,
          categoryId: newCategoryId || undefined,
          subCategoryId: newSubCategoryId || undefined,
          images: newImages,
          showOnWebsite: newShowWebsite,
          showOnMarketplace: newShowMarketplace,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create product");
      }

      toast({
        title: "Product Created!",
        description: `"${newTitle}" added to inventory with Barcode and POS support.`,
      });

      // Reset form
      setNewTitle("");
      setNewDescription("");
      setNewPrice("");
      setNewComparePrice("");
      setNewStock("10");
      setNewSku("");
      setNewBarcode("");
      setNewImages([]);
      setIsCreateOpen(false);

      // Refresh list
      fetchProducts();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: err.message || "Could not create product",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Dialog
  const handleOpenEdit = (p: ProductItem) => {
    setEditProduct(p);
    setEditPrice(p.price.toString());
    setEditStock(p.stock.toString());
    setEditSku(p.sku);
    setEditBarcode(p.barcode);
    setEditShowWebsite(p.showOnWebsite);
    setEditShowMarketplace(p.showOnMarketplace);
    setIsEditOpen(true);
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editProduct) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/ads-seller/products/${editProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: Number(editPrice),
          stock: parseInt(editStock) || 0,
          sku: editSku.trim(),
          barcode: editBarcode.trim(),
          showOnWebsite: editShowWebsite,
          showOnMarketplace: editShowMarketplace,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update product");
      }

      toast({
        title: "Saved",
        description: `Updated product "${editProduct.name}".`,
      });

      setProducts((prev) =>
        prev.map((item) =>
          item.id === editProduct.id
            ? {
                ...item,
                price: Number(editPrice),
                stock: parseInt(editStock) || 0,
                sku: editSku.trim(),
                barcode: editBarcode.trim(),
                showOnWebsite: editShowWebsite,
                showOnMarketplace: editShowMarketplace,
              }
            : item
        )
      );
      setIsEditOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message || "Failed to save product changes",
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Action
  const handleDeleteProduct = async () => {
    if (!deleteProduct) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/ads-seller/products/${deleteProduct.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to delete product");
      }
      toast({
        title: "Product Removed",
        description: `"${deleteProduct.name}" removed from inventory.`,
      });
      setProducts((prev) => prev.filter((p) => p.id !== deleteProduct.id));
      setDeleteProduct(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: err.message || "Could not delete product",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Products & Inventory
            </h1>
            <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs font-bold">
              Auto-Synced
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage your ads catalog, standalone products, barcodes, real-time stock, and marketplace checkout.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            asChild
            className="border-gray-200 hover:bg-gray-50 font-semibold text-xs sm:text-sm h-10 rounded-xl"
          >
            <Link href="/ads-seller/pos">
              <ScanBarcode className="h-4 w-4 mr-1.5 text-orange-600" />
              Open POS
            </Link>
          </Button>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold text-xs sm:text-sm h-10 rounded-xl shadow-md transition-all"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Product
          </Button>
        </div>
      </div>

      {/* TryMe Commission Info Banner */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-[#FF6600] flex items-center justify-center shrink-0">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <span>TryMe Marketplace Online Checkout & Commission</span>
              <span className="text-[10px] bg-orange-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                Active
              </span>
            </h4>
            <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5">
              Items marked <span className="font-semibold text-orange-700">Live</span> on TryMe Marketplace allow direct customer online checkout. Standard platform commission applies on successful marketplace sales.
            </p>
          </div>
        </div>
        <Link
          href="/ads-seller/storefront"
          className="text-xs font-bold text-[#FF6600] hover:underline flex items-center gap-1 shrink-0"
        >
          View Storefront
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>Total Catalog</span>
            <Package className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-black text-gray-900 mt-2">{stats.total}</div>
          <div className="text-[11px] text-gray-400 mt-1">Ads + Standalone items</div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>Marketplace Live</span>
            <Store className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-orange-600 mt-2">{stats.marketplaceLive}</div>
          <div className="text-[11px] text-gray-400 mt-1">Online buy enabled</div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>Website Live</span>
            <Globe className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">{stats.websiteLive}</div>
          <div className="text-[11px] text-gray-400 mt-1">Shown on your site</div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold">
            <span>Low Stock</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{stats.lowStock}</div>
          <div className="text-[11px] text-gray-400 mt-1">Stock ≤ 5 units</div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search products by title, SKU, barcode, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-gray-50/70 border-gray-200 focus:bg-white text-sm"
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full md:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-10 px-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600]"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh */}
          <Button
            variant="outline"
            size="icon"
            onClick={fetchProducts}
            disabled={isLoading}
            className="h-10 w-10 rounded-xl shrink-0 border-gray-200"
            title="Refresh List"
          >
            <RefreshCw className={`h-4 w-4 text-gray-600 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Tab Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 pt-1 text-xs">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "all"
                ? "bg-gray-900 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Items ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("marketplace")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "marketplace"
                ? "bg-orange-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Store className="h-3 w-3" />
            Marketplace Live ({stats.marketplaceLive})
          </button>
          <button
            onClick={() => setActiveTab("website")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "website"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Globe className="h-3 w-3" />
            Website Live ({stats.websiteLive})
          </button>
          <button
            onClick={() => setActiveTab("low_stock")}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "low_stock"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            Low Stock ({stats.lowStock})
          </button>
        </div>
      </div>

      {/* Products Table (Desktop & Tablet) & Cards (Mobile) */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF6600] mx-auto" />
            <p className="text-sm font-semibold text-gray-500">Loading catalog items...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-4 px-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
              <Package className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">No products found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {search || selectedCategory !== "all" || activeTab !== "all"
                  ? "Try resetting filters or searching with different keywords."
                  : "You haven't added any products or ads yet. Create your first product or post an ad to begin!"}
              </p>
            </div>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-[#FF6600] hover:bg-[#e65c00] text-white text-xs font-bold rounded-xl h-9"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create Product Now
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-black uppercase tracking-wider text-gray-400">
                    <th className="py-3 px-4 w-14">Image</th>
                    <th className="py-3 px-4">Product Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Channels</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredProducts.map((p) => {
                    const isMktgToggling = togglingId === `${p.id}-marketplace`;
                    const isWebToggling = togglingId === `${p.id}-website`;

                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        {/* Image */}
                        <td className="py-3 px-4">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden relative shrink-0">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Title & SKU */}
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-gray-900 line-clamp-1">{p.name}</div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 font-mono">
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                              SKU: {p.sku}
                            </span>
                            <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded font-mono">
                              ||| {p.barcode}
                            </span>
                          </div>
                          <div className="mt-1">
                            {p.source === "DIRECT" ? (
                              <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[9px] font-bold py-0 h-4">
                                Direct Product
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] font-bold py-0 h-4">
                                From Ad
                              </Badge>
                            )}
                            {p.variants.length > 0 && (
                              <span className="ml-1.5 text-[10px] text-gray-400 font-bold">
                                ({p.variants.length} vars)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 text-xs font-semibold text-gray-600">
                          {p.categoryName}
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4 font-bold text-gray-900">
                          Rs. {p.price.toLocaleString("en-LK")}
                          {p.compareAtPrice && p.compareAtPrice > p.price && (
                            <div className="text-[11px] text-gray-400 line-through font-normal">
                              Rs. {p.compareAtPrice.toLocaleString("en-LK")}
                            </div>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                p.stock <= 0
                                  ? "bg-red-100 text-red-700"
                                  : p.stock <= 5
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {p.stock} in stock
                            </span>
                          </div>
                        </td>

                        {/* Channels */}
                        <td className="py-3 px-4">
                          <div className="space-y-1.5">
                            {/* Website Channel */}
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="text-gray-500 text-[11px] font-medium flex items-center gap-1">
                                <Globe className="h-3 w-3 text-blue-500" />
                                Website:
                              </span>
                              <button
                                onClick={() => handleToggleChannel(p.id, "website", p.showOnWebsite)}
                                disabled={isWebToggling}
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${
                                  p.showOnWebsite
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                                    : "bg-gray-100 text-gray-400 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700"
                                }`}
                              >
                                {isWebToggling ? "..." : p.showOnWebsite ? "Live" : "Off"}
                              </button>
                            </div>

                            {/* Marketplace Channel */}
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="text-gray-500 text-[11px] font-medium flex items-center gap-1">
                                <Store className="h-3 w-3 text-[#FF6600]" />
                                TryMe:
                              </span>
                              <button
                                onClick={() => handleToggleChannel(p.id, "marketplace", p.showOnMarketplace)}
                                disabled={isMktgToggling}
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${
                                  p.showOnMarketplace
                                    ? "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                                    : "bg-gray-100 text-gray-400 border border-gray-200 hover:bg-orange-50 hover:text-orange-700"
                                }`}
                              >
                                {isMktgToggling ? "..." : p.showOnMarketplace ? "Live" : "Off"}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Barcode & Print Modal */}
                            <BarcodeGeneratorModal
                              product={{
                                id: p.id,
                                name: p.name,
                                sku: p.sku,
                                price: p.price,
                                variants: p.variants.map((v) => ({
                                  id: v.id,
                                  name: v.name,
                                  value: v.value,
                                  sku: v.sku,
                                  barcode: v.barcode,
                                  stock: v.stock,
                                  priceAdjustment: v.priceAdjustment,
                                })),
                              }}
                              triggerButton={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2.5 rounded-lg border-gray-200 hover:bg-orange-50 hover:text-[#FF6600] hover:border-orange-200 text-xs font-bold"
                                  title="Generate Barcode & Print Labels"
                                >
                                  <ScanBarcode className="h-3.5 w-3.5 mr-1 text-[#FF6600]" />
                                  Barcode
                                </Button>
                              }
                            />

                            {/* Edit Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(p)}
                              className="h-8 w-8 rounded-lg hover:bg-gray-100 text-gray-600"
                              title="Edit Stock & Pricing"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>

                            {/* View on Marketplace */}
                            {p.showOnMarketplace && (
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="h-8 w-8 rounded-lg hover:bg-gray-100 text-gray-600"
                                title="View on TryMe Marketplace"
                              >
                                <Link href={`/marketplace/${p.id}`} target="_blank">
                                  <Eye className="h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            )}

                            {/* Delete Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteProduct(p)}
                              className="h-8 w-8 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                              title="Delete Product"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (Responsive) */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredProducts.map((p) => (
                <div key={p.id} className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-sm line-clamp-1">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.categoryName}</div>
                      <div className="font-black text-[#FF6600] text-sm mt-0.5">
                        Rs. {p.price.toLocaleString("en-LK")}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 font-mono text-[10px] text-gray-500">
                        <span>SKU: {p.sku}</span>
                        <span>•</span>
                        <span>Stock: {p.stock}</span>
                      </div>
                    </div>
                  </div>

                  {/* Channel toggles on mobile */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500">Website:</span>
                      <button
                        onClick={() => handleToggleChannel(p.id, "website", p.showOnWebsite)}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          p.showOnWebsite
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {p.showOnWebsite ? "Live" : "Off"}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500">TryMe:</span>
                      <button
                        onClick={() => handleToggleChannel(p.id, "marketplace", p.showOnMarketplace)}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          p.showOnMarketplace
                            ? "bg-orange-50 text-orange-700 border border-orange-200"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {p.showOnMarketplace ? "Live" : "Off"}
                      </button>
                    </div>
                  </div>

                  {/* Action buttons on mobile */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50">
                    <BarcodeGeneratorModal
                      product={{
                        id: p.id,
                        name: p.name,
                        sku: p.sku,
                        price: p.price,
                        variants: p.variants.map((v) => ({
                          id: v.id,
                          name: v.name,
                          value: v.value,
                          sku: v.sku,
                          barcode: v.barcode,
                          stock: v.stock,
                          priceAdjustment: v.priceAdjustment,
                        })),
                      }}
                      triggerButton={
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 rounded-lg border-gray-200 text-xs font-bold"
                        >
                          <ScanBarcode className="h-3.5 w-3.5 mr-1 text-[#FF6600]" />
                          Barcode
                        </Button>
                      }
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(p)}
                      className="h-8 px-2.5 rounded-lg border-gray-200 text-xs font-bold"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteProduct(p)}
                      className="h-8 w-8 rounded-lg text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* CREATE PRODUCT MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-[#FF6600]" />
              Create New Product
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Add a standalone product or item to your store. It will automatically be available in your POS system and can be printed with barcodes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProduct} className="space-y-4 pt-2">
            {/* Title */}
            <div>
              <Label className="text-xs font-bold text-gray-700">Product Name *</Label>
              <Input
                required
                placeholder="e.g. Leather Wallet / Cotton T-Shirt"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="mt-1 h-10 rounded-xl"
              />
            </div>

            {/* Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-gray-700">Category *</Label>
                <select
                  value={newCategoryId}
                  onChange={(e) => {
                    setNewCategoryId(e.target.value);
                    const selected = categories.find((c) => c.id === e.target.value);
                    if (selected?.subCategories?.length) {
                      setNewSubCategoryId(selected.subCategories[0].id);
                    }
                  }}
                  className="w-full h-10 px-3 mt-1 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-700"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-bold text-gray-700">Subcategory</Label>
                <select
                  value={newSubCategoryId}
                  onChange={(e) => setNewSubCategoryId(e.target.value)}
                  className="w-full h-10 px-3 mt-1 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-700"
                >
                  {categories
                    .find((c) => c.id === newCategoryId)
                    ?.subCategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Price & Compare Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-gray-700">Selling Price (Rs.) *</Label>
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="2500"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="mt-1 h-10 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-gray-700">Compare at Price (Rs.)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="3000 (optional)"
                  value={newComparePrice}
                  onChange={(e) => setNewComparePrice(e.target.value)}
                  className="mt-1 h-10 rounded-xl"
                />
              </div>
            </div>

            {/* Stock, SKU, Barcode */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-bold text-gray-700">Opening Stock *</Label>
                <Input
                  required
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="mt-1 h-10 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-gray-700">SKU</Label>
                <Input
                  placeholder="Auto if empty"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  className="mt-1 h-10 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-gray-700">Barcode</Label>
                <Input
                  placeholder="Auto if empty"
                  value={newBarcode}
                  onChange={(e) => setNewBarcode(e.target.value)}
                  className="mt-1 h-10 rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs font-bold text-gray-700">Description</Label>
              <Textarea
                rows={2}
                placeholder="Product description and details..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="mt-1 rounded-xl text-xs sm:text-sm"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700">Product Images (up to 5)</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {newImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={img} alt="Product" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-80 hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {newImages.length < 5 && (
                  <label className="border-2 border-dashed border-gray-200 hover:border-orange-200 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-orange-50/10">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-[#FF6600]" />
                    ) : (
                      <>
                        <UploadCloud className="h-5 w-5 text-gray-400 mb-1" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Add Photo</span>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>

            {/* Channel Visibility Switches */}
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-blue-600" />
                    Show on My Website
                  </div>
                  <div className="text-[11px] text-gray-500">Display this item on your personal storefront</div>
                </div>
                <Switch checked={newShowWebsite} onCheckedChange={setNewShowWebsite} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50/60 border border-orange-100">
                <div>
                  <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-[#FF6600]" />
                    List on TryMe Marketplace (Online Buy)
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Allow TryMe customers to purchase this item online (Platform commission applies)
                  </div>
                </div>
                <Switch checked={newShowMarketplace} onCheckedChange={setNewShowMarketplace} />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl h-10 font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="bg-[#FF6600] hover:bg-[#e65c00] text-white rounded-xl h-10 font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Product"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-gray-900">
              Edit Inventory & Pricing
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 line-clamp-1">
              {editProduct?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold text-gray-700">Selling Price (Rs.)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="mt-1 h-10 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700">Stock Quantity</Label>
              <Input
                type="number"
                min="0"
                value={editStock}
                onChange={(e) => setEditStock(e.target.value)}
                className="mt-1 h-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-gray-700">SKU</Label>
                <Input
                  value={editSku}
                  onChange={(e) => setEditSku(e.target.value)}
                  className="mt-1 h-10 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-gray-700">Barcode</Label>
                <Input
                  value={editBarcode}
                  onChange={(e) => setEditBarcode(e.target.value)}
                  className="mt-1 h-10 rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">Show on Website</span>
                <Switch checked={editShowWebsite} onCheckedChange={setEditShowWebsite} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-700">Show on TryMe Marketplace</span>
                  <p className="text-[10px] text-gray-400">Commission applies on marketplace online orders</p>
                </div>
                <Switch checked={editShowMarketplace} onCheckedChange={setEditShowMarketplace} />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="rounded-xl h-9 font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSavingEdit}
              className="bg-[#FF6600] hover:bg-[#e65c00] text-white rounded-xl h-9 font-bold"
            >
              {isSavingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-gray-900">
              Delete Product?
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Are you sure you want to remove &quot;{deleteProduct?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3">
            <Button
              variant="outline"
              onClick={() => setDeleteProduct(null)}
              className="rounded-xl h-9 font-bold text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
              disabled={isDeleting}
              className="rounded-xl h-9 font-bold text-xs"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
