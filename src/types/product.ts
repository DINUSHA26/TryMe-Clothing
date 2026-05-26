import {
  Product,
  ProductImage,
  ProductVariant,
  Category,
  Vendor,
} from "@prisma/client";

// Product with full details
export type ProductWithDetails = Product & {
  category: Category;
  vendor: Pick<Vendor, "id" | "businessName" | "slug">;
  images: ProductImage[];
  variants: ProductVariant[];
};

// Product list item (for table/card display)
export type ProductListItem = Product & {
  category: Pick<Category, "id" | "name">;
  images: Pick<ProductImage, "url" | "altText">[];
  variants?: {
    id: string;
    name: string;
    value: string;
    stock: number;
    sku?: string | null;
  }[];
  _count?: {
    variants: number;
  };
};

// Vendor product list item (with low stock alert)
export type VendorProductListItem = ProductListItem & {
  lowStockAlert?: boolean;
};

// Admin product list item (includes vendor info)
export type AdminProductListItem = ProductListItem & {
  vendor: Pick<Vendor, "id" | "businessName" | "slug">;
};

// Product list response
export type ProductListResponse = {
  products: ProductListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

// Admin product list response
export type AdminProductListResponse = {
  products: AdminProductListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

// Product form data
export interface ProductFormData {
  isDraft?: boolean;
  categoryId: string;
  name: string;
  slug?: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  stock: number;
  lowStockThreshold?: number;
  images: {
    url: string;
    altText?: string;
    position: number;
  }[];
  variants?: {
    name: string;
    value: string;
    priceAdjustment?: number;
    stock: number;
    sku?: string;
    image?: string;
  }[];
  sizeChart?: string | null;
}
