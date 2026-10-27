import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import AuthLayout from '@/components/auth-layout';
import AddressManager from '@/components/address-manager';
import { getCurrentUser } from '@/lib/auth';
import { addressesData, type AddressView } from '@/lib/addresses';

export const metadata: Metadata = {
  title: 'My account | Nalam',
  description: 'View your Nalam account details.',
};

export default function AccountPage() {
  return (
    <AuthLayout>
      <main className="flex flex-1 justify-center px-4 py-12 sm:px-6 sm:py-16">
        <Suspense fallback={<AccountFallback />}>
          <AccountDetails />
        </Suspense>
      </main>
    </AuthLayout>
  );
}

async function AccountDetails() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?callbackUrl=%2Faccount');
  }
  if (user.role !== 'CUSTOMER') {
    redirect('/admin');
  }

  let addresses: AddressView[] = [];
  let addressesLoadError = false;
  if (user.role === 'CUSTOMER') {
    try {
      addresses = await addressesData.listAddresses(user.id);
    } catch (error) {
      addressesLoadError = true;
      console.error('Address list retrieval failed.', {
        errorName: error instanceof Error ? error.name : typeof error,
      });
    }
  }

  return (
    <section className="w-full max-w-2xl self-start rounded-xl border border-border-soft bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-700">Customer account</p>
      <h1 className="mt-2 font-serif text-3xl text-earth-900">Your account</h1>
      <dl className="mt-7 divide-y divide-border-soft">
        <div className="grid gap-1 py-4 sm:grid-cols-[140px_1fr] sm:gap-4">
          <dt className="text-sm font-medium text-earth-600">Name</dt>
          <dd className="text-sm text-earth-900">{user.name || 'Not provided'}</dd>
        </div>
        <div className="grid gap-1 py-4 sm:grid-cols-[140px_1fr] sm:gap-4">
          <dt className="text-sm font-medium text-earth-600">Email</dt>
          <dd className="break-all text-sm text-earth-900">{user.email}</dd>
        </div>
        <div className="grid gap-1 py-4 sm:grid-cols-[140px_1fr] sm:gap-4">
          <dt className="text-sm font-medium text-earth-600">Role</dt>
          <dd className="text-sm text-earth-900">{user.role}</dd>
        </div>
      </dl>
      {user.role === 'CUSTOMER' ? (
        <>
        <div className="mb-6 border-t border-border-soft pt-6">
          <h2 className="font-serif text-2xl text-earth-900">Your orders</h2>
          <p className="mt-2 text-sm text-foreground-muted">Review your order history and delivery details.</p>
          <Link href="/account/orders" className="mt-4 inline-flex min-h-11 items-center justify-center border border-border-strong px-5 py-2.5 text-sm font-semibold text-earth-800 hover:border-botanical-700 hover:text-botanical-800">
            My Orders
          </Link>
        </div>
        <AddressManager addresses={addresses} loadError={addressesLoadError} />
        </>
      ) : null}
    </section>
  );
}

function AccountFallback() {
  return <div className="h-72 w-full max-w-2xl animate-pulse rounded-xl bg-cream-100" aria-hidden="true" />;
}
