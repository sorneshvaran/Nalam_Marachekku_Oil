import "dotenv/config";
import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "@prisma/orm-postgres/runtime";
import contractJson from "../src/prisma/contract.json" with { type: "json" };

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const categories = [
  { name: "Oils", slug: "oils" },
  { name: "Food Products", slug: "food-products" },
  { name: "Oil Seed Cakes", slug: "oil-seed-cakes" },
];

const products = [
  {
    name: "Groundnut Oil",
    slug: "groundnut-oil",
    categorySlug: "oils",
    variants: [
      { sku: "GROUNDNUT-OIL-500ML", value: "500", unit: "ML", price: "150" },
      { sku: "GROUNDNUT-OIL-1L", value: "1", unit: "L", price: "300" },
      { sku: "GROUNDNUT-OIL-2L", value: "2", unit: "L", price: "600" },
      { sku: "GROUNDNUT-OIL-3L", value: "3", unit: "L", price: "900" },
      { sku: "GROUNDNUT-OIL-5L", value: "5", unit: "L", price: "1400" },
    ],
  },
  {
    name: "Gingelly Oil",
    slug: "gingelly-oil",
    categorySlug: "oils",
    variants: [
      { sku: "GINGELLY-OIL-100ML", value: "100", unit: "ML", price: "50" },
      { sku: "GINGELLY-OIL-200ML", value: "200", unit: "ML", price: "100" },
      { sku: "GINGELLY-OIL-500ML", value: "500", unit: "ML", price: "210" },
      { sku: "GINGELLY-OIL-1L", value: "1", unit: "L", price: "420" },
    ],
  },
  {
    name: "Coconut Oil",
    slug: "coconut-oil",
    categorySlug: "oils",
    variants: [
      { sku: "COCONUT-OIL-100ML", value: "100", unit: "ML", price: "50" },
      { sku: "COCONUT-OIL-200ML", value: "200", unit: "ML", price: "100" },
      { sku: "COCONUT-OIL-500ML", value: "500", unit: "ML", price: "210" },
      { sku: "COCONUT-OIL-1L", value: "1", unit: "L", price: "420" },
    ],
  },
  {
    name: "Neem Oil",
    slug: "neem-oil",
    categorySlug: "oils",
    variants: [
      { sku: "NEEM-OIL-100ML", value: "100", unit: "ML", price: "30" },
    ],
  },
  {
    name: "Castor Oil",
    slug: "castor-oil",
    categorySlug: "oils",
    variants: [
      { sku: "CASTOR-OIL-100ML", value: "100", unit: "ML", price: "30" },
    ],
  },
  {
    name: "Jaggery",
    slug: "jaggery",
    categorySlug: "food-products",
    variants: [
      { sku: "JAGGERY-500G", value: "500", unit: "G", price: "60" },
    ],
  },
  {
    name: "Rock Salt",
    slug: "rock-salt",
    categorySlug: "food-products",
    variants: [
      { sku: "ROCK-SALT-500G", value: "500", unit: "G", price: "60" },
    ],
  },
  {
    name: "Rock Salt Powder",
    slug: "rock-salt-powder",
    categorySlug: "food-products",
    variants: [
      { sku: "ROCK-SALT-POWDER-500G", value: "500", unit: "G", price: "60" },
    ],
  },
  {
    name: "Groundnut Cake",
    slug: "groundnut-cake",
    categorySlug: "oil-seed-cakes",
    variants: [
      { sku: "GROUNDNUT-CAKE-1KG", value: "1", unit: "KG", price: "80" },
    ],
  },
  {
    name: "Sesame Cake",
    slug: "sesame-cake",
    categorySlug: "oil-seed-cakes",
    variants: [
      { sku: "SESAME-CAKE-1KG", value: "1", unit: "KG", price: "20" },
    ],
  },
  {
    name: "Coconut Cake",
    slug: "coconut-cake",
    categorySlug: "oil-seed-cakes",
    variants: [
      { sku: "COCONUT-CAKE-1KG", value: "1", unit: "KG", price: "25" },
    ],
  },
];

