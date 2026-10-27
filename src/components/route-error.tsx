'use client';

import Link from 'next/link';

// Props Next.js passes to an error boundary. `retry` re-fetches and re-renders the
// segment; `reset` only clears the error state, so `retry` is preferred when present.
export type RouteErrorProps = {
  error?: unknown;
  retry?: () => void;
  reset?: () => void;
};

type RouteErrorFallbackProps = {
  title: string;
  description: string;
  homeHref: string;
  homeLabel: string;
  retry?: () => void;
  reset?: () => void;
};

export default function RouteErrorFallback({
  title,
  description,
  homeHref,
  homeLabel,
  retry,
  reset,
}: RouteErrorFallbackProps) {
  const retryBoundary = retry ?? reset;

  return (
    <section
      role="alert"
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 sm:py-24"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-700">
        Something went wrong
      </p>
      <h1 className="mt-3 font-serif text-3xl text-earth-900 sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-foreground-muted">{description}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {retryBoundary ? (
          <button
            type="button"
            onClick={() => retryBoundary()}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-botanical-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-botanical-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botanical-700"
          >
            Try again
          </button>
        ) : null}
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-strong bg-cream-50 px-6 py-3 text-sm font-semibold text-earth-900 transition hover:border-botanical-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botanical-700"
          href={homeHref}
        >
          {homeLabel}
        </Link>
      </div>
    </section>
  );
}
