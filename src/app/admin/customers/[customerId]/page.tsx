import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';

import AuthLayout from '@/components/auth-layout';
import AdminBackToDashboard from '@/components/admin-back-to-dashboard';
import OrderStatusBadge from '@/components/order-status-badge';
import { AdminCustomerDataError, adminCustomersData, type AdminCustomerDetails } from '@/lib/admin-customers';
import { formatOrderDate, formatOrderReference, formatPrice } from '@/lib/format';

export const metadata: Metadata = { title: 'Customer Details | Nalam', description: 'View a Nalam customer profile, saved addresses, and order history.' };

type CustomerPageProps = { params: Promise<{ customerId: string }> };

export default function AdminCustomerDetailsPage({ params }: CustomerPageProps) {
  return <AuthLayout><main className="flex-1 bg-cream-50 px-4 py-8 sm:px-6 sm:py-12"><Suspense fallback={<CustomerLoading />}><AdminCustomerContent params={params} /></Suspense></main></AuthLayout>;
}

async function AdminCustomerContent({ params }: CustomerPageProps) {
  await connection();
  const { customerId } = await params;
  let customer: AdminCustomerDetails | null;
  try {
    customer = await adminCustomersData.getAdminCustomerById(customerId);
  } catch (error) {
    if (error instanceof AdminCustomerDataError) {
      if (error.code === 'INVALID_ID') notFound();
      return <Unavailable />;
    }
    throw error;
  }
  if (!customer) notFound();

  return <section className="mx-auto w-full max-w-8xl">
    <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1"><AdminBackToDashboard /><Link href="/admin/customers" className="text-sm font-medium text-botanical-800 hover:underline">← Customers</Link></div>
    <header className="my-5 border-b border-border-soft pb-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-botanical-700">Nalam operations</p>
      <h1 className="mt-2 break-words font-serif text-3xl text-earth-900 sm:text-4xl">{customer.name || 'Customer'}</h1>
      <p className="mt-2 break-all text-sm text-foreground-muted">{customer.email}</p>
    </header>

    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className="border border-border-soft bg-white p-5 sm:p-6">
        <h2 className="font-serif text-xl text-earth-900">Customer information</h2>
        <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 text-sm">
          <dt className="text-foreground-muted">Name</dt><dd className="text-right font-medium text-earth-900">{customer.name || 'Not provided'}</dd>
          <dt className="text-foreground-muted">Email</dt><dd className="break-all text-right font-medium text-earth-900">{customer.email}</dd>
          <dt className="text-foreground-muted">Role</dt><dd className="text-right font-medium text-earth-900">Customer</dd>
          <dt className="text-foreground-muted">Registered</dt><dd className="text-right text-earth-800">{formatOrderDate(customer.createdAt)}</dd>
          <dt className="text-foreground-muted">Last profile update</dt><dd className="text-right text-earth-800">{formatOrderDate(customer.updatedAt)}</dd>
        </dl>
        <p className="mt-5 border-t border-border-soft pt-4 text-xs leading-5 text-foreground-muted">Customer information is read-only on this page.</p>
      </div>

      <section className="border border-border-soft bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2"><h2 className="font-serif text-xl text-earth-900">Saved addresses</h2><span className="text-xs text-foreground-muted">{customer.addresses.length} {customer.addresses.length === 1 ? 'address' : 'addresses'}</span></div>
        {customer.addresses.length === 0 ? <p className="mt-5 border-t border-border-soft pt-4 text-sm text-foreground-muted">This customer has no saved addresses.</p> :
          <ul className="mt-4 space-y-3">{customer.addresses.map((address) => <li key={address.id} className="border-t border-border-soft pt-4 first:border-t-0 first:pt-0">
            <p className="font-semibold text-earth-900">{address.name}</p>
            <p className="mt-1 text-sm text-earth-700">{address.phone}</p>
            <address className="mt-2 break-words text-sm not-italic leading-6 text-foreground-muted">
              <span className="block">{address.addressLine1}</span>
              {address.addressLine2 ? <span className="block">{address.addressLine2}</span> : null}
              <span className="block">{address.city}, {address.state} {address.postalCode}</span>
              <span className="block">{address.country}</span>
            </address>
          </li>)}</ul>
        }
      </section>
    </section>

    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h2 className="font-serif text-2xl text-earth-900">Order history</h2><p className="mt-1 text-sm text-foreground-muted">Newest orders first. Order values use historical order totals.</p></div><span className="text-sm text-foreground-muted">{customer.orders.length} {customer.orders.length === 1 ? 'order' : 'orders'}</span></div>
      {customer.orders.length === 0 ? <div className="border border-border-soft bg-white px-6 py-12 text-center"><h3 className="font-serif text-xl text-earth-900">No orders yet</h3><p className="mt-2 text-sm text-foreground-muted">Orders placed by this customer will appear here.</p></div> :
        <ul className="space-y-3">{customer.orders.map((order) => <li key={order.id} className="border border-border-soft bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Order {formatOrderReference(order.id)}</p><p className="mt-1 text-sm text-earth-700">{formatOrderDate(order.createdAt)}</p></div>
            <p className="shrink-0 font-serif text-xl font-semibold text-earth-900">{formatPrice(order.total)}</p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border-soft pt-3">
            <OrderStatusBadge status={order.status} />
            <span className="text-xs text-foreground-muted">{order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : order.paymentMethod}</span>
            <span className="text-xs text-foreground-muted">Payment {order.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}</span>
            <span className="text-xs text-foreground-muted">{order.itemCount} {order.itemCount === 1 ? 'item type' : 'item types'}</span>
          </div>
          <Link href={`/admin/orders/${order.id}`} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-botanical-800 hover:underline">Open order details</Link>
        </li>)}</ul>
      }
    </section>
  </section>;
}

function CustomerLoading() { return <section className="mx-auto max-w-8xl" aria-label="Loading customer"><div className="h-28 animate-pulse border-b border-border-soft bg-cream-100" /><div className="mt-6 grid gap-5 lg:grid-cols-2"><div className="h-64 animate-pulse bg-cream-100" /><div className="h-64 animate-pulse bg-cream-100" /></div><div className="mt-6 h-72 animate-pulse bg-cream-100" /></section>; }
function Unavailable() { return <section className="mx-auto max-w-3xl border border-border-soft bg-white px-6 py-12 text-center"><h1 className="font-serif text-2xl text-earth-900">Customer details couldn’t be loaded</h1><p className="mt-2 text-sm text-foreground-muted">Please refresh and try again.</p><Link href="/admin/customers" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-botanical-800 hover:underline">Return to Customers</Link></section>; }
