import 'server-only';

import { requireAdmin } from '@/lib/auth';
import { adminProductIdSchema, adminCategoryIdSchema, type AdminProductInput, type AdminVariantInput, type AdminCategoryInput } from '@/lib/admin-product-validation';
import { db } from '@/lib/db';

export type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  updatedAt: string;
  category: { id: string; name: string } | null;
  variants: Array<{ id: string; sku: string; value: string; unit: 'ML' | 'L' | 'G' | 'KG'; price: string; active: boolean }>;
  image: { url: string; altText: string | null } | null;
};

export type AdminProductDetails = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  categoryId: string;
  category: { id: string; name: string; slug: string } | null;
  variants: Array<{ id: string; sku: string; value: string; unit: 'ML' | 'L' | 'G' | 'KG'; price: string; stockQuantity: number; lowStockThreshold: number; stockStatus: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK'; active: boolean }>;
  images: Array<{ id: string; url: string; altText: string | null; sortOrder: number }>;
};

export type AdminCategory = { id: string; name: string; slug: string; productCount: number };

export class AdminCatalogueError extends Error {
  constructor(readonly code: 'INVALID_ID' | 'NOT_FOUND' | 'DUPLICATE' | 'CATEGORY_IN_USE' | 'ORDER_REFERENCED' | 'UNAVAILABLE') {
    super(code);
    this.name = 'AdminCatalogueError';
  }
}

function hasUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof current !== 'object' || current === null) return false;
    const record = current as Record<string, unknown>;
    if (record.sqlState === '23505') return true;
    current = record.cause;
  }
  return false;
}

async function getAdminProducts(): Promise<AdminProductListItem[]> {
  await requireAdmin();
  try {
    const products = await db.orm.public.Product
      .select('id', 'name', 'slug', 'active', 'updatedAt')
      .include('category', (category) => category.select('id', 'name'))
      .include('variants', (variants) => variants.select('id', 'sku', 'value', 'unit', 'price', 'active'))
      .include('images', (images) => images.select('url', 'altText', 'sortOrder').orderBy((image) => image.sortOrder.asc()).limit(1))
      .orderBy((product) => product.name.asc())
      .all();
    return products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      active: product.active,
      updatedAt: product.updatedAt,
      category: product.category,
      variants: product.variants,
      image: product.images[0] ? { url: product.images[0].url, altText: product.images[0].altText } : null,
    }));
  } catch (error) {
    console.error('Admin product list retrieval failed.', { errorName: error instanceof Error ? error.name : typeof error });
    throw new AdminCatalogueError('UNAVAILABLE');
  }
}

async function getAdminProductById(productId: string): Promise<AdminProductDetails | null> {
  await requireAdmin();
  if (!adminProductIdSchema.safeParse(productId).success) throw new AdminCatalogueError('INVALID_ID');
  try {
    return await db.orm.public.Product
      .where({ id: productId })
      .select('id', 'name', 'slug', 'description', 'active', 'categoryId')
      .include('category', (category) => category.select('id', 'name', 'slug'))
      .include('variants', (variants) => variants.select('id', 'sku', 'value', 'unit', 'price', 'stockQuantity', 'lowStockThreshold', 'stockStatus', 'active').orderBy((variant) => variant.value.asc()))
      .include('images', (images) => images.select('id', 'url', 'altText', 'sortOrder').orderBy((image) => image.sortOrder.asc()))
      .first() as AdminProductDetails | null;
  } catch (error) {
    console.error('Admin product detail retrieval failed.', { errorName: error instanceof Error ? error.name : typeof error });
    throw new AdminCatalogueError('UNAVAILABLE');
  }
}

