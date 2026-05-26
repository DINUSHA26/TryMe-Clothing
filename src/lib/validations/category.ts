import { z } from "zod";

// Create category schema
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name must not exceed 100 characters")
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
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),
  image: z.string().url("Invalid image URL").optional(),
  parentId: z.string().cuid().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// Update category schema (all fields optional)
export const updateCategorySchema = createCategorySchema.partial();

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// List categories query schema
export const categoryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  parentId: z.string().cuid().nullable().optional(),
  isActive: z.enum(["true", "false"]).optional(),
  sortBy: z.enum(["name", "sortOrder", "createdAt"]).default("sortOrder"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type CategoryListQuery = z.infer<typeof categoryListQuerySchema>;

// Toggle category status schema
export const toggleCategoryStatusSchema = z.object({
  isActive: z.boolean(),
});

export type ToggleCategoryStatusInput = z.infer<
  typeof toggleCategoryStatusSchema
>;
