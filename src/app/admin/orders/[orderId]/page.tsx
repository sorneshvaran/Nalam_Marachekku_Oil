import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';

import AdminOrderStatusForm from '@/components/admin-order-status-form';
import AuthLayout from '@/components/auth-layout';
import AdminBackToDashboard from '@/components/admin-back-to-dashboard';
import OrderStatusBadge from '@/components/order-status-badge';
import { formatOrderDate, formatOrderReference, formatPrice } from '@/lib/format';
import { orderIdSchema } from '@/lib/checkout-validation';
import { adminOrdersData, AdminOrderDataError, getAllowedOrderStatuses, type AdminOrderDetails } from '@/lib/admin-orders';

export const metadata: Metadata = {
  title: 'Admin Order Details | Nalam',
  description: 'Review customer order information and update its status.',
};

type AdminOrderPageProps = {
  params: Promise<{ orderId: string }>;
};

export default function AdminOrderDetailsPage({ params }: AdminOrderPageProps) {
  return (
    <AuthLayout>
      <main className="flex-1 bg-cream-50 px-4 py-8 sm:px-6 sm:py-12">
        <Suspense fallback={<AdminOrderLoading />}>
          <AdminOrderContent params={params} />
        </Suspense>
      </main>
    </AuthLayout>
  );
}

async function AdminOrderContent({ params }: AdminOrderPageProps) {
  await connection();
  const { orderId } = await params;
  if (!orderIdSchema.safeParse(orderId).success) notFound();

  let order: AdminOrderDetails | null;
  try {
    order = await adminOrdersData.getAdminOrderById(orderId);
  } catch (error) {
    if (error instanceof AdminOrderDataError) {
      if (error.code === 'INVALID_ID' || error.code === 'NOT_FOUND') notFound();
      return <AdminOrderUnavailable />;
    }
    throw error;
  }
  if (!order) notFound();

  const allowedStatuses = getAllowedOrderStatuses(order.status);
  return (
    <section className="mx-auto w-full max-w-8xl">
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1"><AdminBackToDashboard /><Link href="/admin/orders" className="text-sm font-medium text-botanical-800 hover:underline">← Orders</Link></div>
      <div className="mt-5 flex flex-col gap-4 border-b border-border-soft pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-botanical-700">Nalam operations</p>
          <h1 className="mt-2 break-words font-serif text-3xl text-earth-900 sm:text-4xl">Order {formatOrderReference(order.id)}</h1>
          <p className="mt-2 text-sm text-foreground-muted">Placed {formatOrderDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="min-w-0 space-y-5">
          <div className="border border-border-soft bg-white p-5 sm:p-6">
            <h2 className="font-serif text-xl text-earth-900">Items</h2>
            <ul className="mt-4 divide-y divide-border-soft border-y border-border-soft">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="break-words font-medium text-earth-900">{item.productName}</p>
                    <p className="mt-1 break-words text-sm text-foreground-muted">{item.variantName} · Qty {item.quantity}</p>
                    <p className="mt-1 text-xs text-foreground-muted">{formatPrice(item.unitPrice)} each</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-earth-900">{formatPrice(item.totalPrice)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-earth-700">Subtotal</dt><dd className="font-medium text-earth-900">{formatPrice(order.subtotal)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-earth-700">Shipping</dt><dd className="font-medium text-earth-900">{formatPrice(order.shippingAmount)}</dd></div>
              <div className="flex justify-between gap-3 border-t border-border-soft pt-3"><dt className="font-semibold text-earth-900">Total</dt><dd className="font-semibold text-earth-900">{formatPrice(order.total)}</dd></div>
            </dl>
          </div>
          <div className="border border-border-soft bg-white p-5 sm:p-6">
            <h2 className="font-serif text-xl text-earth-900">Shipping snapshot</h2>
            <p className="mt-4 break-words font-semibold text-earth-900">{order.shippingName}</p>
            <p className="mt-1 break-words text-sm text-earth-700">{order.shippingPhone}</p>
            <address className="mt-3 space-y-1 break-words text-sm not-italic leading-6 text-foreground-muted">
              <span className="block">{order.shippingAddressLine1}</span>
              {order.shippingAddressLine2 ? <span className="block">{order.shippingAddressLine2}</span> : null}
              <span className="block">{order.shippingCity}, {order.shippingState} {order.shippingPostalCode}</span>
              <span className="block">{order.shippingCountry}</span>
            </address>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="border border-border-soft bg-white p-5 sm:p-6">
            <h2 className="font-serif text-xl text-earth-900">Customer</h2>
            <p className="mt-4 break-words font-semibold text-earth-900">{order.customerName || 'Customer'}</p>
            <p className="mt-1 break-all text-sm text-foreground-muted">{order.customerEmail}</p>
            <Link href={`/admin/customers/${order.customerId}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-botanical-800 hover:underline">View customer</Link>
          </section>
          <section className="border border-border-soft bg-white p-5 sm:p-6">
            <h2 className="font-serif text-xl text-earth-900">Order status</h2>
            <div className="mt-4"><OrderStatusBadge status={order.status} /></div>
            <p className="mt-3 text-sm text-foreground-muted">Payment: {order.paymentStatus === 'PAID' ? 'Paid' : 'Pending'} · Cash on Delivery</p>
            <div className="mt-5 border-t border-border-soft pt-5">
              <AdminOrderStatusForm orderId={order.id} allowedStatuses={allowedStatuses} />
              {allowedStatuses.includes('CANCELLED') ? <p className="mt-4 border-t border-border-soft pt-4 text-xs leading-5 text-foreground-muted">Cancelling an order does not automatically return units to inventory. Review whether the items are resalable, then adjust stock in <Link className="font-semibold text-botanical-800 underline" href="/admin/inventory">Inventory</Link> if appropriate.</p> : null}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

function AdminOrderLoading() {
  return <section className="mx-auto w-full max-w-8xl" aria-label="Loading order"><div className="h-24 animate-pulse border-b border-border-soft bg-cream-100" /><div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]"><div className="h-[32rem] animate-pulse bg-cream-100" /><div className="h-72 animate-pulse bg-cream-100" /></div></section>;
}

function AdminOrderUnavailable() {
  return <section className="mx-auto w-full max-w-3xl border border-border-soft bg-white px-6 py-12 text-center"><h1 className="font-serif text-2xl text-earth-900">Order details couldn’t be loaded</h1><p className="mt-2 text-sm text-foreground-muted">Please refresh and try again.</p><Link href="/admin/orders" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-botanical-800 hover:underline">Return to Orders</Link></section>;
}