async function createAdminProduct(input: { product: AdminProductInput; variant: { sku: string; value: string; unit: 'ML' | 'L' | 'G' | 'KG'; price: string }; image?: { url: string; altText: string | null; sortOrder: number } }): Promise<string> {
  await requireAdmin();
  try {
    return await db.transaction(async (tx) => {
      const category = await tx.orm.public.Category.where({ id: input.product.categoryId }).select('id').first();
      if (!category) throw new AdminCatalogueError('NOT_FOUND');
      const duplicateProduct = await tx.orm.public.Product.where({ slug: input.product.slug }).select('id').first();
      if (duplicateProduct) throw new AdminCatalogueError('DUPLICATE');
      const duplicateSku = await tx.orm.public.ProductVariant.where({ sku: input.variant.sku }).select('id').first();
      if (duplicateSku) throw new AdminCatalogueError('DUPLICATE');

      const product = await tx.orm.public.Product.select('id').create({
        categoryId: input.product.categoryId,
        name: input.product.name,
        slug: input.product.slug,
        description: input.product.description,
        active: input.product.active,
      });
      await tx.orm.public.ProductVariant.create({
        productId: product.id,
        sku: input.variant.sku,
        value: input.variant.value,
        unit: input.variant.unit,
        price: input.variant.price,
      });
      if (input.image) {
        await tx.orm.public.ProductImage.create({ productId: product.id, ...input.image });
      }
      return product.id;
    });
  } catch (error) {
    if (error instanceof AdminCatalogueError) throw error;
    if (hasUniqueViolation(error)) throw new AdminCatalogueError('DUPLICATE');
    console.error('Admin product creation failed.', { errorName: error instanceof Error ? error.name : typeof error });
    throw new AdminCatalogueError('UNAVAILABLE');
  }
}

async function updateAdminProduct(productId: string, input: AdminProductInput): Promise<void> {
  await requireAdmin();
  if (!adminProductIdSchema.safeParse(productId).success) throw new AdminCatalogueError('INVALID_ID');
  try {
    const category = await db.orm.public.Category.where({ id: input.categoryId }).select('id').first();
    if (!category) throw new AdminCatalogueError('NOT_FOUND');
    const product = await db.orm.public.Product.where({ id: productId }).select('id').first();
    if (!product) throw new AdminCatalogueError('NOT_FOUND');
    const duplicate = await db.orm.public.Product.where({ slug: input.slug }).select('id').first();
    if (duplicate && duplicate.id !== productId) throw new AdminCatalogueError('DUPLICATE');
    await db.orm.public.Product.where({ id: productId }).update({
      name: input.name,
      slug: input.slug,
      categoryId: input.categoryId,
      description: input.description,
      active: input.active,
    });
  } catch (error) {
    if (error instanceof AdminCatalogueError) throw error;
    if (hasUniqueViolation(error)) throw new AdminCatalogueError('DUPLICATE');
    console.error('Admin product update failed.', { errorName: error instanceof Error ? error.name : typeof error });
    throw new AdminCatalogueError('UNAVAILABLE');
  }
}

async function saveAdminVariant(productId: string, variantId: string | null, input: AdminVariantInput): Promise<void> {
  await requireAdmin();
  if (!adminProductIdSchema.safeParse(productId).success || (variantId && !adminProductIdSchema.safeParse(variantId).success)) throw new AdminCatalogueError('INVALID_ID');
  try {
    const product = await db.orm.public.Product.where({ id: productId }).select('id').first();
    if (!product) throw new AdminCatalogueError('NOT_FOUND');
    const duplicateSku = await db.orm.public.ProductVariant.where({ sku: input.sku }).select('id').first();
    if (duplicateSku && duplicateSku.id !== variantId) throw new AdminCatalogueError('DUPLICATE');
    const duplicateCombination = await db.orm.public.ProductVariant.where({ productId, value: input.value, unit: input.unit }).select('id').first();
    if (duplicateCombination && duplicateCombination.id !== variantId) throw new AdminCatalogueError('DUPLICATE');

    if (variantId) {
      const current = await db.orm.public.ProductVariant.where({ id: variantId, productId }).select('id').first();
      if (!current) throw new AdminCatalogueError('NOT_FOUND');
      await db.orm.public.ProductVariant.where({ id: variantId, productId }).update({ sku: input.sku, value: input.value, unit: input.unit, price: input.price, active: input.active });
    } else {
      await db.orm.public.ProductVariant.create({ productId, sku: input.sku, value: input.value, unit: input.unit, price: input.price, active: input.active });
    }
  } catch (error) {
    if (error instanceof AdminCatalogueError) throw error;
    if (hasUniqueViolation(error)) throw new AdminCatalogueError('DUPLICATE');
    console.error('Admin variant save failed.', { errorName: error instanceof Error ? error.name : typeof error });
    throw new AdminCatalogueError('UNAVAILABLE');
  }
}

