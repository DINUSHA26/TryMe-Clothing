import { Category } from "@prisma/client";

// Category with recursive children
export type CategoryWithChildren = Category & {
  children?: CategoryWithChildren[];
  _count?: {
    products: number;
  };
};

// Category with parent
export type CategoryWithParent = Category & {
  parent?: Category | null;
};

// Category list item (for table display)
export type CategoryListItem = Category & {
  parent?: Pick<Category, "id" | "name"> | null;
  _count: {
    products: number;
    children: number;
  };
};

// Category list response
export type CategoryListResponse = {
  categories: CategoryListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

// Category hierarchy response
export type CategoryHierarchyResponse = {
  tree: CategoryWithChildren[];
};

// Category detail response
export type CategoryDetailResponse = {
  category: Category & {
    parent?: Category | null;
    children: Category[];
    _count: {
      products: number;
    };
  };
};

// Category selector item (simplified for dropdowns)
export type CategorySelectorItem = Pick<Category, "id" | "name" | "parentId"> & {
  level: number; // 0 for root, 1 for child
};
