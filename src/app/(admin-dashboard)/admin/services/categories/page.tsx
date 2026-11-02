"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronRight,
  Layers,
  Tag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminServiceCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Category Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Wrench");
  const [sortOrder, setSortOrder] = useState("0");

  // Subcategory Modal State
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedParentCategory, setSelectedParentCategory] = useState<any | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<any | null>(null);
  const [isSubSubmitting, setIsSubSubmitting] = useState(false);

  // Subcategory Form states
  const [subName, setSubName] = useState("");
  const [subDescription, setSubDescription] = useState("");
  const [subSortOrder, setSubSortOrder] = useState("0");

  // Expanded categories map for viewing subcategories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleExpand = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/services/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
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

  // Category Actions
  const openCreateCategory = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setIcon("Wrench");
    setSortOrder("0");
    setIsModalOpen(true);
  };

  const openEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setName(cat.name || "");
    setDescription(cat.description || "");
    setIcon(cat.icon || "Wrench");
    setSortOrder(String(cat.sortOrder || 0));
    setIsModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Category name is required." });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingCategory
        ? `/api/admin/services/categories/${editingCategory.id}`
        : "/api/admin/services/categories";
      const method = editingCategory ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          icon: icon.trim() || "Wrench",
          sortOrder: parseInt(sortOrder) || 0,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Success",
        description: editingCategory ? "Category updated successfully." : "Category created successfully.",
      });

      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Operation Failed", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat: any) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}" and all its subcategories?`)) return;

    try {
      const res = await fetch(`/api/admin/services/categories/${cat.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast({ title: "Deleted", description: "Category removed successfully." });
      fetchCategories();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: err.message });
    }
  };

  // Subcategory Actions
  const openCreateSubCategory = (parentCat: any) => {
    setSelectedParentCategory(parentCat);
    setEditingSubCategory(null);
    setSubName("");
    setSubDescription("");
    setSubSortOrder("0");
    setIsSubModalOpen(true);
  };

  const openEditSubCategory = (parentCat: any, sub: any) => {
    setSelectedParentCategory(parentCat);
    setEditingSubCategory(sub);
    setSubName(sub.name || "");
    setSubDescription(sub.description || "");
    setSubSortOrder(String(sub.sortOrder || 0));
    setIsSubModalOpen(true);
  };

  const handleSubCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Subcategory name is required." });
      return;
    }

    if (!selectedParentCategory) return;

    setIsSubSubmitting(true);
    try {
      const url = editingSubCategory
        ? `/api/admin/services/subcategories/${editingSubCategory.id}`
        : "/api/admin/services/subcategories";
      const method = editingSubCategory ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedParentCategory.id,
          name: subName.trim(),
          description: subDescription.trim() || null,
          sortOrder: parseInt(subSortOrder) || 0,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast({
        title: "Success",
        description: editingSubCategory ? "Subcategory updated successfully." : "Subcategory created successfully.",
      });

      setIsSubModalOpen(false);
      // Ensure the category is expanded so admin sees the new/updated subcategory
      setExpandedCategories((prev) => ({ ...prev, [selectedParentCategory.id]: true }));
      fetchCategories();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Operation Failed", description: err.message });
    } finally {
      setIsSubSubmitting(false);
    }
  };

  const handleDeleteSubCategory = async (sub: any) => {
    if (!confirm(`Are you sure you want to delete subcategory "${sub.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/services/subcategories/${sub.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast({ title: "Deleted", description: "Subcategory removed successfully." });
      fetchCategories();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <FolderTree className="h-6 w-6 text-[#FF6600]" />
            Website Service Categories & Subcategories
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage main categories and subcategories available for Vendors & Ads Sellers when posting services on their personal websites.
          </p>
        </div>

        <Button
          onClick={openCreateCategory}
          className="bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold rounded-xl shadow-md text-xs sm:text-sm h-11 px-5 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Main Category
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" />
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-sm text-gray-500 mb-4">No service categories created yet.</p>
          <Button onClick={openCreateCategory} className="bg-[#FF6600] text-white rounded-xl">
            Create First Category
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const isExpanded = !!expandedCategories[cat.id];
            const subCategories = cat.subCategories || [];

            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden transition-all"
              >
                {/* Category Main Row */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-gray-50/60 to-white hover:from-orange-50/20 transition-colors">
                  <div className="flex items-start sm:items-center gap-3">
                    <button
                      onClick={() => toggleExpand(cat.id)}
                      className="mt-0.5 sm:mt-0 p-1.5 rounded-lg hover:bg-gray-200/60 text-gray-500 transition-colors"
                      title={isExpanded ? "Collapse subcategories" : "Expand subcategories"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-[#FF6600]" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm sm:text-base text-gray-900">{cat.name}</span>
                        <span className="text-[11px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                          /{cat.slug}
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-orange-100/70 text-[#FF6600] border-0 text-[10px] font-bold"
                        >
                          {subCategories.length} Subcategories
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-gray-600 border-gray-200">
                          {cat._count?.services || 0} Live Services
                        </Badge>
                      </div>
                      {cat.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{cat.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions on Category */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCreateSubCategory(cat)}
                      className="h-8 text-xs font-semibold rounded-xl text-[#FF6600] border-orange-200 hover:bg-orange-50"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Subcategory
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditCategory(cat)}
                      className="h-8 w-8 p-0 rounded-xl text-blue-600 hover:bg-blue-50"
                      title="Edit Category"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(cat)}
                      className="h-8 w-8 p-0 rounded-xl text-red-600 hover:bg-red-50"
                      title="Delete Category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Subcategories Accordion Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 sm:p-5 bg-gray-50/40">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-gray-400" />
                        Subcategories under {cat.name}
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => openCreateSubCategory(cat)}
                        className="text-xs text-[#FF6600] p-0 h-auto font-bold hover:underline"
                      >
                        + Add New Subcategory
                      </Button>
                    </div>

                    {subCategories.length === 0 ? (
                      <div className="p-6 text-center bg-white rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
                        No subcategories added under this category yet.
                        <Button
                          onClick={() => openCreateSubCategory(cat)}
                          variant="outline"
                          size="sm"
                          className="mt-2 text-xs text-[#FF6600] border-orange-200 block mx-auto rounded-lg"
                        >
                          + Create First Subcategory
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {subCategories.map((sub: any) => (
                          <div
                            key={sub.id}
                            className="bg-white p-3 rounded-xl border border-gray-200/70 shadow-2xs hover:border-orange-300 transition-all flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-xs text-gray-800 block truncate">
                                {sub.name}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-gray-400 font-mono">/{sub.slug}</span>
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] px-1 py-0 h-4 bg-gray-100 text-gray-600"
                                >
                                  {sub._count?.services || 0} services
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditSubCategory(cat, sub)}
                                className="h-7 w-7 p-0 rounded-lg text-blue-600 hover:bg-blue-50"
                                title="Edit Subcategory"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSubCategory(sub)}
                                className="h-7 w-7 p-0 rounded-lg text-red-600 hover:bg-red-50"
                                title="Delete Subcategory"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main Category Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md w-[92vw] sm:w-full rounded-2xl sm:rounded-3xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingCategory ? "Edit Category" : "Add Service Category"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Create a top-level category that vendors and sellers can select when posting services.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCategorySubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Category Name *</Label>
              <Input
                placeholder="e.g. Tailoring & Clothing, Car Detailing"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Description</Label>
              <Textarea
                rows={2}
                placeholder="Brief summary of what services belong here"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">Icon Name</Label>
                <Input
                  placeholder="e.g. Wrench, Scissors"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="rounded-xl text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">Sort Order</Label>
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            <DialogFooter className="pt-2 flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold rounded-xl"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                {editingCategory ? "Save Changes" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Subcategory Modal Dialog */}
      <Dialog open={isSubModalOpen} onOpenChange={setIsSubModalOpen}>
        <DialogContent className="max-w-md w-[92vw] sm:w-full rounded-2xl sm:rounded-3xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingSubCategory ? "Edit Subcategory" : "Add Subcategory"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Adding subcategory under parent category:{" "}
              <strong className="text-gray-900">{selectedParentCategory?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubCategorySubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Subcategory Name *</Label>
              <Input
                placeholder="e.g. Gents Tailoring, Engine Repair, Hair Cutting"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                className="rounded-xl text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Description (Optional)</Label>
              <Textarea
                rows={2}
                placeholder="Brief description of this specific subcategory"
                value={subDescription}
                onChange={(e) => setSubDescription(e.target.value)}
                className="rounded-xl text-sm resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Sort Order</Label>
              <Input
                type="number"
                value={subSortOrder}
                onChange={(e) => setSubSortOrder(e.target.value)}
                className="rounded-xl text-sm"
              />
            </div>

            <DialogFooter className="pt-2 flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSubModalOpen(false)}
                className="w-full sm:w-auto rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubSubmitting}
                className="w-full sm:w-auto bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold rounded-xl"
              >
                {isSubSubmitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                {editingSubCategory ? "Save Changes" : "Create Subcategory"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
