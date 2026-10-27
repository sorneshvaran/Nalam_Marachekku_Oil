import Image from "next/image";
import Link from "next/link";
import { formatPrice, formatUnitValue } from "@/lib/format";
import type { ProductWithRelations } from "@/lib/products";

export default function ProductCard({ product }: { product: ProductWithRelations }) {
  const firstImage = product.images[0];
  const availableVariants = product.variants.filter(
    (variant) => variant.stockStatus !== "OUT_OF_STOCK",
  );
  const lowestPriceVariant = availableVariants.reduce<
    ProductWithRelations["variants"][number] | null
  >((lowest, variant) =>
    !lowest || Number(variant.price) < Number(lowest.price) ? variant : lowest,
  null);

  return (
    <article className="group h-full overflow-hidden rounded-xl border border-border-soft bg-white transition-colors hover:border-botanical-300">
      <Link href={"/products/" + product.slug} className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botanical-700">
        <div className="relative aspect-[4/3] overflow-hidden bg-cream-100">
          {firstImage ? (
            <Image
              src={firstImage.url}
              alt={firstImage.altText || product.name}
              fill
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1535px) 33vw, 30rem"
              className="object-contain p-2 sm:p-3"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-cream-100 to-botanical-100">
              <span className="font-serif text-2xl text-botanical-800">{product.category.name}</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-botanical-700">{product.category.name}</p>
          <h3 className="mt-2 min-h-14 font-serif text-xl leading-7 text-earth-900 group-hover:text-botanical-800">{product.name}</h3>
          {product.variants.length ? (
            <p className="mt-2 min-h-10 text-sm leading-5 text-foreground-muted">
              {product.variants.slice(0, 3).map((variant) => formatUnitValue(variant.value, variant.unit)).join(" · ")}
              {product.variants.length > 3 ? " · more sizes" : ""}
            </p>
          ) : (
            <p className="mt-2 min-h-10 text-sm leading-5 text-foreground-muted">Product details available soon</p>
          )}
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border-soft pt-4">
            {lowestPriceVariant ? (
              <p className="text-sm font-semibold text-earth-900">From {formatPrice(lowestPriceVariant.price)}</p>
            ) : (
              <p className="text-sm text-foreground-muted">Currently unavailable</p>
            )}
            <span className="text-sm font-semibold text-botanical-700">View product <span aria-hidden="true">→</span></span>
          </div>
        </div>
      </Link>
    </article>
  );
}
