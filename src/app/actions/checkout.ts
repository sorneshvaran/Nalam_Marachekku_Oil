'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { checkoutData, CheckoutError } from '@/lib/checkout';
import { placeOrderSchema } from '@/lib/checkout-validation';
import { getCurrentUser } from '@/lib/auth';

export type CheckoutActionState = {
  message?: string;
};

const errorMessages: Record<CheckoutError['code'], string> = {
  EMPTY_CART: 'Your cart is empty. Add a product before placing an order.',
  ADDRESS_UNAVAILABLE: 'Choose one of your saved addresses and try again.',
  CART_UNAVAILABLE: 'Your cart needs attention before you can place this order.',
  VARIANT_UNAVAILABLE: 'A cart item is no longer available. Review your cart before placing the order.',
  INSUFFICIENT_STOCK: 'A cart quantity is above current availability. Reduce the quantity and try again.',
  INVALID_QUANTITY: 'A cart quantity is invalid. Review your cart before placing the order.',
  INVALID_PRICE: 'We could not calculate the current prices. Please try again.',
  UNAUTHENTICATED: 'Please sign in again to place your order.',
  FORBIDDEN: 'This account cannot place a customer order.',
};

export async function placeCodOrderAction(
  _previousState: CheckoutActionState | undefined,
  formData: FormData,
): Promise<CheckoutActionState | undefined> {
  const user = await getCurrentUser();
  if (!user) redirect('/login?callbackUrl=%2Fcheckout');
  if (user.role !== 'CUSTOMER') redirect('/');

  const parsed = placeOrderSchema.safeParse({
    addressId: formData.get('addressId'),
  });
  if (!parsed.success) {
    return { message: 'Choose a saved delivery address before placing your order.' };
  }

  let order: { id: string };
  try {
    order = await checkoutData.createCodOrder(parsed.data.addressId);
  } catch (error) {
    if (error instanceof CheckoutError) {
      if (error.code === 'UNAUTHENTICATED') redirect('/login?callbackUrl=%2Fcheckout');
      if (error.code === 'FORBIDDEN') redirect('/');
      return { message: errorMessages[error.code] };
    }
    console.error('COD order creation failed.', {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return { message: 'We could not place your order. Please review your cart and try again.' };
  }

  updateTag('products');
  revalidatePath('/cart');
  revalidatePath('/checkout');
  redirect('/order-success/' + encodeURIComponent(order.id));
}
