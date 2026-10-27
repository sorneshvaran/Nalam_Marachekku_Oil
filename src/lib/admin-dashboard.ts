import 'server-only';

import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import type { OrderStatus, PaymentStatus } from '@/lib/orders';
import type { StockStatus } from '@/lib/inventory';

export type AdminDashboardOrder = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  paymentMethod: 'CASH_ON_DELIVERY';
  paymentStatus: PaymentStatus;
  total: string;
  customerName: string | null;
  customerEmail: string;
};

export type AdminDashboardCustomer = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  orderCount: number;
};

export type AdminDashboardInventoryAlert = {
  variantId: string;
  productName: string;
  sku: string;
  value: string;
  unit: 'ML' | 'L' | 'G' | 'KG';
  stockQuantity: number;
  lowStockThreshold: number;
  stockStatus: StockStatus;
};

export type AdminDashboardData = {
  customers: number;
  products: number;
  activeProducts: number;
  inactiveProducts: number;
  categories: number;
  orders: number;
  orderValue: string;
  ordersNeedingAttention: Record<'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED', number>;
  lowStockCount: number;
  outOfStockCount: number;
  recentOrders: AdminDashboardOrder[];
  recentCustomers: AdminDashboardCustomer[];
  inventoryAlerts: AdminDashboardInventoryAlert[];
  unavailableSections: Array<'orders' | 'customers' | 'inventory'>;
};

export class AdminDashboardDataError extends Error {
  constructor(readonly code: 'UNAVAILABLE') {
    super(code);
    this.name = 'AdminDashboardDataError';
  }
}

async function getAdminDashboard(): Promise<AdminDashboardData> {
  // Authorize before any dashboard query is started.
  await requireAdmin();

  try {
    const [
      customerTotals,
      productTotals,
      activeProductTotals,
      categoryTotals,
      orderTotals,
      attentionGroups,
      lowStockTotals,
      outOfStockTotals,
    ] = await Promise.all([
      db.orm.public.User.where({ role: 'CUSTOMER' }).aggregate((aggregate) => ({ total: aggregate.count() })),
      db.orm.public.Product.aggregate((aggregate) => ({ total: aggregate.count() })),
      db.orm.public.Product.where({ active: true }).aggregate((aggregate) => ({ total: aggregate.count() })),
      db.orm.public.Category.aggregate((aggregate) => ({ total: aggregate.count() })),
      db.orm.public.Order.aggregate((aggregate) => ({ total: aggregate.count(), value: aggregate.sum('total') })),
      db.orm.public.Order.groupBy('status').aggregate((aggregate) => ({ total: aggregate.count() })),
      db.orm.public.ProductVariant.where({ stockStatus: 'LOW_STOCK' }).aggregate((aggregate) => ({ total: aggregate.count() })),
      db.orm.public.ProductVariant.where({ stockStatus: 'OUT_OF_STOCK' }).aggregate((aggregate) => ({ total: aggregate.count() })),
    ]);

    const attentionCounts: AdminDashboardData['ordersNeedingAttention'] = {
      PENDING: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
    };
    for (const group of attentionGroups) {
      if (group.status in attentionCounts) {
        attentionCounts[group.status as keyof typeof attentionCounts] = group.total;
      }
    }

    const [ordersResult, customersResult, inventoryResult] = await Promise.all([
      loadOptionalSection('orders', () => db.orm.public.Order
        .select('id', 'createdAt', 'status', 'paymentMethod', 'paymentStatus', 'total')
        .include('user', (user) => user.select('name', 'email'))
        .orderBy((order) => order.createdAt.desc())
        .limit(5)
        .all()
        .then((orders) => orders.flatMap((order) => order.user ? [{
          id: order.id,
          createdAt: order.createdAt,
          status: order.status,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          total: order.total,
          customerName: order.user.name,
          customerEmail: order.user.email,
        }] : [])), []),
      loadOptionalSection('customers', () => db.orm.public.User
        .where({ role: 'CUSTOMER' })
        .select('id', 'name', 'email', 'createdAt')
        .include('orders', (orders) => orders.count())
        .orderBy((customer) => customer.createdAt.desc())
        .limit(5)
        .all()
        .then((customers) => customers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          createdAt: customer.createdAt,
          orderCount: customer.orders,
        }))), []),
      loadOptionalSection('inventory', async () => {
        const [lowStock, outOfStock] = await Promise.all([
          db.orm.public.ProductVariant.where({ stockStatus: 'LOW_STOCK' })
            .select('id', 'sku', 'value', 'unit', 'stockQuantity', 'lowStockThreshold', 'stockStatus')
            .include('product', (product) => product.select('name'))
            .orderBy((variant) => variant.stockQuantity.asc())
            .limit(8)
            .all(),
          db.orm.public.ProductVariant.where({ stockStatus: 'OUT_OF_STOCK' })
            .select('id', 'sku', 'value', 'unit', 'stockQuantity', 'lowStockThreshold', 'stockStatus')
            .include('product', (product) => product.select('name'))
            .orderBy((variant) => variant.stockQuantity.asc())
            .limit(8)
            .all(),
        ]);
        return [...lowStock, ...outOfStock]
          .filter((variant) => variant.product)
          .sort((left, right) => left.stockQuantity - right.stockQuantity)
          .slice(0, 8)
          .map((variant) => ({
            variantId: variant.id,
            productName: variant.product!.name,
            sku: variant.sku,
            value: variant.value,
            unit: variant.unit,
            stockQuantity: variant.stockQuantity,
            lowStockThreshold: variant.lowStockThreshold,
            stockStatus: variant.stockStatus,
          }));
      }, []),
    ]);

    return {
      customers: customerTotals.total,
      products: productTotals.total,
      activeProducts: activeProductTotals.total,
      inactiveProducts: productTotals.total - activeProductTotals.total,
      categories: categoryTotals.total,
      orders: orderTotals.total,
      orderValue: orderTotals.value ?? '0',
      ordersNeedingAttention: attentionCounts,
      lowStockCount: lowStockTotals.total,
      outOfStockCount: outOfStockTotals.total,
      recentOrders: ordersResult.data,
      recentCustomers: customersResult.data,
      inventoryAlerts: inventoryResult.data,
      unavailableSections: [
        ...(ordersResult.unavailable ? ['orders' as const] : []),
        ...(customersResult.unavailable ? ['customers' as const] : []),
        ...(inventoryResult.unavailable ? ['inventory' as const] : []),
      ],
    };
  } catch (error) {
    if (error instanceof AdminDashboardDataError) throw error;
    console.error('Admin dashboard summary retrieval failed.', { errorName: error instanceof Error ? error.name : typeof error });
    throw new AdminDashboardDataError('UNAVAILABLE');
  }
}

async function loadOptionalSection<T>(
  section: 'orders' | 'customers' | 'inventory',
  query: () => PromiseLike<T>,
  fallback: T,
): Promise<{ data: T; unavailable: boolean }> {
  try {
    return { data: await query(), unavailable: false };
  } catch (error) {
    console.error(`Admin dashboard ${section} section retrieval failed.`, {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return { data: fallback, unavailable: true };
  }
}

export const adminDashboardData = { getAdminDashboard };
