import 'server-only';

export async function getCurrentUser() {
  return null;
}

export async function isAuthenticated() {
  return false;
}

export async function isAdmin() {
  return false;
}

export async function requireUser(): Promise<never> {
  throw new Error('requireUser is not available in unit tests.');
}

export async function requireCustomer(): Promise<never> {
  throw new Error('requireCustomer is not available in unit tests.');
}

export async function requireAdmin(): Promise<never> {
  throw new Error('requireAdmin is not available in unit tests.');
}

export function safeReturnTo(value: unknown, fallback = '/account'): string {
  return typeof value === 'string' ? value : fallback;
}

export type CurrentUser = { id: string; name: string | null; email: string; role: 'CUSTOMER' | 'ADMIN' };
