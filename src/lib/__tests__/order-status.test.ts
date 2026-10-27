import { describe, expect, it } from 'vitest';

import { getAllowedOrderStatuses } from '@/lib/admin-orders';
import type { OrderStatus } from '@/lib/orders';

const ALL_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

describe('order status transitions', () => {
  it('allows the documented forward transitions', () => {
    expect(getAllowedOrderStatuses('PENDING')).toEqual(['CONFIRMED', 'CANCELLED']);
    expect(getAllowedOrderStatuses('CONFIRMED')).toEqual(['PROCESSING', 'CANCELLED']);
    expect(getAllowedOrderStatuses('PROCESSING')).toEqual(['SHIPPED', 'CANCELLED']);
    expect(getAllowedOrderStatuses('SHIPPED')).toEqual(['DELIVERED']);
  });

  it('treats delivered and cancelled as terminal states', () => {
    expect(getAllowedOrderStatuses('DELIVERED')).toEqual([]);
    expect(getAllowedOrderStatuses('CANCELLED')).toEqual([]);
  });

  it('never allows skipping a fulfilment step', () => {
    expect(getAllowedOrderStatuses('PENDING')).not.toContain('PROCESSING');
    expect(getAllowedOrderStatuses('PENDING')).not.toContain('SHIPPED');
    expect(getAllowedOrderStatuses('PENDING')).not.toContain('DELIVERED');
    expect(getAllowedOrderStatuses('CONFIRMED')).not.toContain('SHIPPED');
    expect(getAllowedOrderStatuses('CONFIRMED')).not.toContain('DELIVERED');
    expect(getAllowedOrderStatuses('PROCESSING')).not.toContain('DELIVERED');
  });

  it('never allows cancelling once an order has shipped', () => {
    expect(getAllowedOrderStatuses('SHIPPED')).not.toContain('CANCELLED');
    expect(getAllowedOrderStatuses('DELIVERED')).not.toContain('CANCELLED');
  });

  it('never allows reopening a terminal order', () => {
    expect(getAllowedOrderStatuses('DELIVERED')).not.toContain('PENDING');
    expect(getAllowedOrderStatuses('CANCELLED')).not.toContain('PENDING');
    expect(getAllowedOrderStatuses('CANCELLED')).not.toContain('CONFIRMED');
  });

  it('never allows a transition to the same status', () => {
    for (const status of ALL_STATUSES) {
      expect(getAllowedOrderStatuses(status)).not.toContain(status);
    }
  });

  it('defines transitions for every status', () => {
    for (const status of ALL_STATUSES) {
      expect(Array.isArray(getAllowedOrderStatuses(status))).toBe(true);
    }
  });

  it('returns a fresh array that cannot mutate the transition table', () => {
    const transitions = getAllowedOrderStatuses('PENDING');
    transitions.push('DELIVERED');

    expect(getAllowedOrderStatuses('PENDING')).toEqual(['CONFIRMED', 'CANCELLED']);
  });
});
