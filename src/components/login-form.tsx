'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { loginAction } from '@/app/actions/auth';

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return (
    <p id={id} className="mt-1 text-sm text-red-800">
      {messages[0]}
    </p>
  );
}

export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const errors = state?.fieldErrors;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      {state?.message ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {state.message}
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-earth-800">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          aria-invalid={Boolean(errors?.email?.length)}
          aria-describedby={errors?.email?.length ? 'login-email-error' : undefined}
          className="w-full rounded-md border border-border-strong bg-white px-3.5 py-3 text-earth-900 outline-none transition focus-visible:border-botanical-700 focus-visible:ring-2 focus-visible:ring-botanical-200"
        />
        <FieldError id="login-email-error" messages={errors?.email} />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-earth-800">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          aria-invalid={Boolean(errors?.password?.length)}
          aria-describedby={errors?.password?.length ? 'login-password-error' : undefined}
          className="w-full rounded-md border border-border-strong bg-white px-3.5 py-3 text-earth-900 outline-none transition focus-visible:border-botanical-700 focus-visible:ring-2 focus-visible:ring-botanical-200"
        />
        <FieldError id="login-password-error" messages={errors?.password} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-md bg-botanical-700 px-5 py-3 font-semibold text-white transition hover:bg-botanical-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botanical-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Signing in…' : 'Log in'}
      </button>

      <p className="text-center text-sm text-foreground-muted">
        New to Nalam?{' '}
        <Link className="font-semibold text-botanical-700 underline-offset-4 hover:underline" href={'/register?callbackUrl=' + encodeURIComponent(callbackUrl)}>
          Create an account
        </Link>
      </p>
    </form>
  );
}
