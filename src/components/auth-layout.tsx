import type { ReactNode } from 'react';

import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { productsData } from '@/lib/products';

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const categories = await productsData.getCategoriesWithProductCounts();

  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter categories={categories} />
    </>
  );
}
