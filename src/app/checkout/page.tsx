import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import CheckoutForm from '@/components/checkout-form';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { getCurrentUser } from '@/lib/auth';
import { checkoutData, CheckoutError, type CheckoutPageData } from '@/lib/checkout';
import { productsData } from '@/lib/products';

export const metadata: Metadata = {
  title: 'Checkout | Nalam',
  description: 'Choose a saved delivery address and place your Nalam order.',
};

export default async function CheckoutPage() {
  const categories = await productsData.getCategoriesWithProductCounts();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-cream-50">
        <Suspense fallback={<CheckoutLoading />}>
          <CheckoutContents />
        </Suspense>
      </main>
      <SiteFooter categories={categories} />
    </>
  );
}

async function CheckoutContents() {
  await connection();

  const user = await getCurrentUser();
  if (!user) redirect('/login?callbackUrl=%2Fcheckout');
  if (user.role !== 'CUSTOMER') redirect('/');

  let checkout: CheckoutPageData;
  try {
    checkout = await checkoutData.getCheckoutPageData();
  } catch (error) {
    if (error instanceof CheckoutError && error.code === 'UNAUTHENTICATED') redirect('/login?callbackUrl=%2Fcheckout');
    if (error instanceof CheckoutError && error.code === 'FORBIDDEN') redirect('/');
    console.error('Checkout data retrieval failed.', {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return <CheckoutUnavailable />;
  }

  return (
    <section className="mx-auto max-w-8xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-8 border-b border-border-soft pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-700">
          Complete your order
        </p>
        <h1 className="mt-2 font-serif text-3xl text-earth-900 sm:text-4xl">Checkout</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Review your items, choose a delivery address, and pay on delivery.
        </p>
      </div>

      {checkout.items.length === 0 ? (
        <div className="border border-border-soft bg-white px-6 py-14 text-center sm:py-16">
          <h2 className="font-serif text-2xl text-earth-900">Your cart is empty</h2>
          <p className="mt-2 text-sm text-foreground-muted">
            Add a product to your cart before starting checkout.
          </p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center justify-center bg-botanical-700 px-6 py-3 text-sm font-semibold text-white hover:bg-botanical-800"
            href="/products"
          >
            Explore products
          </Link>
        </div>
      ) : (
        <CheckoutForm
          addresses={checkout.addresses}
          items={checkout.items}
          subtotal={checkout.subtotal}
          shippingAmount={checkout.shippingAmount}
          total={checkout.total}
          hasUnavailableItems={checkout.hasUnavailableItems}
        />
      )}
    </section>
  );
}

function CheckoutLoading() {
  return (
    <section className="mx-auto max-w-8xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8" aria-label="Loading checkout">
      <div className="h-9 w-48 animate-pulse bg-cream-200" />
      <div className="mt-8 h-96 animate-pulse bg-cream-100" />
    </section>
  );
}

function CheckoutUnavailable() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      <h1 className="font-serif text-3xl text-earth-900">We couldn’t load checkout</h1>
      <p className="mt-3 text-sm text-foreground-muted">Please review your cart and try again.</p>
      <Link className="mt-6 inline-flex bg-botanical-700 px-5 py-3 text-sm font-semibold text-white" href="/cart">
        Return to cart
      </Link>
    </section>
  );
}
