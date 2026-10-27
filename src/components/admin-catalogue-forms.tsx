'use client';

import { useActionState } from 'react';
import type { InputHTMLAttributes } from 'react';

import {
  saveAdminCategoryAction,
  deleteAdminCategoryAction,
  deleteAdminProductAction,
  saveAdminImageAction,
  saveAdminProductAction,
  saveAdminVariantAction,
  type AdminCatalogueActionState,
} from '@/app/actions/admin-products';
import type { AdminCategory, AdminProductDetails } from '@/lib/admin-products';

const initialState: AdminCatalogueActionState = {};
const fieldClass = 'min-h-11 w-full border border-border-strong bg-white px-3 py-2 text-sm text-earth-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-botanical-700';
const labelClass = 'mb-1.5 block text-sm font-medium text-earth-800';
const buttonClass = 'inline-flex min-h-11 items-center justify-center bg-botanical-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-botanical-800 disabled:cursor-not-allowed disabled:opacity-60';

function ActionMessage({ state }: { state: AdminCatalogueActionState }) {
  if (!state.message) return null;
  return <p role={state.kind === 'error' ? 'alert' : 'status'} aria-live="polite" className={state.kind === 'error' ? 'text-sm text-red-700' : 'text-sm text-botanical-800'}>{state.message}</p>;
}

