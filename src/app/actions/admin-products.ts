'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/auth';
import { adminCategoryIdSchema, adminCategorySchema, adminImageSchema, adminInitialVariantSchema, adminProductIdSchema, adminProductSchema, adminVariantSchema } from '@/lib/admin-product-validation';
import { AdminCatalogueError, adminProductsData } from '@/lib/admin-products';

export type AdminCatalogueActionState = { kind?: 'success' | 'error'; message?: string };
const invalidState: AdminCatalogueActionState = { kind: 'error', message: 'Check the highlighted fields and try again.' };

function nullableText(value: FormDataEntryValue | null): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function productInput(formData: FormData) {
  return adminProductSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    categoryId: formData.get('categoryId'),
    description: nullableText(formData.get('description')),
    active: formData.get('active') === 'on',
  });
}

function userMessage(error: unknown): AdminCatalogueActionState {
  if (error instanceof AdminCatalogueError) {
    if (error.code === 'DUPLICATE') return { kind: 'error', message: 'That name, URL slug, SKU, or variant combination is already in use.' };
    if (error.code === 'NOT_FOUND' || error.code === 'INVALID_ID') return { kind: 'error', message: 'The requested catalogue record could not be found. Refresh and try again.' };
    if (error.code === 'CATEGORY_IN_USE') return { kind: 'error', message: 'This category contains products and cannot be deleted. Move or remove the products first.' };
    if (error.code === 'ORDER_REFERENCED') return { kind: 'error', message: 'This product cannot be permanently deleted because it is referenced by an order. Deactivate it to keep historical order records intact.' };
  }
  console.error('Admin catalogue action failed.', { errorName: error instanceof Error ? error.name : typeof error });
  return { kind: 'error', message: 'We could not save these changes. Please try again.' };
}

function invalidateCatalogue(productId?: string, oldSlug?: string, newSlug?: string) {
  updateTag('products');
  updateTag('categories');
  revalidatePath('/');
  revalidatePath('/products');
  revalidatePath('/admin/products');
  revalidatePath('/admin/categories');
  if (productId) revalidatePath(`/admin/products/${productId}`);
  if (oldSlug) revalidatePath(`/products/${oldSlug}`);
  if (newSlug) revalidatePath(`/products/${newSlug}`);
}

export async function saveAdminProductAction(
  _previousState: AdminCatalogueActionState,
  formData: FormData,
): Promise<AdminCatalogueActionState> {
  await requireAdmin();
  const product = productInput(formData);
  if (!product.success) return invalidState;
  const productIdValue = formData.get('productId');

  if (productIdValue === null) {
    const variant = adminInitialVariantSchema.safeParse({
      sku: formData.get('sku'),
      value: formData.get('value'),
      unit: formData.get('unit'),
      price: formData.get('price'),
    });
    if (!variant.success) return invalidState;
    const imageUrl = nullableText(formData.get('imageUrl'));
    const image = imageUrl
      ? adminImageSchema.safeParse({ url: imageUrl, altText: nullableText(formData.get('imageAltText')), sortOrder: 0 })
      : undefined;
    if (image && !image.success) return { kind: 'error', message: 'Use a valid local image path beginning with /images/.' };
    try {
      const id = await adminProductsData.createAdminProduct({
        product: product.data,
        variant: variant.data,
        ...(image?.success ? { image: image.data } : {}),
      });
      invalidateCatalogue(id, undefined, product.data.slug);
      redirect(`/admin/products/${id}?created=1`);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT')) throw error;
      return userMessage(error);
    }
  }

  try {
    const parsedId = adminProductIdSchema.safeParse(productIdValue);
    if (!parsedId.success) return invalidState;
    const existing = await adminProductsData.getAdminProductById(parsedId.data);
    if (!existing) return { kind: 'error', message: 'This product could not be found. Refresh and try again.' };
    await adminProductsData.updateAdminProduct(parsedId.data, product.data);
    invalidateCatalogue(parsedId.data, existing.slug, product.data.slug);
    return { kind: 'success', message: 'Product information saved.' };
  } catch (error) {
    return userMessage(error);
  }
}