async function setAdminVariantActive(productId: string, variantId: string, active: boolean): Promise<void> {
  await requireAdmin();
  if (!adminProductIdSchema.safeParse(productId).success || !adminProductIdSchema.safeParse(variantId).success) throw new AdminCatalogueError('INVALID_ID');
  try {
    const variant = await db.orm.public.ProductVariant.where({ id: variantId, productId }).select('id').first();
    if (!variant) throw new AdminCatalogueError('NOT_FOUND');
    await db.orm.public.ProductVariant.where({ id: variantId, productId }).update({ active });
  } catch (error) {
    if (error instanceof AdminCatalogueError) throw error;
    console.error('Admin variant activation update failed.', { errorName: error instanceof Error ? error.name : typeof error });
    throw new AdminCatalogueError('UNAVAILABLE');
  }
}

async function saveAdminImage(productId: string, imageId: string | null, input: { url: string; altText: string | null; sortOrder: number }): Promise<void> {
  await requireAdmin();
  if (!adminProductIdSchema.safeParse(productId).success || (imageId && !adminProductIdSchema.safeParse(imageId).success)) throw new AdminCatalogueError('INVALID_ID');
  try {
    const product = await db.orm.public.Product.where({ id: productId }).select('id').first();
    if (!product) throw new AdminCatalogueError('NOT_FOUND');
    if (imageId) {
      const image = await db.orm.public.ProductImage.where({ id: imageId, productId }).select('id').first();
      if (!image) throw new AdminCatalogueError('NOT_FOUND');
      await db.orm.public.ProductImage.where({ id: imageId, productId }).update({ url: input.url, altText: input.altText, sortOrder: input.sortOrder });
    } else {
      await db.orm.public.ProductImage.create({ productId, ...input });
    }
  } catch (error) {
    if (error instanceof AdminCatalogueError) throw error;
    console.error('Admin image save failed.', { errorName: error instanceof Error ? error.name : typeof error });
    throw new AdminCatalogueError('UNAVAILABLE');
  }
}

async function deleteAdminImage(productId: string, imageId: string): Promise<void> {
  await requireAdmin();
  if (!adminProductIdSchema.safeParse(productId).success || !adminProductIdSchema.safeParse(imageId).success) throw new AdminCatalogueError('INVALID_ID');
  try {
    const image = await db.orm.public.ProductImage.where({ id: imageId, productId }).select('id').first();
    if (!image) throw new AdminCatalogueError('NOT_FOUND');
    await db.orm.public.ProductImage.where({ id: imageId, productId }).deleteAll();
  } catch (error) {
    if (error instanceof AdminCatalogueError) throw error;
    console.error('Admin image deletion failed.', { errorName: error instanceof Error ? error.name : typeof error });
    throw new AdminCatalogueError('UNAVAILABLE');
  }
}

async function getAdminCategories(): Promise<AdminCategory[]> {
  await requireAdmin();
  try {
    const categories = await db.orm.public.Category
      .select('id', 'name', 'slug')
      .include('products', (products) => products.count())
      .orderBy((category) => category.name.asc())
      .all();
    return categories.map((category) => ({ id: category.id, name: category.name, slug: category.slug, productCount: category.products }));
  } catch (error) {
    console.error('Admin category list retrieval failed.', { errorName: error instanceof Error ? error.name : typeof error });
    throw new AdminCatalogueError('UNAVAILABLE');
  }
}

