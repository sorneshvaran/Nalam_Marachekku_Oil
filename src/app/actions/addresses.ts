'use server';

import { revalidatePath } from 'next/cache';

import { addressIdSchema, addressInputSchema } from '@/lib/address-validation';
import { addressesData } from '@/lib/addresses';
import { requireCustomer } from '@/lib/auth';

type AddressField = keyof ReturnType<typeof addressInputSchema.parse>;

export type AddressActionState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Partial<Record<AddressField, string[]>>;
};

function parseAddressInput(formData: FormData) {
  return addressInputSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    addressLine1: formData.get('addressLine1'),
    addressLine2: formData.get('addressLine2') ?? '',
    city: formData.get('city'),
    state: formData.get('state'),
    postalCode: formData.get('postalCode'),
    country: formData.get('country'),
  });
}

function logUnexpectedAddressFailure(event: string, error: unknown): void {
  const errorName = error instanceof Error ? error.name : typeof error;
  const details: Record<string, string> = { errorName };
  let current: unknown = error;
  for (let depth = 0; depth < 3 && typeof current === 'object' && current !== null; depth += 1) {
    const record = current as Record<string, unknown>;
    for (const key of ['code', 'sqlState', 'table', 'column', 'constraint', 'kind']) {
      if (typeof record[key] === 'string' && !(key in details)) details[key] = record[key];
    }
    current = record.cause;
  }
  console.error(event, details);
}

export async function saveAddressAction(
  _previousState: AddressActionState | undefined,
  formData: FormData,
): Promise<AddressActionState> {
  const user = await requireCustomer();
  const parsed = parseAddressInput(formData);

  if (!parsed.success) {
    return {
      message: 'Check the highlighted address fields and try again.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const rawAddressId = formData.get('addressId');
  const isEditing = rawAddressId !== null && rawAddressId !== '';

  try {
    if (isEditing) {
      const parsedId = addressIdSchema.safeParse(rawAddressId);
      if (!parsedId.success) return { message: 'That address could not be found.' };

      const updated = await addressesData.updateAddress(user.id, parsedId.data, parsed.data);
      if (!updated) return { message: 'That address could not be found.' };
    } else {
      await addressesData.createAddress(user.id, parsed.data);
    }

    revalidatePath('/account');
    return { success: true, message: isEditing ? 'Address updated.' : 'Address saved.' };
  } catch (error) {
    logUnexpectedAddressFailure('Address save failed.', error);
    return { message: 'We could not save this address. Please try again.' };
  }
}

export async function deleteAddressAction(
  _previousState: AddressActionState | undefined,
  formData: FormData,
): Promise<AddressActionState> {
  const user = await requireCustomer();
  const parsedId = addressIdSchema.safeParse(formData.get('addressId'));
  if (!parsedId.success) return { message: 'That address could not be found.' };

  try {
    const deleted = await addressesData.deleteAddress(user.id, parsedId.data);
    if (!deleted) return { message: 'That address could not be found.' };

    revalidatePath('/account');
    return { success: true, message: 'Address removed.' };
  } catch (error) {
    logUnexpectedAddressFailure('Address delete failed.', error);
    return { message: 'We could not remove this address. Please try again.' };
  }
}
