import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';

import AuthLayout from '@/components/auth-layout';
import OrderStatusBadge from '@/components/order-status-badge';
import { formatOrderDate, formatOrderReference, formatPrice } from '@/lib/format';
import { orderIdSchema } from '@/lib/checkout-validation';
import { OrderDataError, ordersData, type CustomerOrderDetails } from '@/lib/orders';

export const metadata: Metadata = {
  title: 'Order Details | Nalam',
  description: 'View your Nalam order details and delivery information.',
};

type OrderDetailsPageProps = {
  params: Promise<{ orderId: string }>;
};

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  return (
    <AuthLayout>
      <main className="flex-1 bg-cream-50 px-4 py-10 sm:px-6 sm:py-14">
        <Suspense fallback={<OrderDetailsLoading />}>
          <OrderDetailsContent params={params} />
        </Suspense>
      </main>
    </AuthLayout>
  );
}

async function OrderDetailsContent({ params }: OrderDetailsPageProps) {
  await connection();
  const { orderId } = await params;
  if (!orderIdSchema.safeParse(orderId).success) notFound();

  let order: CustomerOrderDetails | null;
  try {
    order = await ordersData.getCustomerOrderById(orderId);
  } catch (error) {
    if (error instanceof OrderDataError && error.code === 'UNAUTHENTICATED') {
      redirect('/login?callbackUrl=' + encodeURIComponent(`/account/orders/${orderId}`));
    }
    if (error instanceof OrderDataError && error.code === 'FORBIDDEN') notFound();
    console.error('Customer order details retrieval failed.', {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return <OrderDetailsUnavailable />;
  }
  if (!order) notFound();

  return (
    <section className="mx-auto w-full max-w-5xl">
      <Link href="/account/orders" className="text-sm font-medium text-botanical-800 hover:underline">← My Orders</Link>
      <div className="mt-5 flex flex-col gap-4 border-b border-border-soft pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-700">Order details</p>
          <h1 className="mt-2 break-words font-serif text-3xl text-earth-900 sm:text-4xl">Order {formatOrderReference(order.id)}</h1>
          <p className="mt-2 text-sm text-foreground-muted">Placed {formatOrderDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="min-w-0 border border-border-soft bg-white p-5 sm:p-7" aria-labelledby="order-items-heading">
          <h2 id="order-items-heading" className="font-serif text-2xl text-earth-900">Items ordered</h2>
          <ul className="mt-5 divide-y divide-border-soft border-y border-border-soft">
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
          <dl className="mt-5 space-y-3 border-b border-border-soft pb-5 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-earth-700">Subtotal</dt><dd className="font-medium text-earth-900">{formatPrice(order.subtotal)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-earth-700">Shipping</dt><dd className="font-medium text-earth-900">{formatPrice(order.shippingAmount)}</dd></div>
          </dl>
          <div className="flex justify-between gap-4 pt-4">
            <span className="font-semibold text-earth-900">Total</span>
            <span className="font-serif text-xl font-semibold text-earth-900">{formatPrice(order.total)}</span>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="border border-border-soft bg-white p-5 sm:p-6" aria-labelledby="shipping-heading">
            <h2 id="shipping-heading" className="font-serif text-2xl text-earth-900">Shipping address</h2>
            <p className="mt-4 break-words font-semibold text-earth-900">{order.shippingName}</p>
            <p className="mt-1 break-words text-sm text-earth-700">{order.shippingPhone}</p>
            <address className="mt-3 space-y-1 break-words text-sm not-italic leading-6 text-foreground-muted">
              <span className="block">{order.shippingAddressLine1}</span>
              {order.shippingAddressLine2 ? <span className="block">{order.shippingAddressLine2}</span> : null}
              <span className="block">{order.shippingCity}, {order.shippingState} {order.shippingPostalCode}</span>
              <span className="block">{order.shippingCountry}</span>
            </address>
          </section>
          <section className="border border-border-soft bg-white p-5 sm:p-6" aria-labelledby="payment-heading">
            <h2 id="payment-heading" className="font-serif text-2xl text-earth-900">Payment</h2>
            <p className="mt-4 text-sm font-semibold text-earth-900">Cash on Delivery</p>
            <p className="mt-1 text-sm text-foreground-muted">Payment status: {order.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}</p>
          </section>
        </aside>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/products" className="inline-flex min-h-11 items-center justify-center bg-botanical-700 px-6 py-3 text-sm font-semibold text-white hover:bg-botanical-800">Continue shopping</Link>
        <Link href="/account" className="inline-flex min-h-11 items-center justify-center border border-border-strong px-6 py-3 text-sm font-semibold text-earth-800 hover:border-botanical-700 hover:text-botanical-800">My account</Link>
      </div>
    </section>
  );
}

function OrderDetailsLoading() {
  return <section className="mx-auto w-full max-w-5xl" aria-label="Loading order details"><div className="h-24 animate-pulse border-b border-border-soft bg-cream-100" /><div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]"><div className="h-96 animate-pulse bg-cream-100" /><div className="h-72 animate-pulse bg-cream-100" /></div></section>;
}

function OrderDetailsUnavailable() {
  return <section className="mx-auto w-full max-w-3xl border border-border-soft bg-white px-6 py-12 text-center"><h1 className="font-serif text-2xl text-earth-900">We couldn’t load this order</h1><p className="mt-2 text-sm text-foreground-muted">Please try again in a moment.</p><Link href="/account/orders" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-botanical-800 hover:underline">Return to My Orders</Link></section>;
}