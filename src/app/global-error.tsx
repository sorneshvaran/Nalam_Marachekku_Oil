'use client';

import './globals.css';

import RouteErrorFallback, { type RouteErrorProps } from '@/components/route-error';

// Replaces the root layout when it fails, so it must render its own document.
export default function GlobalError({ retry, reset }: RouteErrorProps) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-cream-50 text-earth-900">
        <main className="flex flex-1 flex-col">
          <RouteErrorFallback
            retry={retry}
            reset={reset}
            title="Something went wrong"
            description="The application could not load this page. Try again, or return to the home page."
            homeHref="/"
            homeLabel="Back to home"
          />
        </main>
      </body>
    </html>
  );
}
