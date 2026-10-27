'use client';

import { useActionState, useState } from 'react';

import { addToCartAction } from '@/app/actions/cart';
import { MAX_CART_QUANTITY } from '@/lib/cart-constants';
import { formatPrice, formatUnitValue } from '@/lib/format';
import { addGuestItem } from '@/lib/guest-cart';

type VariantOption = {
  id: string;
  value: string;
  unit: 'ML' | 'L' | 'G' | 'KG';
  price: string;
  stockStatus: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';
};

export default function AddToCartForm({
  productSlug,
  variants,
  isCustomer,
}: {
  productSlug: string;
  variants: VariantOption[];
  isCustomer: boolean;
}) {
  const [state, action, pending] = useActionState(addToCartAction, undefined);
  const firstPurchasable = variants.find((variant) => variant.stockStatus !== 'OUT_OF_STOCK');
  const [localVariantId, setLocalVariantId] = useState(firstPurchasable?.id ?? '');
  const [hasChangedSelection, setHasChangedSelection] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [guestMessage, setGuestMessage] = useState<{ text: string; success: boolean } | null>(null);
  const restoredVariantId = state?.success && variants.some((variant) => variant.id === state.variantId)
    ? state.variantId
    : undefined;
  const selectedVariantId = !hasChangedSelection && restoredVariantId
    ? restoredVariantId
    : localVariantId;
  const canAdd = variants.some((variant) => variant.stockStatus !== 'OUT_OF_STOCK');

  if (variants.length === 0) {
    return (
      <p className="mt-5 rounded-xl border border-border-soft bg-white p-5 text-sm text-foreground-muted">
        There are no active product sizes listed at the moment.
      </p>
    );
  }

  return (
    <form
      action={isCustomer ? action : undefined}
      onSubmit={(event) => {
        if (isCustomer) return;
        event.preventDefault();
        const result = addGuestItem(selectedVariantId, Number(quantity));
        setGuestMessage(result === 'success'
          ? { text: 'Added to your guest cart.', success: true }
          : result === 'invalid-quantity'
            ? { text: 'Enter a whole quantity from 1 to 99.', success: false }
            : result === 'quantity-limit'
            ? { text: 'Choose a quantity from 1 to 99. Your cart cannot exceed 99 units of one size.', success: false }
            : { text: 'This browser could not save your cart. Check its storage settings and try again.', success: false });
      }}
      className="mt-5 space-y-5"
    >
      <input type="hidden" name="productSlug" value={productSlug} />

      <fieldset>
        <legend className="sr-only">Choose a size</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {variants.map((variant) => {
            const isOutOfStock = variant.stockStatus === 'OUT_OF_STOCK';
            const isSelected = selectedVariantId === variant.id;
            return (
              <label
                key={variant.id}
                className={
                  'flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 transition ' +
                  (isOutOfStock
                    ? 'cursor-not-allowed border-border-soft bg-cream-50 opacity-70'
                    : isSelected
                      ? 'border-botanical-600 bg-botanical-50 ring-1 ring-botanical-600'
                      : 'border-border-soft bg-white hover:border-botanical-300') +
                  ' focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-botanical-700'
                }
              >
                <span className="flex items-start gap-3">
                  <input
                    className="mt-1 accent-botanical-700"
                    type="radio"
                    name="variantId"
                    value={variant.id}
                    checked={isSelected}
                    disabled={isOutOfStock}
                    onChange={() => {
                      setLocalVariantId(variant.id);
                      setHasChangedSelection(true);
                    }}
                    required
                  />
                  <span>
                    <span className="block font-medium text-earth-900">
                      {formatUnitValue(variant.value, variant.unit)}
                    </span>
                    <span className="mt-1 block text-xs text-foreground-muted">
                      {isSelected && !isOutOfStock ? 'Selected · ' : ''}{isOutOfStock
                        ? 'Out of stock'
                        : variant.stockStatus === 'LOW_STOCK'
                          ? 'Low stock'
                          : 'Available'}
                    </span>
                  </span>
                </span>
                <span className="text-lg font-semibold text-earth-900">
                  {formatPrice(variant.price)}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="cart-quantity" className="mb-1.5 block text-sm font-medium text-earth-800">
            Quantity
          </label>
          <input
            id="cart-quantity"
            name="quantity"
            type="number"
            min={1}
            max={MAX_CART_QUANTITY}
            step={1}
            inputMode="numeric"
            required
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="w-24 rounded-md border border-border-strong bg-white px-3 py-2.5 text-earth-900 outline-none focus-visible:border-botanical-700 focus-visible:ring-2 focus-visible:ring-botanical-200"
          />
        </div>
        <button
          type="submit"
          disabled={!canAdd || pending}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-botanical-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-botanical-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botanical-700 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {isCustomer && pending ? 'Adding…' : 'Add to cart'}
        </button>
      </div>

      {state?.message ? (
        <p
          role={state.success ? 'status' : 'alert'}
          className={
            'rounded-md border px-4 py-3 text-sm ' +
            (state.success
              ? 'border-botanical-200 bg-botanical-50 text-botanical-900'
              : 'border-red-200 bg-red-50 text-red-900')
          }
        >
          {state.message}
        </p>
      ) : null}
      {!isCustomer && guestMessage ? (
        <p
          role={guestMessage.success ? 'status' : 'alert'}
          className={
            'rounded-md border px-4 py-3 text-sm ' +
            (guestMessage.success
              ? 'border-botanical-200 bg-botanical-50 text-botanical-900'
              : 'border-red-200 bg-red-50 text-red-900')
          }
        >
          {guestMessage.text}
        </p>
      ) : null}
    </form>
  );
}
