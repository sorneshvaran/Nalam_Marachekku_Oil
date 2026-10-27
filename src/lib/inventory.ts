export type StockStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export function deriveStockStatus(stockQuantity: number, lowStockThreshold: number): StockStatus {
  if (stockQuantity <= 0) return 'OUT_OF_STOCK';
  if (stockQuantity <= lowStockThreshold) return 'LOW_STOCK';
  return 'AVAILABLE';
}
