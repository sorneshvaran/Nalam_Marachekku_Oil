import Image from "next/image";
import Link from "next/link";
import { productsData } from "@/lib/products";
import ProductCard from "@/components/product-card";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import type { CategoryWithCount, ProductWithRelations } from "@/lib/products";

export default async function Home() {
  const [products, categories] = await Promise.all([
    productsData.getActiveProductsWithVariantsAndImages(),
    productsData.getCategoriesWithProductCounts(),
  ]);
  return (
    <main id="top" className="flex-1">
      <SiteHeader />
      <section className="bg-cream-100">
        <div className="mx-auto grid max-w-8xl items-center gap-10 px-6 py-14 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-botanical-700">
              Nalam · a journey since 2017
            </p>
            <h1 className="font-serif text-4xl leading-[1.08] tracking-tight text-earth-900 sm:text-5xl lg:text-6xl">
              Traditional wood-pressed oils and foods
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-foreground-muted sm:text-lg">
              Nalam has followed its traditional wood-press approach since 2017.
              Explore our current oils and traditional food products.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center justify-center rounded-md bg-botanical-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-botanical-800"
                href="/products"
              >
                Explore products
                <ArrowIcon />
              </Link>
              <a
                className="inline-flex items-center justify-center rounded-md border border-border-strong bg-cream-50 px-6 py-3 text-sm font-semibold text-earth-900 transition hover:border-botanical-600"
                href="#our-story"
              >
                Our method
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-border-strong pt-5 text-sm text-earth-700">
              <span>Following our method since 2017</span>
              <span>Sizes and prices listed by product</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -left-4 top-8 h-24 w-24 rounded-full bg-cream-300/70 blur-2xl sm:-left-8" />
            <div className="absolute -bottom-4 right-6 h-32 w-32 rounded-full bg-botanical-100 blur-2xl" />
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-border-soft bg-cream-50 shadow-sm">
              <Image
                src="/images/woodpress-machine.png"
                alt="Wood-press machine used for traditional oil extraction"
                fill
                sizes="(max-width: 1023px) 90vw, 36rem"
                className="object-contain p-3 sm:p-5"
                preload
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border-soft bg-cream-50">
        <div className="mx-auto grid max-w-8xl gap-4 px-6 py-6 sm:grid-cols-3 lg:px-8">
          <div className="text-center sm:text-left">
            <p className="font-serif text-lg text-earth-900">Traditional extraction</p>
            <p className="mt-1 text-sm text-foreground-muted">A wood-press approach Nalam has followed since 2017</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="font-serif text-lg text-earth-900">A considered range</p>
            <p className="mt-1 text-sm text-foreground-muted">Browse oils and traditional food products</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="font-serif text-lg text-earth-900">Product details</p>
            <p className="mt-1 text-sm text-foreground-muted">See available sizes and prices on each product</p>
          </div>
        </div>
      </section>

      <section id="our-story" className="bg-cream-100 py-16 sm:py-20">
        <div className="mx-auto grid max-w-8xl items-center gap-8 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-700">
              The Nalam method
            </p>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-earth-900 sm:text-4xl">
              A traditional approach, followed since 2017
            </h2>
          </div>
          <div className="max-w-2xl">
            <p className="text-base leading-7 text-foreground-muted">
              Nalam’s journey began in 2017 and continues with traditional
              wood-press extraction for oils, alongside a considered range of
              traditional food products. Product pages list current sizes,
              prices, and availability so you can choose from the options shown.
            </p>
            <Link
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-botanical-700 underline decoration-botanical-300 underline-offset-4 transition hover:text-botanical-900"
              href="/products"
            >
              Browse the range
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-cream-50 py-16 sm:py-20">
        <CategorySection categories={categories} />
      </section>

      <section className="bg-white py-16 sm:py-20">
        <FeaturedProducts products={products} />
      </section>

      <SiteFooter categories={categories} />
    </main>
  );
}

function CategorySection({ categories }: { categories: CategoryWithCount[] }) {
  return (
    <div className="mx-auto max-w-8xl px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-700">
            Browse Nalam
          </p>
          <h2 className="mt-2 font-serif text-3xl text-earth-900 sm:text-4xl">
            Explore our collection
          </h2>
        </div>
        <Link className="text-sm font-semibold text-botanical-700 underline decoration-botanical-300 underline-offset-4 hover:text-botanical-900" href="/products">
          View all products
        </Link>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-xl border border-border-soft bg-white px-6 py-8 text-sm text-foreground-muted">
          Product categories will appear here when they are available.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={"/products?category=" + encodeURIComponent(category.slug)}
              className="group flex min-h-40 flex-col justify-between rounded-xl border border-border-soft bg-white p-6 transition hover:-translate-y-1 hover:border-botanical-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-serif text-2xl text-earth-900 transition group-hover:text-botanical-800">
                  {category.name}
                </h3>
                <span aria-hidden="true" className="text-xl text-botanical-700">↗</span>
              </div>
              <p className="mt-6 text-sm text-foreground-muted">
                {category.productCount} {category.productCount === 1 ? "product" : "products"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FeaturedProducts({ products }: { products: ProductWithRelations[] }) {
  const featuredProducts = products.slice(0, 6);

  return (
    <div className="mx-auto max-w-8xl px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-700">
            From the Nalam catalogue
          </p>
          <h2 className="mt-2 font-serif text-3xl text-earth-900 sm:text-4xl">
            Explore Nalam products
          </h2>
        </div>
        <Link className="text-sm font-semibold text-botanical-700 underline decoration-botanical-300 underline-offset-4 hover:text-botanical-900" href="/products">
          See the full range
        </Link>
      </div>

      {featuredProducts.length === 0 ? (
        <div className="rounded-xl border border-border-soft bg-cream-50 px-6 py-12 text-center text-foreground-muted">
          <p className="font-serif text-xl text-earth-900">Our catalogue is being prepared.</p>
          <p className="mt-2 text-sm">Please check back for available products.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}
