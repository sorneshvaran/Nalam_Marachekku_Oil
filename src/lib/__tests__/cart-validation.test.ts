import { describe, expect, it } from 'vitest';

import { MAX_CART_QUANTITY, MAX_GUEST_CART_ITEMS } from '@/lib/cart-constants';
import {
  addToCartSchema,
  guestCartItemSchema,
  guestCartSchema,
  normalizeGuestCartItems,
  removeCartItemSchema,
  updateCartQuantitySchema,
  type GuestCartItem,
} from '@/lib/cart-validation';

const VARIANT_ID = '1f0f5d3c-8e2a-4c5f-9f7a-2b1d3e4f5a6b';
const CART_ITEM_ID = '2b1d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f';
const SECOND_VARIANT_ID = '3c2e4f5a-6b7c-4d8e-9f0a-1b2c3d4e5f60';
const PRODUCT_SLUG = 'groundnut-oil';

function addToCart(quantity: unknown) {
  return addToCartSchema.safeParse({
    productSlug: PRODUCT_SLUG,
    variantId: VARIANT_ID,
    quantity,
  });
}

function variant(variantId: string, quantity: number): GuestCartItem {
  return { variantId, quantity };
}

describe('cart quantity rules', () => {
  it('accepts the minimum quantity of 1', () => {
    const result = addToCart('1');

    expect(result.success).toBe(true);
    expect(result.success && result.data.quantity).toBe(1);
  });

  it('accepts the maximum quantity', () => {
    const result = addToCart(String(MAX_CART_QUANTITY));

    expect(result.success).toBe(true);
    expect(result.success && result.data.quantity).toBe(MAX_CART_QUANTITY);
  });

  it('rejects zero, negative and above-maximum quantities', () => {
    expect(addToCart('0').success).toBe(false);
    expect(addToCart('-3').success).toBe(false);
    expect(addToCart(String(MAX_CART_QUANTITY + 1)).success).toBe(false);
  });

  it('rejects quantities that are not whole positive numbers', () => {
    expect(addToCart('1.5').success).toBe(false);
    expect(addToCart('2,5').success).toBe(false);
    expect(addToCart(' 5').success).toBe(false);
    expect(addToCart('03').success).toBe(false);
    expect(addToCart('five').success).toBe(false);
    expect(addToCart('').success).toBe(false);
    expect(addToCart(undefined).success).toBe(false);
    expect(addToCart(5).success).toBe(false);
  });

  it('rejects identifiers and slugs that are not well formed', () => {
    expect(addToCartSchema.safeParse({ productSlug: PRODUCT_SLUG, variantId: 'nope', quantity: '1' }).success).toBe(false);
    expect(addToCartSchema.safeParse({ productSlug: 'Groundnut Oil', variantId: VARIANT_ID, quantity: '1' }).success).toBe(false);
    expect(addToCartSchema.safeParse({ productSlug: '', variantId: VARIANT_ID, quantity: '1' }).success).toBe(false);
  });

  it('drops unexpected fields instead of letting them reach the cart', () => {
    const result = addToCartSchema.safeParse({
      productSlug: PRODUCT_SLUG,
      variantId: VARIANT_ID,
      quantity: '1',
      price: '0',
    });

    expect(result.success).toBe(true);
    expect(result.success && Object.keys(result.data).sort()).toEqual(['productSlug', 'quantity', 'variantId']);
  });

  it('applies the same quantity rules when updating an existing cart item', () => {
    expect(updateCartQuantitySchema.safeParse({ cartItemId: CART_ITEM_ID, quantity: '7' }).success).toBe(true);
    expect(updateCartQuantitySchema.safeParse({ cartItemId: CART_ITEM_ID, quantity: '0' }).success).toBe(false);
    expect(updateCartQuantitySchema.safeParse({ cartItemId: CART_ITEM_ID, quantity: String(MAX_CART_QUANTITY + 1) }).success).toBe(false);
    expect(updateCartQuantitySchema.safeParse({ cartItemId: 'not-a-cart-item', quantity: '2' }).success).toBe(false);
  });

  it('requires a valid cart item id when removing an item', () => {
    expect(removeCartItemSchema.safeParse({ cartItemId: CART_ITEM_ID }).success).toBe(true);
    expect(removeCartItemSchema.safeParse({ cartItemId: '' }).success).toBe(false);
    expect(removeCartItemSchema.safeParse({}).success).toBe(false);
  });
});

