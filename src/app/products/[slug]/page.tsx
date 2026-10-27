import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import AddToCartForm from "@/components/add-to-cart-form";
import { getCurrentUser } from "@/lib/auth";
import { productsData } from "@/lib/products";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <main className="flex-1">
      <Suspense>
        <ProductDetailContent params={params} />
      </Suspense>
    </main>
  );
}

async function ProductDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, categories, user] = await Promise.all([
    productsData.getProductBySlug(slug),
    productsData.getCategoriesWithProductCounts(),
    getCurrentUser(),
  ]);

  if (!product) notFound();

  const leadImage = product.images[0];

  return (
    <>
      <SiteHeader />

      <section className="bg-cream-50">
        <div className="mx-auto max-w-8xl px-6 py-8 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-sm text-earth-600">
            <Link className="transition hover:text-botanical-700" href="/">Home</Link>
            <span className="px-2" aria-hidden="true">/</span>
            <Link className="transition hover:text-botanical-700" href="/products">Products</Link>
            <span className="px-2" aria-hidden="true">/</span>
            <Link
              className="transition hover:text-botanical-700"
              href={"/products?category=" + encodeURIComponent(product.category.slug)}
            >
              {product.category.name}
            </Link>
            <span className="px-2" aria-hidden="true">/</span>
            <span className="text-earth-900">{product.name}</span>
          </nav>
        </div>
      </section>

      <section className="bg-cream-50 pb-14 sm:pb-20">
        <div className="mx-auto grid min-w-0 max-w-8xl grid-cols-1 gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:px-8">
          <div className="min-w-0 space-y-4">
            {leadImage ? (
              <div className="relative aspect-[4/3] w-full min-w-0 overflow-hidden rounded-2xl border border-border-soft bg-cream-100">
                <Image
                  src={leadImage.url}
                  alt={leadImage.altText || product.name}
                  fill
                  sizes="(max-width: 1023px) 100vw, (max-width: 1535px) calc(50vw - 4rem), 44rem"
                  className="object-contain p-2 sm:p-4"
                  preload
                />
              </div>
            ) : (
              <div className="flex aspect-[4/3] min-w-0 items-center justify-center rounded-2xl border border-border-soft bg-gradient-to-br from-cream-100 to-botanical-100">
                <span className="font-serif text-3xl text-botanical-800">{product.category.name}</span>
              </div>
            )}

            {product.images.length > 1 && (
              <div className="grid min-w-0 grid-cols-3 gap-3">
                {product.images.slice(1).map((image) => (
                  <div key={image.id} className="relative aspect-square min-w-0 overflow-hidden rounded-xl border border-border-soft bg-cream-100">
                    <Image
                      src={image.url}
                      alt={image.altText || product.name}
                      fill
                      sizes="(max-width: 1023px) 30vw, (max-width: 1535px) 14vw, 14rem"
                      className="object-contain p-2 sm:p-3"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-700">
              {product.category.name}
            </p>
            <h1 className="mt-3 font-serif text-4xl leading-tight text-earth-900 sm:text-5xl">
              {product.name}
            </h1>
            {product.description && (
              <p className="mt-5 max-w-xl text-base leading-7 text-foreground-muted">
                {product.description}
              </p>
            )}

            <div className="mt-9 border-t border-border-soft pt-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl text-earth-900">Sizes and prices</h2>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Current options from the product catalogue
                  </p>
                </div>
                <Link
                  className="text-sm font-semibold text-botanical-700 underline decoration-botanical-300 underline-offset-4 hover:text-botanical-900"
                  href="/products"
                >
                  Browse all products
                </Link>
              </div>

              {user?.role === "ADMIN" ? (
                <p className="mt-5 text-sm text-foreground-muted">Product purchasing is available to customers.</p>
              ) : (
                <AddToCartForm
                  productSlug={product.slug}
                  variants={product.variants}
                  isCustomer={user?.role === "CUSTOMER"}
                />
              )}
            </div>

            <div className="mt-8 rounded-xl border border-border-soft bg-white p-5">
              <p className="font-serif text-lg text-earth-900">Product information</p>
              <p className="mt-2 text-sm leading-6 text-foreground-muted">
                This page shows the current product details and variant availability recorded in the catalogue.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream-100 py-12 sm:py-16">
        <div className="mx-auto flex max-w-8xl flex-col items-start justify-between gap-4 px-6 sm:flex-row sm:items-center lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-botanical-700">
              Explore Nalam
            </p>
            <h2 className="mt-2 font-serif text-2xl text-earth-900 sm:text-3xl">
              Browse the rest of the catalogue
            </h2>
          </div>
          <Link
            className="inline-flex items-center rounded-md bg-botanical-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-botanical-800"
            href="/products"
          >
            Shop products
            <span className="ml-2" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <SiteFooter categories={categories} />
    </>
  );
}
