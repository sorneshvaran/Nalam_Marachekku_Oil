import 'server-only';

import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { MAX_CART_QUANTITY } from '@/lib/cart-constants';
import { normalizeGuestCartItems, type GuestCartItem } from '@/lib/cart-validation';

export type CartErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'VARIANT_UNAVAILABLE'
  | 'OUT_OF_STOCK'
  | 'INSUFFICIENT_STOCK'
  | 'CART_ITEM_NOT_FOUND'
  | 'INVALID_QUANTITY'
  | 'QUANTITY_LIMIT'
  | 'INVALID_PRICE'
  | 'INVALID_GUEST_CART';

export class CartError extends Error {
  constructor(readonly code: CartErrorCode) {
    super(code);
    this.name = 'CartError';
  }
}

export interface CartViewItem {
  id: string;
  quantity: number;
  productName: string;
  productSlug: string;
  image: { url: string; altText: string | null } | null;
  variantLabel: string;
  unitPrice: string;
  lineTotal: string;
  stockStatus: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  isAvailable: boolean;
}

export interface CartView {
  items: CartViewItem[];
  subtotal: string;
}

export interface GuestCartViewItem {
  variantId: string;
  quantity: number;
  productName: string;
  productSlug: string | null;
  image: { url: string; altText: string | null } | null;
  variantLabel: string;
  unitPrice: string | null;
  lineTotal: string | null;
  stockStatus: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | null;
  isAvailable: boolean;
}

export interface GuestCartView {
  items: GuestCartViewItem[];
  subtotal: string;
}

function assertQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new CartError('INVALID_QUANTITY');
  }
  if (quantity > MAX_CART_QUANTITY) {
    throw new CartError('QUANTITY_LIMIT');
  }
}

async function requireCustomerId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new CartError('UNAUTHENTICATED');
  if (user.role !== 'CUSTOMER') throw new CartError('FORBIDDEN');
  return user.id;
}

type CartTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function ensureCartInTransaction(
  tx: CartTransaction,
  userId: string,
): Promise<{ id: string }> {
  const user = await tx.orm.public.User
    .where({ id: userId })
    .select('id')
    .forNoKeyUpdate()
    .first();
  if (!user) throw new CartError('UNAUTHENTICATED');

  const existing = await tx.orm.public.Cart
    .where({ userId })
    .select('id')
    .first();
  if (existing) return existing;

  return tx.orm.public.Cart.select('id').create({ userId });
}

function assertVariantCanBeAdded(
  variant: {
    active: boolean;
    stockQuantity: number;
    product: { active: boolean; slug: string } | null;
  },
  expectedProductSlug?: string,
): void {
  if (
    !variant.active ||
    !variant.product ||
    !variant.product.active ||
    (expectedProductSlug !== undefined && variant.product.slug !== expectedProductSlug)
  ) {
    throw new CartError('VARIANT_UNAVAILABLE');
  }
  if (variant.stockQuantity <= 0) {
    throw new CartError('OUT_OF_STOCK');
  }
}

function decimalParts(value: string): { coefficient: bigint; scale: number } {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(value);
  if (!match) throw new CartError('INVALID_PRICE');
  const fraction = match[2] ?? '';
  return { coefficient: BigInt(match[1] + fraction), scale: fraction.length };
}

function decimalFromParts(coefficient: bigint, scale: number): string {
  if (scale === 0) return coefficient.toString();
  const digits = coefficient.toString().padStart(scale + 1, '0');
  const whole = digits.slice(0, -scale);
  const fraction = digits.slice(-scale).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
}

export function multiplyPrice(price: string, quantity: number): string {
  const parts = decimalParts(price);
  return decimalFromParts(parts.coefficient * BigInt(quantity), parts.scale);
}

export function sumPrices(prices: string[]): string {
  if (prices.length === 0) return '0';
  const parts = prices.map(decimalParts);
  const scale = Math.max(...parts.map((part) => part.scale));
  const total = parts.reduce(
    (sum, part) => sum + part.coefficient * BigInt(10) ** BigInt(scale - part.scale),
    BigInt(0),
  );
  return decimalFromParts(total, scale);
}

