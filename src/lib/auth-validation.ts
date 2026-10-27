import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

export const registrationSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(254),
    password: z.string().min(12).max(128),
    confirmPassword: z.string().min(1).max(128),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
