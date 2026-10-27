import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';

import AuthLayout from '@/components/auth-layout';
import OrderStatusBadge from '@/components/order-status-badge';
import { formatOrderDate, formatOrderReference, formatPrice } from '@/lib/format';
import { OrderDataError, ordersData, type CustomerOrderListItem } from '@/lib/orders';

export const metadata: Metadata = {
  title: 'My Orders | Nalam',
  description: 'View your Nalam order history.',
};

export default function OrdersPage() {
  return (
    <AuthLayout>
      <main className="flex-1 bg-cream-50 px-4 py-10 sm:px-6 sm:py-14">
        <Suspense fallback={<OrdersLoading />}>
          <OrdersContent />
        </Suspense>
      </main>
    </AuthLayout>
  );
}

async function OrdersContent() {
  await connection();
  let orders: CustomerOrderListItem[];
  try {
    orders = await ordersData.getCustomerOrders();
  } catch (error) {
    if (error instanceof OrderDataError && error.code === 'UNAUTHENTICATED') {
      redirect('/login?callbackUrl=%2Faccount%2Forders');
    }
    if (error instanceof OrderDataError && error.code === 'FORBIDDEN') notFound();
    console.error('Customer order list retrieval failed.', {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return <OrdersUnavailable />;
  }

  return (
    <section className="mx-auto w-full max-w-5xl">
      <div className="mb-8 border-b border-border-soft pb-6">
        <Link href="/account" className="text-sm font-medium text-botanical-800 hover:underline">
          My account
        </Link>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-botanical-700">Your purchases</p>
        <h1 className="mt-2 font-serif text-3xl text-earth-900 sm:text-4xl">My Orders</h1>
        <p className="mt-2 text-sm text-foreground-muted">View your order history and delivery details.</p>
      </div>

      {orders.length === 0 ? (
        <div className="border border-border-soft bg-white px-6 py-14 text-center sm:py-16">
          <h2 className="font-serif text-2xl text-earth-900">No orders yet</h2>
          <p className="mt-2 text-sm text-foreground-muted">Your orders will appear here after you place an order.</p>
          <Link
            href="/products"
            className="mt-6 inline-flex min-h-11 items-center justify-center bg-botanical-700 px-6 py-3 text-sm font-semibold text-white hover:bg-botanical-800"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="border border-border-soft bg-white p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground-muted">
                    Order {formatOrderReference(order.id)}
                  </p>
                  <p className="mt-1 text-sm text-earth-700">Placed {formatOrderDate(order.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  <p className="font-serif text-lg font-semibold text-earth-900">{formatPrice(order.total)}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 border-t border-border-soft pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-earth-900">Cash on Delivery</p>
                  <p className="mt-1 text-xs text-foreground-muted">
                    Payment: {order.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-earth-700">
                    {order.items.slice(0, 2).map((item, index) => (
                      <li key={`${item.productName}-${item.variantName}-${index}`} className="break-words">
                        {item.productName} · {item.variantName} · Qty {item.quantity}
                      </li>
                    ))}
                    {order.items.length > 2 ? (
                      <li className="text-foreground-muted">and {order.items.length - 2} more item types</li>
                    ) : null}
                  </ul>
                </div>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="inline-flex min-h-11 items-center justify-center border border-border-strong px-5 py-2.5 text-sm font-semibold text-earth-800 hover:border-botanical-700 hover:text-botanical-800"
                >
                  View Order
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function OrdersLoading() {
  return (
    <section className="mx-auto w-full max-w-5xl" aria-label="Loading orders">
      <div className="h-24 animate-pulse border-b border-border-soft bg-cream-100" />
      <div className="mt-8 h-56 animate-pulse border border-border-soft bg-cream-100" />
    </section>
  );
}

function OrdersUnavailable() {
  return (
    <section className="mx-auto w-full max-w-3xl border border-border-soft bg-white px-6 py-12 text-center">
      <h1 className="font-serif text-2xl text-earth-900">We couldn’t load your orders</h1>
      <p className="mt-2 text-sm text-foreground-muted">Please try again in a moment.</p>
      <Link href="/account" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-botanical-800 hover:underline">
        Return to my account
      </Link>
    </section>
  );
}