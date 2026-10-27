'use client';

import { useActionState, useState } from 'react';

import { saveAddressAction } from '@/app/actions/addresses';
import type { AddressInput } from '@/lib/address-validation';
import type { AddressView } from '@/lib/addresses';

type AddressFormValues = Omit<AddressInput, 'addressLine2'> & { addressLine2: string };

const fieldLabels: Record<keyof AddressFormValues, string> = {
  name: 'Full name',
  phone: 'Phone',
  addressLine1: 'Address line 1',
  addressLine2: 'Address line 2 (optional)',
  city: 'City',
  state: 'State',
  postalCode: 'Postal code',
  country: 'Country',
};

function toFormValues(address?: AddressView): AddressFormValues {
  return {
    name: address?.name ?? '',
    phone: address?.phone ?? '',
    addressLine1: address?.addressLine1 ?? '',
    addressLine2: address?.addressLine2 ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    postalCode: address?.postalCode ?? '',
    country: address?.country ?? '',
  };
}

export default function AddressForm({
  address,
  onCancel,
  onDone,
}: {
  address?: AddressView;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(saveAddressAction, undefined);
  const [values, setValues] = useState<AddressFormValues>(() => toFormValues(address));
  const errors = state?.fieldErrors;
  const fieldOrder: (keyof AddressFormValues)[] = [
    'name', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country',
  ];

  function setField(field: keyof AddressFormValues, value: string): void {
    setValues((current) => ({ ...current, [field]: value }));
  }

  return (
    <form action={action} className="rounded-lg border border-border-soft bg-cream-50 p-5 sm:p-6">
      {address ? <input type="hidden" name="addressId" value={address.id} /> : null}

      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-botanical-700">
          {address ? 'Edit saved address' : 'New saved address'}
        </p>
        <h3 className="mt-1 font-serif text-2xl text-earth-900">
          {address ? 'Update address details' : 'Add an address'}
        </h3>
      </div>

      {state?.message ? (
        <p
          role={state.success ? 'status' : 'alert'}
          className={
            'mb-4 rounded-md border px-4 py-3 text-sm ' +
            (state.success
              ? 'border-botanical-200 bg-botanical-50 text-botanical-900'
              : 'border-red-200 bg-red-50 text-red-900')
          }
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {fieldOrder.map((field) => {
          const isMultiline = field === 'addressLine1' || field === 'addressLine2';
          const id = 'address-' + field;
          const errorId = id + '-error';
          const maxLength = field === 'name' ? 100
            : field === 'phone' ? 40
              : field === 'addressLine1' || field === 'addressLine2' ? 200
                : field === 'postalCode' ? 24 : 100;

          return (
            <div key={field} className={isMultiline ? 'sm:col-span-2' : ''}>
              <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-earth-800">
                {fieldLabels[field]}
              </label>
              {isMultiline ? (
                <textarea
                  id={id}
                  name={field}
                  autoComplete={field === 'addressLine1' ? 'address-line1' : 'address-line2'}
                  required={field === 'addressLine1'}
                  maxLength={maxLength}
                  rows={field === 'addressLine1' ? 2 : 2}
                  value={values[field]}
                  onChange={(event) => setField(field, event.target.value)}
                  aria-invalid={Boolean(errors?.[field]?.length)}
                  aria-describedby={errors?.[field]?.length ? errorId : undefined}
                  className="w-full resize-y rounded-md border border-border-strong bg-white px-3.5 py-3 text-sm text-earth-900 outline-none focus-visible:border-botanical-700 focus-visible:ring-2 focus-visible:ring-botanical-200"
                />
              ) : (
                <input
                  id={id}
                  name={field}
                  type="text"
                  autoComplete={field === 'name' ? 'name'
                    : field === 'phone' ? 'tel'
                      : field === 'city' ? 'address-level2'
                        : field === 'state' ? 'address-level1'
                          : field === 'postalCode' ? 'postal-code' : 'country-name'}
                  required
                  maxLength={maxLength}
                  value={values[field]}
                  onChange={(event) => setField(field, event.target.value)}
                  aria-invalid={Boolean(errors?.[field]?.length)}
                  aria-describedby={errors?.[field]?.length ? errorId : undefined}
                  className="w-full rounded-md border border-border-strong bg-white px-3.5 py-3 text-sm text-earth-900 outline-none focus-visible:border-botanical-700 focus-visible:ring-2 focus-visible:ring-botanical-200"
                />
              )}
              {errors?.[field]?.[0] ? (
                <p id={errorId} className="mt-1 text-sm text-red-800">{errors[field]?.[0]}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending || state?.success === true}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-botanical-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-botanical-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Saving…' : address ? 'Save changes' : 'Save address'}
        </button>
        {state?.success ? (
          <button
            type="button"
            onClick={onDone}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-strong px-5 py-3 text-sm font-semibold text-earth-800 hover:border-botanical-700 hover:text-botanical-800"
          >
            Done
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-md px-4 py-3 text-sm font-medium text-earth-700 underline underline-offset-4"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