async function saveAdminCategory(categoryId: string | null, input: AdminCategoryInput): Promise<void> {
  await requireAdmin();
  if (categoryId && !adminCategoryIdSchema.safeParse(categoryId).success) throw new AdminCatalogueError('INVALID_ID');
  try {
    if (categoryId) {
      const category = await db.orm.public.Category.where({ id: categoryId }).select('id').first();
      if (!category) throw new AdminCatalogueError('NOT_FOUND');
      const duplicateName = await db.orm.public.Category.where({ name: input.name }).select('id').first();
      const duplicateSlug = await db.orm.public.Category.where({ slug: input.slug }).select('id').first();
      if ((duplicateName && duplicateName.id !== categoryId) || (duplicateSlug && duplicateSlug.id !== categoryId)) throw new AdminCatalogueError('DUPLICATE');
      await db.orm.public.Category.where({ id: categoryId }).update({ name: input.name, slug: input.slug });
    } else {
      const duplicateName = await db.orm.public.Category.where({ name: input.name }).select('id').first();
      const duplicateSlug = await db.orm.public.Category.where({ slug: input.slug }).select('id').first();
      if (duplicateName || duplicateSlug) throw new AdminCatalogueError('DUPLICATE');
      await db.orm.public.Category.create({ name: input.name, slug: input.slug });
    }
  } catch (error) {
    if (error instanceof AdminCatalogueError) throw error;
    if (hasUniqueViolation(error)) throw new AdminCatalogueError('DUPLICATE');
    console.error('Admin category save failed.', { errorName: error instanceof Error ? error.name : typeof error });
    throw new AdminCatalogueError('UNAVAILABLE');
  }
}

async function deleteAdminCategory(categoryId: string): Promise<void> {
  await requireAdmin();
  if (!adminCategoryIdSchema.safeParse(categoryId).success) throw new AdminCatalogueError('INVALID_ID');
  try {
    await db.transaction(async (tx) => {
      const category = await tx.orm.public.Category
        .where({ id: categoryId })
        .forUpdate()
        .select('id')
        .first();
      if (!category) throw new AdminCatalogueError('NOT_FOUND');

      const product = await tx.orm.public.Product
        .where({ categoryId })
        .select('id')
        .first();
      if (product) throw new AdminCatalogueError('CATEGORY_IN_USE');

      await tx.orm.public.Category.where({ id: categoryId }).deleteAll();
    });
  } catch (error) {
    if (error instanceof AdminCatalogueError) throw error;
    console.error('Admin category deletion failed.', { errorName: error instanceof Error ? error.name : typeof error });
    throw new AdminCatalogueError('UNAVAILABLE');
  }
}

async function deleteAdminProduct(productId: string): Promise<void> {
  await requireAdmin();
  if (!adminProductIdSchema.safeParse(productId).success) throw new AdminCatalogueError('INVALID_ID');
  try {
    await db.transaction(async (tx) => {
      const product = await tx.orm.public.Product
        .where({ id: productId })
        .forUpdate()
        .select('id')
        .first();
      if (!product) throw new AdminCatalogueError('NOT_FOUND');

      const variants = await tx.orm.public.ProductVariant
        .where({ productId })
        .orderBy((variant) => variant.id.asc())
        .forUpdate()
        .select('id')
        .all();
      const variantIds = variants.map((variant) => variant.id);

      if (variantIds.length > 0) {
        const historicalOrderItem = await tx.orm.public.OrderItem
          .where((item) => item.variantId.in(variantIds))
          .select('id')
          .first();
        if (historicalOrderItem) throw new AdminCatalogueError('ORDER_REFERENCED');

        await tx.orm.public.CartItem
          .where((item) => item.variantId.in(variantIds))
          .deleteAll();
        await tx.orm.public.ProductVariant
          .where((variant) => variant.id.in(variantIds))
          .deleteAll();
      }

      await tx.orm.public.Product.where({ id: productId }).deleteAll();
    });
  } catch (error) {
    if (error instanceof AdminCatalogueError) throw error;
    console.error('Admin product deletion failed.', { errorName: error instanceof Error ? error.name : typeof error });
    throw new AdminCatalogueError('UNAVAILABLE');
  }
}
export const adminProductsData = {
  getAdminProducts,
  getAdminProductById,
  createAdminProduct,
  updateAdminProduct,
  saveAdminVariant,
  setAdminVariantActive,
  saveAdminImage,
  deleteAdminImage,
  getAdminCategories,
  saveAdminCategory,
  deleteAdminCategory,
  deleteAdminProduct,
};
