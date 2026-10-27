import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';

import AuthLayout from '@/components/auth-layout';
import AdminBackToDashboard from '@/components/admin-back-to-dashboard';
import OrderStatusBadge from '@/components/order-status-badge';
import { formatOrderDate, formatOrderReference, formatPrice } from '@/lib/format';
import { adminOrdersData, AdminOrderDataError, type AdminOrderListItem } from '@/lib/admin-orders';

export const metadata: Metadata = {
  title: 'Admin Orders | Nalam',
  description: 'Review and manage customer orders.',
};

export default function AdminOrdersPage() {
  return (
    <AuthLayout>
      <main className="flex-1 bg-cream-50 px-4 py-8 sm:px-6 sm:py-12">
        <Suspense fallback={<AdminOrdersLoading />}>
          <AdminOrdersContent />
        </Suspense>
      </main>
    </AuthLayout>
  );
}

async function AdminOrdersContent() {
  await connection();

  let orders: AdminOrderListItem[];
  try {
    orders = await adminOrdersData.getAdminOrders();
  } catch (error) {
    if (error instanceof AdminOrderDataError) return <AdminOrdersUnavailable />;
    throw error;
  }

  return (
    <section className="mx-auto w-full max-w-8xl">
      <AdminBackToDashboard />
      <div className="mb-6 border-b border-border-soft pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-botanical-700">Nalam operations</p>
        <h1 className="mt-2 font-serif text-3xl text-earth-900 sm:text-4xl">Orders</h1>
        <p className="mt-2 text-sm text-foreground-muted">Review customer orders and their current status.</p>
      </div>

      {orders.length === 0 ? (
        <div className="border border-border-soft bg-white px-6 py-12 text-center">
          <h2 className="font-serif text-2xl text-earth-900">No orders yet</h2>
          <p className="mt-2 text-sm text-foreground-muted">New customer orders will appear here.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto border border-border-soft bg-white md:block">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="border-b border-border-soft bg-cream-100 text-xs uppercase tracking-wide text-earth-700">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Order</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Customer</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Payment</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">View</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {orders.map((order) => (
                  <tr key={order.id} className="align-top">
                    <td className="px-4 py-4 font-semibold text-earth-900">{formatOrderReference(order.id)}</td>
                    <td className="max-w-64 px-4 py-4">
                      <p className="break-words font-medium text-earth-900">{order.customerName || 'Customer'}</p>
                      <p className="mt-1 break-all text-xs text-foreground-muted">{order.customerEmail}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-earth-700">{formatOrderDate(order.createdAt)}</td>
                    <td className="px-4 py-4"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-4 py-4">
                      <p className="text-earth-800">{order.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}</p>
                      <p className="mt-1 text-xs text-foreground-muted">Cash on Delivery</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-earth-900">{formatPrice(order.total)}</td>
                    <td className="px-4 py-4 text-right">
                      <Link href={`/admin/orders/${order.id}`} className="font-semibold text-botanical-800 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {orders.map((order) => (
              <li key={order.id} className="border border-border-soft bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Order {formatOrderReference(order.id)}</p>
                    <p className="mt-1 break-words font-medium text-earth-900">{order.customerName || 'Customer'}</p>
                    <p className="mt-1 break-all text-xs text-foreground-muted">{order.customerEmail}</p>
                  </div>
                  <p className="shrink-0 font-serif text-lg font-semibold text-earth-900">{formatPrice(order.total)}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    <span className="text-xs text-foreground-muted">Payment {order.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}</span>
                  </div>
                  <span className="text-xs text-foreground-muted">{formatOrderDate(order.createdAt)} · {order.itemCount} item types</span>
                </div>
                <Link href={`/admin/orders/${order.id}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-botanical-800 hover:underline">View order</Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function AdminOrdersLoading() {
  return <section className="mx-auto w-full max-w-8xl" aria-label="Loading orders"><div className="h-24 animate-pulse border-b border-border-soft bg-cream-100" /><div className="mt-6 h-80 animate-pulse border border-border-soft bg-cream-100" /></section>;
}

function AdminOrdersUnavailable() {
  return <section className="mx-auto w-full max-w-3xl border border-border-soft bg-white px-6 py-12 text-center"><h1 className="font-serif text-2xl text-earth-900">Orders couldn’t be loaded</h1><p className="mt-2 text-sm text-foreground-muted">Please refresh and try again.</p></section>;
}