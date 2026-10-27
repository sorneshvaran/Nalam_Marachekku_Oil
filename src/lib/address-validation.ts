import { z } from 'zod';

const requiredText = (max: number) =>
  z.string().trim().min(1, 'This field is required.').max(max, `Use ${max} characters or fewer.`);

export const addressInputSchema = z.object({
  name: requiredText(100),
  phone: requiredText(40),
  addressLine1: requiredText(200),
  addressLine2: z.string().trim().max(200, 'Use 200 characters or fewer.').transform((value) => value || null),
  city: requiredText(100),
  state: requiredText(100),
  postalCode: requiredText(24),
  country: requiredText(100),
}).strict();

export const addressIdSchema = z.string().uuid();

export type AddressInput = z.infer<typeof addressInputSchema>;
