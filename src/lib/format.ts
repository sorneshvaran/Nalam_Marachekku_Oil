export type VariantUnit = 'ML' | 'L' | 'G' | 'KG';

const UNIT_LABELS: Record<VariantUnit, string> = {
  ML: 'ml',
  L: 'L',
  G: 'g',
  KG: 'kg',
};

export function formatUnitValue(value: string, unit: VariantUnit): string {
  return `${value} ${UNIT_LABELS[unit]}`;
}

export function formatPrice(price: string): string {
  return `₹${price}`;
}
export function formatOrderReference(orderId: string): string {
  return orderId.replaceAll('-', '').slice(0, 10).toUpperCase();
}

export function formatOrderDate(createdAt: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(createdAt));
}