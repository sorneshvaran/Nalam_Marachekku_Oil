import 'server-only';

import { redirect } from 'next/navigation';
import { connection } from 'next/server';

import { auth } from '@/auth';
import { usersData } from '@/lib/users';

export type CurrentUser = NonNullable<
  Awaited<ReturnType<typeof usersData.getAccountById>>
>;

export async function getCurrentUser(): Promise<CurrentUser | null> {
  await connection();
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  return (await usersData.getAccountById(userId)) ?? null;
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}

export async function isAdmin(): Promise<boolean> {
  return (await getCurrentUser())?.role === 'ADMIN';
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function requireCustomer(): Promise<CurrentUser> {
  const user = await requireUser();

  if (user.role !== 'CUSTOMER') {
    redirect('/');
  }

  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();

  if (user.role !== 'ADMIN') {
    redirect('/');
  }

  return user;
}

export function safeReturnTo(value: unknown, fallback = '/account'): string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  ) {
    return fallback;
  }

  return value;
}
