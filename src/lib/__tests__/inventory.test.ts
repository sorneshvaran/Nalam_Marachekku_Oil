import { describe, expect, it } from 'vitest';

import { deriveStockStatus } from '@/lib/inventory';
import {
  adjustInventorySchema,
  inventoryValuesSchema,
  setInventorySchema,
} from '@/lib/inventory-validation';

const VARIANT_ID = '1f0f5d3c-8e2a-4c5f-9f7a-2b1d3e4f5a6b';
const MAX_INT32 = 2_147_483_647;

describe('deriveStockStatus', () => {
  it('treats zero stock as out of stock', () => {
    expect(deriveStockStatus(0, 5)).toBe('OUT_OF_STOCK');
  });

  it('treats negative stock as out of stock', () => {
    expect(deriveStockStatus(-1, 5)).toBe('OUT_OF_STOCK');
  });

  it('treats stock at or below the low-stock threshold as low stock', () => {
    expect(deriveStockStatus(1, 5)).toBe('LOW_STOCK');
    expect(deriveStockStatus(5, 5)).toBe('LOW_STOCK');
  });

  it('treats stock above the threshold as available', () => {
    expect(deriveStockStatus(6, 5)).toBe('AVAILABLE');
    expect(deriveStockStatus(1000, 5)).toBe('AVAILABLE');
  });

  it('never reports low stock for a zero threshold', () => {
    expect(deriveStockStatus(1, 0)).toBe('AVAILABLE');
    expect(deriveStockStatus(0, 0)).toBe('OUT_OF_STOCK');
  });
});

describe('setInventorySchema', () => {
  it('accepts zero stock with a zero threshold', () => {
    const result = setInventorySchema.safeParse({
      variantId: VARIANT_ID,
      stockQuantity: '0',
      lowStockThreshold: '0',
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data).toEqual({
      variantId: VARIANT_ID,
      stockQuantity: 0,
      lowStockThreshold: 0,
    });
  });

  it('rejects negative, fractional and non-numeric quantities', () => {
    const base = { variantId: VARIANT_ID, lowStockThreshold: '5' };

    expect(setInventorySchema.safeParse({ ...base, stockQuantity: '-1' }).success).toBe(false);
    expect(setInventorySchema.safeParse({ ...base, stockQuantity: '2.5' }).success).toBe(false);
    expect(setInventorySchema.safeParse({ ...base, stockQuantity: 'many' }).success).toBe(false);
    expect(setInventorySchema.safeParse({ ...base, stockQuantity: '' }).success).toBe(false);
    expect(setInventorySchema.safeParse({ ...base, stockQuantity: String(MAX_INT32 + 1) }).success).toBe(false);
  });

  it('rejects an unknown variant id and unexpected fields', () => {
    expect(setInventorySchema.safeParse({ variantId: 'nope', stockQuantity: '1', lowStockThreshold: '1' }).success).toBe(false);
    expect(setInventorySchema.safeParse({
      variantId: VARIANT_ID,
      stockQuantity: '1',
      lowStockThreshold: '1',
      stockStatus: 'AVAILABLE',
    }).success).toBe(false);
  });
});

describe('adjustInventorySchema', () => {
  it('accepts adding and removing whole units', () => {
    expect(adjustInventorySchema.safeParse({ variantId: VARIANT_ID, mode: 'ADD', amount: '1' }).success).toBe(true);
    expect(adjustInventorySchema.safeParse({ variantId: VARIANT_ID, mode: 'REMOVE', amount: String(MAX_INT32) }).success).toBe(true);
  });

  it('rejects zero, negative and fractional adjustment amounts', () => {
    expect(adjustInventorySchema.safeParse({ variantId: VARIANT_ID, mode: 'ADD', amount: '0' }).success).toBe(false);
    expect(adjustInventorySchema.safeParse({ variantId: VARIANT_ID, mode: 'ADD', amount: '-5' }).success).toBe(false);
    expect(adjustInventorySchema.safeParse({ variantId: VARIANT_ID, mode: 'ADD', amount: '1.5' }).success).toBe(false);
    expect(adjustInventorySchema.safeParse({ variantId: VARIANT_ID, mode: 'ADD', amount: 'abc' }).success).toBe(false);
  });

  it('rejects unknown modes and missing fields', () => {
    expect(adjustInventorySchema.safeParse({ variantId: VARIANT_ID, mode: 'SET', amount: '1' }).success).toBe(false);
    expect(adjustInventorySchema.safeParse({ variantId: VARIANT_ID, mode: 'add', amount: '1' }).success).toBe(false);
    expect(adjustInventorySchema.safeParse({ variantId: VARIANT_ID, amount: '1' }).success).toBe(false);
    expect(adjustInventorySchema.safeParse({ variantId: VARIANT_ID, mode: 'ADD' }).success).toBe(false);
  });
});

describe('inventoryValuesSchema', () => {
  it('accepts non-negative integers', () => {
    expect(inventoryValuesSchema.safeParse({ stockQuantity: 0, lowStockThreshold: 0 }).success).toBe(true);
    expect(inventoryValuesSchema.safeParse({ stockQuantity: 25, lowStockThreshold: 5 }).success).toBe(true);
  });

  it('rejects negative, fractional and string values', () => {
    expect(inventoryValuesSchema.safeParse({ stockQuantity: -1, lowStockThreshold: 0 }).success).toBe(false);
    expect(inventoryValuesSchema.safeParse({ stockQuantity: 1.5, lowStockThreshold: 0 }).success).toBe(false);
    expect(inventoryValuesSchema.safeParse({ stockQuantity: '5', lowStockThreshold: 0 }).success).toBe(false);
    expect(inventoryValuesSchema.safeParse({ stockQuantity: MAX_INT32 + 1, lowStockThreshold: 0 }).success).toBe(false);
  });
});
