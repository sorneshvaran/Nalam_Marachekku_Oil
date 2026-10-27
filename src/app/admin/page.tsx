import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { connection } from 'next/server';

import AuthLayout from '@/components/auth-layout';
import OrderStatusBadge from '@/components/order-status-badge';
import { AdminDashboardDataError, adminDashboardData, type AdminDashboardData, type AdminDashboardInventoryAlert } from '@/lib/admin-dashboard';
import { formatOrderDate, formatOrderReference, formatPrice, formatUnitValue } from '@/lib/format';

export const metadata: Metadata = { title: 'Dashboard | Nalam', description: 'Overview of Nalam store operations.' };

export default function AdminDashboardPage() {
  return <AuthLayout><main className="flex-1 bg-cream-50 px-4 py-8 sm:px-6 sm:py-12"><Suspense fallback={<DashboardLoading />}><DashboardContent /></Suspense></main></AuthLayout>;
}

async function DashboardContent() {
  await connection();
  let dashboard: AdminDashboardData;
  try {
    dashboard = await adminDashboardData.getAdminDashboard();
  } catch (error) {
    if (error instanceof AdminDashboardDataError) return <Unavailable />;
    throw error;
  }

  return <section className="mx-auto w-full max-w-8xl">
    <header className="mb-7 border-b border-border-soft pb-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-botanical-700">Nalam operations</p>
      <h1 className="mt-2 font-serif text-3xl text-earth-900 sm:text-4xl">Dashboard</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-muted">A current overview of store activity, orders that need attention, and inventory health.</p>
    </header>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard label="Customers" value={dashboard.customers.toLocaleString('en-IN')} href="/admin/customers" detail="Customer accounts" />
      <MetricCard label="Products" value={dashboard.products.toLocaleString('en-IN')} href="/admin/products" detail={`${dashboard.activeProducts} active · ${dashboard.inactiveProducts} inactive`} />
      <MetricCard label="Categories" value={dashboard.categories.toLocaleString('en-IN')} href="/admin/categories" detail="Product categories" />
      <MetricCard label="Orders" value={dashboard.orders.toLocaleString('en-IN')} href="/admin/orders" detail="All order statuses" />
      <MetricCard label="Order Value — All Time" value={formatPrice(dashboard.orderValue)} href="/admin/orders" detail="Stored order totals, including cancelled orders" />
    </div>

    <section className="mt-8">
      <header className="mb-4 border-b border-border-soft pb-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-botanical-700">Management</p><h2 className="mt-1 font-serif text-2xl text-earth-900">Choose an area</h2></header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <ManagementCard title="Orders" href="/admin/orders" action="Manage Orders">
          <p className="text-sm text-earth-800">{dashboard.orders.toLocaleString('en-IN')} total orders</p>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">{(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] as const).map((status) => <div key={status} className="flex items-center justify-between gap-2"><OrderStatusBadge status={status} /><span className="text-sm font-semibold tabular-nums text-earth-900">{dashboard.ordersNeedingAttention[status]}</span></div>)}</div>
        </ManagementCard>

        <ManagementCard title="Products" href="/admin/products" action="Manage Products">
          <p className="font-serif text-3xl tabular-nums text-earth-900">{dashboard.products.toLocaleString('en-IN')}</p>
          <p className="mt-2 text-sm text-foreground-muted">{dashboard.activeProducts} active · {dashboard.inactiveProducts} inactive</p>
        </ManagementCard>

        <ManagementCard title="Categories" href="/admin/categories" action="Manage Categories">
          <p className="font-serif text-3xl tabular-nums text-earth-900">{dashboard.categories.toLocaleString('en-IN')}</p>
          <p className="mt-2 text-sm text-foreground-muted">Current product categories</p>
        </ManagementCard>

        <ManagementCard title="Inventory" href="/admin/inventory" action="Manage Inventory">
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Low stock</p><p className="mt-1 font-serif text-3xl tabular-nums text-earth-900">{dashboard.lowStockCount}</p></div>
            <div><p className="text-xs font-semibold uppercase tracking-wide text-red-700">Out of stock</p><p className="mt-1 font-serif text-3xl tabular-nums text-earth-900">{dashboard.outOfStockCount}</p></div>
          </div>
          {dashboard.unavailableSections.includes('inventory') ? <SectionUnavailable name="Inventory alerts" /> : dashboard.inventoryAlerts.length === 0 ? <p className="mt-3 text-sm text-foreground-muted">No low-stock or out-of-stock variants.</p> : <div className="mt-3 divide-y divide-border-soft border-t border-border-soft">{dashboard.inventoryAlerts.slice(0, 3).map((item) => <InventoryAlert key={item.variantId} item={item} />)}</div>}
        </ManagementCard>

        <ManagementCard title="Customers" href="/admin/customers" action="Manage Customers">
          <p className="font-serif text-3xl tabular-nums text-earth-900">{dashboard.customers.toLocaleString('en-IN')}</p>
          {dashboard.unavailableSections.includes('customers') ? <p className="mt-2 text-sm text-foreground-muted">Recent customer details are unavailable.</p> : dashboard.recentCustomers[0] ? <p className="mt-2 break-words text-sm text-foreground-muted">Latest: {dashboard.recentCustomers[0].name || 'Name not provided'} · {formatOrderDate(dashboard.recentCustomers[0].createdAt)}</p> : <p className="mt-2 text-sm text-foreground-muted">No customer accounts yet.</p>}
        </ManagementCard>
      </div>
    </section>

    <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <section className="min-w-0 border border-border-soft bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-border-soft px-4 py-4 sm:px-5"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-botanical-700">Latest activity</p><h2 className="mt-1 font-serif text-xl text-earth-900">Recent orders</h2></div><Link href="/admin/orders" className="min-h-11 inline-flex items-center text-sm font-semibold text-botanical-800 hover:underline">All orders</Link></div>
        {dashboard.unavailableSections.includes('orders') ? <SectionUnavailable name="Recent orders" /> : dashboard.recentOrders.length === 0 ? <p className="px-4 py-8 text-sm text-foreground-muted sm:px-5">No orders yet.</p> : <>
          <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-cream-100 text-xs uppercase tracking-wide text-earth-700"><tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3 text-right">Total</th></tr></thead><tbody className="divide-y divide-border-soft">{dashboard.recentOrders.map((order) => <tr key={order.id}><td className="whitespace-nowrap px-4 py-4"><Link className="font-semibold text-botanical-800 hover:underline" href={`/admin/orders/${order.id}`}>{formatOrderReference(order.id)}</Link></td><td className="max-w-44 px-4 py-4"><p className="break-words text-earth-900">{order.customerName || 'Name not provided'}</p><p className="break-all text-xs text-foreground-muted">{order.customerEmail}</p></td><td className="whitespace-nowrap px-4 py-4 text-earth-700">{formatOrderDate(order.createdAt)}</td><td className="px-4 py-4"><OrderStatusBadge status={order.status} /></td><td className="px-4 py-4 text-xs text-earth-700">{paymentDescription(order.paymentMethod, order.paymentStatus)}</td><td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-earth-900">{formatPrice(order.total)}</td></tr>)}</tbody></table></div>
          <ul className="divide-y divide-border-soft md:hidden">{dashboard.recentOrders.map((order) => <li key={order.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link className="font-semibold text-botanical-800 hover:underline" href={`/admin/orders/${order.id}`}>Order {formatOrderReference(order.id)}</Link><p className="mt-1 break-words text-sm text-earth-900">{order.customerName || 'Name not provided'}</p><p className="break-all text-xs text-foreground-muted">{order.customerEmail}</p></div><p className="shrink-0 font-semibold text-earth-900">{formatPrice(order.total)}</p></div><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><OrderStatusBadge status={order.status} /><span className="text-xs text-foreground-muted">{formatOrderDate(order.createdAt)} · {paymentDescription(order.paymentMethod, order.paymentStatus)}</span></div></li>)}</ul>
        </>}
      </section>

      <section className="min-w-0 border border-border-soft bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-border-soft px-4 py-4 sm:px-5"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-botanical-700">New accounts</p><h2 className="mt-1 font-serif text-xl text-earth-900">Recent customers</h2></div><Link href="/admin/customers" className="min-h-11 inline-flex items-center text-sm font-semibold text-botanical-800 hover:underline">All customers</Link></div>
        {dashboard.unavailableSections.includes('customers') ? <SectionUnavailable name="Recent customers" /> : dashboard.recentCustomers.length === 0 ? <p className="px-4 py-8 text-sm text-foreground-muted sm:px-5">No customers yet.</p> : <ul className="divide-y divide-border-soft">{dashboard.recentCustomers.map((customer) => <li key={customer.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="min-w-0"><Link href={`/admin/customers/${customer.id}`} className="break-words font-medium text-botanical-800 hover:underline">{customer.name || 'Name not provided'}</Link><p className="break-all text-xs text-foreground-muted">{customer.email}</p><p className="mt-1 text-xs text-foreground-muted">Joined {formatOrderDate(customer.createdAt)}</p></div><div className="flex items-center justify-between gap-3 text-sm sm:block sm:text-right"><span className="text-foreground-muted">{customer.orderCount} {customer.orderCount === 1 ? 'order' : 'orders'}</span><Link href={`/admin/customers/${customer.id}`} className="min-h-11 inline-flex items-center text-sm font-semibold text-botanical-800 hover:underline">View</Link></div></li>)}</ul>}
      </section>
    </div>

  </section>;
}

function MetricCard({ label, value, href, detail }: { label: string; value: string; href: string; detail: string }) {
  return <Link href={href} className="min-w-0 border border-border-soft bg-white p-4 transition hover:border-botanical-300 sm:p-5"><span className="block min-h-9 text-xs font-semibold uppercase tracking-[0.1em] text-foreground-muted">{label}</span><span className="block break-words font-serif text-2xl text-earth-900 sm:text-3xl">{value}</span><span className="mt-2 block text-xs leading-5 text-foreground-muted">{detail}</span></Link>;
}

function ManagementCard({ title, href, action, children }: { title: string; href: string; action: string; children: ReactNode }) {
  return <Link href={href} className="group flex min-w-0 flex-col border border-border-soft bg-white p-4 transition-colors hover:border-botanical-300 hover:bg-cream-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botanical-700 sm:p-5">
    <h3 className="font-serif text-xl text-earth-900">{title}</h3>
    <div className="mt-3 min-w-0 flex-1">{children}</div>
    <span className="mt-4 inline-flex min-h-11 items-center border-t border-border-soft pt-3 text-sm font-semibold text-botanical-800 group-hover:underline">{action} <span aria-hidden="true" className="ml-2">→</span></span>
  </Link>;
}

function InventoryAlert({ item }: { item: AdminDashboardInventoryAlert }) {
  const isOut = item.stockStatus === 'OUT_OF_STOCK';
  return <div className="flex items-start justify-between gap-3 py-3"><div className="min-w-0"><p className="break-words text-sm font-medium text-earth-900">{item.productName} · {formatUnitValue(item.value, item.unit)}</p><p className="mt-1 break-all text-xs text-foreground-muted">SKU: {item.sku} · {item.stockQuantity} in stock · threshold {item.lowStockThreshold}</p></div><span className={`shrink-0 border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${isOut ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>{isOut ? 'Out of stock' : 'Low stock'}</span></div>;
}

function paymentDescription(method: 'CASH_ON_DELIVERY', status: 'PENDING' | 'PAID') {
  return `${method === 'CASH_ON_DELIVERY' ? 'Cash on delivery' : method} · ${status === 'PAID' ? 'Paid' : 'Pending'}`;
}

function SectionUnavailable({ name }: { name: string }) {
  return <p role="status" className="px-4 py-6 text-sm text-foreground-muted sm:px-5">{name} could not be loaded. Refresh the dashboard or open its management page.</p>;
}

function DashboardLoading() {
  return <section className="mx-auto max-w-8xl" aria-label="Loading dashboard"><div className="h-24 border-b border-border-soft bg-cream-100" /><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-28 border border-border-soft bg-cream-100" />)}</div><div className="mt-8 grid gap-6 lg:grid-cols-2"><div className="h-64 border border-border-soft bg-cream-100" /><div className="h-64 border border-border-soft bg-cream-100" /></div></section>;
}

function Unavailable() {
  return <section className="mx-auto max-w-3xl border border-border-soft bg-white px-6 py-12 text-center"><h1 className="font-serif text-2xl text-earth-900">Dashboard couldn’t be loaded</h1><p className="mt-2 text-sm text-foreground-muted">Please refresh and try again.</p></section>;
}
