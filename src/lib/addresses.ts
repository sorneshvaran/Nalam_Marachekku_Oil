import 'server-only';

import { db } from '@/lib/db';
import type { AddressInput } from '@/lib/address-validation';

export type AddressView = {
  id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

async function listAddresses(userId: string): Promise<AddressView[]> {
  return db.orm.public.Address
    .where({ userId })
    .select('id', 'name', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country')
    .orderBy((address) => address.createdAt.desc())
    .all();
}

async function createAddress(userId: string, input: AddressInput): Promise<AddressView> {
  return db.orm.public.Address
    .select('id', 'name', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country')
    .create({ userId, ...input });
}

async function updateAddress(
  userId: string,
  addressId: string,
  input: AddressInput,
): Promise<AddressView | null> {
  return db.orm.public.Address
    .where({ id: addressId, userId })
    .select('id', 'name', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country')
    .update(input);
}

async function deleteAddress(userId: string, addressId: string): Promise<AddressView | null> {
  return db.orm.public.Address
    .where({ id: addressId, userId })
    .select('id', 'name', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country')
    .delete();
}

export const addressesData = {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
};
