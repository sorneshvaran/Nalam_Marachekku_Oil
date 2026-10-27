import { Suspense } from 'react';
import Link from 'next/link';

import { logoutAction } from '@/app/actions/auth';
import AdminDashboardNavigation from '@/components/admin-dashboard-navigation';
import GuestCartLink from '@/components/guest-cart-link';
import GuestCartMerge from '@/components/guest-cart-merge';
import { getCurrentUser, type CurrentUser } from '@/lib/auth';
import { cartData } from '@/lib/cart';

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border-soft bg-cream-50/95 backdrop-blur">
      <div className="mx-auto flex h-[76px] max-w-8xl items-center justify-between gap-2 px-4 sm:gap-6 sm:px-6 lg:px-8">
        <Suspense fallback={<HeaderFallback />}>
          <HeaderContents />
        </Suspense>
      </div>
    </header>
  );
}

function HeaderBrand() {
  return (
    <Link className="flex shrink-0 flex-col leading-none text-earth-900" href="/" aria-label="Nalam home">
      <span className="font-serif text-xl font-semibold tracking-[0.12em] sm:text-2xl">NALAM</span>
      <span className="mt-1 hidden text-[9px] font-medium uppercase tracking-[0.16em] text-earth-600 sm:block">Traditional foods</span>
    </Link>
  );
}

function HeaderFallback() {
  return (
    <>
      <span className="flex shrink-0 flex-col leading-none text-earth-900" aria-hidden="true">
        <span className="font-serif text-xl font-semibold tracking-[0.12em] sm:text-2xl">NALAM</span>
        <span className="mt-1 hidden text-[9px] font-medium uppercase tracking-[0.16em] text-earth-600 sm:block">Traditional foods</span>
      </span>
      <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-4 md:gap-6">
        <div aria-hidden="true" className="h-9 w-28" />
      </nav>
    </>
  );
}

async function HeaderContents() {
  const user = await getCurrentUser();
  return (
    <>
      {user?.role === 'ADMIN' ? (
        <span className="flex shrink-0 flex-col leading-none text-earth-900">
          <span className="font-serif text-xl font-semibold tracking-[0.12em] sm:text-2xl">NALAM</span>
          <span className="mt-1 hidden text-[9px] font-medium uppercase tracking-[0.16em] text-earth-600 sm:block">Traditional foods</span>
        </span>
      ) : <HeaderBrand />}
      <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-4 md:gap-6">
        <AuthNavigation user={user} />
      </nav>
    </>
  );
}

function StorefrontHeaderShortcuts() {
  return (
    <>
      <Link className="hidden text-sm font-medium text-earth-700 transition hover:text-botanical-700 md:inline" href="/about">About Nalam</Link>
      <Link className="hidden rounded-md bg-botanical-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-botanical-800 sm:inline-flex" href="/products">Shop now</Link>
    </>
  );
}

function AuthNavigation({ user }: { user: CurrentUser | null }) {
  if (!user) {
    return (
      <>
        <StorefrontHeaderShortcuts />
        <div className="flex items-center gap-2 sm:gap-3">
          <Link className="text-xs font-medium text-earth-700 transition hover:text-botanical-700 sm:hidden" href="/products">Shop</Link>
          <GuestCartLink />
          <Link className="rounded-md px-2 py-2 text-xs font-medium text-earth-700 transition hover:text-botanical-700 sm:px-1 sm:text-sm" href="/login">Login</Link>
          <Link className="rounded-md bg-botanical-700 px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-botanical-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botanical-700 sm:px-3 sm:text-sm" href="/register">Register</Link>
        </div>
      </>
    );
  }

  if (user.role === 'ADMIN') {
    return (
      <div className="flex items-center gap-1 sm:gap-3">
        <AdminDashboardNavigation />
        <LogoutForm />
      </div>
    );
  }

  return <CustomerNavigation user={user} />;
}

async function CustomerNavigation({ user }: { user: CurrentUser }) {
  const cartQuantity = await cartData.getCartQuantityForUser(user.id);
  return (
    <>
      <StorefrontHeaderShortcuts />
      <div className="flex items-center gap-2 sm:gap-3">
        <Link className="text-xs font-medium text-earth-700 transition hover:text-botanical-700 sm:hidden" href="/products">Shop</Link>
        <GuestCartMerge />
        <Link
          className="rounded-md px-2 py-2 text-xs font-medium text-earth-700 transition hover:text-botanical-700 sm:px-1 sm:text-sm"
          href="/cart"
          aria-label={'Cart, ' + cartQuantity + (cartQuantity === 1 ? ' item' : ' items')}
        >
          Cart ({cartQuantity})
        </Link>
        <Link className="rounded-md px-2 py-2 text-xs font-medium text-earth-700 transition hover:text-botanical-700 sm:px-1 sm:text-sm" href="/account">Account</Link>
        <LogoutForm />
      </div>
    </>
  );
}

function LogoutForm() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-md border border-border-strong px-2.5 py-2 text-xs font-semibold text-earth-800 transition hover:border-botanical-700 hover:text-botanical-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botanical-700 sm:px-3 sm:text-sm"
      >
        Log out
      </button>
    </form>
  );
}