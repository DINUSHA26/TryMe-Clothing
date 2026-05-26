import { z } from "zod";

// Product image schema
const productImageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  altText: z.string().max(200).optional(),
  position: z.number().int().min(0),
});

// Product variant schema
const productVariantSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  value: z.string().min(1).max(100).trim(),
  priceAdjustment: z.number().optional(),
  stock: z.number().int().min(0),
  sku: z.string().max(100).optional(),
  image: z.string().url("Invalid image URL").trim().optional().or(z.literal("")),
});

// Create product schema
export const createProductSchema = z
  .object({
    isDraft: z.boolean().default(false).optional(),
    categoryId: z.string().cuid("Invalid category"),
    name: z
      .string()
      .min(3, "Product name must be at least 3 characters")
      .max(200, "Product name must not exceed 200 characters")
      .trim(),
    slug: z
      .string()
      .regex(
        /^[a-z0-9-]+$/,
        "Slug must contain only lowercase letters, numbers, and hyphens"
      )
      .optional(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(5000, "Description must not exceed 5000 characters")
      .trim(),
    price: z
      .number()
      .min(0.01, "Price must be at least 0.01")
      .max(99999999.99, "Price is too high"),
    compareAtPrice: z
      .number()
      .min(0.01)
      .max(99999999.99)
      .optional(),
    sku: z.string().max(100).optional(),
    stock: z.number().int().min(0, "Stock cannot be negative"),
    lowStockThreshold: z.number().int().min(0).optional(),
    images: z
      .array(productImageSchema)
      .min(1, "At least one image is required")
      .max(10, "Maximum 10 images allowed"),
    variants: z
      .array(productVariantSchema)
      .max(50, "Maximum 50 variants allowed")
      .optional(),
    sizeChart: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.compareAtPrice && data.compareAtPrice <= data.price) {
        return false;
      }
      return true;
    },
    {
      message: "Compare at price must be greater than regular price",
      path: ["compareAtPrice"],
    }
  );

export type CreateProductInput = z.infer<typeof createProductSchema>;

// Update product schema (partial, excluding images)
// Note: Cannot use .omit() on schemas with refinements, so we define it manually
export const updateProductSchema = z.object({
  isDraft: z.boolean().optional(),
  categoryId: z.string().cuid("Invalid category").optional(),
  name: z
    .string()
    .min(3, "Product name must be at least 3 characters")
    .max(200, "Product name must not exceed 200 characters")
    .trim()
    .optional(),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    )
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must not exceed 5000 characters")
    .trim()
    .optional(),
  price: z
    .number()
    .min(0.01, "Price must be at least 0.01")
    .max(99999999.99, "Price is too high")
    .optional(),
  compareAtPrice: z
    .number()
    .min(0.01)
    .max(99999999.99)
    .optional(),
  sku: z.string().max(100).optional(),
  stock: z.number().int().min(0, "Stock cannot be negative").optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  images: z
    .array(
      z.object({
        url: z.string().url("Invalid image URL"),
        altText: z.string().max(200).optional(),
        position: z.number().int().default(0),
      })
    )
    .min(1, "At least one image is required")
    .optional(),
  variants: z.array(productVariantSchema).max(50).optional(),
  sizeChart: z.string().optional().nullable(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// Product list query schema
export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  vendorId: z.string().cuid().optional(),
  isActive: z.enum(["true", "false"]).optional(),
  isDisabledByAdmin: z.enum(["true", "false"]).optional(),
  sortBy: z
    .enum(["name", "price", "stock", "createdAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

// Disable product schema
export const disableProductSchema = z
  .object({
    isDisabledByAdmin: z.boolean(),
    adminDisableReason: z
      .string()
      .min(10, "Reason must be at least 10 characters")
      .max(500, "Reason must not exceed 500 characters")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.isDisabledByAdmin && !data.adminDisableReason) {
        return false;
      }
      return true;
    },
    {
      message: "Reason is required when disabling a product",
      path: ["adminDisableReason"],
    }
  );

export type DisableProductInput = z.infer<typeof disableProductSchema>;

// Add variant schema
export const addVariantSchema = productVariantSchema;

export type AddVariantInput = z.infer<typeof addVariantSchema>;

// Update variant schema
export const updateVariantSchema = z.object({
  priceAdjustment: z.number().optional(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().max(100).optional(),
});

export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;

// Update stock schema
export const updateStockSchema = z.object({
  stock: z.number().int().min(0, "Stock cannot be negative"),
  variantId: z.string().cuid().optional(),
});

export type UpdateStockInput = z.infer<typeof updateStockSchema>;

// Add image schema
export const addImageSchema = z.object({
  images: z
    .array(productImageSchema)
    .min(1, "At least one image is required")
    .max(10, "Maximum 10 images per upload"),
});

export type AddImageInput = z.infer<typeof addImageSchema>;

// Reorder images schema
export const reorderImagesSchema = z.object({
  images: z.array(
    z.object({
      id: z.string().cuid(),
      position: z.number().int().min(0),
    })
  ),
});

export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>;