export async function saveAdminVariantAction(
  _previousState: AdminCatalogueActionState,
  formData: FormData,
): Promise<AdminCatalogueActionState> {
  await requireAdmin();
  const productId = adminProductIdSchema.safeParse(formData.get('productId'));
  const variantIdValue = formData.get('variantId');
  const variantId = variantIdValue === null ? null : adminProductIdSchema.safeParse(variantIdValue);
  const variant = adminVariantSchema.safeParse({
    sku: formData.get('sku'), value: formData.get('value'), unit: formData.get('unit'),
    price: formData.get('price'), active: formData.get('active') === 'on',
  });
  if (!productId.success || (variantId && !variantId.success) || !variant.success) return invalidState;
  try {
    await adminProductsData.saveAdminVariant(productId.data, variantId ? variantId.data : null, variant.data);
    invalidateCatalogue(productId.data);
    return { kind: 'success', message: 'Variant saved.' };
  } catch (error) {
    return userMessage(error);
  }
}

export async function saveAdminImageAction(
  _previousState: AdminCatalogueActionState,
  formData: FormData,
): Promise<AdminCatalogueActionState> {
  await requireAdmin();
  const productId = adminProductIdSchema.safeParse(formData.get('productId'));
  const imageIdValue = formData.get('imageId');
  const imageId = imageIdValue === null ? null : adminProductIdSchema.safeParse(imageIdValue);
  const mode = formData.get('mode');
  if (!productId.success || (imageId && !imageId.success) || !['save', 'delete'].includes(String(mode))) return invalidState;
  try {
    if (mode === 'delete') {
      if (!imageId || !imageId.success) return invalidState;
      await adminProductsData.deleteAdminImage(productId.data, imageId.data);
    } else {
      const image = adminImageSchema.safeParse({
        url: formData.get('url'), altText: nullableText(formData.get('altText')),
        sortOrder: Number(formData.get('sortOrder')),
      });
      if (!image.success) return { kind: 'error', message: image.error.issues[0]?.message ?? 'Check the image fields and try again.' };
      await adminProductsData.saveAdminImage(productId.data, imageId ? imageId.data : null, image.data);
    }
    invalidateCatalogue(productId.data);
    return { kind: 'success', message: mode === 'delete' ? 'Image removed.' : 'Image saved.' };
  } catch (error) {
    return userMessage(error);
  }
}

export async function saveAdminCategoryAction(
  _previousState: AdminCatalogueActionState,
  formData: FormData,
): Promise<AdminCatalogueActionState> {
  await requireAdmin();
  const categoryIdValue = formData.get('categoryId');
  const categoryId = categoryIdValue === null ? null : adminProductIdSchema.safeParse(categoryIdValue);
  const category = adminCategorySchema.safeParse({ name: formData.get('name'), slug: formData.get('slug') });
  if ((categoryId && !categoryId.success) || !category.success) return invalidState;
  try {
    await adminProductsData.saveAdminCategory(categoryId ? categoryId.data : null, category.data);
    invalidateCatalogue();
    return { kind: 'success', message: categoryId ? 'Category saved.' : 'Category created.' };
  } catch (error) {
    return userMessage(error);
  }
}

export async function deleteAdminCategoryAction(
  _previousState: AdminCatalogueActionState,
  formData: FormData,
): Promise<AdminCatalogueActionState> {
  await requireAdmin();
  const categoryId = adminCategoryIdSchema.safeParse(formData.get('categoryId'));
  if (!categoryId.success) return invalidState;
  try {
    await adminProductsData.deleteAdminCategory(categoryId.data);
  } catch (error) {
    return userMessage(error);
  }
  invalidateCatalogue();
  revalidatePath('/admin/categories');
  redirect('/admin/categories?deleted=1');
}

export async function deleteAdminProductAction(
  _previousState: AdminCatalogueActionState,
  formData: FormData,
): Promise<AdminCatalogueActionState> {
  await requireAdmin();
  const productId = adminProductIdSchema.safeParse(formData.get('productId'));
  if (!productId.success) return invalidState;
  try {
    await adminProductsData.deleteAdminProduct(productId.data);
  } catch (error) {
    return userMessage(error);
  }
  invalidateCatalogue(productId.data);
  revalidatePath('/admin/products');
  redirect('/admin/products?deleted=1');
}