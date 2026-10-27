import { z } from 'zod';

import { MAX_CART_QUANTITY, MAX_GUEST_CART_ITEMS } from '@/lib/cart-constants';

const quantityFromForm = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(MAX_CART_QUANTITY));

const productSlug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120);
const rowId = z.string().uuid();

export const guestCartItemSchema = z.object({
  variantId: rowId,
  quantity: z.number().int().min(1).max(MAX_CART_QUANTITY),
}).strict();

export const guestCartSchema = z.array(guestCartItemSchema).max(MAX_GUEST_CART_ITEMS);
export type GuestCartItem = z.infer<typeof guestCartItemSchema>;

export function normalizeGuestCartItems(items: readonly GuestCartItem[]): GuestCartItem[] | null {
  const quantities = new Map<string, number>();

  for (const item of items) {
    const quantity = (quantities.get(item.variantId) ?? 0) + item.quantity;
    if (quantity > MAX_CART_QUANTITY) return null;
    quantities.set(item.variantId, quantity);
  }

  if (quantities.size > MAX_GUEST_CART_ITEMS) return null;
  return Array.from(quantities, ([variantId, quantity]) => ({ variantId, quantity }));
}

export const addToCartSchema = z.object({
  productSlug,
  variantId: rowId,
  quantity: quantityFromForm,
});

export const updateCartQuantitySchema = z.object({
  cartItemId: rowId,
  quantity: quantityFromForm,
});

export const removeCartItemSchema = z.object({ cartItemId: rowId });
