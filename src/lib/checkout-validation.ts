import { z } from 'zod';

import { addressIdSchema } from '@/lib/address-validation';

export const placeOrderSchema = z
  .object({
    addressId: addressIdSchema,
  })
  .strict();

export const orderIdSchema = z.string().uuid();
