'use client';

import RouteErrorFallback, { type RouteErrorProps } from '@/components/route-error';

export default function AccountError({ retry, reset }: RouteErrorProps) {
  return (
    <RouteErrorFallback
      retry={retry}
      reset={reset}
      title="We couldn’t load your account"
      description="Your account details are temporarily unavailable. Try again, or return to the home page."
      homeHref="/"
      homeLabel="Back to home"
    />
  );
}
