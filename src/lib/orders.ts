import 'server-only';

import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID';

export type CustomerOrderListItem = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: 'CASH_ON_DELIVERY';
  paymentStatus: PaymentStatus;
  total: string;
  items: Array<{
    productName: string;
    variantName: string;
    quantity: number;
  }>;
};

export type CustomerOrderDetails = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: 'CASH_ON_DELIVERY';
  paymentStatus: PaymentStatus;
  subtotal: string;
  shippingAmount: string;
  total: string;
  shippingName: string;
  shippingPhone: string;
  shippingAddressLine1: string;
  shippingAddressLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  shippingCountry: string;
  items: Array<{
    id: string;
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
};

export class OrderDataError extends Error {
  constructor(readonly code: 'UNAUTHENTICATED' | 'FORBIDDEN') {
    super(code);
    this.name = 'OrderDataError';
  }
}

async function requireCustomerId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new OrderDataError('UNAUTHENTICATED');
  if (user.role !== 'CUSTOMER') throw new OrderDataError('FORBIDDEN');
  return user.id;
}

async function getCustomerOrders(): Promise<CustomerOrderListItem[]> {
  const userId = await requireCustomerId();
  return db.orm.public.Order
    .where({ userId })
    .select('id', 'createdAt', 'status', 'paymentMethod', 'paymentStatus', 'total')
    .include('items', (items) => items.select('productName', 'variantName', 'quantity'))
    .orderBy((order) => order.createdAt.desc())
    .all();
}

async function getCustomerOrderById(orderId: string): Promise<CustomerOrderDetails | null> {
  const userId = await requireCustomerId();
  return db.orm.public.Order
    .where({ id: orderId, userId })
    .select(
      'id',
      'createdAt',
      'status',
      'paymentMethod',
      'paymentStatus',
      'subtotal',
      'shippingAmount',
      'total',
      'shippingName',
      'shippingPhone',
      'shippingAddressLine1',
      'shippingAddressLine2',
      'shippingCity',
      'shippingState',
      'shippingPostalCode',
      'shippingCountry',
    )
    .include('items', (items) =>
      items.select('id', 'productName', 'variantName', 'quantity', 'unitPrice', 'totalPrice'),
    )
    .first();
}

export const ordersData = {
  getCustomerOrders,
  getCustomerOrderById,
};