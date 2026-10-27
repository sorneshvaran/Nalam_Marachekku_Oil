'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminDashboardNavigation() {
  const pathname = usePathname();
  const isDashboard = pathname === '/admin';

  return (
    <nav aria-label="Admin navigation" className="flex items-center">
      <Link
        href="/admin"
        aria-current={isDashboard ? 'page' : undefined}
        className={isDashboard
          ? 'rounded-md bg-botanical-700 px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-botanical-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botanical-700 sm:px-3 sm:text-sm'
          : 'rounded-md px-2.5 py-2 text-xs font-semibold text-botanical-800 transition hover:bg-botanical-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botanical-700 sm:px-3 sm:text-sm'}
      >
        Dashboard
      </Link>
    </nav>
  );
}
