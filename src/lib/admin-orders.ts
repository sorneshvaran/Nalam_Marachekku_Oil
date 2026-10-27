import 'server-only';

import { requireAdmin } from '@/lib/auth';
import { orderStatusSchema } from '@/lib/admin-order-validation';
import { orderIdSchema } from '@/lib/checkout-validation';
import type { OrderStatus, PaymentStatus } from '@/lib/orders';
import { db } from '@/lib/db';

export type AdminOrderListItem = {
  id: string;
  createdAt: string;
  customerName: string | null;
  customerEmail: string;
  status: OrderStatus;
  paymentMethod: 'CASH_ON_DELIVERY';
  paymentStatus: PaymentStatus;
  total: string;
  itemCount: number;
};

export type AdminOrderDetails = {
  id: string;
  customerId: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: 'CASH_ON_DELIVERY';
  paymentStatus: PaymentStatus;
  subtotal: string;
  shippingAmount: string;
  total: string;
  customerName: string | null;
  customerEmail: string;
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

export class AdminOrderDataError extends Error {
  constructor(readonly code: 'INVALID_ID' | 'NOT_FOUND' | 'INVALID_TRANSITION' | 'STATUS_CHANGED' | 'UNAVAILABLE') {
    super(code);
    this.name = 'AdminOrderDataError';
  }
}

const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function getAllowedOrderStatuses(status: OrderStatus): OrderStatus[] {
  return [...allowedTransitions[status]];
}

async function getAdminOrders(): Promise<AdminOrderListItem[]> {
  await requireAdmin();

  try {
    const orders = await db.orm.public.Order
      .select('id', 'createdAt', 'status', 'paymentMethod', 'paymentStatus', 'total')
      .include('user', (user) => user.select('name', 'email'))
      .include('items', (items) => items.select('id'))
      .orderBy((order) => order.createdAt.desc())
      .all();

    return orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAt,
      customerName: order.user?.name ?? null,
      customerEmail: order.user?.email ?? 'Unavailable',
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      total: order.total,
      itemCount: order.items.length,
    }));
  } catch (error) {
    console.error('Admin order list retrieval failed.', {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    throw new AdminOrderDataError('UNAVAILABLE');
  }
}

async function getAdminOrderById(orderId: string): Promise<AdminOrderDetails | null> {
  await requireAdmin();
  if (!orderIdSchema.safeParse(orderId).success) throw new AdminOrderDataError('INVALID_ID');

  try {
    const order = await db.orm.public.Order
      .where({ id: orderId })
      .select(
        'id',
        'userId',
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
      .include('user', (user) => user.select('name', 'email'))
      .include('items', (items) =>
        items.select('id', 'productName', 'variantName', 'quantity', 'unitPrice', 'totalPrice'),
      )
      .first();

    if (!order) return null;

    return {
      id: order.id,
      createdAt: order.createdAt,
      customerId: order.userId,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      shippingAmount: order.shippingAmount,
      total: order.total,
      customerName: order.user?.name ?? null,
      customerEmail: order.user?.email ?? 'Unavailable',
      shippingName: order.shippingName,
      shippingPhone: order.shippingPhone,
      shippingAddressLine1: order.shippingAddressLine1,
      shippingAddressLine2: order.shippingAddressLine2,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      shippingPostalCode: order.shippingPostalCode,
      shippingCountry: order.shippingCountry,
      items: order.items,
    };
  } catch (error) {
    console.error('Admin order detail retrieval failed.', {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    throw new AdminOrderDataError('UNAVAILABLE');
  }
}

async function updateAdminOrderStatus(orderId: string, requestedStatus: string): Promise<OrderStatus> {
  await requireAdmin();
  if (!orderIdSchema.safeParse(orderId).success) throw new AdminOrderDataError('INVALID_ID');
  const parsedStatus = orderStatusSchema.safeParse(requestedStatus);
  if (!parsedStatus.success) throw new AdminOrderDataError('INVALID_TRANSITION');

  let current: { status: OrderStatus } | null;
  try {
    current = await db.orm.public.Order
      .where({ id: orderId })
      .select('status')
      .first();
  } catch (error) {
    console.error('Admin order status lookup failed.', {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    throw new AdminOrderDataError('UNAVAILABLE');
  }

  if (!current) throw new AdminOrderDataError('NOT_FOUND');
  if (!allowedTransitions[current.status].includes(parsedStatus.data)) {
    throw new AdminOrderDataError('INVALID_TRANSITION');
  }

  try {
    const updated = await db.orm.public.Order
      .where({ id: orderId, status: current.status })
      .select('id', 'status')
      .update({ status: parsedStatus.data });

    if (!updated) throw new AdminOrderDataError('STATUS_CHANGED');
    return updated.status;
  } catch (error) {
    if (error instanceof AdminOrderDataError) throw error;
    console.error('Admin order status update failed.', {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    throw new AdminOrderDataError('UNAVAILABLE');
  }
}

export const adminOrdersData = {
  getAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
};