"use client";

import { useState, Fragment } from "react";
import { Edit, Trash, MoreHorizontal, ChevronRight, ChevronDown, Loader2, BarChart2 } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { EditCategoryDialog } from "./EditCategoryDialog";
import type { CategoryListItem } from "@/types/category";

interface CategoryTableProps {
  categories: CategoryListItem[];
  onCategoryUpdated: () => void;
}

export function CategoryTable({
  categories: rootCategories,
  onCategoryUpdated,
}: CategoryTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [childCategories, setChildCategories] = useState<Record<string, CategoryListItem[]>>({});
  const [loadingChildren, setLoadingChildren] = useState<Set<string>>(new Set());

  const [editingCategory, setEditingCategory] =
    useState<CategoryListItem | null>(null);
  const [deletingCategory, setDeletingCategory] =
    useState<CategoryListItem | null>(null);
  const { toast } = useToast();

  const handleUpdateCallback = () => {
    // Clear child categories to ensure we don't show stale data
    setChildCategories({});
    onCategoryUpdated();
  };

  const handleToggleStatus = async (
    categoryId: string,
    currentStatus: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/admin/categories/${categoryId}/toggle-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !currentStatus }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to update category status",
        });
        return;
      }

      toast({
        title: "Success",
        description: result.data.message,
      });

      handleUpdateCallback();
    } catch (error) {
      console.error("Error toggling status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    try {
      const response = await fetch(
        `/api/admin/categories/${deletingCategory.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to delete category",
        });
        setDeletingCategory(null);
        return;
      }

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });

      setDeletingCategory(null);
      handleUpdateCallback();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    }
  };

  const fetchChildren = async (parentId: string) => {
    if (childCategories[parentId]) return;

    setLoadingChildren(prev => new Set(prev).add(parentId));
    try {
      const params = new URLSearchParams({
        parentId,
        pageSize: "100",
      });
      const response = await fetch(`/api/admin/categories?${params}`);
      const result = await response.json();

      if (result.success) {
        setChildCategories(prev => ({
          ...prev,
          [parentId]: result.data.categories
        }));
      }
    } catch (error) {
      console.error("Error fetching children:", error);
    } finally {
      setLoadingChildren(prev => {
        const next = new Set(prev);
        next.delete(parentId);
        return next;
      });
    }
  };

  const toggleExpand = async (categoryId: string) => {
    const isExpanded = expandedIds.has(categoryId);
    const next = new Set(expandedIds);
    if (isExpanded) {
      next.delete(categoryId);
    } else {
      next.add(categoryId);
      await fetchChildren(categoryId);
    }
    setExpandedIds(next);
  };

  const handleUpdateSortOrder = async (categoryId: string, newOrder: number) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: newOrder }),
      });

      const result = await response.json();

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to update category priority",
        });
        return;
      }

      toast({
        title: "Priority Updated",
        description: "The display order has been updated successfully.",
      });

      handleUpdateCallback();
    } catch (error) {
      console.error("Error updating sort order:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    }
  };

  const renderCategoryRow = (category: CategoryListItem, isChild = false) => (
    <TableRow key={category.id} className={isChild ? "bg-muted/30" : ""}>
      <TableCell className={isChild ? "pl-12" : ""}>
        {category.image ? (
          <div className="relative w-10 h-10 rounded overflow-hidden">
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground text-center">
              No image
            </span>
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {!isChild && category._count.children > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={() => toggleExpand(category.id)}
            >
              {loadingChildren.has(category.id) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : expandedIds.has(category.id) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          {!isChild && category._count.children === 0 && <div className="w-6" />}
          <div>
            <p className="font-medium">{category.name}</p>
            {category.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                {category.description}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {category.parent ? (
          <span className="text-xs text-muted-foreground">{category.parent.name}</span>
        ) : (
          <Badge variant="outline" className="text-[10px] font-normal uppercase tracking-wider">Main</Badge>
        )}
      </TableCell>
      <TableCell>
        <span className="text-sm font-medium">{category._count.products}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">{category._count.children}</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 w-20">
          <Input
            type="number"
            defaultValue={category.sortOrder}
            className="h-8 px-2 text-center text-xs font-semibold"
            onBlur={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val !== category.sortOrder) {
                handleUpdateSortOrder(category.id, val);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const target = e.target as HTMLInputElement;
                const val = parseInt(target.value);
                if (!isNaN(val) && val !== category.sortOrder) {
                  handleUpdateSortOrder(category.id, val);
                  target.blur();
                }
              }
            }}
          />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={category.isActive}
            onCheckedChange={() =>
              handleToggleStatus(category.id, category.isActive)
            }
            className="scale-90"
          />
          <Badge
            variant={category.isActive ? "default" : "secondary"}
            className="text-[10px] h-5"
          >
            {category.isActive ? "ACTIVE" : "INACTIVE"}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setEditingCategory(category)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeletingCategory(category)}
              className="text-destructive"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  if (rootCategories.length === 0) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No categories found</p>
          <p className="text-sm text-muted-foreground">
            Create your first category to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Category Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Sub-levels</TableHead>
              <TableHead className="w-[100px]">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4" />
                  Priority
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rootCategories.map((category) => (
              <Fragment key={category.id}>
                {renderCategoryRow(category)}
                {expandedIds.has(category.id) &&
                  childCategories[category.id]?.map(child => renderCategoryRow(child, true))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      {editingCategory && (
        <EditCategoryDialog
          category={editingCategory}
          open={!!editingCategory}
          onOpenChange={(open) => !open && setEditingCategory(null)}
          onSuccess={handleUpdateCallback}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deletingCategory?.name}&rdquo;?
              {deletingCategory?._count?.children && deletingCategory._count.children > 0 && (
                <span className="block mt-2 text-destructive">
                  This category has {deletingCategory._count.children}{" "}
                  subcategor{deletingCategory._count.children === 1 ? "y" : "ies"}.
                  You must delete them first.
                </span>
              )}
              {deletingCategory?._count?.products && deletingCategory._count.products > 0 && (
                <span className="block mt-2 text-destructive">
                  This category has {deletingCategory._count.products} product
                  {deletingCategory._count.products === 1 ? "" : "s"}. You must
                  reassign or delete them first.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingCategory(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={
                (deletingCategory?._count.children ?? 0) > 0 ||
                (deletingCategory?._count.products ?? 0) > 0
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