describe('guest cart validation', () => {
  it('accepts whole quantities within the allowed range', () => {
    expect(guestCartItemSchema.safeParse(variant(VARIANT_ID, 1)).success).toBe(true);
    expect(guestCartItemSchema.safeParse(variant(VARIANT_ID, MAX_CART_QUANTITY)).success).toBe(true);
  });

  it('rejects out-of-range or non-integer quantities', () => {
    expect(guestCartItemSchema.safeParse(variant(VARIANT_ID, 0)).success).toBe(false);
    expect(guestCartItemSchema.safeParse(variant(VARIANT_ID, MAX_CART_QUANTITY + 1)).success).toBe(false);
    expect(guestCartItemSchema.safeParse(variant(VARIANT_ID, 2.5)).success).toBe(false);
    expect(guestCartItemSchema.safeParse({ variantId: VARIANT_ID, quantity: '2' }).success).toBe(false);
  });

  it('rejects unexpected fields on a guest cart item', () => {
    expect(guestCartItemSchema.safeParse({ ...variant(VARIANT_ID, 2), price: '10' }).success).toBe(false);
  });

  it('caps the number of guest cart lines', () => {
    const atLimit = Array.from({ length: MAX_GUEST_CART_ITEMS }, (_, index) =>
      variant(`00000000-0000-4000-8000-${String(index).padStart(12, '0')}`, 1),
    );

    expect(guestCartSchema.safeParse(atLimit).success).toBe(true);
    expect(guestCartSchema.safeParse([...atLimit, variant(SECOND_VARIANT_ID, 1)]).success).toBe(false);
  });
});

describe('guest cart normalisation', () => {
  it('returns an empty cart for empty input', () => {
    expect(normalizeGuestCartItems([])).toEqual([]);
  });

  it('merges duplicate lines for the same variant', () => {
    expect(normalizeGuestCartItems([variant(VARIANT_ID, 2), variant(VARIANT_ID, 3)])).toEqual([
      variant(VARIANT_ID, 5),
    ]);
  });

  it('keeps distinct variants separate', () => {
    expect(normalizeGuestCartItems([variant(VARIANT_ID, 2), variant(SECOND_VARIANT_ID, 4)])).toEqual([
      variant(VARIANT_ID, 2),
      variant(SECOND_VARIANT_ID, 4),
    ]);
  });

  it('accepts a merged quantity exactly at the maximum', () => {
    const half = Math.floor(MAX_CART_QUANTITY / 2);

    expect(normalizeGuestCartItems([variant(VARIANT_ID, half), variant(VARIANT_ID, MAX_CART_QUANTITY - half)])).toEqual([
      variant(VARIANT_ID, MAX_CART_QUANTITY),
    ]);
  });

  it('rejects a merged quantity above the maximum', () => {
    expect(normalizeGuestCartItems([
      variant(VARIANT_ID, Math.ceil(MAX_CART_QUANTITY / 2)),
      variant(VARIANT_ID, MAX_CART_QUANTITY),
    ])).toBeNull();
  });

  it('rejects more distinct variants than the guest cart allows', () => {
    const tooMany = Array.from({ length: MAX_GUEST_CART_ITEMS + 1 }, (_, index) =>
      variant(`00000000-0000-4000-8000-${String(index).padStart(12, '0')}`, 1),
    );

    expect(normalizeGuestCartItems(tooMany)).toBeNull();
  });
});
