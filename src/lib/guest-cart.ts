'use client';

import {
  guestCartItemSchema,
  guestCartSchema,
  normalizeGuestCartItems,
  type GuestCartItem,
} from '@/lib/cart-validation';

export const GUEST_CART_STORAGE_KEY = 'nalam:guest-cart:v1';
const GUEST_CART_CHANGE_EVENT = 'nalam:guest-cart-change';

export type GuestCartMutationResult =
  | 'success'
  | 'invalid-quantity'
  | 'quantity-limit'
  | 'storage-unavailable';

function notifyGuestCartChanged(): void {
  window.dispatchEvent(new Event(GUEST_CART_CHANGE_EVENT));
}

function resetMalformedGuestCart(): boolean {
  try {
    window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

function writeGuestCart(items: readonly GuestCartItem[]): boolean {
  try {
    if (items.length === 0) {
      window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    } else {
      window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
    }
    notifyGuestCartChanged();
    return true;
  } catch {
    return false;
  }
}

export function getGuestCart(): GuestCartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (stored === null) return [];

    const parsedJson: unknown = JSON.parse(stored);
    const parsed = guestCartSchema.safeParse(parsedJson);
    const normalized = parsed.success ? normalizeGuestCartItems(parsed.data) : null;
    if (normalized === null) {
      resetMalformedGuestCart();
      return [];
    }

    return normalized;
  } catch {
    resetMalformedGuestCart();
    return [];
  }
}

export function addGuestItem(variantId: string, quantity: number): GuestCartMutationResult {
  const parsedItem = guestCartItemSchema.safeParse({ variantId, quantity });
  if (!parsedItem.success) return 'invalid-quantity';

  const currentItems = getGuestCart();
  const normalized = normalizeGuestCartItems([...currentItems, parsedItem.data]);
  if (normalized === null) return 'quantity-limit';
  return writeGuestCart(normalized) ? 'success' : 'storage-unavailable';
}

export function updateGuestItem(variantId: string, quantity: number): GuestCartMutationResult {
  const parsedItem = guestCartItemSchema.safeParse({ variantId, quantity });
  if (!parsedItem.success) return 'invalid-quantity';

  const currentItems = getGuestCart();
  if (!currentItems.some((item) => item.variantId === variantId)) {
    return writeGuestCart(currentItems) ? 'success' : 'storage-unavailable';
  }

  const updatedItems = currentItems.map((item) =>
    item.variantId === variantId ? parsedItem.data : item,
  );
  return writeGuestCart(updatedItems) ? 'success' : 'storage-unavailable';
}

export function removeGuestItem(variantId: string): GuestCartMutationResult {
  const currentItems = getGuestCart();
  const remainingItems = currentItems.filter((item) => item.variantId !== variantId);
  return writeGuestCart(remainingItems) ? 'success' : 'storage-unavailable';
}

export function clearGuestCart(): boolean {
  return writeGuestCart([]);
}

export function getGuestCartQuantity(): number {
  return getGuestCart().reduce((total, item) => total + item.quantity, 0);
}

export function subscribeToGuestCart(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === GUEST_CART_STORAGE_KEY) onChange();
  };
  window.addEventListener('storage', handleStorage);
  window.addEventListener(GUEST_CART_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(GUEST_CART_CHANGE_EVENT, onChange);
  };
}
