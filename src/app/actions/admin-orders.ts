'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth';
import { adminOrderStatusUpdateSchema } from '@/lib/admin-order-validation';
import { adminOrdersData, AdminOrderDataError } from '@/lib/admin-orders';

export type AdminOrderStatusActionState = {
  kind?: 'success' | 'error';
  message?: string;
};

export async function updateAdminOrderStatusAction(
  _previousState: AdminOrderStatusActionState,
  formData: FormData,
): Promise<AdminOrderStatusActionState> {
  await requireAdmin();

  const parsed = adminOrderStatusUpdateSchema.safeParse({
    orderId: formData.get('orderId'),
    status: formData.get('status'),
  });
  if (!parsed.success) {
    return { kind: 'error', message: 'Choose a valid status and try again.' };
  }

  try {
    await adminOrdersData.updateAdminOrderStatus(parsed.data.orderId, parsed.data.status);
    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${parsed.data.orderId}`);
    return { kind: 'success', message: 'Order status updated.' };
  } catch (error) {
    if (error instanceof AdminOrderDataError) {
      if (error.code === 'INVALID_TRANSITION') {
        return { kind: 'error', message: 'That status change is not allowed. Refresh the order and try again.' };
      }
      if (error.code === 'STATUS_CHANGED') {
        return { kind: 'error', message: 'This order changed in another session. Refresh before updating it.' };
      }
      if (error.code === 'NOT_FOUND' || error.code === 'INVALID_ID') {
        return { kind: 'error', message: 'This order could not be found. Refresh the page and try again.' };
      }
      return { kind: 'error', message: 'We could not update the order. Please try again.' };
    }

    console.error('Admin order status action failed.', {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return { kind: 'error', message: 'We could not update the order. Please try again.' };
  }
}