async function addToCart(
  input: { productSlug: string; variantId: string; quantity: number },
): Promise<void> {
  assertQuantity(input.quantity);
  const userId = await requireCustomerId();

  await db.transaction(async (tx) => {
    const cart = await ensureCartInTransaction(tx, userId);
    // Serialize changes to this cart so concurrent adds cannot lose quantity updates.
    const lockedCart = await tx.orm.public.Cart
      .where({ id: cart.id, userId })
      .forNoKeyUpdate()
      .first();
    if (!lockedCart) throw new CartError('CART_ITEM_NOT_FOUND');

    const variant = await tx.orm.public.ProductVariant
      .where({ id: input.variantId })
      .select('id', 'productId', 'value', 'unit', 'price', 'stockQuantity', 'stockStatus', 'active')
      .include('product', (product) => product.select('id', 'slug', 'active'))
      .first();
    if (!variant) throw new CartError('VARIANT_UNAVAILABLE');
    assertVariantCanBeAdded(variant, input.productSlug);
    const existing = await tx.orm.public.CartItem
      .where({ cartId: cart.id, variantId: variant.id })
      .first();
    const nextQuantity = (existing?.quantity ?? 0) + input.quantity;
    if (nextQuantity > MAX_CART_QUANTITY) throw new CartError('QUANTITY_LIMIT');
    if (nextQuantity > variant.stockQuantity) throw new CartError('INSUFFICIENT_STOCK');

    if (existing) {
      await tx.orm.public.CartItem
        .where({ id: existing.id, cartId: cart.id })
        .updateAll({ quantity: nextQuantity });
    } else {
      await tx.orm.public.CartItem.create({
        cartId: cart.id,
        variantId: variant.id,
        quantity: nextQuantity,
      });
    }
  });
}

async function getCurrentCart(): Promise<CartView | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== 'CUSTOMER') throw new CartError('FORBIDDEN');
  return getCartForUser(user.id);
}

async function getCartForUser(userId: string): Promise<CartView> {
  const cart = await db.orm.public.Cart
    .where({ userId })
    .select('id')
    .include('items', (items) =>
      items
        .select('id', 'quantity')
        .include('variant', (variant) =>
          variant
            .select('id', 'value', 'unit', 'price', 'stockQuantity', 'stockStatus', 'active')
            .include('product', (product) =>
              product
                .select('id', 'name', 'slug', 'active')
                .include('images', (image) =>
                  image
                    .select('url', 'altText', 'sortOrder')
                    .orderBy((entry) => entry.sortOrder.asc())
                    .limit(1),
                ),
            ),
        ),
    )
    .first();

  const items: CartViewItem[] = (cart?.items ?? []).flatMap((item): CartViewItem[] => {
    if (!item.variant || !item.variant.product) return [];
    const product = item.variant.product;
    const lineTotal = multiplyPrice(item.variant.price, item.quantity);
    return [{
      id: item.id,
      quantity: item.quantity,
      productName: product.name,
      productSlug: product.slug,
      image: product.images[0]
        ? { url: product.images[0].url, altText: product.images[0].altText }
        : null,
      variantLabel: `${item.variant.value} ${item.variant.unit}`,
      unitPrice: item.variant.price,
      lineTotal,
      stockStatus: item.variant.stockStatus,
      isAvailable:
        product.active &&
        item.variant.active &&
        item.variant.stockQuantity > 0 && item.quantity <= item.variant.stockQuantity,
    }];
  });

  return { items, subtotal: sumPrices(items.map((item) => item.lineTotal)) };
}

async function getGuestCartView(input: readonly GuestCartItem[]): Promise<GuestCartView> {
  const normalizedItems = normalizeGuestCartItems(input);
  if (!normalizedItems) throw new CartError('INVALID_GUEST_CART');
  if (normalizedItems.length === 0) return { items: [], subtotal: '0' };

  const variants = await db.orm.public.ProductVariant
    .where((variant) => variant.id.in(normalizedItems.map((item) => item.variantId)))
    .select('id', 'value', 'unit', 'price', 'stockQuantity', 'stockStatus', 'active')
    .include('product', (product) =>
      product
        .select('id', 'name', 'slug', 'active')
        .include('images', (image) =>
          image
            .select('url', 'altText', 'sortOrder')
            .orderBy((entry) => entry.sortOrder.asc())
            .limit(1),
        ),
    )
    .all();
  const variantsById = new Map(variants.map((variant) => [variant.id, variant]));

  const items: GuestCartViewItem[] = normalizedItems.map((guestItem) => {
    const variant = variantsById.get(guestItem.variantId);
    const product = variant?.product;
    if (!variant || !product || !product.active) {
      return {
        variantId: guestItem.variantId,
        quantity: guestItem.quantity,
        productName: 'Unavailable item',
        productSlug: null,
        image: null,
        variantLabel: 'This option is no longer listed',
        unitPrice: null,
        lineTotal: null,
        stockStatus: null,
        isAvailable: false,
      };
    }

    return {
      variantId: variant.id,
      quantity: guestItem.quantity,
      productName: product.name,
      productSlug: product.slug,
      image: product.images[0]
        ? { url: product.images[0].url, altText: product.images[0].altText }
        : null,
      variantLabel: `${variant.value} ${variant.unit}`,
      unitPrice: variant.price,
      lineTotal: multiplyPrice(variant.price, guestItem.quantity),
      stockStatus: variant.stockStatus,
      isAvailable: variant.active && variant.stockQuantity > 0 && guestItem.quantity <= variant.stockQuantity,
    };
  });

  const subtotal = sumPrices(
    items.flatMap((item) => item.lineTotal === null ? [] : [item.lineTotal]),
  );
  return { items, subtotal };
}

