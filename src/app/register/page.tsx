import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import AuthLayout from '@/components/auth-layout';
import RegisterForm from '@/components/register-form';
import { getCurrentUser } from '@/lib/auth';
import { safeReturnTo } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Create account | Nalam',
  description: 'Create a Nalam customer account.',
};

type RegisterPageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
};

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  return (
    <AuthLayout>
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
        <Suspense fallback={<AuthPageFallback />}>
          <RegisterPageContent searchParams={searchParams} />
        </Suspense>
      </main>
    </AuthLayout>
  );
}

async function RegisterPageContent({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const callbackUrl = safeReturnTo(params.callbackUrl);
  if (user) {
    redirect(callbackUrl);
  }

  return (
    <section className="w-full max-w-md rounded-xl border border-border-soft bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-700">Join Nalam</p>
      <h1 className="mt-2 font-serif text-3xl text-earth-900">Create your account</h1>
      <p className="mt-3 text-sm leading-6 text-foreground-muted">
        Set up an account to keep your Nalam details together.
      </p>
      <div className="mt-7">
        <RegisterForm callbackUrl={callbackUrl} />
      </div>
    </section>
  );
}

function AuthPageFallback() {
  return <div className="h-[590px] w-full max-w-md animate-pulse rounded-xl bg-cream-100" aria-hidden="true" />;
}
