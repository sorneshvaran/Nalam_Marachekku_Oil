import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Server-only modules (and anything that opens a database or Auth.js connection)
// are stubbed so the pure business logic sitting beside them can be unit tested.
const stub = (relativePath: string) => fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^server-only$/, replacement: stub('./test/stubs/server-only.ts') },
      { find: /^@\/lib\/auth$/, replacement: stub('./test/stubs/auth.ts') },
      { find: /^@\/lib\/db$/, replacement: stub('./test/stubs/db.ts') },
      { find: /^@\//, replacement: stub('./src/') },
    ],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
