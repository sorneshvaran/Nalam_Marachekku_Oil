import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { db } from '@/lib/db';

export interface ProductWithRelations {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: Array<{
    id: string;
    url: string;
    altText: string | null;
    sortOrder: number;
  }>;
  variants: Array<{
    id: string;
    sku: string;
    value: string;
    unit: 'ML' | 'L' | 'G' | 'KG';
    price: string;
    stockStatus: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';
    active: boolean;
  }>;
}

export interface CategoryWithProducts {
  id: string;
  name: string;
  slug: string;
  products: ProductWithRelations[];
}

export interface CategorySimple {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryWithCount extends CategorySimple {
  productCount: number;
}

async function getAllCategories(): Promise<CategorySimple[]> {
  'use cache';
  cacheLife('days');
  cacheTag('categories');

  const categories = await db.orm.public.Category
    .select('id', 'name', 'slug')
    .orderBy((c) => c.name.asc())
    .all();
  return categories;
}

async function getActiveProductsWithVariantsAndImages(): Promise<ProductWithRelations[]> {
  'use cache';
  cacheLife('hours');
  cacheTag('products');

  const products = await db.orm.public.Product
    .where({ active: true })
    .include('category', (cat) => cat.select('id', 'name', 'slug'))
    .include('images', (img) =>
      img
        .select('id', 'url', 'altText', 'sortOrder')
        .orderBy((i) => i.sortOrder.asc())
    )
    .include('variants', (var_) =>
      var_
        .where((v) => v.active.eq(true))
        .select('id', 'sku', 'value', 'unit', 'price', 'stockStatus', 'active')
        .orderBy((v) => v.value.asc())
    )
    .orderBy((p) => p.name.asc())
    .all();

  return products as ProductWithRelations[];
}

async function getProductsByCategory(categorySlug: string): Promise<ProductWithRelations[]> {
  'use cache';
  cacheLife('hours');
  cacheTag('products');

  const category = await db.orm.public.Category.where({ slug: categorySlug }).first();

  if (!category) {
    return [];
  }

  const products = await db.orm.public.Product
    .where({ active: true, categoryId: category.id })
    .include('category', (cat) => cat.select('id', 'name', 'slug'))
    .include('images', (img) =>
      img
        .select('id', 'url', 'altText', 'sortOrder')
        .orderBy((i) => i.sortOrder.asc())
    )
    .include('variants', (var_) =>
      var_
        .where((v) => v.active.eq(true))
        .select('id', 'sku', 'value', 'unit', 'price', 'stockStatus', 'active')
        .orderBy((v) => v.value.asc())
    )
    .orderBy((p) => p.name.asc())
    .all();

  return products as ProductWithRelations[];
}

async function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  'use cache';
  cacheLife('hours');
  cacheTag('products');

  const product = await db.orm.public.Product
    .where({ slug, active: true })
    .include('category', (cat) => cat.select('id', 'name', 'slug'))
    .include('images', (img) =>
      img
        .select('id', 'url', 'altText', 'sortOrder')
        .orderBy((i) => i.sortOrder.asc())
    )
    .include('variants', (var_) =>
      var_
        .where((v) => v.active.eq(true))
        .select('id', 'sku', 'value', 'unit', 'price', 'stockStatus', 'active')
        .orderBy((v) => v.value.asc())
    )
    .first();

  return (product as ProductWithRelations) ?? null;
}

async function getCategoriesWithProductCounts(): Promise<CategoryWithCount[]> {
  'use cache';
  cacheLife('days');
  cacheTag('categories');

  const categories = await db.orm.public.Category
    .include('products', (prod) =>
      prod
        .where((p) => p.active.eq(true))
        .count()
    )
    .select('id', 'name', 'slug')
    .orderBy((c) => c.name.asc())
    .all();

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    productCount: c.products,
  }));
}

export const productsData = {
  getAllCategories,
  getActiveProductsWithVariantsAndImages,
  getProductsByCategory,
  getProductBySlug,
  getCategoriesWithProductCounts,
};