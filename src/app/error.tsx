'use client';

import RouteErrorFallback, { type RouteErrorProps } from '@/components/route-error';

export default function Error({ retry, reset }: RouteErrorProps) {
  return (
    <RouteErrorFallback
      retry={retry}
      reset={reset}
      title="We couldn’t load this page"
      description="Something went wrong while loading this page. Try again, or return to the home page and continue browsing."
      homeHref="/"
      homeLabel="Back to home"
    />
  );
}
