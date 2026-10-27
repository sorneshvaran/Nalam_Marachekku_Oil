import 'server-only';

import { z } from 'zod';

// Empty strings are treated as absent so that an unfilled placeholder in a local
// .env file (for example `AUTH_TRUST_HOST=""`) is not reported as a bad value.
function optionalVariable(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

const serverEnvSchema = z.object({
  NODE_ENV: z.string().optional(),
  DATABASE_URL: z.string().min(1),
  // Auth.js falls back to AUTH_SECRET itself, and only production requires it.
  AUTH_SECRET: z.string().min(1).optional(),
  AUTH_TRUST_HOST: z.string().min(1).optional(),
});

const parsed = serverEnvSchema.safeParse({
  NODE_ENV: optionalVariable('NODE_ENV'),
  DATABASE_URL: optionalVariable('DATABASE_URL'),
  AUTH_SECRET: optionalVariable('AUTH_SECRET'),
  AUTH_TRUST_HOST: optionalVariable('AUTH_TRUST_HOST'),
});

if (!parsed.success) {
  // Names only: environment values are never included in the error.
  const invalidVariables = [
    ...new Set(parsed.error.issues.map((issue) => issue.path.join('.')).filter(Boolean)),
  ];
  throw new Error(
    `Invalid server environment: ${invalidVariables.join(', ') || 'unknown variable'} must be configured. See .env.example.`,
  );
}

const nodeEnv = parsed.data.NODE_ENV ?? 'development';

if (nodeEnv === 'production' && !parsed.data.AUTH_SECRET) {
  throw new Error('Invalid server environment: AUTH_SECRET must be set in production. See .env.example.');
}

export const env = {
  DATABASE_URL: parsed.data.DATABASE_URL,
  AUTH_SECRET: parsed.data.AUTH_SECRET,
  AUTH_TRUST_HOST: parsed.data.AUTH_TRUST_HOST,
  isProduction: nodeEnv === 'production',
} as const;
