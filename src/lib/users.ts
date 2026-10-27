import 'server-only';

import { db } from '@/lib/db';

function hasUniqueViolation(error: unknown): boolean {
  let current: unknown = error;

  for (let depth = 0; depth < 4; depth += 1) {
    if (typeof current !== 'object' || current === null) {
      return false;
    }

    const record = current as Record<string, unknown>;
    if (record.sqlState === '23505') {
      return true;
    }

    current = record.cause;
  }

  return false;
}

async function getForCredentials(email: string) {
  return db.orm.public.User
    .where({ email })
    .select('id', 'name', 'email', 'passwordHash')
    .first();
}

async function createCustomer(input: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  try {
    return await db.orm.public.User.create({
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: 'CUSTOMER',
    });
  } catch (error) {
    if (hasUniqueViolation(error)) {
      return null;
    }

    throw error;
  }
}

async function getAccountById(id: string) {
  return db.orm.public.User
    .where({ id })
    .select('id', 'name', 'email', 'role')
    .first();
}

export const usersData = {
  getForCredentials,
  createCustomer,
  getAccountById,
};
