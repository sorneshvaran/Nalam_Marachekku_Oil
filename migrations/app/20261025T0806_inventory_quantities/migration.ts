#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/573f980f25478261cf1996fa06c1dae888a3fa6549717c98d8d736823635d666/contract';
import startContract from '../../snapshots/573f980f25478261cf1996fa06c1dae888a3fa6549717c98d8d736823635d666/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/86b4200dbb335bff9b013fab43e8c3bbd3094c637a423b1008734a7286afea8e/contract';
import endContract from '../../snapshots/86b4200dbb335bff9b013fab43e8c3bbd3094c637a423b1008734a7286afea8e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, sql } from '@prisma/orm-postgres/migration';
import postgres from '@prisma/orm-postgres/runtime';

const { sql: query, contract } = postgres<End>({ contractJson: endContract });

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'ProductVariant',
        column: col('lowStockThreshold', 'int4', {
          notNull: true,
          default: lit(5),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'ProductVariant',
        column: col('stockQuantity', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.setDefault({
        schema: 'public',
        table: 'ProductVariant',
        column: col('stockStatus', 'text', {
          default: lit('OUT_OF_STOCK'),
          codecRef: { codecId: 'pg/text@1' },
        }),
        operationClass: 'widening',
      }),
      this.dataTransform(contract, 'normalize-initial-inventory-status', {
        check: () => query.public.ProductVariant.select('id')
          .where((fields, fns) => fns.ne(fields.stockStatus, 'OUT_OF_STOCK'))
          .limit(1),
        run: () => query.public.ProductVariant.update({ stockStatus: 'OUT_OF_STOCK' }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'ProductVariant',
        constraint: 'product_variant_low_stock_threshold_nonnegative_dbee7e8b',
        expression: sql`"lowStockThreshold" >= 0`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'ProductVariant',
        constraint: 'product_variant_stock_quantity_nonnegative_63b5ecea',
        expression: sql`"stockQuantity" >= 0`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
