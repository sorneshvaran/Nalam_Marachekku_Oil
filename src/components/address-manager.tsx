'use client';

import { useActionState, useState } from 'react';

import { deleteAddressAction } from '@/app/actions/addresses';
import AddressForm from '@/components/address-form';
import type { AddressView } from '@/lib/addresses';

export default function AddressManager({
  addresses,
  loadError = false,
}: {
  addresses: AddressView[];
  loadError?: boolean;
}) {
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmingAddressId, setConfirmingAddressId] = useState<string | null>(null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAddressAction, undefined);
  const deletingAddress = addresses.find((address) => address.id === confirmingAddressId);

  return (
    <section id="addresses" className="mt-10 border-t border-border-soft pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-botanical-700">Your details</p>
          <h2 className="mt-1 font-serif text-2xl text-earth-900 sm:text-3xl">Saved addresses</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-foreground-muted">
            Keep delivery details ready for a future checkout. Each address belongs to your account.
          </p>
        </div>
        {!isCreating && !editingAddressId ? (
          <button
            type="button"
            onClick={() => {
              setConfirmingAddressId(null);
              setIsCreating(true);
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-botanical-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-botanical-800"
          >
            Add address
          </button>
        ) : null}
      </div>

      {deleteState?.message ? (
        <p
          role={deleteState.success ? 'status' : 'alert'}
          className={
            'mt-5 rounded-md border px-4 py-3 text-sm ' +
            (deleteState.success
              ? 'border-botanical-200 bg-botanical-50 text-botanical-900'
              : 'border-red-200 bg-red-50 text-red-900')
          }
        >
          {deleteState.message}
        </p>
      ) : null}

      {loadError ? (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          <p>We could not load your saved addresses.</p>
          <a className="mt-2 inline-block font-semibold underline underline-offset-4" href="/account#addresses">
            Try again
          </a>
        </div>
      ) : null}

      {isCreating ? (
        <div className="mt-6">
          <AddressForm onCancel={() => setIsCreating(false)} onDone={() => setIsCreating(false)} />
        </div>
      ) : null}

      {addresses.length === 0 && !isCreating && !loadError ? (
        <div className="mt-6 border-y border-border-soft bg-cream-50 px-5 py-8 sm:px-6">
          <h3 className="font-serif text-xl text-earth-900">No saved addresses yet</h3>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            Add an address to keep your delivery details together for later.
          </p>
        </div>
      ) : null}

      {addresses.length > 0 ? (
        <ul className="mt-6 divide-y divide-border-soft border-y border-border-soft">
          {addresses.map((address) => (
            <li key={address.id} className="py-5 first:pt-5 last:pb-5">
              {editingAddressId === address.id ? (
                <AddressForm
                  key={address.id}
                  address={address}
                  onCancel={() => setEditingAddressId(null)}
                  onDone={() => setEditingAddressId(null)}
                />
              ) : (
                <article className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-earth-900">{address.name}</h3>
                    <p className="mt-1 text-sm text-earth-700">{address.phone}</p>
                    <address className="mt-3 whitespace-pre-line text-sm not-italic leading-6 text-foreground-muted">
                      {[
                        address.addressLine1,
                        address.addressLine2,
                        address.city,
                        address.state,
                        address.postalCode,
                        address.country,
                      ].filter(Boolean).join(', ')}
                    </address>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setConfirmingAddressId(null);
                        setEditingAddressId(address.id);
                      }}
                      className="min-h-10 text-sm font-semibold text-botanical-800 underline underline-offset-4"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddressId(null);
                        setIsCreating(false);
                        setConfirmingAddressId(address.id);
                      }}
                      className="min-h-10 text-sm font-semibold text-earth-700 underline underline-offset-4 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {deletingAddress ? (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4" role="alertdialog" aria-modal="false" aria-labelledby="delete-address-title">
          <h3 id="delete-address-title" className="font-semibold text-red-950">Remove this address?</h3>
          <p className="mt-1 text-sm leading-6 text-red-900">
            The saved address for {deletingAddress.name} at {deletingAddress.addressLine1} will be removed from your account.
          </p>
          <form action={deleteAction} className="mt-4 flex flex-wrap gap-3">
            <input type="hidden" name="addressId" value={deletingAddress.id} />
            <button
              type="submit"
              disabled={deletePending}
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-red-800 px-4 py-2 text-sm font-semibold text-white hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deletePending ? 'Removing…' : 'Remove address'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingAddressId(null)}
              disabled={deletePending}
              className="inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-earth-800 underline underline-offset-4 disabled:opacity-60"
            >
              Keep address
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
