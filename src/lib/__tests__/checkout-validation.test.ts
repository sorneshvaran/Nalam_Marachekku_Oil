import { describe, expect, it } from 'vitest';

import { orderIdSchema, placeOrderSchema } from '@/lib/checkout-validation';

const ADDRESS_ID = '9d8c7b6a-5f4e-4d3c-8b2a-1f0e9d8c7b6a';
const ORDER_ID = '4d3c2b1a-0f9e-4d8c-8b7a-6f5e4d3c2b1a';

describe('placeOrderSchema', () => {
  it('accepts one of the customer own address ids', () => {
    const result = placeOrderSchema.safeParse({ addressId: ADDRESS_ID });

    expect(result.success).toBe(true);
    expect(result.success && result.data.addressId).toBe(ADDRESS_ID);
  });

  it('accepts an upper-case uuid', () => {
    expect(placeOrderSchema.safeParse({ addressId: ADDRESS_ID.toUpperCase() }).success).toBe(true);
  });

  it('rejects missing, empty and malformed address ids', () => {
    expect(placeOrderSchema.safeParse({}).success).toBe(false);
    expect(placeOrderSchema.safeParse({ addressId: '' }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ addressId: 'not-a-uuid' }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ addressId: 123 }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ addressId: null }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ addressId: '9d8c7b6a5f4e4d3c8b2a1f0e9d8c7b6a' }).success).toBe(false);
  });

  it('rejects unexpected fields such as client-supplied prices or totals', () => {
    expect(placeOrderSchema.safeParse({ addressId: ADDRESS_ID, total: '1' }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ addressId: ADDRESS_ID, userId: ADDRESS_ID }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ addressId: ADDRESS_ID, quantity: '1' }).success).toBe(false);
  });
});

describe('orderIdSchema', () => {
  it('accepts an order id', () => {
    expect(orderIdSchema.safeParse(ORDER_ID).success).toBe(true);
  });

  it('rejects anything that is not an order id', () => {
    expect(orderIdSchema.safeParse('').success).toBe(false);
    expect(orderIdSchema.safeParse('12345').success).toBe(false);
    expect(orderIdSchema.safeParse(ORDER_ID + '0').success).toBe(false);
  });
});
