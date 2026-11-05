"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  Upload,
  X,
  Loader2,
  FolderTree,
  ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ServiceSubCategoryItem {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  _count?: { services: number };
}

interface ServiceCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  subCategories: ServiceSubCategoryItem[];
  _count?: { services: number };
}

export default function AdminServiceCategoriesPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<ServiceCategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Modal State for Create / Edit Category or Subcategory
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<{
    isSub: boolean;
    data: any;
  } | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formParentId, setFormParentId] = useState<string>("none");
  const [formSortOrder, setFormSortOrder] = useState<string>("0");
  const [formImage, setFormImage] = useState<string | null>(null);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/services/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to load service categories",
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
    fetchCategories();
  }, []);

  const toggleExpand = (catId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  // Open Create Dialog
  const handleOpenCreate = (preselectedParentId?: string) => {
    setEditingTarget(null);
    setFormName("");
    setFormDescription("");
    setFormParentId(preselectedParentId || "none");
    setFormSortOrder("0");
    setFormImage(null);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (item: any, isSub: boolean, parentId?: string) => {
    setEditingTarget({ isSub, data: item });
    setFormName(item.name || "");
    setFormDescription(item.description || "");
    setFormParentId(isSub ? parentId || item.categoryId || "none" : "none");
    setFormSortOrder(String(item.sortOrder ?? 0));
    setFormImage(item.image || null);
    setFormIsActive(item.isActive ?? true);
    setIsModalOpen(true);
  };

  // Upload category image to Cloudinary
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please select a valid image file.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "service-categories");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Upload failed");

      setFormImage(data.data.url);
      toast({ title: "Image Uploaded", description: "Category image uploaded successfully." });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err.message || "Failed to upload image",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Submit Modal (Create or Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Category name is required.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const isSub = formParentId !== "none";

      if (editingTarget) {
        // Editing existing
        if (editingTarget.isSub) {
          // Update Subcategory
          const res = await fetch(`/api/admin/services/subcategories/${editingTarget.data.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: formName.trim(),
              description: formDescription.trim() || null,
              image: formImage,
              sortOrder: parseInt(formSortOrder) || 0,
              isActive: formIsActive,
            }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
        } else {
          // Update Root Category
          const res = await fetch(`/api/admin/services/categories/${editingTarget.data.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: formName.trim(),
              description: formDescription.trim() || null,
              image: formImage,
              sortOrder: parseInt(formSortOrder) || 0,
              isActive: formIsActive,
            }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
        }

        toast({ title: "Success", description: "Category updated successfully." });
      } else {
        // Create New
        if (isSub) {
          // Create Subcategory under parent
          const res = await fetch("/api/admin/services/subcategories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              categoryId: formParentId,
              name: formName.trim(),
              description: formDescription.trim() || null,
              image: formImage,
              sortOrder: parseInt(formSortOrder) || 0,
            }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
        } else {
          // Create Root Category
          const res = await fetch("/api/admin/services/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: formName.trim(),
              description: formDescription.trim() || null,
              image: formImage,
              sortOrder: parseInt(formSortOrder) || 0,
            }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.error);
        }

        toast({ title: "Success", description: "Category created successfully." });
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Category Active Switch
  const handleToggleCategoryStatus = async (cat: ServiceCategoryItem) => {
    const nextStatus = !cat.isActive;
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, isActive: nextStatus } : c))
    );

    try {
      const res = await fetch(`/api/admin/services/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({
        title: "Status Updated",
        description: `Category "${cat.name}" is now ${nextStatus ? "Active" : "Inactive"}.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message,
      });
      fetchCategories();
    }
  };

  // Toggle Subcategory Active Switch
  const handleToggleSubCategoryStatus = async (sub: ServiceSubCategoryItem) => {
    const nextStatus = !sub.isActive;
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === sub.categoryId) {
          return {
            ...c,
            subCategories: c.subCategories.map((s) =>
              s.id === sub.id ? { ...s, isActive: nextStatus } : s
            ),
          };
        }
        return c;
      })
    );

    try {
      const res = await fetch(`/api/admin/services/subcategories/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({
        title: "Status Updated",
        description: `Subcategory "${sub.name}" is now ${nextStatus ? "Active" : "Inactive"}.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message,
      });
      fetchCategories();
    }
  };

  // Delete Root Category
  const handleDeleteCategory = async (cat: ServiceCategoryItem) => {
    if (!confirm(`Are you sure you want to delete "${cat.name}" and all its subcategories?`)) return;

    try {
      const res = await fetch(`/api/admin/services/categories/${cat.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast({ title: "Deleted", description: "Category deleted successfully." });
      fetchCategories();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: err.message,
      });
    }
  };

  // Delete Subcategory
  const handleDeleteSubCategory = async (sub: ServiceSubCategoryItem) => {
    if (!confirm(`Are you sure you want to delete subcategory "${sub.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/services/subcategories/${sub.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast({ title: "Deleted", description: "Subcategory deleted successfully." });
      fetchCategories();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: err.message,
      });
    }
  };

  // Statistics
  const totalRootCategories = categories.length;
  const totalSubCategories = categories.reduce((sum, c) => sum + (c.subCategories?.length || 0), 0);
  const totalCategoriesCount = totalRootCategories + totalSubCategories;
  const activeCategoriesCount =
    categories.filter((c) => c.isActive).length +
    categories.reduce(
      (sum, c) => sum + (c.subCategories?.filter((s) => s.isActive).length || 0),
      0
    );
  const totalServicesCount = categories.reduce(
    (sum, c) => sum + (c._count?.services || 0),
    0
  );

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => {
        if (statusFilter === "active" && !cat.isActive) return false;
        if (statusFilter === "inactive" && cat.isActive) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCat =
            cat.name.toLowerCase().includes(q) ||
            (cat.description && cat.description.toLowerCase().includes(q));
          const matchSub = cat.subCategories?.some(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              (s.description && s.description.toLowerCase().includes(q))
          );
          return matchCat || matchSub;
        }
        return true;
      })
      .map((cat) => {
        if (!searchQuery.trim()) return cat;
        // If searching, also filter subcategories
        const q = searchQuery.toLowerCase();
        return {
          ...cat,
          subCategories: cat.subCategories.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              (s.description && s.description.toLowerCase().includes(q))
          ),
        };
      });
  }, [categories, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Categories</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage service categories and hierarchy
          </p>
        </div>
        <Button
          onClick={() => handleOpenCreate()}
          className="bg-black hover:bg-neutral-800 text-white font-medium shadow-sm transition-all"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Category
        </Button>
      </div>

      {/* Stats Cards (matches screenshot 3) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Categories
          </p>
          <p className="text-3xl font-extrabold text-foreground">{totalCategoriesCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Root Categories
          </p>
          <p className="text-3xl font-extrabold text-blue-600">{totalRootCategories}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active
          </p>
          <p className="text-3xl font-extrabold text-emerald-600">{activeCategoriesCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Services
          </p>
          <p className="text-3xl font-extrabold text-foreground">{totalServicesCount}</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onValueChange={(val: any) => setStatusFilter(val)}
          >
            <SelectTrigger className="w-full sm:w-40 bg-card">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Categories Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-16">Image</TableHead>
              <TableHead className="min-w-[200px]">Category Name</TableHead>
              <TableHead className="w-28 text-center">Type</TableHead>
              <TableHead className="w-24 text-center">Services</TableHead>
              <TableHead className="w-24 text-center">Sub-levels</TableHead>
              <TableHead className="w-24 text-center">Priority</TableHead>
              <TableHead className="w-28 text-center">Status</TableHead>
              <TableHead className="w-16 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                    <span>Loading service categories...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <FolderTree className="h-8 w-8 text-muted-foreground/40" />
                    <p className="font-semibold text-foreground">No categories found</p>
                    <p className="text-xs">Try adjusting your search query or create a new category.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((cat) => {
                const isExpanded = expandedIds.has(cat.id);
                const hasSubs = (cat.subCategories?.length || 0) > 0;

                return (
                  <div key={cat.id} className="contents">
                    {/* Main Category Row */}
                    <TableRow className="hover:bg-muted/40 transition-colors group">
                      {/* Image */}
                      <TableCell className="py-3">
                        <div className="w-11 h-11 rounded-lg border bg-muted/50 overflow-hidden relative flex items-center justify-center shrink-0">
                          {cat.image ? (
                            <Image
                              src={cat.image}
                              alt={cat.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                          )}
                        </div>
                      </TableCell>

                      {/* Name & Expand Chevron */}
                      <TableCell className="py-3">
                        <div className="flex items-start gap-2">
                          {hasSubs ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(cat.id)}
                              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground mt-0.5"
                              title={isExpanded ? "Collapse" : "Expand subcategories"}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <div className="w-6 shrink-0" />
                          )}
                          <div>
                            <p className="font-bold text-foreground text-sm flex items-center gap-2">
                              {cat.name}
                            </p>
                            {cat.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Type Badge */}
                      <TableCell className="text-center py-3">
                        <Badge
                          variant="secondary"
                          className="font-bold text-[10px] px-2.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200 uppercase tracking-wider"
                        >
                          MAIN
                        </Badge>
                      </TableCell>

                      {/* Services Count */}
                      <TableCell className="text-center font-semibold text-sm py-3">
                        {cat._count?.services ?? 0}
                      </TableCell>

                      {/* Sub-levels Count */}
                      <TableCell className="text-center font-semibold text-sm py-3">
                        {cat.subCategories?.length || 0}
                      </TableCell>

                      {/* Priority (Sort Order) */}
                      <TableCell className="text-center font-mono text-sm py-3 text-muted-foreground">
                        {cat.sortOrder ?? 0}
                      </TableCell>

                      {/* Status Switch Toggle */}
                      <TableCell className="text-center py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={cat.isActive}
                            onCheckedChange={() => handleToggleCategoryStatus(cat)}
                          />
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              cat.isActive ? "text-emerald-600" : "text-muted-foreground"
                            }`}
                          >
                            {cat.isActive ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleOpenCreate(cat.id)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Subcategory
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(cat, false)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Category
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteCategory(cat)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Category
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>

                    {/* Subcategories (Indented rows when expanded) */}
                    {isExpanded &&
                      cat.subCategories?.map((sub) => (
                        <TableRow
                          key={sub.id}
                          className="bg-muted/15 hover:bg-muted/30 transition-colors border-l-4 border-l-blue-500"
                        >
                          {/* Image */}
                          <TableCell className="py-2.5 pl-6">
                            <div className="w-9 h-9 rounded-md border bg-muted/60 overflow-hidden relative flex items-center justify-center shrink-0">
                              {sub.image ? (
                                <Image
                                  src={sub.image}
                                  alt={sub.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                              )}
                            </div>
                          </TableCell>

                          {/* Subcategory Name */}
                          <TableCell className="py-2.5 pl-8">
                            <div>
                              <p className="font-semibold text-foreground text-sm">
                                {sub.name}
                              </p>
                              {sub.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {sub.description}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          {/* Type */}
                          <TableCell className="text-center py-2.5">
                            <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[100px] inline-block">
                              {cat.name}
                            </span>
                          </TableCell>

                          {/* Services Count */}
                          <TableCell className="text-center font-medium text-xs text-muted-foreground py-2.5">
                            {sub._count?.services ?? 0}
                          </TableCell>

                          {/* Sub-levels */}
                          <TableCell className="text-center font-medium text-xs text-muted-foreground py-2.5">
                            0
                          </TableCell>

                          {/* Priority */}
                          <TableCell className="text-center font-mono text-xs text-muted-foreground py-2.5">
                            {sub.sortOrder ?? 0}
                          </TableCell>

                          {/* Status Switch Toggle */}
                          <TableCell className="text-center py-2.5">
                            <div className="flex items-center justify-center gap-2">
                              <Switch
                                checked={sub.isActive}
                                onCheckedChange={() => handleToggleSubCategoryStatus(sub)}
                                className="scale-90"
                              />
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wider ${
                                  sub.isActive ? "text-emerald-600" : "text-muted-foreground"
                                }`}
                              >
                                {sub.isActive ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </div>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right py-2.5">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                  onClick={() => handleOpenEdit(sub, true, cat.id)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Subcategory
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteSubCategory(sub)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Subcategory
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </div>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Category Modal (matches Screenshot 4) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingTarget
                ? editingTarget.isSub
                  ? "Edit Subcategory"
                  : "Edit Category"
                : "Create Category"}
            </DialogTitle>
            <DialogDescription>
              {editingTarget
                ? "Update category details and image."
                : "Add a new category or subcategory to organize services in your platform."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitForm} className="space-y-4 pt-2">
            {/* Category Name */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-name" className="text-xs font-bold uppercase text-muted-foreground">
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cat-name"
                placeholder="e.g., Tailoring & Custom Clothing"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc" className="text-xs font-bold uppercase text-muted-foreground">
                Description
              </Label>
              <Textarea
                id="cat-desc"
                placeholder="Brief description of what services fall under this category..."
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            {/* Parent Category Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Parent Category
              </Label>
              <Select
                value={formParentId}
                onValueChange={(val) => setFormParentId(val)}
                disabled={editingTarget?.isSub ? false : editingTarget ? true : false}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="None (Root Category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Root Category)</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Leave as &quot;None&quot; for top-level root categories, or select a parent to create a subcategory.
              </p>
            </div>

            {/* Sort Order */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-sort" className="text-xs font-bold uppercase text-muted-foreground">
                Sort Order / Priority
              </Label>
              <Input
                id="cat-sort"
                type="number"
                min="0"
                placeholder="0"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Lower numbers appear first (0, 1, 2...)
              </p>
            </div>

            {/* Category Image Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Category Image
              </Label>
              <div className="flex items-center gap-4">
                {formImage ? (
                  <div className="relative w-20 h-20 rounded-xl border border-neutral-200 overflow-hidden shrink-0 group">
                    <Image
                      src={formImage}
                      alt="Category Preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormImage(null)}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white p-1 rounded-full transition-colors"
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center text-muted-foreground/60 shrink-0">
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-[9px] mt-1">No Image</span>
                  </div>
                )}

                <div className="space-y-1 flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="cat-image-file"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                        Upload Image
                      </>
                    )}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    Recommended: 400x400px square or circular graphic for Shop by Category directory.
                  </p>
                </div>
              </div>
            </div>

            {/* Status Switch (when editing) */}
            {editingTarget && (
              <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                <div>
                  <p className="font-semibold text-sm">Status</p>
                  <p className="text-xs text-muted-foreground">
                    Enable or disable this category across storefront and search.
                  </p>
                </div>
                <Switch
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                />
              </div>
            )}

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting || isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="bg-[#FF6600] hover:bg-[#e65c00] text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : editingTarget ? (
                  "Save Changes"
                ) : (
                  "Create Category"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