const productImages = [
  { productName: "Groundnut Oil", file: "groundnut-oil-500ml.jpeg", altText: "Groundnut oil product, 500 ml", sortOrder: 0 },
  { productName: "Groundnut Oil", file: "groundnut-oil-1l.jpeg", altText: "Groundnut oil product, 1 L", sortOrder: 1 },
  { productName: "Groundnut Oil", file: "groundnut-oil-2l.jpeg", altText: "Groundnut oil product, 2 L", sortOrder: 2 },
  { productName: "Groundnut Oil", file: "groundnut-oil-3l.jpeg", altText: "Groundnut oil product, 3 L", sortOrder: 3 },
  { productName: "Groundnut Oil", file: "groundnut-oil-5l.jpeg", altText: "Groundnut oil product, 5 L", sortOrder: 4 },
  { productName: "Gingelly Oil", file: "gingelly-oil-500ml.jpeg", altText: "Gingelly oil product, 500 ml", sortOrder: 0 },
  { productName: "Gingelly Oil", file: "gingelly-oil-1l.jpeg", altText: "Gingelly oil product, 1 L", sortOrder: 1 },
  { productName: "Coconut Oil", file: "coconut-oil-500ml.jpeg", altText: "Coconut oil product, 500 ml", sortOrder: 0 },
  { productName: "Coconut Oil", file: "coconut-oil-1l.jpeg", altText: "Coconut oil product, 1 L", sortOrder: 1 },
  { productName: "Jaggery", file: "Nalam_Jaggery_Powder.png", altText: "Nalam jaggery powder product, 500 g", sortOrder: 0 },
];

