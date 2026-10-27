import { z } from 'zod';

import { orderIdSchema } from '@/lib/checkout-validation';

export const orderStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]);

export const adminOrderStatusUpdateSchema = z.object({
  orderId: orderIdSchema,
  status: orderStatusSchema,
}).strict();