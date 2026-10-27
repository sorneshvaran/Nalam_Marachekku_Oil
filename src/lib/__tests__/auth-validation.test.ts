import { describe, expect, it } from 'vitest';

import { loginSchema, normalizeEmail, registrationSchema } from '@/lib/auth-validation';

describe('normalizeEmail', () => {
  it('trims and lower-cases an address', () => {
    expect(normalizeEmail('  User.Name@Example.COM  ')).toBe('user.name@example.com');
  });

  it('leaves an already normalised address unchanged', () => {
    expect(normalizeEmail('user@example.com')).toBe('user@example.com');
  });
});

describe('loginSchema', () => {
  it('accepts a valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'correct horse battery staple' });

    expect(result.success).toBe(true);
  });

  it('trims the submitted email', () => {
    const result = loginSchema.safeParse({ email: '  user@example.com ', password: 'secret' });

    expect(result.success && result.data.email).toBe('user@example.com');
  });

  it('rejects malformed email addresses', () => {
    for (const email of ['', 'user', 'user@', '@example.com', 'user@example', 'user name@example.com']) {
      expect(loginSchema.safeParse({ email, password: 'secret' }).success).toBe(false);
    }
  });

  it('rejects an empty or over-long password', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: '' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'x'.repeat(129) }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'x'.repeat(128) }).success).toBe(true);
  });

  it('rejects a missing email or password', () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'user@example.com' }).success).toBe(false);
    expect(loginSchema.safeParse({ password: 'secret' }).success).toBe(false);
  });

  it('rejects an over-long email address', () => {
    expect(loginSchema.safeParse({ email: 'a'.repeat(250) + '@example.com', password: 'secret' }).success).toBe(false);
  });
});

describe('registrationSchema', () => {
  const validRegistration = {
    name: 'Nalam Customer',
    email: 'customer@example.com',
    password: 'a-long-enough-passphrase',
    confirmPassword: 'a-long-enough-passphrase',
  };

  it('accepts a valid registration', () => {
    expect(registrationSchema.safeParse(validRegistration).success).toBe(true);
  });

  it('requires at least twelve characters of password', () => {
    expect(registrationSchema.safeParse({
      ...validRegistration,
      password: 'x'.repeat(11),
      confirmPassword: 'x'.repeat(11),
    }).success).toBe(false);

    expect(registrationSchema.safeParse({
      ...validRegistration,
      password: 'x'.repeat(12),
      confirmPassword: 'x'.repeat(12),
    }).success).toBe(true);
  });

  it('reports mismatched passwords against the confirmation field', () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      confirmPassword: 'something-else-entirely',
    });

    expect(result.success).toBe(false);
    expect(
      result.success === false && result.error.issues.some((issue) => issue.path[0] === 'confirmPassword'),
    ).toBe(true);
  });

  it('requires a name of at least two characters', () => {
    expect(registrationSchema.safeParse({ ...validRegistration, name: 'A' }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...validRegistration, name: '   ' }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...validRegistration, name: 'Jo' }).success).toBe(true);
  });

  it('trims the submitted name and email', () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      name: '  Nalam Customer  ',
      email: ' Customer@Example.com ',
    });

    expect(result.success && result.data.name).toBe('Nalam Customer');
    expect(result.success && result.data.email).toBe('Customer@Example.com');
  });

  it('rejects an invalid email or an over-long name', () => {
    expect(registrationSchema.safeParse({ ...validRegistration, email: 'not-an-email' }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...validRegistration, name: 'n'.repeat(101) }).success).toBe(false);
  });

  it('rejects a missing field', () => {
    expect(registrationSchema.safeParse({}).success).toBe(false);
  });
});
