'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';

import { placeCodOrderAction } from '@/app/actions/checkout';
import type { AddressView } from '@/lib/addresses';
import type { CheckoutItemView } from '@/lib/checkout';
import { formatPrice } from '@/lib/format';

export default function CheckoutForm({
  addresses,
  items,
  subtotal,
  shippingAmount,
  total,
  hasUnavailableItems,
}: {
  addresses: AddressView[];
  items: CheckoutItemView[];
  subtotal: string | null;
  shippingAmount: string;
  total: string | null;
  hasUnavailableItems: boolean;
}) {
  const [state, action, pending] = useActionState(placeCodOrderAction, undefined);
  const [selectedAddressId, setSelectedAddressId] = useState(addresses[0]?.id ?? '');
  const canPlaceOrder =
    addresses.length > 0 &&
    items.length > 0 &&
    !hasUnavailableItems &&
    subtotal !== null &&
    total !== null;

  return (
    <form action={action} className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-8">
        <section className="border border-border-soft bg-white p-5 sm:p-7" aria-labelledby="shipping-heading">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border-soft pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-botanical-700">Delivery</p>
              <h2 id="shipping-heading" className="mt-1 font-serif text-2xl text-earth-900">Shipping address</h2>
            </div>
            <Link
              href="/account#addresses"
              className="text-sm font-semibold text-botanical-800 underline underline-offset-4"
            >
              Add or manage addresses
            </Link>
          </div>

          {addresses.length === 0 ? (
            <div className="mt-5 bg-cream-50 p-5">
              <p className="font-medium text-earth-900">Add a saved address to continue.</p>
              <p className="mt-1 text-sm leading-6 text-foreground-muted">
                Checkout uses a delivery address saved to your account.
              </p>
              <Link
                href="/account#addresses"
                className="mt-4 inline-flex min-h-10 items-center rounded-md bg-botanical-700 px-4 py-2 text-sm font-semibold text-white hover:bg-botanical-800"
              >
                Add an address
              </Link>
            </div>
          ) : (
            <fieldset className="mt-5 space-y-3">
              <legend className="sr-only">Choose a saved delivery address</legend>
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={
                    'flex cursor-pointer gap-3 border p-4 transition ' +
                    (selectedAddressId === address.id
                      ? 'border-botanical-700 bg-botanical-50/50'
                      : 'border-border-soft hover:border-border-strong')
                  }
                >
                  <input
                    type="radio"
                    name="addressId"
                    value={address.id}
                    required
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                    className="mt-1 h-4 w-4 accent-botanical-700"
                  />
                  <span className="min-w-0 text-sm leading-6">
                    <span className="block font-semibold text-earth-900">{address.name}</span>
                    <span className="block text-earth-700">{address.phone}</span>
                    <span className="mt-1 block text-foreground-muted">
                      {[
                        address.addressLine1,
                        address.addressLine2,
                        address.city,
                        address.state,
                        address.postalCode,
                        address.country,
                      ].filter(Boolean).join(', ')}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
        </section>

        <section className="border border-border-soft bg-white p-5 sm:p-7" aria-labelledby="payment-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-botanical-700">Payment</p>
          <h2 id="payment-heading" className="mt-1 font-serif text-2xl text-earth-900">Payment method</h2>
          <div className="mt-5 border border-border-soft bg-cream-50 p-4">
            <p className="font-semibold text-earth-900">Cash on Delivery</p>
            <p className="mt-1 text-sm leading-6 text-foreground-muted">
              Pay for your order when it is delivered.
            </p>
          </div>
        </section>
      </div>

      <aside className="border border-border-soft bg-white p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="font-serif text-2xl text-earth-900">Order summary</h2>

        {hasUnavailableItems ? (
          <div className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950" role="alert">
            A cart item is unavailable or needs attention. Review your cart before continuing.
            <Link className="mt-1 block font-semibold underline underline-offset-4" href="/cart">
              Review cart
            </Link>
          </div>
        ) : null}

        <ul className="mt-5 divide-y divide-border-soft border-y border-border-soft">
          {items.map((item) => (
            <li key={item.id} className="py-4 first:pt-4 last:pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-earth-900">{item.productName}</p>
                  <p className="mt-1 text-sm text-foreground-muted">{item.variantName} · Qty {item.quantity}</p>
                  <p className="mt-1 text-xs text-foreground-muted">
                    Unit price {item.unitPrice === null ? '—' : formatPrice(item.unitPrice)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-earth-900">
                  {item.lineTotal === null ? '—' : formatPrice(item.lineTotal)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {items.length === 0 ? (
          <p className="mt-5 text-sm text-foreground-muted">Your cart is empty.</p>
        ) : null}

        <dl className="mt-5 space-y-3 border-b border-border-soft pb-5 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-earth-700">Subtotal</dt>
            <dd className="font-semibold text-earth-900">{subtotal === null ? '—' : formatPrice(subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-earth-700">Shipping</dt>
            <dd className="font-semibold text-earth-900">{formatPrice(shippingAmount)}</dd>
          </div>
        </dl>
        <div className="flex items-center justify-between gap-4 py-4">
          <span className="font-semibold text-earth-900">Total</span>
          <span className="font-serif text-xl font-semibold text-earth-900">
            {total === null ? '—' : formatPrice(total)}
          </span>
        </div>

        {state?.message ? (
          <p className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || !canPlaceOrder}
          className="inline-flex min-h-12 w-full items-center justify-center bg-botanical-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-botanical-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Placing order…' : 'Place Order'}
        </button>
        <p className="mt-3 text-center text-xs leading-5 text-foreground-muted">
          Your order and total are checked again before it is placed.
        </p>
        <Link
          href="/cart"
          className="mt-4 inline-flex min-h-10 w-full items-center justify-center text-sm font-semibold text-earth-700 underline underline-offset-4 hover:text-botanical-800"
        >
          Back to cart
        </Link>
      </aside>
    </form>
  );
}