const expectedVariantCount = products.reduce((count, product) => count + product.variants.length, 0);
if (categories.length !== 3 || products.length !== 11 || expectedVariantCount !== 21) {
  throw new Error("Catalogue definition count does not match 3 categories, 11 products, and 21 variants.");
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

for (const image of productImages) {
  await access(path.join(rootDirectory, "public", "images", "products", image.file));
}

const db = postgres({ contractJson, url: process.env.DATABASE_URL });
const stats = {
  categories: { created: 0, found: 0, updated: 0 },
  products: { created: 0, found: 0, updated: 0 },
  variants: { created: 0, found: 0, updated: 0 },
  images: { created: 0, found: 0, updated: 0 },
};

async function ensureCategory(tx, specification) {
  const bySlug = await tx.orm.public.Category.where({ slug: specification.slug }).first();
  const byName = await tx.orm.public.Category.where({ name: specification.name }).first();

  if (bySlug && byName && bySlug.id !== byName.id) {
    throw new Error("Category name/slug resolves to two existing records: " + specification.name);
  }

  const existing = bySlug || byName;
  if (!existing) {
    stats.categories.created += 1;
    return await tx.orm.public.Category.create(specification);
  }

  stats.categories.found += 1;
  const updates = {};
  if (existing.name !== specification.name) updates.name = specification.name;
  if (existing.slug !== specification.slug) updates.slug = specification.slug;

  if (Object.keys(updates).length > 0) {
    const updated = await tx.orm.public.Category.where({ id: existing.id }).update(updates);
    stats.categories.updated += 1;
    return updated;
  }

  return existing;
}

async function ensureProduct(tx, specification, category) {
  const bySlug = await tx.orm.public.Product.where({ slug: specification.slug }).first();
  const matchingNames = await tx.orm.public.Product.where({ name: specification.name })
    .select("id", "name", "slug", "categoryId", "active")
    .all();

  let existing = bySlug;
  if (bySlug && bySlug.name !== specification.name) {
    throw new Error("Product slug is already used by a different product: " + specification.slug);
  }
  if (!existing) {
    const inCategory = matchingNames.filter((product) => product.categoryId === category.id);
    if (inCategory.length > 1) {
      throw new Error("Multiple product records share the confirmed name: " + specification.name);
    }
    if (matchingNames.length > 0 && inCategory.length === 0) {
      throw new Error("Product name exists in another category; refusing to create a duplicate: " + specification.name);
    }
    existing = inCategory[0];
  } else if (matchingNames.some((product) => product.id !== existing.id)) {
    throw new Error("Multiple product records share the confirmed name: " + specification.name);
  }

  if (!existing) {
    stats.products.created += 1;
    return await tx.orm.public.Product.create({
      name: specification.name,
      slug: specification.slug,
      categoryId: category.id,
      active: true,
    });
  }

  stats.products.found += 1;
  const updates = {};
  if (existing.categoryId !== category.id) updates.categoryId = category.id;
  if (!existing.active) updates.active = true;

  if (Object.keys(updates).length > 0) {
    const updated = await tx.orm.public.Product.where({ id: existing.id }).update(updates);
    stats.products.updated += 1;
    return updated;
  }

  return existing;
}

async function ensureVariant(tx, product, specification) {
  const bySku = await tx.orm.public.ProductVariant.where({ sku: specification.sku })
    .select("id", "productId", "sku", "value", "unit", "price", "stockStatus", "active")
    .first();
  const byProductAndSize = await tx.orm.public.ProductVariant
    .where({ productId: product.id, value: specification.value, unit: specification.unit })
    .select("id", "productId", "sku", "value", "unit", "price", "stockStatus", "active")
    .first();

  if (bySku && byProductAndSize && bySku.id !== byProductAndSize.id) {
    throw new Error("SKU and product/size resolve to different variants: " + specification.sku);
  }

  const existing = bySku || byProductAndSize;
  if (existing) {
    if (
      existing.productId !== product.id ||
      Number(existing.value) !== Number(specification.value) ||
      existing.unit !== specification.unit
    ) {
      throw new Error("Existing SKU conflicts with confirmed variant: " + specification.sku);
    }

    stats.variants.found += 1;
    const updates = {};
    if (Number(existing.price) !== Number(specification.price)) updates.price = specification.price;
    if (!existing.active) updates.active = true;

    if (Object.keys(updates).length > 0) {
      const updated = await tx.orm.public.ProductVariant.where({ id: existing.id }).update(updates);
      stats.variants.updated += 1;
      return updated;
    }

    return existing;
  }

  stats.variants.created += 1;
  return await tx.orm.public.ProductVariant.create({
    productId: product.id,
    sku: specification.sku,
    value: specification.value,
    unit: specification.unit,
    price: specification.price,
    active: true,
  });
}

async function ensureImage(tx, product, specification) {
  const url = "/images/products/" + specification.file;
  const matches = await tx.orm.public.ProductImage.where({ url })
    .select("id", "productId", "url", "altText", "sortOrder")
    .all();

  if (matches.length > 1) {
    throw new Error("Duplicate product image records already exist for " + url);
  }

  const existing = matches[0];
  if (existing && existing.productId !== product.id) {
    throw new Error("Image URL is already assigned to a different product: " + url);
  }

  if (existing) {
    stats.images.found += 1;
    const updates = {};
    if (existing.altText !== specification.altText) updates.altText = specification.altText;
    if (existing.sortOrder !== specification.sortOrder) updates.sortOrder = specification.sortOrder;

    if (Object.keys(updates).length > 0) {
      const updated = await tx.orm.public.ProductImage.where({ id: existing.id }).update(updates);
      stats.images.updated += 1;
      return updated;
    }

    return existing;
  }

  stats.images.created += 1;
  return await tx.orm.public.ProductImage.create({
    productId: product.id,
    url,
    altText: specification.altText,
    sortOrder: specification.sortOrder,
  });
}

try {
  const result = await db.transaction(async (tx) => {
    const categoriesBySlug = new Map();
    for (const specification of categories) {
      categoriesBySlug.set(specification.slug, await ensureCategory(tx, specification));
    }

    const productsByName = new Map();
    for (const specification of products) {
      const category = categoriesBySlug.get(specification.categorySlug);
      const product = await ensureProduct(tx, specification, category);
      productsByName.set(specification.name, product);
      for (const variant of specification.variants) {
        await ensureVariant(tx, product, variant);
      }
    }

    for (const image of productImages) {
      const product = productsByName.get(image.productName);
      if (!product) throw new Error("No product mapping found for image " + image.file);
      await ensureImage(tx, product, image);
    }

    return {
      categories: Array.from(categoriesBySlug.values()).map(({ name, slug }) => ({ name, slug })),
      products: Array.from(productsByName.values()).map(({ name, slug }) => ({ name, slug })),
    };
  });

  console.log(JSON.stringify({ stats, records: result }, null, 2));
} catch (error) {
  console.error("Catalogue import failed:", error?.message || String(error));
  process.exitCode = 1;
} finally {
  await db.close();
}