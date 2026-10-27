import 'server-only';

import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { deriveStockStatus, type StockStatus } from '@/lib/inventory';
import { inventoryVariantIdSchema, inventoryValuesSchema } from '@/lib/inventory-validation';

export type AdminInventoryItem = {
  variantId: string;
  productId: string;
  productName: string;
  categoryName: string | null;
  productActive: boolean;
  variantActive: boolean;
  sku: string;
  value: string;
  unit: 'ML' | 'L' | 'G' | 'KG';
  price: string;
  stockQuantity: number;
  lowStockThreshold: number;
  stockStatus: StockStatus;
};

export class AdminInventoryError extends Error {
  constructor(readonly code: 'INVALID_ID' | 'NOT_FOUND' | 'INVALID_VALUES' | 'INSUFFICIENT_STOCK' | 'UNAVAILABLE') {
    super(code);
    this.name = 'AdminInventoryError';
  }
}

function hasValidId(id: string): boolean {
  return inventoryVariantIdSchema.safeParse(id).success;
}

async function getAdminInventory(): Promise<AdminInventoryItem[]> {
  await requireAdmin();
  try {
    const variants = await db.orm.public.ProductVariant
      .select('id', 'productId', 'sku', 'value', 'unit', 'price', 'stockQuantity', 'lowStockThreshold', 'active', 'stockStatus')
      .include('product', (product) => product.select('id', 'name', 'active').include('category', (category) => category.select('name')))
      .orderBy((variant) => variant.sku.asc())
      .all();

    return variants.flatMap((variant) => variant.product ? [{
      variantId: variant.id,
      productId: variant.productId,
      productName: variant.product.name,
      categoryName: variant.product.category?.name ?? null,
      productActive: variant.product.active,
      variantActive: variant.active,
      sku: variant.sku,
      value: variant.value,
      unit: variant.unit,
      price: variant.price,
      stockQuantity: variant.stockQuantity,
      lowStockThreshold: variant.lowStockThreshold,
      stockStatus: deriveStockStatus(variant.stockQuantity, variant.lowStockThreshold),
    }] : []);
  } catch (error) {
    console.error('Admin inventory retrieval failed.', { errorName: error instanceof Error ? error.name : typeof error });
    throw new AdminInventoryError('UNAVAILABLE');
  }
}

async function setAdminInventory(variantId: string, values: { stockQuantity: number; lowStockThreshold: number }): Promise<void> {
  await requireAdmin();
  if (!hasValidId(variantId)) throw new AdminInventoryError('INVALID_ID');
  const parsed = inventoryValuesSchema.safeParse(values);
  if (!parsed.success) throw new AdminInventoryError('INVALID_VALUES');

  try {
    await db.transaction(async (tx) => {
      const variant = await tx.orm.public.ProductVariant
        .where({ id: variantId })
        .forUpdate()
        .first();
      if (!variant) throw new AdminInventoryError('NOT_FOUND');
      await tx.orm.public.ProductVariant.where({ id: variantId }).updateAll({
        stockQuantity: parsed.data.stockQuantity,
        lowStockThreshold: parsed.data.lowStockThreshold,
        stockStatus: deriveStockStatus(parsed.data.stockQuantity, parsed.data.lowStockThreshold),
      });
    });
  } catch (error) {
    if (error instanceof AdminInventoryError) throw error;
    console.error('Admin inventory update failed.', { errorName: error instanceof Error ? error.name : typeof error });
    throw new AdminInventoryError('UNAVAILABLE');
  }
}

async function adjustAdminInventory(variantId: string, mode: 'ADD' | 'REMOVE', amount: number): Promise<void> {
  await requireAdmin();
  if (!hasValidId(variantId)) throw new AdminInventoryError('INVALID_ID');
  if (!Number.isInteger(amount) || amount <= 0 || amount > 2_147_483_647) throw new AdminInventoryError('INVALID_VALUES');

  try {
    await db.transaction(async (tx) => {
      const variant = await tx.orm.public.ProductVariant
        .where({ id: variantId })
        .forUpdate()
        .first();
      if (!variant) throw new AdminInventoryError('NOT_FOUND');

      const stockQuantity = mode === 'ADD'
        ? variant.stockQuantity + amount
        : variant.stockQuantity - amount;
      if (stockQuantity < 0) throw new AdminInventoryError('INSUFFICIENT_STOCK');
      if (!Number.isSafeInteger(stockQuantity) || stockQuantity > 2_147_483_647) throw new AdminInventoryError('INVALID_VALUES');

      await tx.orm.public.ProductVariant.where({ id: variantId }).updateAll({
        stockQuantity,
        stockStatus: deriveStockStatus(stockQuantity, variant.lowStockThreshold),
      });
    });
  } catch (error) {
    if (error instanceof AdminInventoryError) throw error;
    console.error('Admin inventory adjustment failed.', { errorName: error instanceof Error ? error.name : typeof error });
    throw new AdminInventoryError('UNAVAILABLE');
  }
}

export const adminInventoryData = { getAdminInventory, setAdminInventory, adjustAdminInventory };
