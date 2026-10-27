import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';

import AuthLayout from '@/components/auth-layout';
import AdminBackToDashboard from '@/components/admin-back-to-dashboard';
import { AdminCustomerDataError, adminCustomersData, type AdminCustomerListItem } from '@/lib/admin-customers';
import { formatOrderDate, formatPrice } from '@/lib/format';

export const metadata: Metadata = { title: 'Customers | Nalam', description: 'View registered Nalam customers and their order history.' };

export default function AdminCustomersPage() {
  return <AuthLayout><main className="flex-1 bg-cream-50 px-4 py-8 sm:px-6 sm:py-12"><Suspense fallback={<CustomersLoading />}><AdminCustomersContent /></Suspense></main></AuthLayout>;
}

async function AdminCustomersContent() {
  await connection();
  let customers: AdminCustomerListItem[];
  try {
    customers = await adminCustomersData.getAdminCustomers();
  } catch (error) {
    if (error instanceof AdminCustomerDataError) return <Unavailable />;
    throw error;
  }

  return <section className="mx-auto w-full max-w-8xl">
    <AdminBackToDashboard />
    <header className="mb-7 border-b border-border-soft pb-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-botanical-700">Nalam operations</p>
      <h1 className="mt-2 font-serif text-3xl text-earth-900 sm:text-4xl">Customers</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-muted">Registered customer accounts and their order history. Lifetime order value sums stored order totals across all statuses, including cancelled orders.</p>
      <p className="mt-3 text-xs text-foreground-muted">{customers.length} {customers.length === 1 ? 'customer' : 'customers'}</p>
    </header>

    {customers.length === 0 ? <div className="border border-border-soft bg-white px-6 py-12 text-center"><h2 className="font-serif text-2xl text-earth-900">No customers yet</h2><p className="mt-2 text-sm text-foreground-muted">Registered customer accounts will appear here.</p></div> : <>
      <div className="hidden overflow-x-auto border border-border-soft bg-white md:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border-soft bg-cream-100 text-xs uppercase tracking-wide text-earth-700"><tr>
            <th scope="col" className="px-4 py-3 font-semibold">Customer</th><th scope="col" className="px-4 py-3 font-semibold">Registered</th><th scope="col" className="px-4 py-3 text-right font-semibold">Orders</th><th scope="col" className="px-4 py-3 text-right font-semibold">Lifetime order value</th><th scope="col" className="px-4 py-3 font-semibold">Most recent order</th><th scope="col" className="px-4 py-3"><span className="sr-only">Details</span></th>
          </tr></thead>
          <tbody className="divide-y divide-border-soft">{customers.map((customer) => <tr key={customer.id} className="align-top">
            <td className="max-w-72 px-4 py-4"><p className="break-words font-medium text-earth-900">{customer.name || 'Name not provided'}</p><p className="mt-1 break-all text-xs text-foreground-muted">{customer.email}</p></td>
            <td className="whitespace-nowrap px-4 py-4 text-earth-700">{formatOrderDate(customer.createdAt)}</td>
            <td className="px-4 py-4 text-right tabular-nums text-earth-800">{customer.orderCount}</td>
            <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-earth-900">{formatPrice(customer.totalOrderValue)}</td>
            <td className="whitespace-nowrap px-4 py-4 text-earth-700">{customer.mostRecentOrderAt ? formatOrderDate(customer.mostRecentOrderAt) : 'No orders'}</td>
            <td className="px-4 py-4 text-right"><Link href={`/admin/customers/${customer.id}`} className="font-semibold text-botanical-800 hover:underline">View</Link></td>
          </tr>)}</tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">{customers.map((customer) => <li key={customer.id} className="border border-border-soft bg-white p-4">
        <div className="min-w-0"><p className="break-words font-medium text-earth-900">{customer.name || 'Name not provided'}</p><p className="mt-1 break-all text-xs text-foreground-muted">{customer.email}</p></div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border-soft pt-3 text-sm">
          <dt className="text-foreground-muted">Registered</dt><dd className="text-right text-earth-800">{formatOrderDate(customer.createdAt)}</dd>
          <dt className="text-foreground-muted">Orders</dt><dd className="text-right tabular-nums text-earth-800">{customer.orderCount}</dd>
          <dt className="text-foreground-muted">Lifetime order value</dt><dd className="text-right font-semibold text-earth-900">{formatPrice(customer.totalOrderValue)}</dd>
          <dt className="text-foreground-muted">Most recent order</dt><dd className="text-right text-earth-800">{customer.mostRecentOrderAt ? formatOrderDate(customer.mostRecentOrderAt) : 'No orders'}</dd>
        </dl>
        <Link href={`/admin/customers/${customer.id}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-botanical-800 hover:underline">View customer</Link>
      </li>)}</ul>
    </>}
  </section>;
}

function CustomersLoading() { return <section className="mx-auto max-w-8xl" aria-label="Loading customers"><div className="h-28 animate-pulse border-b border-border-soft bg-cream-100" /><div className="mt-6 h-80 animate-pulse border border-border-soft bg-cream-100" /></section>; }
function Unavailable() { return <section className="mx-auto max-w-3xl border border-border-soft bg-white px-6 py-12 text-center"><h1 className="font-serif text-2xl text-earth-900">Customers couldn’t be loaded</h1><p className="mt-2 text-sm text-foreground-muted">Please refresh and try again.</p></section>; }
