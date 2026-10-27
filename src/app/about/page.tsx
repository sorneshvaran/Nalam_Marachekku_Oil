import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { productsData } from "@/lib/products";

export const metadata: Metadata = {
  title: "About Nalam | Traditional Foods and Wood-Pressed Oils",
  description:
    "Learn about Nalam and its traditional wood-press method for extracting oils.",
};

export default async function AboutPage() {
  const categories = await productsData.getCategoriesWithProductCounts();

  return (
    <main className="flex-1">
      <SiteHeader />

      <section className="bg-cream-100">
        <div className="mx-auto grid max-w-8xl items-center gap-10 px-6 py-12 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-20">
          <div>
            <nav aria-label="Breadcrumb" className="mb-7 text-sm text-earth-600">
              <Link className="transition hover:text-botanical-700" href="/">Home</Link>
              <span className="px-2" aria-hidden="true">/</span>
              <span className="text-earth-900">About Nalam</span>
            </nav>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-700">
              Nalam · since 2017
            </p>
            <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-tight text-earth-900 sm:text-5xl lg:text-6xl">
              Traditional foods and oils, shaped by our method
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-foreground-muted sm:text-lg">
              Nalam has followed its traditional wood-press approach since 2017.
              Today, our catalogue brings together wood-pressed oils and
              traditional food products.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center rounded-md bg-botanical-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-botanical-800"
                href="/products"
              >
                Browse products
                <span className="ml-2" aria-hidden="true">→</span>
              </Link>
              <Link
                className="inline-flex items-center rounded-md border border-border-strong bg-cream-50 px-6 py-3 text-sm font-semibold text-earth-900 transition hover:border-botanical-600"
                href="#our-method"
              >
                Our method
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -left-5 top-8 h-28 w-28 rounded-full bg-cream-300/70 blur-2xl" />
            <div className="absolute -bottom-5 right-7 h-32 w-32 rounded-full bg-botanical-100 blur-2xl" />
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

      <section id="our-method" className="scroll-mt-24 bg-cream-50 py-16 sm:py-20">
        <div className="mx-auto grid max-w-8xl gap-8 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-700">Since 2017</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-earth-900 sm:text-4xl">
              Wood-press extraction for our oils
            </h2>
          </div>
          <div className="max-w-2xl">
            <p className="text-base leading-7 text-foreground-muted">
              Nalam continues its traditional wood-press approach, alongside a
              range of traditional foods. We keep the current product options,
              sizes, prices, and availability visible in the catalogue so
              customers can review the details before choosing.
            </p>
            <Link
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-botanical-700 underline decoration-botanical-300 underline-offset-4 transition hover:text-botanical-900"
              href="/products"
            >
              Explore the range
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-8xl px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-700">
                The catalogue
              </p>
              <h2 className="mt-2 font-serif text-3xl text-earth-900 sm:text-4xl">
                Explore Nalam products
              </h2>
            </div>
            <Link
              className="text-sm font-semibold text-botanical-700 underline decoration-botanical-300 underline-offset-4 transition hover:text-botanical-900"
              href="/products"
            >
              View all products
            </Link>
          </div>

          {categories.length === 0 ? (
            <p className="rounded-xl border border-border-soft bg-cream-50 px-6 py-8 text-sm text-foreground-muted">
              Product categories will appear here when they are available.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={"/products?category=" + encodeURIComponent(category.slug)}
                  className="group flex min-h-40 flex-col justify-between rounded-xl border border-border-soft bg-cream-50 p-6 transition hover:-translate-y-1 hover:border-botanical-300 hover:shadow-md"
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
      </section>

      <section className="bg-cream-100 py-14 sm:py-16">
        <div className="mx-auto flex max-w-8xl flex-col items-start justify-between gap-5 px-6 sm:flex-row sm:items-center lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-700">
              Nalam
            </p>
            <h2 className="mt-2 font-serif text-2xl text-earth-900 sm:text-3xl">
              See the products currently in our catalogue
            </h2>
          </div>
          <Link
            className="inline-flex shrink-0 items-center rounded-md bg-botanical-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-botanical-800"
            href="/products"
          >
            Shop products
            <span className="ml-2" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <SiteFooter categories={categories} />
    </main>
  );
}
