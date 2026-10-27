import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ENV_KEYS = ['NODE_ENV', 'DATABASE_URL', 'AUTH_SECRET', 'AUTH_TRUST_HOST'] as const;
const DATABASE_URL = 'postgresql://user:password@localhost:5432/nalam';

async function importEnvModule() {
  vi.resetModules();
  return import('@/lib/env');
}

describe('server environment validation', () => {
  beforeEach(() => {
    // Start from empty values so the test does not depend on the local .env file.
    for (const key of ENV_KEYS) {
      vi.stubEnv(key, '');
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reports a missing DATABASE_URL', async () => {
    await expect(importEnvModule()).rejects.toThrow(/DATABASE_URL/);
  });

  it('reports a missing AUTH_SECRET in production', async () => {
    vi.stubEnv('DATABASE_URL', DATABASE_URL);
    vi.stubEnv('NODE_ENV', 'production');

    await expect(importEnvModule()).rejects.toThrow(/AUTH_SECRET/);
  });

  it('exposes the validated values in production', async () => {
    vi.stubEnv('DATABASE_URL', DATABASE_URL);
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUTH_SECRET', 'production-secret-value');

    const { env } = await importEnvModule();

    expect(env.DATABASE_URL).toBe(DATABASE_URL);
    expect(env.AUTH_SECRET).toBe('production-secret-value');
    expect(env.isProduction).toBe(true);
  });

  it('allows a missing AUTH_SECRET outside production', async () => {
    vi.stubEnv('DATABASE_URL', DATABASE_URL);
    vi.stubEnv('NODE_ENV', 'development');

    const { env } = await importEnvModule();

    expect(env.AUTH_SECRET).toBeUndefined();
    expect(env.isProduction).toBe(false);
  });

  it('treats an empty optional variable as unset', async () => {
    vi.stubEnv('DATABASE_URL', DATABASE_URL);
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUTH_SECRET', 'production-secret-value');
    vi.stubEnv('AUTH_TRUST_HOST', '   ');

    const { env } = await importEnvModule();

    expect(env.AUTH_TRUST_HOST).toBeUndefined();
  });

  it('never includes the configured value in the error message', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DATABASE_URL', '   ');

    await expect(importEnvModule()).rejects.toThrow(
      /Invalid server environment: DATABASE_URL must be configured\./,
    );
  });
});
