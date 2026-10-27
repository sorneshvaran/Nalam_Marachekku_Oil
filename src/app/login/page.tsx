import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import AuthLayout from '@/components/auth-layout';
import LoginForm from '@/components/login-form';
import { getCurrentUser, safeReturnTo } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Log in | Nalam',
  description: 'Log in to your Nalam customer account.',
};

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <AuthLayout>
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
        <Suspense fallback={<AuthPageFallback />}>
          <LoginPageContent searchParams={searchParams} />
        </Suspense>
      </main>
    </AuthLayout>
  );
}

async function LoginPageContent({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const callbackUrl = safeReturnTo(params.callbackUrl);
  if (user) {
    redirect(callbackUrl);
  }

  return (
    <section className="w-full max-w-md rounded-xl border border-border-soft bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-700">Welcome back</p>
      <h1 className="mt-2 font-serif text-3xl text-earth-900">Log in to Nalam</h1>
      <p className="mt-3 text-sm leading-6 text-foreground-muted">
        Use your email address and password to access your account.
      </p>
      <div className="mt-7">
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </section>
  );
}

function AuthPageFallback() {
  return <div className="h-[430px] w-full max-w-md animate-pulse rounded-xl bg-cream-100" aria-hidden="true" />;
}
