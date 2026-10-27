'use client';

import RouteErrorFallback, { type RouteErrorProps } from '@/components/route-error';

export default function CheckoutError({ retry, reset }: RouteErrorProps) {
  return (
    <RouteErrorFallback
      retry={retry}
      reset={reset}
      title="We couldn’t load checkout"
      description="Checkout is temporarily unavailable. Try again, or return to your cart to review your items."
      homeHref="/cart"
      homeLabel="Return to cart"
    />
  );
}
