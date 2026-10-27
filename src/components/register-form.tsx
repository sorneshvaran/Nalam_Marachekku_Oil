'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { registerAction } from '@/app/actions/auth';

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

export default function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(registerAction, undefined);
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
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-earth-800">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={100}
          aria-invalid={Boolean(errors?.name?.length)}
          aria-describedby={errors?.name?.length ? 'register-name-error' : undefined}
          className="w-full rounded-md border border-border-strong bg-white px-3.5 py-3 text-earth-900 outline-none transition focus-visible:border-botanical-700 focus-visible:ring-2 focus-visible:ring-botanical-200"
        />
        <FieldError id="register-name-error" messages={errors?.name} />
      </div>

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
          aria-describedby={errors?.email?.length ? 'register-email-error' : undefined}
          className="w-full rounded-md border border-border-strong bg-white px-3.5 py-3 text-earth-900 outline-none transition focus-visible:border-botanical-700 focus-visible:ring-2 focus-visible:ring-botanical-200"
        />
        <FieldError id="register-email-error" messages={errors?.email} />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-earth-800">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
          aria-invalid={Boolean(errors?.password?.length)}
          aria-describedby={errors?.password?.length ? 'register-password-error' : 'register-password-hint'}
          className="w-full rounded-md border border-border-strong bg-white px-3.5 py-3 text-earth-900 outline-none transition focus-visible:border-botanical-700 focus-visible:ring-2 focus-visible:ring-botanical-200"
        />
        <p id="register-password-hint" className="mt-1 text-xs text-foreground-muted">Use at least 12 characters.</p>
        <FieldError id="register-password-error" messages={errors?.password} />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-earth-800">Confirm password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
          aria-invalid={Boolean(errors?.confirmPassword?.length)}
          aria-describedby={errors?.confirmPassword?.length ? 'register-confirm-password-error' : undefined}
          className="w-full rounded-md border border-border-strong bg-white px-3.5 py-3 text-earth-900 outline-none transition focus-visible:border-botanical-700 focus-visible:ring-2 focus-visible:ring-botanical-200"
        />
        <FieldError id="register-confirm-password-error" messages={errors?.confirmPassword} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-md bg-botanical-700 px-5 py-3 font-semibold text-white transition hover:bg-botanical-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botanical-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-sm text-foreground-muted">
        Already registered?{' '}
        <Link className="font-semibold text-botanical-700 underline-offset-4 hover:underline" href={'/login?callbackUrl=' + encodeURIComponent(callbackUrl)}>
          Log in
        </Link>
      </p>
    </form>
  );
}
