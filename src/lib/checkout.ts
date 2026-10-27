import 'server-only';

import { getCurrentUser } from '@/lib/auth';
import { addressesData, type AddressView } from '@/lib/addresses';
import { MAX_CART_QUANTITY } from '@/lib/cart-constants';
import { multiplyPrice, sumPrices } from '@/lib/cart';
import { db } from '@/lib/db';
import { deriveStockStatus } from '@/lib/inventory';

export type CheckoutItemView = {
  id: string;
  productName: string;
  productSlug: string | null;
  variantName: string;
  quantity: number;
  unitPrice: string | null;
  lineTotal: string | null;
  isAvailable: boolean;
};

export type CheckoutPageData = {
  addresses: AddressView[];
  items: CheckoutItemView[];
  subtotal: string | null;
  shippingAmount: '0';
  total: string | null;
  hasUnavailableItems: boolean;
};

export type CheckoutErrorCode =
  | 'EMPTY_CART'
  | 'ADDRESS_UNAVAILABLE'
  | 'CART_UNAVAILABLE'
  | 'VARIANT_UNAVAILABLE'
  | 'INSUFFICIENT_STOCK'
  | 'INVALID_QUANTITY'
  | 'INVALID_PRICE'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN';

export class CheckoutError extends Error {
  constructor(readonly code: CheckoutErrorCode) {
    super(code);
    this.name = 'CheckoutError';
  }
}

async function requireCheckoutCustomerId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new CheckoutError('UNAUTHENTICATED');
  if (user.role !== 'CUSTOMER') throw new CheckoutError('FORBIDDEN');
  return user.id;
}

type CartItemRecord = {
  id: string;
  quantity: number;
  variant: {
    id: string;
    value: string;
    unit: 'ML' | 'L' | 'G' | 'KG';
    price: string;
    stockStatus: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';
    stockQuantity: number;
    lowStockThreshold: number;
    active: boolean;
    product: { name: string; slug: string; active: boolean } | null;
  } | null;
};

function variantName(value: string, unit: string): string {
  return value + ' ' + unit;
}

function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_CART_QUANTITY;
}

function isPurchasable(item: CartItemRecord): boolean {
  return (
    isValidQuantity(item.quantity) &&
    Boolean(item.variant?.active) &&
    Boolean(item.variant?.product?.active) &&
    (item.variant?.stockQuantity ?? 0) >= item.quantity
  );
}

function presentCartItems(items: CartItemRecord[]): CheckoutItemView[] {
  return items.map((item) => {
    const variant = item.variant;
    const product = variant?.product;
    const quantityIsValid = isValidQuantity(item.quantity);
    const canCalculate = Boolean(variant) && quantityIsValid;

    return {
      id: item.id,
      productName: product?.name ?? 'Unavailable item',
      productSlug: product?.slug ?? null,
      variantName: variant ? variantName(variant.value, variant.unit) : 'Unavailable option',
      quantity: item.quantity,
      unitPrice: variant?.price ?? null,
      lineTotal: canCalculate && variant ? multiplyPrice(variant.price, item.quantity) : null,
      isAvailable: isPurchasable(item),
    };
  });
}

function getTotals(items: CheckoutItemView[]): {
  subtotal: string | null;
  total: string | null;
  hasUnavailableItems: boolean;
} {
  const hasUnavailableItems = items.some((item) => !item.isAvailable || item.lineTotal === null);
  const lineTotals = items.flatMap((item) => item.lineTotal === null ? [] : [item.lineTotal]);
  const subtotal = hasUnavailableItems ? null : sumPrices(lineTotals);
  return {
    subtotal,
    total: subtotal === null ? null : sumPrices([subtotal, '0']),
    hasUnavailableItems,
  };
}

async function getCheckoutPageData(): Promise<CheckoutPageData> {
  const userId = await requireCheckoutCustomerId();
  const [addresses, cart] = await Promise.all([
    addressesData.listAddresses(userId),
    db.orm.public.Cart
      .where({ userId })
      .select('id')
      .include('items', (items) =>
        items
          .select('id', 'quantity')
          .include('variant', (variant) =>
            variant
              .select('id', 'value', 'unit', 'price', 'stockStatus', 'stockQuantity', 'lowStockThreshold', 'active')
              .include('product', (product) => product.select('name', 'slug', 'active')),
          ),
      )
      .first(),
  ]);

  const items = presentCartItems((cart?.items ?? []) as CartItemRecord[]);
  const totals = getTotals(items);
  return {
    addresses,
    items,
    subtotal: totals.subtotal,
    shippingAmount: '0',
    total: totals.total,
    hasUnavailableItems: totals.hasUnavailableItems,
  };
}

