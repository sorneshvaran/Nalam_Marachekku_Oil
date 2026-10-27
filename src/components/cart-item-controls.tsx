'use client';

import { useActionState, useState } from 'react';

import {
  removeCartItemAction,
  updateCartItemQuantityAction,
} from '@/app/actions/cart';
import { MAX_CART_QUANTITY } from '@/lib/cart-constants';

export default function CartItemControls({
  cartItemId,
  quantity: initialQuantity,
  isAvailable,
}: {
  cartItemId: string;
  quantity: number;
  isAvailable: boolean;
}) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateCartItemQuantityAction,
    undefined,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeCartItemAction,
    undefined,
  );
  const [quantity, setQuantity] = useState(String(initialQuantity));

  return (
    <div className="mt-4 space-y-3">
      <form action={updateAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="cartItemId" value={cartItemId} />
        <div>
          <label htmlFor={'quantity-' + cartItemId} className="mb-1 block text-xs font-medium text-earth-700">
            Quantity
          </label>
          <input
            id={'quantity-' + cartItemId}
            name="quantity"
            type="number"
            min={1}
            max={MAX_CART_QUANTITY}
            step={1}
            inputMode="numeric"
            required
            disabled={!isAvailable || updatePending}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="w-24 rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-earth-900 outline-none focus-visible:border-botanical-700 focus-visible:ring-2 focus-visible:ring-botanical-200 disabled:bg-cream-100"
          />
        </div>
        <button
          type="submit"
          disabled={!isAvailable || updatePending || quantity === String(initialQuantity)}
          className="min-h-10 rounded-md border border-botanical-700 px-3 py-2 text-sm font-semibold text-botanical-800 transition hover:bg-botanical-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {updatePending ? 'Saving…' : 'Update'}
        </button>
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={!isAvailable || updatePending || Number(quantity) <= 1}
          onClick={() => setQuantity((current) => String(Math.max(1, Number(current || 1) - 1)))}
          className="min-h-10 rounded-md border border-border-strong px-3 py-2 text-sm text-earth-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          −
        </button>
        <button
          type="button"
          aria-label="Increase quantity"
          disabled={!isAvailable || updatePending || Number(quantity) >= MAX_CART_QUANTITY}
          onClick={() => setQuantity((current) => String(Math.min(MAX_CART_QUANTITY, Number(current || 0) + 1)))}
          className="min-h-10 rounded-md border border-border-strong px-3 py-2 text-sm text-earth-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          +
        </button>
      </form>

      {updateState?.message ? (
        <p role={updateState.success ? 'status' : 'alert'} className="text-sm text-red-800">
          {updateState.message}
        </p>
      ) : null}

      <form action={removeAction}>
        <input type="hidden" name="cartItemId" value={cartItemId} />
        <button
          type="submit"
          disabled={removePending}
          className="text-sm font-semibold text-earth-700 underline decoration-border-strong underline-offset-4 hover:text-botanical-800 disabled:opacity-50"
        >
          {removePending ? 'Removing…' : 'Remove item'}
        </button>
      </form>
      {removeState?.message ? (
        <p role={removeState.success ? 'status' : 'alert'} className="text-sm text-red-800">
          {removeState.message}
        </p>
      ) : null}
    </div>
  );
}
