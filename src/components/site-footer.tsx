import Link from "next/link";
import type { CategoryWithCount } from "@/lib/products";

export default function SiteFooter({ categories }: { categories: CategoryWithCount[] }) {
  return (
    <footer className="bg-earth-900 py-12 text-cream-100 sm:py-16">
      <div className="mx-auto grid max-w-8xl gap-10 px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Link className="font-serif text-2xl font-semibold tracking-[0.12em] text-cream-50" href="/">NALAM</Link>
          <p className="mt-3 max-w-xs text-sm leading-6 text-cream-200">Traditional wood-pressed oils and food products.</p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-cream-200">Shop</h2>
          <Link className="mt-4 inline-block text-sm text-cream-100 hover:text-white" href="/products">All products</Link>
          <ul className="mt-2 space-y-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link className="text-sm text-cream-200 hover:text-white" href={"/products?category=" + encodeURIComponent(category.slug)}>{category.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-cream-200">Discover</h2>
          <Link className="mt-4 inline-block text-sm text-cream-200 hover:text-white" href="/about">About Nalam</Link><Link className="mt-3 block text-sm text-cream-200 hover:text-white" href="/about#our-method">Our method</Link>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-cream-200">Nalam</h2>
          <p className="mt-4 text-sm leading-6 text-cream-200">Browse current product details and available sizes in the catalogue.</p>
        </div>
        <p className="border-t border-cream-700/60 pt-6 text-xs text-cream-200 sm:col-span-2 lg:col-span-4">© Nalam</p>
      </div>
    </footer>
  );
}

