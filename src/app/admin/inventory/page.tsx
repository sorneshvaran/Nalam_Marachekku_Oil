import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';

import AuthLayout from '@/components/auth-layout';
import AdminBackToDashboard from '@/components/admin-back-to-dashboard';
import { AdminInventoryForms } from '@/components/admin-inventory-forms';
import { AdminInventoryError, adminInventoryData, type AdminInventoryItem } from '@/lib/admin-inventory';
import { formatPrice, formatUnitValue } from '@/lib/format';
import type { StockStatus } from '@/lib/inventory';

export const metadata: Metadata = { title: 'Inventory | Nalam', description: 'Manage Nalam product variant stock.' };

export default function AdminInventoryPage() {
  return <AuthLayout>
    <main className="flex-1 bg-cream-50 px-4 py-8 sm:px-6 sm:py-12">
      <Suspense fallback={<InventoryLoading />}><AdminInventoryContent /></Suspense>
    </main>
  </AuthLayout>;
}

async function AdminInventoryContent() {
  await connection();
  let inventory;
  try {
    inventory = await adminInventoryData.getAdminInventory();
  } catch (error) {
    if (!(error instanceof AdminInventoryError)) throw error;
    return <Unavailable />;
  }
  const inventoryGroups = groupInventoryByCategory(inventory);

  return <section className="mx-auto w-full max-w-8xl">
    <header className="mb-7 border-b border-border-soft pb-5">
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1"><AdminBackToDashboard /><Link href="/admin/products" className="text-sm font-medium text-botanical-800 hover:underline">← Products</Link></div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-botanical-700">Nalam operations</p>
      <h1 className="mt-2 font-serif text-3xl text-earth-900 sm:text-4xl">Inventory</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-muted">Manage sellable units for each product variant. Customer pages show availability status without revealing exact quantities.</p>
    </header>

    <div className="mb-5 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.08em]">
      <StatusLegend status="AVAILABLE" />
      <StatusLegend status="LOW_STOCK" />
      <StatusLegend status="OUT_OF_STOCK" />
    </div>

    {inventory.length === 0 ? <div className="border border-border-soft bg-white p-8 text-center text-sm text-foreground-muted">No product variants are available to manage.</div> :
      <div className="space-y-8">{inventoryGroups.map((group) => <section key={group.categoryName}><h2 className="border-b border-border-soft pb-3 font-serif text-2xl text-earth-900">{group.categoryName}</h2><div className="mt-4 space-y-4">{group.items.map((item) => <article key={item.variantId} className="border border-border-soft bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-xl text-earth-900">{item.productName}</h2>
              <StatusBadge status={item.stockStatus} />
              <span className={`border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${item.variantActive && item.productActive ? 'border-botanical-200 bg-botanical-50 text-botanical-800' : 'border-border-soft bg-cream-100 text-earth-600'}`}>
                {item.variantActive && item.productActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-foreground-muted">
              <span>{formatUnitValue(item.value, item.unit)}</span><span>SKU: {item.sku}</span><span>{formatPrice(item.price)}</span>
              {!item.productActive ? <span>Product inactive</span> : null}
              {!item.variantActive ? <span>Variant inactive</span> : null}
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 border-t border-border-soft pt-3 text-sm sm:min-w-64 sm:border-t-0 sm:pt-0">
            <dt className="text-foreground-muted">Current stock</dt><dd className="text-right font-semibold tabular-nums text-earth-900">{item.stockQuantity}</dd>
            <dt className="text-foreground-muted">Low-stock threshold</dt><dd className="text-right font-semibold tabular-nums text-earth-900">{item.lowStockThreshold}</dd>
          </dl>
        </div>
        <AdminInventoryForms variantId={item.variantId} stockQuantity={item.stockQuantity} lowStockThreshold={item.lowStockThreshold} />
      </article>)}</div></section>)}</div>
    }
  </section>;
}

function InventoryLoading() {
  return <section className="mx-auto max-w-8xl" aria-label="Loading inventory"><div className="h-32 animate-pulse border-b border-border-soft bg-cream-100" /><div className="mt-5 space-y-4"><div className="h-48 animate-pulse bg-cream-100" /><div className="h-48 animate-pulse bg-cream-100" /></div></section>;
}

function StatusLegend({ status }: { status: StockStatus }) { return <StatusBadge status={status} />; }

function groupInventoryByCategory(inventory: AdminInventoryItem[]) {
  const groups = new Map<string, AdminInventoryItem[]>();
  for (const item of inventory) {
    const categoryName = item.categoryName?.trim() || 'Uncategorized';
    const categoryItems = groups.get(categoryName) ?? [];
    categoryItems.push(item);
    groups.set(categoryName, categoryItems);
  }
  return [...groups.entries()]
    .map(([categoryName, items]) => ({ categoryName, items: items.sort((left, right) => left.productName.localeCompare(right.productName, undefined, { sensitivity: 'base' }) || left.sku.localeCompare(right.sku, undefined, { sensitivity: 'base' })) }))
    .sort((left, right) => left.categoryName.localeCompare(right.categoryName, undefined, { sensitivity: 'base' }));
}

function StatusBadge({ status }: { status: StockStatus }) {
  const style = status === 'AVAILABLE'
    ? 'border-botanical-200 bg-botanical-50 text-botanical-800'
    : status === 'LOW_STOCK'
      ? 'border-amber-300 bg-amber-50 text-amber-800'
      : 'border-red-200 bg-red-50 text-red-700';
  return <span className={`inline-flex border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${style}`}>{status.replaceAll('_', ' ')}</span>;
}

function Unavailable() {
  return <section className="mx-auto max-w-3xl border border-border-soft bg-white px-6 py-12 text-center"><h1 className="font-serif text-2xl text-earth-900">Inventory couldn’t be loaded</h1><p className="mt-2 text-sm text-foreground-muted">Please refresh and try again.</p></section>;
}
