'use server';

import { revalidatePath, updateTag } from 'next/cache';

import { requireAdmin } from '@/lib/auth';
import { AdminInventoryError, adminInventoryData } from '@/lib/admin-inventory';
import { adjustInventorySchema, setInventorySchema } from '@/lib/inventory-validation';

export type AdminInventoryActionState = { kind?: 'success' | 'error'; message?: string };

function actionError(error: unknown): AdminInventoryActionState {
  if (error instanceof AdminInventoryError) {
    if (error.code === 'INSUFFICIENT_STOCK') return { kind: 'error', message: 'That removal is greater than the current stock.' };
    if (error.code === 'INVALID_VALUES') return { kind: 'error', message: 'Enter whole, non-negative values within the supported range.' };
    if (error.code === 'NOT_FOUND' || error.code === 'INVALID_ID') return { kind: 'error', message: 'This variant could not be found. Refresh and try again.' };
  }
  console.error('Admin inventory action failed.', { errorName: error instanceof Error ? error.name : typeof error });
  return { kind: 'error', message: 'We could not save this inventory change. Please try again.' };
}

function invalidateInventory() {
  updateTag('products');
  revalidatePath('/admin/inventory');
  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/');
}

export async function setInventoryAction(
  _previousState: AdminInventoryActionState,
  formData: FormData,
): Promise<AdminInventoryActionState> {
  await requireAdmin();
  const parsed = setInventorySchema.safeParse({
    variantId: formData.get('variantId'),
    stockQuantity: formData.get('stockQuantity'),
    lowStockThreshold: formData.get('lowStockThreshold'),
  });
  if (!parsed.success) return { kind: 'error', message: 'Enter valid whole-number stock and threshold values.' };

  try {
    await adminInventoryData.setAdminInventory(parsed.data.variantId, {
      stockQuantity: parsed.data.stockQuantity,
      lowStockThreshold: parsed.data.lowStockThreshold,
    });
    invalidateInventory();
    return { kind: 'success', message: 'Stock and threshold saved.' };
  } catch (error) {
    return actionError(error);
  }
}

export async function adjustInventoryAction(
  _previousState: AdminInventoryActionState,
  formData: FormData,
): Promise<AdminInventoryActionState> {
  await requireAdmin();
  const parsed = adjustInventorySchema.safeParse({
    variantId: formData.get('variantId'),
    mode: formData.get('mode'),
    amount: formData.get('amount'),
  });
  if (!parsed.success) return { kind: 'error', message: 'Enter a whole adjustment amount greater than zero.' };

  try {
    await adminInventoryData.adjustAdminInventory(parsed.data.variantId, parsed.data.mode, parsed.data.amount);
    invalidateInventory();
    return { kind: 'success', message: parsed.data.mode === 'ADD' ? 'Stock added.' : 'Stock removed.' };
  } catch (error) {
    return actionError(error);
  }
}
