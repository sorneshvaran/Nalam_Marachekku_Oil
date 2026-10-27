'use client';

import { useActionState } from 'react';

import { adjustInventoryAction, setInventoryAction, type AdminInventoryActionState } from '@/app/actions/admin-inventory';

type InventoryFormValues = { variantId: string; stockQuantity: number; lowStockThreshold: number };
const initialState: AdminInventoryActionState = {};
const fieldClass = 'min-h-10 w-full border border-border-strong bg-white px-3 py-2 text-sm text-earth-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botanical-700';
const buttonClass = 'inline-flex min-h-10 items-center justify-center bg-botanical-700 px-4 py-2 text-sm font-semibold text-white hover:bg-botanical-800 disabled:cursor-not-allowed disabled:opacity-60';

function ActionMessage({ state }: { state: AdminInventoryActionState }) {
  if (!state.message) return null;
  return <p role="status" aria-live="polite" className={state.kind === 'error' ? 'text-sm text-red-700' : 'text-sm text-botanical-800'}>{state.message}</p>;
}

export function AdminInventoryForms({ variantId, stockQuantity, lowStockThreshold }: InventoryFormValues) {
  const [setState, setAction, setPending] = useActionState(setInventoryAction, initialState);
  const [adjustState, adjustAction, adjustPending] = useActionState(adjustInventoryAction, initialState);
  const id = variantId.replaceAll('-', '');

  return <div className="grid gap-4 border-t border-border-soft pt-4 lg:grid-cols-2">
    <form action={setAction} className="space-y-3">
      <input type="hidden" name="variantId" value={variantId} />
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-earth-700">Set stock and threshold</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-earth-700" htmlFor={`stock-${id}`}>Quantity
          <input className={fieldClass + ' mt-1'} id={`stock-${id}`} name="stockQuantity" type="number" min="0" max="2147483647" step="1" required defaultValue={stockQuantity} />
        </label>
        <label className="text-xs font-medium text-earth-700" htmlFor={`threshold-${id}`}>Low-stock threshold
          <input className={fieldClass + ' mt-1'} id={`threshold-${id}`} name="lowStockThreshold" type="number" min="0" max="2147483647" step="1" required defaultValue={lowStockThreshold} />
        </label>
      </div>
      <button className={buttonClass} type="submit" disabled={setPending}>{setPending ? 'Saving…' : 'Save stock settings'}</button>
      <ActionMessage state={setState} />
    </form>

    <form action={adjustAction} className="space-y-3">
      <input type="hidden" name="variantId" value={variantId} />
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-earth-700">Adjust stock</p>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <label className="text-xs font-medium text-earth-700" htmlFor={`mode-${id}`}>Action
          <select className={fieldClass + ' mt-1'} id={`mode-${id}`} name="mode" defaultValue="ADD"><option value="ADD">Add stock</option><option value="REMOVE">Remove stock</option></select>
        </label>
        <label className="text-xs font-medium text-earth-700" htmlFor={`amount-${id}`}>Units
          <input className={fieldClass + ' mt-1'} id={`amount-${id}`} name="amount" type="number" min="1" max="2147483647" step="1" required defaultValue="1" />
        </label>
      </div>
      <button className={buttonClass} type="submit" disabled={adjustPending}>{adjustPending ? 'Applying…' : 'Apply adjustment'}</button>
      <ActionMessage state={adjustState} />
    </form>
  </div>;
}
