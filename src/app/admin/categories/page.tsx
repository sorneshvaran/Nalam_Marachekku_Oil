import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';

import AuthLayout from '@/components/auth-layout';
import AdminBackToDashboard from '@/components/admin-back-to-dashboard';
import { AdminCategoryDeleteForm, AdminCategoryForm } from '@/components/admin-catalogue-forms';
import { AdminCatalogueError, adminProductsData, type AdminCategory } from '@/lib/admin-products';

export const metadata: Metadata = { title: 'Admin Categories | Nalam', description: 'Manage Nalam product categories.' };

type AdminCategoriesPageProps = { searchParams: Promise<{ deleted?: string }> };

export default function AdminCategoriesPage({ searchParams }: AdminCategoriesPageProps) {
  return <AuthLayout><main className="flex-1 bg-cream-50 px-4 py-8 sm:px-6 sm:py-12"><Suspense fallback={<CategoriesLoading />}><AdminCategoriesContent searchParams={searchParams} /></Suspense></main></AuthLayout>;
}

async function AdminCategoriesContent({ searchParams }: AdminCategoriesPageProps) {
  await connection();
  const query = await searchParams;
  let categories: AdminCategory[];
  try { categories = await adminProductsData.getAdminCategories(); }
  catch (error) { if (error instanceof AdminCatalogueError) return <Unavailable />; throw error; }
  return <section className="mx-auto w-full max-w-8xl">
    <AdminBackToDashboard />
    <header className="mb-7 border-b border-border-soft pb-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-botanical-700">Nalam operations</p><h1 className="mt-2 font-serif text-3xl text-earth-900 sm:text-4xl">Categories</h1><p className="mt-2 text-sm text-foreground-muted">Create categories and update their names or customer-facing URLs.</p></header>
    {query.deleted === '1' ? <p role="status" className="mb-5 border border-botanical-200 bg-botanical-50 p-4 text-sm text-botanical-800">Category deleted.</p> : null}
    <section><h2 className="mb-3 font-serif text-2xl text-earth-900">Add category</h2><AdminCategoryForm /></section>
    <section className="mt-9"><div className="mb-3 flex flex-wrap items-end justify-between gap-2"><h2 className="font-serif text-2xl text-earth-900">Existing categories</h2><span className="text-sm text-foreground-muted">{categories.length} total</span></div>
      {categories.length ? <ul className="space-y-3">{categories.map((category) => <li key={category.id} className="border border-border-soft bg-white p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="min-w-0"><p className="font-medium text-earth-900">{category.name}</p><Link href={'/products?category=' + encodeURIComponent(category.slug)} className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-botanical-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botanical-700">View products →</Link></div><span className="shrink-0 text-xs text-foreground-muted">{category.productCount} {category.productCount === 1 ? 'product' : 'products'}</span></div><AdminCategoryForm category={category} />{category.productCount > 0 ? <p className="mt-3 text-sm text-earth-700">This category contains products and cannot be deleted. Move or remove the products first.</p> : null}<AdminCategoryDeleteForm categoryId={category.id} /></li>)}</ul> : <div className="border border-border-soft bg-white px-6 py-12 text-center"><h3 className="font-serif text-xl text-earth-900">No categories yet</h3><p className="mt-2 text-sm text-foreground-muted">Create a category before adding products.</p></div>}
    </section>
    <Link href="/admin/products" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-botanical-800 hover:underline">Manage products</Link>
  </section>;
}

function CategoriesLoading() { return <section className="mx-auto w-full max-w-8xl" aria-label="Loading categories"><div className="h-24 border-b border-border-soft bg-cream-100" /><div className="mt-6 h-64 bg-cream-100" /></section>; }
function Unavailable() { return <section className="mx-auto w-full max-w-3xl border border-border-soft bg-white px-6 py-12 text-center"><h1 className="font-serif text-2xl text-earth-900">Categories couldn’t be loaded</h1><p className="mt-2 text-sm text-foreground-muted">Please refresh and try again.</p></section>; }