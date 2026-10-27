import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';

import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { getCurrentUser } from '@/lib/auth';
import { OrderDataError, ordersData, type CustomerOrderDetails } from '@/lib/orders';
import { orderIdSchema } from '@/lib/checkout-validation';
import { formatPrice } from '@/lib/format';
import { productsData } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Order placed | Nalam',
  description: 'Your Nalam Cash on Delivery order has been placed.',
};

type OrderSuccessPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const categories = await productsData.getCategoriesWithProductCounts();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-cream-50">
        <Suspense fallback={<OrderSuccessLoading />}>
          <OrderSuccessContents params={params} />
        </Suspense>
      </main>
      <SiteFooter categories={categories} />
    </>
  );
}

async function OrderSuccessContents({ params }: OrderSuccessPageProps) {
  await connection();

  const { orderId } = await params;
  if (!orderIdSchema.safeParse(orderId).success) notFound();

  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/order-success/' + orderId));
  }
  if (user.role !== 'CUSTOMER') notFound();

  let order: CustomerOrderDetails | null;
  try {
    order = await ordersData.getCustomerOrderById(orderId);
  } catch (error) {
    if (error instanceof OrderDataError && error.code === 'UNAUTHENTICATED') {
      redirect('/login?callbackUrl=' + encodeURIComponent('/order-success/' + orderId));
    }
    if (error instanceof OrderDataError && error.code === 'FORBIDDEN') notFound();
    console.error('Order success retrieval failed.', {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    notFound();
  }
  if (!order) notFound();

  const reference = order.id.replaceAll('-', '').slice(0, 10).toUpperCase();

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="border border-border-soft bg-white p-6 text-center sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-botanical-50 text-2xl font-semibold text-botanical-800" aria-hidden="true">
          ✓
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-botanical-700">Order confirmed</p>
        <h1 className="mt-2 font-serif text-3xl text-earth-900 sm:text-4xl">Thank you for your order</h1>
        <p className="mt-3 text-sm leading-6 text-foreground-muted">
          Your order has been placed. Pay by Cash on Delivery.
        </p>
        <p className="mt-4 text-sm text-earth-700">
          Order reference <span className="font-semibold text-earth-900">{reference}</span>
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="border border-border-soft bg-white p-5 sm:p-7" aria-labelledby="items-heading">
          <h2 id="items-heading" className="font-serif text-2xl text-earth-900">Items ordered</h2>
          <ul className="mt-5 divide-y divide-border-soft border-y border-border-soft">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 py-4 first:pt-4 last:pb-4">
                <div>
                  <p className="font-medium text-earth-900">{item.productName}</p>
                  <p className="mt-1 text-sm text-foreground-muted">
                    {item.variantName} · Qty {item.quantity}
                  </p>
                  <p className="mt-1 text-xs text-foreground-muted">
                    {formatPrice(item.unitPrice)} each
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-earth-900">{formatPrice(item.totalPrice)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-3 border-b border-border-soft pb-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-earth-700">Subtotal</dt>
              <dd className="font-medium text-earth-900">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-earth-700">Shipping</dt>
              <dd className="font-medium text-earth-900">{formatPrice(order.shippingAmount)}</dd>
            </div>
          </dl>
          <div className="flex justify-between gap-4 pt-4">
            <span className="font-semibold text-earth-900">Total due on delivery</span>
            <span className="font-serif text-xl font-semibold text-earth-900">{formatPrice(order.total)}</span>
          </div>
        </section>

        <aside className="border border-border-soft bg-white p-5 sm:p-6">
          <h2 className="font-serif text-2xl text-earth-900">Delivery details</h2>
          <p className="mt-4 font-semibold text-earth-900">{order.shippingName}</p>
          <p className="mt-1 text-sm text-earth-700">{order.shippingPhone}</p>
          <address className="mt-3 whitespace-pre-line text-sm not-italic leading-6 text-foreground-muted">
            {[
              order.shippingAddressLine1,
              order.shippingAddressLine2,
              order.shippingCity,
              order.shippingState,
              order.shippingPostalCode,
              order.shippingCountry,
            ].filter(Boolean).join(', ')}
          </address>
          <div className="mt-6 border-t border-border-soft pt-5">
            <p className="text-sm font-semibold text-earth-900">Cash on Delivery</p>
            <p className="mt-1 text-sm text-foreground-muted">Payment is due when the order arrives.</p>
          </div>
        </aside>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/products"
          className="inline-flex min-h-11 items-center justify-center bg-botanical-700 px-6 py-3 text-sm font-semibold text-white hover:bg-botanical-800"
        >
          Continue shopping
        </Link>
        <Link
          href={`/account/orders/${order.id}`}
          className="inline-flex min-h-11 items-center justify-center border border-border-strong px-6 py-3 text-sm font-semibold text-earth-800 hover:border-botanical-700 hover:text-botanical-800"
        >
          My account
        </Link>
      </div>
    </section>
  );
}

function OrderSuccessLoading() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8" aria-label="Loading order confirmation">
      <div className="h-48 animate-pulse bg-cream-100" />
      <div className="mt-8 h-72 animate-pulse bg-cream-100" />
    </section>
  );
}