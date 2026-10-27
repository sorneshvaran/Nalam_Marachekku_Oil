'use client';

import RouteErrorFallback, { type RouteErrorProps } from '@/components/route-error';

export default function AdminError({ retry, reset }: RouteErrorProps) {
  return (
    <RouteErrorFallback
      retry={retry}
      reset={reset}
      title="We couldn’t load the admin area"
      description="This admin section is temporarily unavailable. Try again, or return to the dashboard."
      homeHref="/admin"
      homeLabel="Back to dashboard"
    />
  );
}
