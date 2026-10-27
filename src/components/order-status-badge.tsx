import type { OrderStatus } from '@/lib/orders';

const labels: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className="inline-flex min-h-7 items-center border border-botanical-200 bg-botanical-50 px-2.5 py-1 text-xs font-semibold text-botanical-800">
      {labels[status]}
    </span>
  );
}