'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';

import { cartData, CartError } from '@/lib/cart';
import {
  addToCartSchema,
  guestCartSchema,
  normalizeGuestCartItems,
  removeCartItemSchema,
  updateCartQuantitySchema,
} from '@/lib/cart-validation';

export type CartActionState = {
  message?: string;
  success?: boolean;
  variantId?: string;
};

const errorMessages: Record<Exclude<CartError['code'], 'UNAUTHENTICATED'>, string> = {
  FORBIDDEN: 'This account cannot use a customer cart.',
  VARIANT_UNAVAILABLE: 'This product option is no longer available.',
  OUT_OF_STOCK: 'This product option is out of stock.',
  INSUFFICIENT_STOCK: 'The requested quantity is above current availability. Reduce the quantity and try again.',
  CART_ITEM_NOT_FOUND: 'That cart item could not be found.',
  INVALID_QUANTITY: 'Enter a whole quantity of at least 1.',
  QUANTITY_LIMIT: 'A cart item cannot exceed 99 units.',
  INVALID_PRICE: 'The current price could not be calculated. Please try again later.',
  INVALID_GUEST_CART: 'Your guest cart could not be read. Please review it and try again.',
};

function safeErrorMessage(error: unknown): string {
  return error instanceof CartError
    ? errorMessages[error.code as keyof typeof errorMessages]
    : 'We could not update your cart. Please try again.';
}

function logUnexpectedCartFailure(event: string, error: unknown): void {
  if (error instanceof CartError) return;
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
  console.error(event, details);
}

function handleUnauthenticated(error: unknown, returnTo: string): boolean {
  if (!(error instanceof CartError) || error.code !== 'UNAUTHENTICATED') return false;
  redirect('/login?callbackUrl=' + encodeURIComponent(returnTo));
}

export async function addToCartAction(
  _previousState: CartActionState | undefined,
  formData: FormData,
): Promise<CartActionState> {
  const parsed = addToCartSchema.safeParse({
    productSlug: formData.get('productSlug'),
    variantId: formData.get('variantId'),
    quantity: formData.get('quantity'),
  });

  if (!parsed.success) {
    return { message: 'Choose an available size and a quantity from 1 to 99.' };
  }

  try {
    await cartData.addToCart(parsed.data);
  } catch (error) {
    if (error instanceof CartError && error.code === 'UNAUTHENTICATED') {
      return { message: 'Your sign-in changed. Refresh this page and try adding the item again.' };
    }
    logUnexpectedCartFailure('Cart add failed.', error);
    return { message: safeErrorMessage(error) };
  }

  refresh();
  return { message: 'Added to your cart.', success: true, variantId: parsed.data.variantId };
}

export async function updateCartItemQuantityAction(
  _previousState: CartActionState | undefined,
  formData: FormData,
): Promise<CartActionState> {
  const parsed = updateCartQuantitySchema.safeParse({
    cartItemId: formData.get('cartItemId'),
    quantity: formData.get('quantity'),
  });

  if (!parsed.success) {
    return { message: 'Enter a whole quantity from 1 to 99.' };
  }

  try {
    await cartData.updateCartItemQuantity(parsed.data.cartItemId, parsed.data.quantity);
  } catch (error) {
    handleUnauthenticated(error, '/cart');
    logUnexpectedCartFailure('Cart quantity update failed.', error);
    return { message: safeErrorMessage(error) };
  }

  refresh();
  return { message: 'Cart quantity updated.', success: true };
}

export async function removeCartItemAction(
  _previousState: CartActionState | undefined,
  formData: FormData,
): Promise<CartActionState> {
  const parsed = removeCartItemSchema.safeParse({ cartItemId: formData.get('cartItemId') });
  if (!parsed.success) return { message: 'That cart item could not be found.' };

  try {
    await cartData.removeCartItem(parsed.data.cartItemId);
  } catch (error) {
    handleUnauthenticated(error, '/cart');
    logUnexpectedCartFailure('Cart item removal failed.', error);
    return { message: safeErrorMessage(error) };
  }

  refresh();
  return { message: 'Item removed from your cart.', success: true };
}

export type GuestCartViewActionResult =
  | { success: true; cart: Awaited<ReturnType<typeof cartData.getGuestCartView>> }
  | { success: false; message: string };

export async function getGuestCartViewAction(
  input: unknown,
): Promise<GuestCartViewActionResult> {
  const parsed = guestCartSchema.safeParse(input);
  const items = parsed.success ? normalizeGuestCartItems(parsed.data) : null;
  if (!items) {
    return { success: false, message: 'Your guest cart could not be read. Please review it and try again.' };
  }

  try {
    return { success: true, cart: await cartData.getGuestCartView(items) };
  } catch (error) {
    logUnexpectedCartFailure('Guest cart catalogue lookup failed.', error);
    return { success: false, message: 'We could not load current product details. Please try again.' };
  }
}

export type GuestCartMergeActionResult =
  | { success: true; cart: Awaited<ReturnType<typeof cartData.mergeGuestCart>> }
  | { success: false; message: string };

export async function mergeGuestCartAction(
  input: unknown,
): Promise<GuestCartMergeActionResult> {
  const parsed = guestCartSchema.safeParse(input);
  const items = parsed.success ? normalizeGuestCartItems(parsed.data) : null;
  if (!items) {
    return { success: false, message: 'Your guest cart has invalid quantities. Review it and try again.' };
  }

  try {
    const cart = await cartData.mergeGuestCart(items);
    refresh();
    return { success: true, cart };
  } catch (error) {
    if (error instanceof CartError) {
      if (error.code === 'UNAUTHENTICATED') {
        return { success: false, message: 'Please sign in again to merge your guest cart.' };
      }
      if (error.code === 'QUANTITY_LIMIT') {
        return { success: false, message: 'A variant quantity cannot exceed 99 units, including your account cart.' };
      }
      if (error.code === 'OUT_OF_STOCK' || error.code === 'VARIANT_UNAVAILABLE' || error.code === 'INSUFFICIENT_STOCK') {
        return { success: false, message: 'Some guest-cart items are currently unavailable. Remove them and retry the merge.' };
      }
      if (error.code === 'FORBIDDEN') {
        return { success: false, message: 'This account cannot receive a customer cart.' };
      }
    }
    logUnexpectedCartFailure('Guest cart merge failed.', error);
    return { success: false, message: 'We could not merge your guest cart. Your items are still saved in this browser.' };
  }
}
