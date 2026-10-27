import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';

import AuthLayout from '@/components/auth-layout';
import AdminBackToDashboard from '@/components/admin-back-to-dashboard';
import { formatOrderDate, formatPrice, formatUnitValue } from '@/lib/format';
import { AdminCatalogueError, adminProductsData, type AdminProductListItem } from '@/lib/admin-products';

export const metadata: Metadata = { title: 'Admin Products | Nalam', description: 'Manage the Nalam product catalogue.' };

type AdminProductsPageProps = { searchParams: Promise<{ deleted?: string }> };

export default function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  return <AuthLayout><main className="flex-1 bg-cream-50 px-4 py-8 sm:px-6 sm:py-12"><Suspense fallback={<ProductsLoading />}><AdminProductsContent searchParams={searchParams} /></Suspense></main></AuthLayout>;
}

async function AdminProductsContent({ searchParams }: AdminProductsPageProps) {
  await connection();
  const query = await searchParams;
  let products: AdminProductListItem[];
  try { products = await adminProductsData.getAdminProducts(); }
  catch (error) {
    if (error instanceof AdminCatalogueError) return <Unavailable />;
    throw error;
  }
  const productGroups = groupProductsByCategory(products);
  return (
    <section className="mx-auto w-full max-w-8xl">
      <AdminBackToDashboard />
      {query.deleted === '1' ? <p role="status" className="mb-5 border border-botanical-200 bg-botanical-50 p-4 text-sm text-botanical-800">Product deleted.</p> : null}
      <header className="mb-6 flex flex-col gap-4 border-b border-border-soft pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-botanical-700">Nalam operations</p><h1 className="mt-2 font-serif text-3xl text-earth-900 sm:text-4xl">Products</h1><p className="mt-2 text-sm text-foreground-muted">Manage product details, variants, images, and storefront visibility.</p></div>
        <Link href="/admin/products/new" className="inline-flex min-h-11 items-center justify-center bg-botanical-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-botanical-800">Add product</Link>
      </header>
      {products.length === 0 ? <div className="border border-border-soft bg-white px-6 py-12 text-center"><h2 className="font-serif text-2xl text-earth-900">No products yet</h2><p className="mt-2 text-sm text-foreground-muted">Add a product to begin building the catalogue.</p></div> : (
        <>
          <div className="hidden overflow-x-auto border border-border-soft bg-white md:block"><table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-border-soft bg-cream-100 text-xs uppercase tracking-wide text-earth-700"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Variants</th><th className="px-4 py-3">Starting price</th><th className="px-4 py-3">Updated</th><th className="px-4 py-3"><span className="sr-only">Edit</span></th></tr></thead>
            {productGroups.map((group) => <tbody key={group.categoryName} className="divide-y divide-border-soft"><tr className="border-y border-border-soft bg-cream-50"><th colSpan={7} scope="rowgroup" className="px-4 py-3 text-left font-serif text-lg text-earth-900">{group.categoryName} <span className="font-sans text-sm font-medium text-foreground-muted">— {group.products.length} {group.products.length === 1 ? 'product' : 'products'}</span></th></tr>{group.products.map((product) => <ProductTableRow key={product.id} product={product} />)}</tbody>)}
          </table></div>
          <div className="space-y-6 md:hidden">{productGroups.map((group) => <section key={group.categoryName}><h2 className="border-b border-border-soft pb-2 font-serif text-xl text-earth-900">{group.categoryName} <span className="font-sans text-sm font-medium text-foreground-muted">— {group.products.length} {group.products.length === 1 ? 'product' : 'products'}</span></h2><ul className="mt-3 space-y-3">{group.products.map((product) => <ProductCard key={product.id} product={product} />)}</ul></section>)}</div>
        </>
      )}
    </section>
  );
}