async function createCodOrder(addressId: string): Promise<{ id: string }> {
  const userId = await requireCheckoutCustomerId();

  return db.transaction(async (tx) => {
    const customer = await tx.orm.public.User
      .where({ id: userId, role: 'CUSTOMER' })
      .select('id')
      .first();
    if (!customer) throw new CheckoutError('CART_UNAVAILABLE');
    const cart = await tx.orm.public.Cart
      .where({ userId })
      .forNoKeyUpdate()
      .first();
    if (!cart) throw new CheckoutError('EMPTY_CART');

    const cartItems = await tx.orm.public.CartItem
      .where({ cartId: cart.id })
      .select('id', 'variantId', 'quantity')
      .all();
    if (cartItems.length === 0) throw new CheckoutError('EMPTY_CART');
    if (cartItems.some((item) => !isValidQuantity(item.quantity))) {
      throw new CheckoutError('INVALID_QUANTITY');
    }

    // Lock variants in a stable order. Competing checkouts wait and then read committed quantities.
    const variantIds = [...new Set(cartItems.map((item) => item.variantId))].sort();
    const lockedVariants = new Map<string, {
      id: string;
      productId: string;
      value: string;
      unit: 'ML' | 'L' | 'G' | 'KG';
      price: string;
      stockQuantity: number;
      lowStockThreshold: number;
      active: boolean;
      product: { name: string; active: boolean } | null;
    }>();

    for (const variantId of variantIds) {
      const variant = await tx.orm.public.ProductVariant
        .where({ id: variantId })
        .forUpdate()
        .select('id', 'productId', 'value', 'unit', 'price', 'stockQuantity', 'lowStockThreshold', 'active')
        .first();
      if (!variant) throw new CheckoutError('VARIANT_UNAVAILABLE');
      const product = await tx.orm.public.Product
        .where({ id: variant.productId })
        .forShare()
        .select('name', 'active')
        .first();
      lockedVariants.set(variantId, { ...variant, product });
    }

    const quantitiesByVariant = new Map<string, number>();
    for (const item of cartItems) {
      quantitiesByVariant.set(item.variantId, (quantitiesByVariant.get(item.variantId) ?? 0) + item.quantity);
    }
    for (const [variantId, quantity] of quantitiesByVariant) {
      const variant = lockedVariants.get(variantId);
      if (!variant || !variant.product || !variant.active || !variant.product.active) {
        throw new CheckoutError('VARIANT_UNAVAILABLE');
      }
      if (variant.stockQuantity < quantity) throw new CheckoutError('INSUFFICIENT_STOCK');
    }

    const address = await tx.orm.public.Address
      .where({ id: addressId, userId })
      .select('id', 'name', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country')
      .first();
    if (!address) throw new CheckoutError('ADDRESS_UNAVAILABLE');

    const pricedItems = cartItems.map((item) => {
      const variant = lockedVariants.get(item.variantId);
      const product = variant?.product;
      if (!variant || !product) throw new CheckoutError('VARIANT_UNAVAILABLE');
      const unitPrice = variant.price;
      const totalPrice = multiplyPrice(unitPrice, item.quantity);
      return {
        variantId: variant.id,
        productName: product.name,
        variantName: variantName(variant.value, variant.unit),
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      };
    });
    const subtotal = sumPrices(pricedItems.map((item) => item.totalPrice));
    const shippingAmount = '0';
    const total = sumPrices([subtotal, shippingAmount]);

    // Deduct once when the order is placed; any later failure rolls this update back.
    for (const [variantId, quantity] of quantitiesByVariant) {
      const variant = lockedVariants.get(variantId);
      if (!variant) throw new CheckoutError('VARIANT_UNAVAILABLE');
      const stockQuantity = variant.stockQuantity - quantity;
      await tx.orm.public.ProductVariant.where({ id: variantId }).updateAll({
        stockQuantity,
        stockStatus: deriveStockStatus(stockQuantity, variant.lowStockThreshold),
      });
    }

    const order = await tx.orm.public.Order
      .select('id')
      .create({
        userId,
        subtotal,
        shippingAmount,
        total,
        status: 'PENDING',
        paymentMethod: 'CASH_ON_DELIVERY',
        paymentStatus: 'PENDING',
        shippingName: address.name,
        shippingPhone: address.phone,
        shippingAddressLine1: address.addressLine1,
        shippingAddressLine2: address.addressLine2,
        shippingCity: address.city,
        shippingState: address.state,
        shippingPostalCode: address.postalCode,
        shippingCountry: address.country,
      });

    for (const item of pricedItems) {
      await tx.orm.public.OrderItem.create({ orderId: order.id, ...item });
    }

    await tx.orm.public.CartItem.where({ cartId: cart.id }).deleteAll();
    return { id: order.id };
  });
}

export const checkoutData = {
  getCheckoutPageData,
  createCodOrder,
};
