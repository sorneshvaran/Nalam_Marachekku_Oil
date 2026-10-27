import 'server-only';

import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import type { OrderStatus, PaymentStatus } from '@/lib/orders';

export type AdminCustomerListItem = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  orderCount: number;
  totalOrderValue: string;
  mostRecentOrderAt: string | null;
};

export type AdminCustomerAddress = {
  id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type AdminCustomerOrder = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: 'CASH_ON_DELIVERY';
  paymentStatus: PaymentStatus;
  total: string;
  itemCount: number;
};

export type AdminCustomerDetails = {
  id: string;
  name: string | null;
  email: string;
  role: 'CUSTOMER';
  createdAt: string;
  updatedAt: string;
  addresses: AdminCustomerAddress[];
  orders: AdminCustomerOrder[];
};

export class AdminCustomerDataError extends Error {
  constructor(readonly code: 'INVALID_ID' | 'UNAVAILABLE') {
    super(code);
    this.name = 'AdminCustomerDataError';
  }
}

function sumDecimalValues(values: readonly string[]): string {
  if (values.length === 0) return '0';
  const parts = values.map((value) => {
    const match = /^(\d+)(?:\.(\d+))?$/.exec(value);
    if (!match) throw new Error('Invalid stored order total.');
    const fraction = match[2] ?? '';
    return { coefficient: BigInt(match[1] + fraction), scale: fraction.length };
  });
  const scale = Math.max(...parts.map((part) => part.scale));
  const coefficient = parts.reduce(
    (total, part) => total + part.coefficient * BigInt(10) ** BigInt(scale - part.scale),
    BigInt(0),
  );
  if (scale === 0) return coefficient.toString();
  const digits = coefficient.toString().padStart(scale + 1, '0');
  const whole = digits.slice(0, -scale);
  const fraction = digits.slice(-scale).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function getAdminCustomers(): Promise<AdminCustomerListItem[]> {
  await requireAdmin();
  try {
    const customers = await db.orm.public.User
      .where({ role: 'CUSTOMER' })
      .select('id', 'name', 'email', 'createdAt')
      .include('orders', (orders) => orders.select('createdAt', 'total').orderBy((order) => order.createdAt.desc()))
      .orderBy((customer) => customer.createdAt.desc())
      .all();

    return customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      createdAt: customer.createdAt,
      orderCount: customer.orders.length,
      totalOrderValue: sumDecimalValues(customer.orders.map((order) => order.total)),
      mostRecentOrderAt: customer.orders[0]?.createdAt ?? null,
    }));
  } catch (error) {
    console.error('Admin customer list retrieval failed.', { errorName: error instanceof Error ? error.name : typeof error });
    throw new AdminCustomerDataError('UNAVAILABLE');
  }
}

async function getAdminCustomerById(customerId: string): Promise<AdminCustomerDetails | null> {
  await requireAdmin();
  if (!isUuid(customerId)) throw new AdminCustomerDataError('INVALID_ID');

  try {
    const customer = await db.orm.public.User
      .where({ id: customerId, role: 'CUSTOMER' })
      .select('id', 'name', 'email', 'role', 'createdAt', 'updatedAt')
      .first();
    if (!customer) return null;

    const [addresses, orders] = await Promise.all([
      db.orm.public.Address
        .where({ userId: customer.id })
        .select('id', 'name', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country')
        .orderBy((address) => address.createdAt.desc())
        .all(),
      db.orm.public.Order
        .where({ userId: customer.id })
        .select('id', 'createdAt', 'status', 'paymentMethod', 'paymentStatus', 'total')
        .include('items', (items) => items.select('id'))
        .orderBy((order) => order.createdAt.desc())
        .all(),
    ]);

    return {
      ...customer,
      role: 'CUSTOMER',
      addresses,
      orders: orders.map((order) => ({
        id: order.id,
        createdAt: order.createdAt,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        total: order.total,
        itemCount: order.items.length,
      })),
    };
  } catch (error) {
    console.error('Admin customer detail retrieval failed.', { errorName: error instanceof Error ? error.name : typeof error });
    throw new AdminCustomerDataError('UNAVAILABLE');
  }
}

export const adminCustomersData = { getAdminCustomers, getAdminCustomerById };
