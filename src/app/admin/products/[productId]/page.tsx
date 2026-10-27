import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { connection } from 'next/server';

import AuthLayout from '@/components/auth-layout';
import AdminBackToDashboard from '@/components/admin-back-to-dashboard';
import { AdminImageForm, AdminProductDeleteForm, AdminProductForm, AdminVariantForm } from '@/components/admin-catalogue-forms';
import { AdminCatalogueError, adminProductsData, type AdminCategory, type AdminProductDetails } from '@/lib/admin-products';
import { formatPrice, formatUnitValue } from '@/lib/format';

export const metadata: Metadata = { title: 'Edit Product | Nalam', description: 'Edit product information and catalogue variants.' };

export default function AdminProductDetailPage({ params, searchParams }: { params: Promise<{ productId: string }>; searchParams: Promise<{ created?: string }> }) {
  return <AuthLayout><main className="flex-1 bg-cream-50 px-4 py-8 sm:px-6 sm:py-12"><Suspense fallback={<ProductLoading />}><AdminProductContent params={params} searchParams={searchParams} /></Suspense></main></AuthLayout>;
}

async function AdminProductContent({ params, searchParams }: { params: Promise<{ productId: string }>; searchParams: Promise<{ created?: string }> }) {
  await connection();
  const [{ productId }, query] = await Promise.all([params, searchParams]);
  let product: AdminProductDetails | null;
  let categories: AdminCategory[];
  try {
    [product, categories] = await Promise.all([adminProductsData.getAdminProductById(productId), adminProductsData.getAdminCategories()]);
  } catch (error) {
    if (error instanceof AdminCatalogueError) {
      if (error.code === 'INVALID_ID' || error.code === 'NOT_FOUND') notFound();
      return <Unavailable />;
    }
    throw error;
  }
  if (!product) notFound();

  return <section className="mx-auto w-full max-w-8xl">
    <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1"><AdminBackToDashboard /><Link href="/admin/products" className="text-sm font-medium text-botanical-800 hover:underline">← Products</Link></div>
    <header className="my-5 border-b border-border-soft pb-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-botanical-700">Nalam operations</p><h1 className="mt-2 break-words font-serif text-3xl text-earth-900 sm:text-4xl">Edit {product.name}</h1><p className="mt-2 break-all text-sm text-foreground-muted">Customer URL: /products/{product.slug}</p></header>
    {query.created === '1' ? <p role="status" className="mb-5 border border-botanical-200 bg-botanical-50 p-4 text-sm text-botanical-800">Product created. You can add more variants and images below.</p> : null}

    <section><h2 className="mb-3 font-serif text-2xl text-earth-900">Product information</h2><AdminProductForm categories={categories} product={product} /></section>

    <AdminProductDeleteForm productId={product.id} productName={product.name} />

    <section className="mt-9"><div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h2 className="font-serif text-2xl text-earth-900">Variants</h2><p className="mt-1 text-sm text-foreground-muted">Edit prices and availability. Referenced variants are retained and can be deactivated.</p></div><p className="text-sm text-foreground-muted">{product.variants.length} total</p></div>
      <div className="space-y-3">{product.variants.map((variant) => <div key={variant.id} className="space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-earth-900">{variant.sku}</h3><div className="flex flex-wrap gap-2 text-xs text-foreground-muted"><span>{formatUnitValue(variant.value, variant.unit)}</span><span>·</span><span>{formatPrice(variant.price)}</span><span>·</span><span>Stock: {variant.stockQuantity}</span><span>Low-stock threshold: {variant.lowStockThreshold}</span><span>Status: {variant.stockStatus.replaceAll('_', ' ').toLowerCase()}</span></div></div><AdminVariantForm productId={product.id} variant={variant} /></div>)}
        <div className="border-t border-border-soft pt-4"><h3 className="mb-3 font-serif text-xl text-earth-900">Add variant</h3><AdminVariantForm productId={product.id} /></div>
      </div>
    </section>

    <section className="mt-9"><div className="mb-3"><h2 className="font-serif text-2xl text-earth-900">Images</h2><p className="mt-1 text-sm text-foreground-muted">Use an existing local image path under public/images. No upload or remote storage is configured.</p></div>
      <div className="space-y-4">{product.images.map((image) => <div key={image.id} className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]"><div className="relative aspect-[4/3] border border-border-soft bg-white"> <Image src={image.url} alt={image.altText || product.name} fill sizes="160px" className="object-contain p-2" /></div><AdminImageForm productId={product.id} image={image} /></div>)}
        <div className="border-t border-border-soft pt-4"><h3 className="mb-3 font-serif text-xl text-earth-900">Add image</h3><AdminImageForm productId={product.id} /></div>
      </div>
    </section>
  </section>;
}

function ProductLoading() { return <section className="mx-auto max-w-8xl" aria-label="Loading product"><div className="h-24 bg-cream-100" /><div className="mt-6 h-96 bg-cream-100" /></section>; }
function Unavailable() { return <section className="mx-auto max-w-3xl border border-border-soft bg-white px-6 py-12 text-center"><h1 className="font-serif text-2xl text-earth-900">Product couldn’t be loaded</h1><p className="mt-2 text-sm text-foreground-muted">Please refresh and try again.</p></section>; }