async function mergeGuestCart(input: readonly GuestCartItem[]): Promise<CartView> {
  const userId = await requireCustomerId();
  const guestItems = normalizeGuestCartItems(input);
  if (!guestItems) throw new CartError('QUANTITY_LIMIT');
  if (guestItems.length === 0) return getCartForUser(userId);

  await db.transaction(async (tx) => {
    const cart = await ensureCartInTransaction(tx, userId);
    const lockedCart = await tx.orm.public.Cart
      .where({ id: cart.id, userId })
      .forNoKeyUpdate()
      .first();
    if (!lockedCart) throw new CartError('CART_ITEM_NOT_FOUND');

    const variants = await tx.orm.public.ProductVariant
      .where((variant) => variant.id.in(guestItems.map((item) => item.variantId)))
      .select('id', 'productId', 'value', 'unit', 'price', 'stockQuantity', 'stockStatus', 'active')
      .include('product', (product) => product.select('id', 'slug', 'active'))
      .all();
    const variantsById = new Map(variants.map((variant) => [variant.id, variant]));

    for (const guestItem of guestItems) {
      const variant = variantsById.get(guestItem.variantId);
      if (!variant) throw new CartError('VARIANT_UNAVAILABLE');
      assertQuantity(guestItem.quantity);
      assertVariantCanBeAdded(variant);
    }

    for (const guestItem of guestItems) {
      const existing = await tx.orm.public.CartItem
        .where({ cartId: cart.id, variantId: guestItem.variantId })
        .select('id', 'quantity')
        .first();
      const nextQuantity = (existing?.quantity ?? 0) + guestItem.quantity;
      if (nextQuantity > MAX_CART_QUANTITY) throw new CartError('QUANTITY_LIMIT');
      const variant = variantsById.get(guestItem.variantId);
      if (!variant) throw new CartError('VARIANT_UNAVAILABLE');
      if (nextQuantity > variant.stockQuantity) throw new CartError('INSUFFICIENT_STOCK');

      if (existing) {
        await tx.orm.public.CartItem
          .where({ id: existing.id, cartId: cart.id })
          .updateAll({ quantity: nextQuantity });
      } else {
        await tx.orm.public.CartItem.create({
          cartId: cart.id,
          variantId: guestItem.variantId,
          quantity: guestItem.quantity,
        });
      }
    }
  });

  return getCartForUser(userId);
}

async function updateCartItemQuantity(cartItemId: string, quantity: number): Promise<void> {
  assertQuantity(quantity);
  const userId = await requireCustomerId();

  await db.transaction(async (tx) => {
    const cart = await tx.orm.public.Cart
      .where({ userId })
      .forNoKeyUpdate()
      .first();
    if (!cart) throw new CartError('CART_ITEM_NOT_FOUND');

    const item = await tx.orm.public.CartItem
      .where({ id: cartItemId, cartId: cart.id })
      .select('id', 'quantity')
      .include('variant', (variant) =>
        variant
          .select('id', 'active', 'stockStatus', 'stockQuantity')
          .include('product', (product) => product.select('id', 'active')),
      )
      .first();
    if (!item) throw new CartError('CART_ITEM_NOT_FOUND');
    if (
      !item.variant ||
      !item.variant.product ||
      !item.variant.active ||
      !item.variant.product.active
    ) {
      throw new CartError('VARIANT_UNAVAILABLE');
    }
    if (item.variant.stockQuantity <= 0) throw new CartError('OUT_OF_STOCK');

    if (quantity > item.variant.stockQuantity) throw new CartError('INSUFFICIENT_STOCK');

    await tx.orm.public.CartItem
      .where({ id: item.id, cartId: cart.id })
      .updateAll({ quantity });
  });
}

async function removeCartItem(cartItemId: string): Promise<void> {
  const userId = await requireCustomerId();

  await db.transaction(async (tx) => {
    const cart = await tx.orm.public.Cart
      .where({ userId })
      .forNoKeyUpdate()
      .first();
    if (!cart) throw new CartError('CART_ITEM_NOT_FOUND');

    const item = await tx.orm.public.CartItem
      .where({ id: cartItemId, cartId: cart.id })
      .select('id')
      .first();
    if (!item) throw new CartError('CART_ITEM_NOT_FOUND');

    await tx.orm.public.CartItem
      .where({ id: item.id, cartId: cart.id })
      .deleteAll();
  });
}

async function getCartQuantityForUser(userId: string): Promise<number> {
  const cart = await db.orm.public.Cart
    .where({ userId })
    .select('id')
    .include('items', (items) => items.sum('quantity'))
    .first();
  return cart?.items ?? 0;
}

export const cartData = {
  addToCart,
  getGuestCartView,
  getCurrentCart,
  getCartQuantityForUser,
  mergeGuestCart,
  updateCartItemQuantity,
  removeCartItem,
};
