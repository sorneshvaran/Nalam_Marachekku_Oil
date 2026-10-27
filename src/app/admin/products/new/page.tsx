import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import AuthLayout from '@/components/auth-layout';
import AdminBackToDashboard from '@/components/admin-back-to-dashboard';
import { AdminProductForm } from '@/components/admin-catalogue-forms';
import { AdminCatalogueError, adminProductsData, type AdminCategory } from '@/lib/admin-products';

export const metadata: Metadata = { title: 'Add Product | Nalam', description: 'Add a product to the Nalam catalogue.' };

export default function NewAdminProductPage() {
  return <AuthLayout><main className="flex-1 bg-cream-50 px-4 py-8 sm:px-6 sm:py-12"><Suspense fallback={<ProductFormLoading />}><AdminNewProductContent /></Suspense></main></AuthLayout>;
}

async function AdminNewProductContent() {
  await connection();
  let categories: AdminCategory[];
  try { categories = await adminProductsData.getAdminCategories(); }
  catch (error) {
    if (error instanceof AdminCatalogueError) return <Unavailable />;
    throw error;
  }
  return <section className="mx-auto w-full max-w-8xl"><div className="mb-2"><AdminBackToDashboard /></div><Link href="/admin/products" className="text-sm font-medium text-botanical-800 hover:underline">← Products</Link><header className="my-5 border-b border-border-soft pb-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-botanical-700">Nalam operations</p><h1 className="mt-2 font-serif text-3xl text-earth-900 sm:text-4xl">Add product</h1><p className="mt-2 text-sm text-foreground-muted">Enter the confirmed product information and its first variant.</p></header>{categories.length === 0 ? <div className="border border-border-soft bg-white p-6"><p className="text-sm text-earth-800">Create a category before adding a product.</p><Link href="/admin/categories" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-botanical-800 hover:underline">Manage categories</Link></div> : <AdminProductForm categories={categories} />}</section>;
}

function ProductFormLoading() { return <section className="mx-auto max-w-8xl" aria-label="Loading product form"><div className="h-24 bg-cream-100" /><div className="mt-6 h-96 bg-cream-100" /></section>; }
function Unavailable() { return <section className="mx-auto max-w-3xl border border-border-soft bg-white px-6 py-12 text-center"><h1 className="font-serif text-2xl text-earth-900">Categories couldn’t be loaded</h1><p className="mt-2 text-sm text-foreground-muted">Please refresh and try again.</p></section>; }
