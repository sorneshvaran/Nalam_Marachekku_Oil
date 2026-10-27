import { z } from 'zod';

const idSchema = z.string().uuid();
const decimalValue = z.string().trim().regex(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,3})?$/, 'Enter a valid number.');
const priceValue = z.string().trim().regex(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/, 'Enter a valid price.');
const slugSchema = z.string().trim().min(1).max(100)
  .transform((value) => value.toLowerCase().replace(/\s+/g, '-'))
  .pipe(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens.'));
const skuSchema = z.string().trim().min(2).max(64)
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/, 'Use letters, numbers, and hyphens.'));

export const adminProductIdSchema = idSchema;
export const adminCategoryIdSchema = idSchema;

export const adminProductSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: slugSchema,
  categoryId: idSchema,
  description: z.string().trim().max(4000).nullable(),
  active: z.boolean(),
}).strict();

export const adminInitialVariantSchema = z.object({
  sku: skuSchema,
  value: decimalValue.refine((value) => Number(value) > 0, 'Value must be greater than zero.'),
  unit: z.enum(['ML', 'L', 'G', 'KG']),
  price: priceValue,
}).strict();

export const adminVariantSchema = adminInitialVariantSchema.extend({
  active: z.boolean(),
}).strict();

export const adminImageSchema = z.object({
  url: z.string().trim().min(1).max(500).refine(
    (value) => value.startsWith('/images/') && !value.includes('..') && !value.includes('\\'),
    'Use an existing local image path beginning with /images/.',
  ),
  altText: z.string().trim().max(250).nullable(),
  sortOrder: z.number().int().min(0).max(10000),
}).strict();

export const adminCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: slugSchema,
}).strict();

export const adminProductCreateSchema = z.object({
  product: adminProductSchema,
  variant: adminInitialVariantSchema,
  image: adminImageSchema.optional(),
}).strict();

export type AdminProductInput = z.infer<typeof adminProductSchema>;
export type AdminVariantInput = z.infer<typeof adminVariantSchema>;
export type AdminCategoryInput = z.infer<typeof adminCategorySchema>;
