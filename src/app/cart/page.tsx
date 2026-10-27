import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import CartItemControls from '@/components/cart-item-controls';
import GuestCartView from '@/components/guest-cart-view';
import { cartData, CartError, type CartView } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { productsData } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Your cart | Nalam',
  description: 'Review the products and sizes in your Nalam cart.',
};

export default async function CartPage() {
  const categories = await productsData.getCategoriesWithProductCounts();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-cream-50">
        <Suspense fallback={<CartLoading />}>
          <CartContents />
        </Suspense>
      </main>
      <SiteFooter categories={categories} />
    </>
  );
}

async function CartContents() {
  // Keep request-time session work outside the error boundary so Next.js can
  // postpone it behind Suspense during prerendering.
  await connection();

  let cart: CartView | null;
  try {
    cart = await cartData.getCurrentCart();
  } catch (error) {
    if (error instanceof CartError && error.code === 'FORBIDDEN') redirect('/');
    const errorName = error instanceof Error ? error.name : typeof error;
    const details: Record<string, string> = { errorName };
    let current: unknown = error;
    for (let depth = 0; depth < 4 && typeof current === 'object' && current !== null; depth += 1) {
      const record = current as Record<string, unknown>;
      for (const key of ['code', 'sqlState', 'table', 'column', 'constraint', 'kind']) {
        if (typeof record[key] === 'string' && !(key in details)) details[key] = record[key];
      }
      current = record.cause;
    }
    console.error('Cart retrieval failed.', details);
    return <CartUnavailable />;
  }

  if (!cart) return <GuestCartView />;

  return (
    <section className="mx-auto max-w-8xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-8 border-b border-border-soft pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-700">
          Your Nalam cart
        </p>
        <h1 className="mt-2 font-serif text-3xl text-earth-900 sm:text-4xl">Shopping cart</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Prices reflect the current catalogue. Shipping is {formatPrice('0')} for this checkout.
        </p>
      </div>

      {cart.items.length === 0 ? (
        <div className="rounded-xl border border-border-soft bg-white px-5 py-10 text-center sm:px-8 sm:py-16">
          <h2 className="font-serif text-2xl text-earth-900">Your cart is empty</h2>
          <p className="mt-2 text-sm text-foreground-muted">
            Browse the catalogue and choose a size to add to your cart.
          </p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-botanical-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-botanical-800"
            href="/products"
          >
            Explore products
          </Link>
        </div>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <ul className="space-y-4">
            {cart.items.map((item) => (
              <li key={item.id}>
                <article className="grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] gap-3 rounded-xl border border-border-soft bg-white p-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4 sm:p-5">
                  <Link
                    href={'/products/' + item.productSlug}
                    aria-label={'View ' + item.productName}
                    className="relative aspect-square w-full min-w-0 overflow-hidden rounded-lg border border-border-soft bg-cream-100"
                  >
                    {item.image ? (
                      <Image
                        src={item.image.url}
                        alt={item.image.altText || item.productName}
                        fill
                        sizes="(max-width: 639px) 5.5rem, 8rem"
                        className="object-contain p-1 sm:p-3"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center px-3 text-center font-serif text-sm text-botanical-800">
                        NALAM
                      </span>
                    )}
                  </Link>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Link
                          href={'/products/' + item.productSlug}
                          className="font-serif text-xl text-earth-900 hover:text-botanical-800"
                        >
                          {item.productName}
                        </Link>
                        <p className="mt-1 text-sm text-foreground-muted">{item.variantLabel}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-foreground-muted">Unit price</p>
                        <p className="font-semibold text-earth-900">{formatPrice(item.unitPrice)}</p>
                      </div>
                    </div>

                    {!item.isAvailable ? (
                      <p role="status" className="mt-3 rounded-md bg-cream-100 px-3 py-2 text-sm text-earth-800">
                        This option is currently unavailable. Remove it from your cart to continue shopping.
                      </p>
                    ) : item.stockStatus === 'LOW_STOCK' ? (
                      <p className="mt-3 text-xs font-medium text-earth-700">Low stock</p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-border-soft pt-4">
                      <CartItemControls
                        key={item.id + '-' + item.quantity}
                        cartItemId={item.id}
                        quantity={item.quantity}
                        isAvailable={item.isAvailable}
                      />
                      <p className="text-right">
                        <span className="block text-xs text-foreground-muted">Line total</span>
                        <span className="font-semibold text-earth-900">{formatPrice(item.lineTotal)}</span>
                      </p>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>

          <aside className="rounded-xl border border-border-soft bg-white p-5 sm:p-6 lg:sticky lg:top-24">
            <h2 className="font-serif text-2xl text-earth-900">Order summary</h2>
            <div className="mt-5 space-y-3 border-b border-border-soft pb-5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-earth-700">Subtotal</span>
                <span className="font-semibold text-earth-900">{formatPrice(cart.subtotal)}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-earth-700">Shipping</span>
                <span className="font-semibold text-earth-900">{formatPrice('0')}</span>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-foreground-muted">
              The cart uses current catalogue prices. No order or payment is created in this step.
            </p>
            {cart.items.every((item) => item.isAvailable) ? (
  <Link
    className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-botanical-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-botanical-800"
    href="/checkout"
  >
    Continue to checkout
  </Link>
) : (
  <p className="mt-5 text-sm text-earth-700">Remove unavailable items before checkout.</p>
)}
            <Link
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-strong px-5 py-3 text-sm font-semibold text-earth-800 transition hover:border-botanical-700 hover:text-botanical-800"
              href="/products"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}

function CartLoading() {
  return (
    <section className="mx-auto max-w-8xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8" aria-label="Loading cart">
      <div className="h-9 w-48 animate-pulse rounded bg-cream-200" />
      <div className="mt-8 h-40 animate-pulse rounded-xl bg-cream-100" />
    </section>
  );
}

function CartUnavailable() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      <h1 className="font-serif text-3xl text-earth-900">We couldn’t load your cart</h1>
      <p className="mt-3 text-sm text-foreground-muted">Please try again in a moment.</p>
      <Link className="mt-6 inline-flex rounded-md bg-botanical-700 px-5 py-3 text-sm font-semibold text-white" href="/cart">
        Try again
      </Link>
    </section>
  );
}
