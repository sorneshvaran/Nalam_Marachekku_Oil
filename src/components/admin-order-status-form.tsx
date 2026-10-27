'use client';

import { useActionState } from 'react';

import { updateAdminOrderStatusAction } from '@/app/actions/admin-orders';
import type { AdminOrderStatusActionState } from '@/app/actions/admin-orders';
import type { OrderStatus } from '@/lib/orders';

type AdminOrderStatusFormProps = {
  orderId: string;
  allowedStatuses: OrderStatus[];
};

const initialState: AdminOrderStatusActionState = {};

export default function AdminOrderStatusForm({ orderId, allowedStatuses }: AdminOrderStatusFormProps) {
  const [state, action, pending] = useActionState(updateAdminOrderStatusAction, initialState);

  if (allowedStatuses.length === 0) {
    return <p className="text-sm text-foreground-muted">This order is closed. No further status changes are available.</p>;
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <label htmlFor="next-order-status" className="mb-2 block text-sm font-medium text-earth-800">
          Move order to
        </label>
        <select
          id="next-order-status"
          name="status"
          defaultValue={allowedStatuses[0]}
          className="min-h-11 w-full border border-border-strong bg-white px-3 py-2 text-sm text-earth-900 focus-visible:outline-2 focus-visible:outline-botanical-700"
          disabled={pending}
        >
          {allowedStatuses.map((status) => (
            <option key={status} value={status}>{status.charAt(0) + status.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center bg-botanical-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-botanical-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Updating…' : 'Update status'}
      </button>
      {state.message ? (
        <p role="status" aria-live="polite" className={state.kind === 'error' ? 'text-sm text-red-700' : 'text-sm text-botanical-800'}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}