'use client';

import RouteErrorFallback, { type RouteErrorProps } from '@/components/route-error';

export default function ProductsError({ retry, reset }: RouteErrorProps) {
  return (
    <RouteErrorFallback
      retry={retry}
      reset={reset}
      title="We couldn’t load the product catalogue"
      description="This part of the shop is temporarily unavailable. Try again, or return to the home page to browse our oils and traditional food products."
      homeHref="/"
      homeLabel="Back to home"
    />
  );
}
