import { z } from 'zod';

const MAX_INT32 = 2_147_483_647;
const variantId = z.string().uuid();
const nonNegativeInteger = z.number().int().min(0).max(MAX_INT32);

function integerFormValue(max: number) {
  return z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0).max(max));
}

export const inventoryVariantIdSchema = variantId;

export const setInventorySchema = z.object({
  variantId,
  stockQuantity: integerFormValue(MAX_INT32),
  lowStockThreshold: integerFormValue(MAX_INT32),
}).strict();

export const adjustInventorySchema = z.object({
  variantId,
  mode: z.enum(['ADD', 'REMOVE']),
  amount: z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().int().min(1).max(MAX_INT32)),
}).strict();

export const inventoryValuesSchema = z.object({
  stockQuantity: nonNegativeInteger,
  lowStockThreshold: nonNegativeInteger,
}).strict();
