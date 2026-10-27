#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/28dd2597e3b4447a47e02aeeac4d74bdcb16c92fe48e7c6a219e5ec8ac1b0f5e/contract';
import startContract from '../../snapshots/28dd2597e3b4447a47e02aeeac4d74bdcb16c92fe48e7c6a219e5ec8ac1b0f5e/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/573f980f25478261cf1996fa06c1dae888a3fa6549717c98d8d736823635d666/contract';
import endContract from '../../snapshots/573f980f25478261cf1996fa06c1dae888a3fa6549717c98d8d736823635d666/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('passwordHash', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