export function AdminProductForm({ categories, product }: { categories: AdminCategory[]; product?: AdminProductDetails }) {
  const [state, action, pending] = useActionState(saveAdminProductAction, initialState);
  return (
    <form action={action} className="space-y-5 border border-border-soft bg-white p-5 sm:p-6">
      {product ? <input type="hidden" name="productId" value={product.id} /> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label className={labelClass} htmlFor="product-name">Product name</label><input className={fieldClass} id="product-name" name="name" required maxLength={120} defaultValue={product?.name ?? ''} /></div>
        <div><label className={labelClass} htmlFor="product-slug">URL slug</label><input className={fieldClass} id="product-slug" name="slug" required maxLength={100} pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*" placeholder="groundnut-oil" defaultValue={product?.slug ?? ''} /></div>
        <div><label className={labelClass} htmlFor="product-category">Category</label><select className={fieldClass} id="product-category" name="categoryId" required defaultValue={product?.categoryId ?? ''}><option value="" disabled>Select a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
        <label className="flex min-h-11 items-center gap-3 self-end pb-2 text-sm font-medium text-earth-800"><input type="checkbox" name="active" defaultChecked={product?.active ?? true} className="size-4 accent-botanical-700" />Product is active</label>
        <div className="sm:col-span-2"><label className={labelClass} htmlFor="product-description">Description</label><textarea className={fieldClass + ' min-h-28'} id="product-description" name="description" maxLength={4000} defaultValue={product?.description ?? ''} /></div>
      </div>

      {!product ? (
        <section className="border-t border-border-soft pt-5">
          <h2 className="font-serif text-xl text-earth-900">First variant</h2>
          <p className="mt-1 text-sm text-foreground-muted">A product needs one valid variant before it can be created.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="SKU" name="sku" required maxLength={64} placeholder="PRODUCT-500G" />
            <Field label="Value" name="value" required type="number" min="0.001" step="0.001" />
            <div><label className={labelClass} htmlFor="variant-unit">Unit</label><select className={fieldClass} id="variant-unit" name="unit" defaultValue="G"><option value="ML">ML</option><option value="L">L</option><option value="G">G</option><option value="KG">KG</option></select></div>
            <Field label="Price (₹)" name="price" required type="number" min="0" step="0.01" />
          </div>
          <div className="mt-4 max-w-lg"><Field label="First image path (optional)" name="imageUrl" placeholder="/images/products/example.jpg" /><p className="mt-1 text-xs text-foreground-muted">Use an existing local image under public/images. Image upload is not available here.</p></div>
          <div className="mt-4 max-w-lg"><Field label="Image alt text (optional)" name="imageAltText" maxLength={250} /></div>
        </section>
      ) : null}

      <div className="border-t border-border-soft pt-5"><button className={buttonClass} type="submit" disabled={pending}>{pending ? 'Saving…' : product ? 'Save product' : 'Create product'}</button><div className="mt-3"><ActionMessage state={state} /></div></div>
    </form>
  );
}

export function AdminVariantForm({ productId, variant }: { productId: string; variant?: AdminProductDetails['variants'][number] }) {
  const [state, action, pending] = useActionState(saveAdminVariantAction, initialState);
  const fieldId = variant?.id ?? 'new';
  return (
    <form action={action} className="space-y-4 border border-border-soft bg-white p-4">
      <input type="hidden" name="productId" value={productId} />{variant ? <input type="hidden" name="variantId" value={variant.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field id={'variant-sku-' + fieldId} label="SKU" name="sku" required maxLength={64} defaultValue={variant?.sku ?? ''} />
        <Field id={'variant-value-' + fieldId} label="Value" name="value" required type="number" min="0.001" step="0.001" defaultValue={variant?.value ?? ''} />
        <div><label className={labelClass} htmlFor={'unit-' + (variant?.id ?? 'new')}>Unit</label><select className={fieldClass} id={'unit-' + (variant?.id ?? 'new')} name="unit" defaultValue={variant?.unit ?? 'G'}><option value="ML">ML</option><option value="L">L</option><option value="G">G</option><option value="KG">KG</option></select></div>
        <Field id={'variant-price-' + fieldId} label="Price (₹)" name="price" required type="number" min="0" step="0.01" defaultValue={variant?.price ?? ''} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-earth-800"><input type="checkbox" name="active" defaultChecked={variant?.active ?? true} className="size-4 accent-botanical-700" />Variant is active</label>
        <button className={buttonClass} type="submit" disabled={pending}>{pending ? 'Saving…' : variant ? 'Save variant' : 'Add variant'}</button>
      </div>
      <ActionMessage state={state} />
    </form>
  );
}

export function AdminImageForm({ productId, image }: { productId: string; image?: AdminProductDetails['images'][number] }) {
  const [state, action, pending] = useActionState(saveAdminImageAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(saveAdminImageAction, initialState);
  const fieldId = image?.id ?? 'new';
  return (
    <div className="space-y-3 border border-border-soft bg-white p-4">
      <form action={action} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="productId" value={productId} /><input type="hidden" name="mode" value="save" />{image ? <input type="hidden" name="imageId" value={image.id} /> : null}
        <Field id={'image-url-' + fieldId} label="Local image path" name="url" required maxLength={500} placeholder="/images/products/example.jpg" defaultValue={image?.url ?? ''} />
        <Field id={'image-alt-' + fieldId} label="Alt text" name="altText" maxLength={250} defaultValue={image?.altText ?? ''} />
        <Field id={'image-order-' + fieldId} label="Sort order" name="sortOrder" required type="number" min="0" max="10000" step="1" defaultValue={image?.sortOrder ?? 0} />
        <div className="flex flex-wrap items-end gap-3"><button className={buttonClass} type="submit" disabled={pending}>{pending ? 'Saving…' : image ? 'Save image' : 'Add image'}</button></div>
        <div className="sm:col-span-2"><ActionMessage state={state} /></div>
      </form>
      {image ? <form action={deleteAction} className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-3"><input type="hidden" name="productId" value={productId} /><input type="hidden" name="imageId" value={image.id} /><input type="hidden" name="mode" value="delete" /><button type="submit" disabled={deletePending} className="inline-flex min-h-11 items-center border border-border-strong px-4 text-sm font-semibold text-earth-800 hover:border-red-700 hover:text-red-700 disabled:opacity-60">{deletePending ? 'Removing…' : 'Remove image'}</button><ActionMessage state={deleteState} /></form> : null}
    </div>
  );
}

export function AdminCategoryDeleteForm({ categoryId }: { categoryId: string }) {
  const [state, action, pending] = useActionState(deleteAdminCategoryAction, initialState);
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm('Delete this category? Categories containing products cannot be deleted.')) event.preventDefault();
      }}
      className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-3"
    >
      <input type="hidden" name="categoryId" value={categoryId} />
      <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center border border-red-300 px-4 text-sm font-semibold text-red-800 hover:border-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? 'Deleting…' : 'Delete category'}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export function AdminProductDeleteForm({ productId, productName }: { productId: string; productName: string }) {
  const [state, action, pending] = useActionState(deleteAdminProductAction, initialState);
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Permanently delete “${productName}”? Historical orders are protected, and references in customer carts will be removed.`)) event.preventDefault();
      }}
      className="mt-5 flex flex-col gap-3 border border-red-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="font-semibold text-earth-900">Permanent deletion</p>
        <p className="mt-1 text-sm leading-6 text-foreground-muted">Products referenced by historical orders cannot be deleted. Deactivate those products instead.</p>
      </div>
      <input type="hidden" name="productId" value={productId} />
      <button type="submit" disabled={pending} className="inline-flex min-h-11 shrink-0 items-center justify-center border border-red-300 px-4 text-sm font-semibold text-red-800 hover:border-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? 'Deleting…' : 'Delete product permanently'}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}
export function AdminCategoryForm({ category }: { category?: AdminCategory }) {
  const [state, action, pending] = useActionState(saveAdminCategoryAction, initialState);
  const fieldId = category?.id ?? 'new';
  return (
    <form action={action} className="grid gap-4 border border-border-soft bg-white p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      {category ? <input type="hidden" name="categoryId" value={category.id} /> : null}
      <Field id={'category-name-' + fieldId} label="Category name" name="name" required maxLength={100} defaultValue={category?.name ?? ''} />
      <Field id={'category-slug-' + fieldId} label="URL slug" name="slug" required maxLength={100} pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*" placeholder="oil-seed-cakes" defaultValue={category?.slug ?? ''} />
      <button className={buttonClass} type="submit" disabled={pending}>{pending ? 'Saving…' : category ? 'Save category' : 'Create category'}</button>
      <div className="sm:col-span-3"><ActionMessage state={state} /></div>
    </form>
  );
}

function Field({ label, name, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = props.id ?? name;
  return <div><label className={labelClass} htmlFor={id}>{label}</label><input className={fieldClass} id={id} name={name} {...props} /></div>;
}
