'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { getGuestCartViewAction } from '@/app/actions/cart';
import { MAX_CART_QUANTITY } from '@/lib/cart-constants';
import { formatPrice } from '@/lib/format';
import {
  getGuestCart,
  removeGuestItem,
  subscribeToGuestCart,
  updateGuestItem,
  type GuestCartMutationResult,
} from '@/lib/guest-cart';
import type { GuestCartView as GuestCartDataView, GuestCartViewItem } from '@/lib/cart';

export default function GuestCartView() {
  const [cart, setCart] = useState<GuestCartDataView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const requestNumber = useRef(0);

  const loadCart = useCallback(async () => {
    const items = getGuestCart();
    const request = ++requestNumber.current;
    setError('');

    if (items.length === 0) {
      setCart({ items: [], subtotal: '0' });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await getGuestCartViewAction(items);
      if (request !== requestNumber.current) return;
      if (!result.success) {
        setError(result.message);
        setCart(null);
        return;
      }
      setCart(result.cart);
    } catch {
      if (request === requestNumber.current) {
        setError('We could not load current product details. Your guest cart is still saved.');
      }
    } finally {
      if (request === requestNumber.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadCart);
    return subscribeToGuestCart(() => void loadCart());
  }, [loadCart]);

  function handleMutation(result: GuestCartMutationResult): void {
    if (result === 'success') {
      setError('');
    } else if (result === 'invalid-quantity') {
      setError('Enter a whole quantity from 1 to 99.');
    } else if (result === 'quantity-limit') {
      setError('This variant cannot exceed 99 units in your guest cart.');
    } else {
      setError('This browser could not save your cart. Check its storage settings and try again.');
    }
  }

  return (
    <section className="mx-auto max-w-8xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-8 border-b border-border-soft pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-700">Your Nalam cart</p>
        <h1 className="mt-2 font-serif text-3xl text-earth-900 sm:text-4xl">Shopping cart</h1>
        <p className="mt-2 text-sm text-foreground-muted">
          Prices reflect the current catalogue. Shipping is {formatPrice('0')} for this checkout.
        </p>
      </div>

      {error ? (
        <p role="alert" className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-4" aria-label="Loading guest cart">
          <div className="h-40 animate-pulse rounded-xl bg-cream-100" />
          <div className="h-40 animate-pulse rounded-xl bg-cream-100" />
        </div>
      ) : !cart || cart.items.length === 0 ? (
        <div className="rounded-xl border border-border-soft bg-white px-6 py-14 text-center sm:py-16">
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
          <div>
            <p className="mb-4 rounded-md bg-cream-100 px-4 py-3 text-sm text-earth-800">
              This guest cart is saved in this browser. Sign in or create an account to merge it with your account cart.
            </p>
            <ul className="space-y-4">
              {cart.items.map((item) => (
                <GuestCartRow
                  key={item.variantId}
                  item={item}
                  onUpdate={(quantity) => handleMutation(updateGuestItem(item.variantId, quantity))}
                  onRemove={() => handleMutation(removeGuestItem(item.variantId))}
                />
              ))}
            </ul>
          </div>

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
              This guest cart is saved in this browser. Sign in at checkout to place your order.
            </p>
            <div className="mt-6 grid gap-3">
              <Link
  className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-botanical-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-botanical-800"
  href="/checkout"
>
  Continue to checkout
</Link>
              <Link
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-botanical-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-botanical-800"
                href="/login?callbackUrl=%2Fcart"
              >
                Log in to merge cart
              </Link>
              <Link
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-strong px-5 py-3 text-sm font-semibold text-earth-800 transition hover:border-botanical-700 hover:text-botanical-800"
                href="/register?callbackUrl=%2Fcart"
              >
                Create an account
              </Link>
              <Link className="text-center text-sm font-medium text-botanical-800 underline underline-offset-4" href="/products">
                Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function GuestCartRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: GuestCartViewItem;
  onUpdate: (quantity: number) => void;
  onRemove: () => void;
}) {
  const title = item.productSlug ? (
    <Link href={'/products/' + item.productSlug} className="font-serif text-xl text-earth-900 hover:text-botanical-800">
      {item.productName}
    </Link>
  ) : (
    <span className="font-serif text-xl text-earth-900">{item.productName}</span>
  );

  return (
    <li>
      <article className="grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] gap-3 rounded-xl border border-border-soft bg-white p-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4 sm:p-5">
        <div className="relative aspect-square w-full min-w-0 overflow-hidden rounded-lg border border-border-soft bg-cream-100">
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
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {title}
              <p className="mt-1 text-sm text-foreground-muted">{item.variantLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-foreground-muted">Unit price</p>
              <p className="font-semibold text-earth-900">
                {item.unitPrice === null ? '—' : formatPrice(item.unitPrice)}
              </p>
            </div>
          </div>

          {!item.isAvailable ? (
            <p role="status" className="mt-3 rounded-md bg-cream-100 px-3 py-2 text-sm text-earth-800">
              Currently unavailable. Remove this item before merging your cart.
            </p>
          ) : item.stockStatus === 'LOW_STOCK' ? (
            <p className="mt-3 text-xs font-medium text-earth-700">Low stock</p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-border-soft pt-4">
            <GuestCartControls
              key={item.variantId + '-' + item.quantity}
              variantId={item.variantId}
              quantity={item.quantity}
              isAvailable={item.isAvailable}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
            <p className="text-right">
              <span className="block text-xs text-foreground-muted">Line total</span>
              <span className="font-semibold text-earth-900">
                {item.lineTotal === null ? '—' : formatPrice(item.lineTotal)}
              </span>
            </p>
          </div>
        </div>
      </article>
    </li>
  );
}

function GuestCartControls({
  variantId,
  quantity: initialQuantity,
  isAvailable,
  onUpdate,
  onRemove,
}: {
  variantId: string;
  quantity: number;
  isAvailable: boolean;
  onUpdate: (quantity: number) => void;
  onRemove: () => void;
}) {
  const [quantity, setQuantity] = useState(String(initialQuantity));
  const parsedQuantity = Number(quantity);
  const isValidQuantity = Number.isInteger(parsedQuantity) && parsedQuantity >= 1 && parsedQuantity <= MAX_CART_QUANTITY;

  function saveQuantity(nextQuantity: number): void {
    onUpdate(nextQuantity);
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div>
        <label htmlFor={'guest-quantity-' + variantId} className="mb-1 block text-xs font-medium text-earth-700">
          Quantity
        </label>
        <input
          id={'guest-quantity-' + variantId}
          type="number"
          min={1}
          max={MAX_CART_QUANTITY}
          step={1}
          inputMode="numeric"
          required
          disabled={!isAvailable}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          className="w-24 rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-earth-900 outline-none focus-visible:border-botanical-700 focus-visible:ring-2 focus-visible:ring-botanical-200 disabled:bg-cream-100"
        />
      </div>
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={!isAvailable || !isValidQuantity || parsedQuantity <= 1}
        onClick={() => saveQuantity(Math.max(1, Number(quantity || 1) - 1))}
        className="min-h-10 rounded-md border border-border-strong px-3 py-2 text-sm text-earth-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        −
      </button>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={!isAvailable || !isValidQuantity || parsedQuantity >= MAX_CART_QUANTITY}
        onClick={() => saveQuantity(Math.min(MAX_CART_QUANTITY, Number(quantity || 0) + 1))}
        className="min-h-10 rounded-md border border-border-strong px-3 py-2 text-sm text-earth-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        +
      </button>
      <button
        type="button"
        disabled={!isAvailable || !isValidQuantity || quantity === String(initialQuantity)}
        onClick={() => saveQuantity(parsedQuantity)}
        className="min-h-10 rounded-md border border-botanical-700 px-3 py-2 text-sm font-semibold text-botanical-800 transition hover:bg-botanical-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Update
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="min-h-10 text-sm font-semibold text-earth-700 underline decoration-border-strong underline-offset-4 hover:text-botanical-800"
      >
        Remove item
      </button>
    </div>
  );
}
