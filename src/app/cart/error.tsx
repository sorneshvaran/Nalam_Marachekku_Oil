'use client';

import RouteErrorFallback, { type RouteErrorProps } from '@/components/route-error';

export default function CartError({ retry, reset }: RouteErrorProps) {
  return (
    <RouteErrorFallback
      retry={retry}
      reset={reset}
      title="We couldn’t load your cart"
      description="Your cart is temporarily unavailable. Try again, or browse the products to keep shopping."
      homeHref="/products"
      homeLabel="Browse products"
    />
  );
}