function ProductTableRow({ product }: { product: AdminProductListItem }) {
  const activePrices = product.variants.filter((variant) => variant.active).map((variant) => Number(variant.price)).filter(Number.isFinite);
  const startPrice = activePrices.length ? formatPrice(String(Math.min(...activePrices))) : '—';
  return <tr className="align-top"><td className="px-4 py-4"><div className="flex items-center gap-3">{product.image ? <div className="relative size-14 shrink-0 border border-border-soft bg-cream-100"><Image src={product.image.url} alt={product.image.altText || product.name} fill sizes="56px" className="object-contain p-1" /></div> : <div aria-hidden="true" className="size-14 shrink-0 border border-border-soft bg-cream-100" />}<div className="min-w-0"><p className="font-semibold text-earth-900">{product.name}</p><p className="mt-1 break-all text-xs text-foreground-muted">/{product.slug}</p></div></div></td><td className="px-4 py-4 text-earth-700">{product.category?.name ?? 'Uncategorized'}</td><td className="px-4 py-4"><StatusLabel active={product.active} /></td><td className="max-w-72 px-4 py-4"><p className="font-medium text-earth-900">{product.variants.length} {product.variants.length === 1 ? 'variant' : 'variants'}</p><p className="mt-1 text-xs leading-5 text-foreground-muted">{variantSummary(product.variants)}</p></td><td className="whitespace-nowrap px-4 py-4 font-semibold text-earth-900">{startPrice}</td><td className="whitespace-nowrap px-4 py-4 text-earth-700">{formatOrderDate(product.updatedAt)}</td><td className="px-4 py-4 text-right"><Link href={`/admin/products/${product.id}`} className="font-semibold text-botanical-800 hover:underline">Edit</Link></td></tr>;
}

function ProductCard({ product }: { product: AdminProductListItem }) {
  const prices = product.variants.filter((variant) => variant.active).map((variant) => Number(variant.price)).filter(Number.isFinite);
  return <li className="border border-border-soft bg-white p-4"><div className="flex gap-3">{product.image ? <div className="relative size-16 shrink-0 border border-border-soft bg-cream-100"><Image src={product.image.url} alt={product.image.altText || product.name} fill sizes="64px" className="object-contain p-1" /></div> : null}<div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="break-words font-semibold text-earth-900">{product.name}</h2><StatusLabel active={product.active} /></div><p className="mt-1 text-sm text-foreground-muted">{product.category?.name ?? 'Uncategorized'} · {product.variants.length} variants</p><p className="mt-2 text-sm text-earth-800">{variantSummary(product.variants)}</p><p className="mt-2 text-sm font-semibold text-earth-900">Starting at {prices.length ? formatPrice(String(Math.min(...prices))) : '—'}</p></div></div><div className="mt-4 flex items-center justify-between border-t border-border-soft pt-3"><span className="text-xs text-foreground-muted">Updated {formatOrderDate(product.updatedAt)}</span><Link href={`/admin/products/${product.id}`} className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-botanical-800">Edit product</Link></div></li>;
}

function StatusLabel({ active }: { active: boolean }) { return <span className={active ? 'inline-flex border border-botanical-200 bg-botanical-50 px-2 py-1 text-xs font-semibold text-botanical-800' : 'inline-flex border border-border-soft bg-cream-100 px-2 py-1 text-xs font-semibold text-earth-700'}>{active ? 'Active' : 'Inactive'}</span>; }
function variantSummary(variants: AdminProductListItem['variants']) { return variants.length ? variants.map((variant) => `${formatUnitValue(variant.value, variant.unit)}${variant.active ? '' : ' (inactive)'}`).join(' · ') : 'No variants'; }
function groupProductsByCategory(products: AdminProductListItem[]) {
  const groups = new Map<string, AdminProductListItem[]>();
  for (const product of products) {
    const categoryName = product.category?.name?.trim() || 'Uncategorized';
    const categoryProducts = groups.get(categoryName) ?? [];
    categoryProducts.push(product);
    groups.set(categoryName, categoryProducts);
  }
  return [...groups.entries()]
    .map(([categoryName, categoryProducts]) => ({ categoryName, products: categoryProducts }))
    .sort((left, right) => left.categoryName.localeCompare(right.categoryName, undefined, { sensitivity: 'base' }));
}
function ProductsLoading() { return <section className="mx-auto max-w-8xl" aria-label="Loading products"><div className="h-24 border-b border-border-soft bg-cream-100" /><div className="mt-6 h-96 border border-border-soft bg-cream-100" /></section>; }
function Unavailable() { return <section className="mx-auto max-w-3xl border border-border-soft bg-white px-6 py-12 text-center"><h1 className="font-serif text-2xl text-earth-900">Products couldn’t be loaded</h1><p className="mt-2 text-sm text-foreground-muted">Please refresh and try again.</p></section>; }
