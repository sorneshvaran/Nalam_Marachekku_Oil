import Link from "next/link";
import { Suspense } from "react";
import ProductCard from "@/components/product-card";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { formatUnitValue } from "@/lib/format";
import { productsData } from "@/lib/products";

type ProductsSearchParams = {
  category?: string;
  size?: string;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductsSearchParams>;
}) {
  return (
    <main className="flex-1">
      <Suspense><ProductsContent searchParams={searchParams} /></Suspense>
    </main>
  );
}

async function ProductsContent({
  searchParams,
}: {
  searchParams: Promise<ProductsSearchParams>;
}) {
  const { category, size } = await searchParams;
  const [categories, products] = await Promise.all([
    productsData.getCategoriesWithProductCounts(),
    category
      ? productsData.getProductsByCategory(category)
      : productsData.getActiveProductsWithVariantsAndImages(),
  ]);
  const sizeOptions = products
    .flatMap((product) =>
      product.variants.map((variant) => ({
        value: variant.value + ":" + variant.unit,
        label: formatUnitValue(variant.value, variant.unit),
      })),
    )
    .reduce<Array<{ value: string; label: string }>>((unique, option) => {
      if (!unique.some((item) => item.value === option.value)) unique.push(option);
      return unique;
    }, []);
  const visibleProducts = size
    ? products.filter((product) =>
        product.variants.some((variant) => variant.value + ":" + variant.unit === size),
      )
    : products;
  const activeCategory = categories.find((item) => item.slug === category);

  return (
    <>
      <SiteHeader />
      <section className="bg-cream-100">
        <div className="mx-auto max-w-8xl px-6 py-12 sm:py-16 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-earth-600">
            <Link className="hover:text-botanical-700" href="/">Home</Link>
            <span className="px-2" aria-hidden="true">/</span><span className="text-earth-900">Shop</span>
          </nav>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-700">Nalam collection</p>
          <h1 className="mt-2 font-serif text-4xl text-earth-900 sm:text-5xl">{activeCategory?.name || "Our collection"}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-foreground-muted">
            Browse current Nalam products and check each product page for available sizes and prices.
          </p>
        </div>
      </section>

      <section className="bg-cream-50 py-10 sm:py-14">
        <div className="mx-auto grid max-w-8xl gap-8 px-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:px-8">
          <aside className="rounded-xl border border-border-soft bg-white p-5 lg:h-fit">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-xl text-earth-900">Filter by</h2>
              {(category || size) && <Link className="text-xs font-semibold text-botanical-700 underline underline-offset-4" href="/products">Clear all</Link>}
            </div>
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-earth-700">Category</h3>
              <ul className="mt-3 space-y-2">
                <li><FilterLink href="/products" active={!category} label="All products" /></li>
                {categories.map((item) => (
                  <li key={item.id}>
                    <FilterLink
                      href={"/products?category=" + encodeURIComponent(item.slug)}
                      active={category === item.slug}
                      label={item.name}
                      count={item.productCount}
                    />
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-7 border-t border-border-soft pt-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-earth-700">Filter by size</h3>
              {sizeOptions.length === 0 ? (
                <p className="mt-3 text-sm text-foreground-muted">Sizes will appear with available products.</p>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:items-start">
                  <li><SizeLink href={productsHref(category)} active={!size} label="All sizes" /></li>
                  {sizeOptions.map((option) => (
                    <li key={option.value}>
                      <SizeLink href={productsHref(category, option.value)} active={size === option.value} label={option.label} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          <div>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border-soft pb-4">
              <div>
                <h2 className="font-serif text-2xl text-earth-900">{activeCategory?.name || "All products"}</h2>
                <p className="mt-1 text-sm text-foreground-muted">
                  {visibleProducts.length} {visibleProducts.length === 1 ? "product" : "products"}
                  {size ? " · " + (sizeOptions.find((option) => option.value === size)?.label || "selected size") : ""}
                </p>
              </div>
              {(category || size) && <Link className="text-sm font-semibold text-botanical-700 underline underline-offset-4" href={productsHref(category)}>Reset filters</Link>}
            </div>

            {visibleProducts.length === 0 ? (
              <div className="rounded-xl border border-border-soft bg-white px-6 py-14 text-center">
                <h3 className="font-serif text-2xl text-earth-900">{size ? "No products match this size." : "No products to show yet."}</h3>
                <p className="mt-2 text-sm text-foreground-muted">{size ? "Choose another available size or clear the filter." : "Please check back for available products."}</p>
                {(category || size) && <Link className="mt-5 inline-flex rounded-md bg-botanical-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-botanical-800" href="/products">Clear filters</Link>}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visibleProducts.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            )}
          </div>
        </div>
      </section>
      <SiteFooter categories={categories} />
    </>
  );
}

function FilterLink({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count?: number;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={"flex items-center justify-between rounded-md px-3 py-2 text-sm transition " + (active ? "bg-cream-100 font-semibold text-botanical-800" : "text-earth-700 hover:bg-cream-50")}
      href={href}
    >
      <span>{label}</span>
      {count !== undefined && <span className="text-xs text-foreground-muted">{count}</span>}
    </Link>
  );
}

function SizeLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      aria-current={active ? "true" : undefined}
      className={"inline-flex rounded-full border px-3 py-1.5 text-sm transition " + (active ? "border-botanical-600 bg-botanical-50 text-botanical-800" : "border-border-soft text-earth-700 hover:border-botanical-300")}
      href={href}
    >
      {label}
    </Link>
  );
}

function productsHref(category?: string, size?: string) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (size) params.set("size", size);
  const query = params.toString();
  return query ? "/products?" + query : "/products";
}

