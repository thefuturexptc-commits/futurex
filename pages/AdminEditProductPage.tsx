import React, { useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';

interface VariantForm {
  variantId: string;
  color: string;
  colorHex: string;
  size: string;
  stock: number;
  priceOverride: number | null;
  images: File[];
  video: File | null;
}

export interface EditProductFormState {
  productId: string;
  name: string;
  category: string;
  mrp: number;
  salePrice: number;
  weight: string;
  warranty: string;
  shortDescription: string;
  fullDescription: string;
  isBestSeller: boolean;
  isNewArrival: boolean;
  hasVariants: boolean;
  simpleStock: number;
  simpleImages: File[];
  variants: VariantForm[];
}

interface AdminEditProductPageProps {
  categories?: string[];
  initialData?: Partial<EditProductFormState>;
  onSave?: (payload: EditProductFormState) => void | Promise<void>;
  onCancel?: () => void;
}

const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500';

const getFileKey = (file: File, index: number) => `${file.name}_${file.size}_${file.lastModified}_${index}`;

const reorderList = <T,>(list: T[], fromIndex: number, toIndex: number): T[] => {
  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};

const normalizeNumber = (value: number) => (Number.isFinite(value) ? value : 0);

const createVariant = (): VariantForm => ({
  variantId: `v_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  color: '',
  colorHex: '#6b7280',
  size: '',
  stock: 0,
  priceOverride: null,
  images: [],
  video: null,
});

export const AdminEditProductPage: React.FC<AdminEditProductPageProps> = ({
  categories = ['Smart Bands', 'Smart Rings', 'Smart Fans', 'Smart Monitoring', 'Smart Glasses'],
  initialData,
  onSave,
  onCancel,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [dragSimpleIndex, setDragSimpleIndex] = useState<number | null>(null);
  const [dragVariantImage, setDragVariantImage] = useState<{ variantId: string; index: number } | null>(null);

  const [form, setForm] = useState<EditProductFormState>({
    productId: initialData?.productId || `p_${Date.now()}`,
    name: initialData?.name || '',
    category: initialData?.category || categories[0] || '',
    mrp: normalizeNumber(initialData?.mrp ?? 0),
    salePrice: normalizeNumber(initialData?.salePrice ?? 0),
    weight: initialData?.weight || '',
    warranty: initialData?.warranty || '',
    shortDescription: initialData?.shortDescription || '',
    fullDescription: initialData?.fullDescription || '',
    isBestSeller: Boolean(initialData?.isBestSeller),
    isNewArrival: Boolean(initialData?.isNewArrival),
    hasVariants: Boolean(initialData?.hasVariants),
    simpleStock: normalizeNumber(initialData?.simpleStock ?? 0),
    simpleImages: initialData?.simpleImages || [],
    variants: initialData?.variants?.length ? initialData.variants : [],
  });

  const pageTitle = useMemo(() => (form.productId ? 'Edit Product' : 'Create Product'), [form.productId]);

  const setField = <K extends keyof EditProductFormState>(key: K, value: EditProductFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateVariant = (variantId: string, patch: Partial<VariantForm>) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v) => (v.variantId === variantId ? { ...v, ...patch } : v)),
    }));
  };

  const addSimpleImages = (files: FileList | null) => {
    if (!files?.length) return;
    const incoming = Array.from(files);
    setForm((prev) => {
      const seen = new Set(prev.simpleImages.map((f) => `${f.name}_${f.size}_${f.lastModified}`));
      const next = [...prev.simpleImages];
      incoming.forEach((file) => {
        const key = `${file.name}_${file.size}_${file.lastModified}`;
        if (!seen.has(key)) {
          seen.add(key);
          next.push(file);
        }
      });
      return { ...prev, simpleImages: next };
    });
  };

  const addVariantImages = (variantId: string, files: FileList | null) => {
    if (!files?.length) return;
    const incoming = Array.from(files);
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) => {
        if (variant.variantId !== variantId) return variant;
        const seen = new Set(variant.images.map((f) => `${f.name}_${f.size}_${f.lastModified}`));
        const next = [...variant.images];
        incoming.forEach((file) => {
          const key = `${file.name}_${file.size}_${file.lastModified}`;
          if (!seen.has(key)) {
            seen.add(key);
            next.push(file);
          }
        });
        return { ...variant, images: next };
      }),
    }));
  };

  const removeSimpleImage = (index: number) => {
    setForm((prev) => ({ ...prev, simpleImages: prev.simpleImages.filter((_, i) => i !== index) }));
  };

  const removeVariantImage = (variantId: string, index: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.variantId === variantId ? { ...variant, images: variant.images.filter((_, i) => i !== index) } : variant
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: EditProductFormState = {
      ...form,
      hasVariants: Boolean(form.hasVariants),
      simpleStock: form.hasVariants ? 0 : normalizeNumber(form.simpleStock),
      simpleImages: form.hasVariants ? [] : form.simpleImages,
      variants: form.hasVariants
        ? form.variants.map((variant) => ({
            ...variant,
            stock: normalizeNumber(variant.stock),
            priceOverride: variant.priceOverride == null || Number.isNaN(Number(variant.priceOverride))
              ? null
              : Number(variant.priceOverride),
          }))
        : [],
    };

    try {
      setIsSaving(true);
      if (onSave) {
        await onSave(payload);
      } else {
        alert('Product form is ready, but no save handler is connected.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-white/10 rounded-2xl p-5 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold">{pageTitle}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage core product data and inventory mode.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold">Basic Product Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product ID</label>
                <input className={`${inputClass} opacity-80`} value={form.productId} readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="e.g. Galaxy Ring Pro"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select className={inputClass} value={form.category} onChange={(e) => setField('category', e.target.value)}>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">MRP</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.mrp}
                  onChange={(e) => setField('mrp', Number(e.target.value))}
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sale Price</label>
                <input
                  type="number"
                  className={inputClass}
                  value={form.salePrice}
                  onChange={(e) => setField('salePrice', Number(e.target.value))}
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weight</label>
                <input
                  className={inputClass}
                  value={form.weight}
                  onChange={(e) => setField('weight', e.target.value)}
                  placeholder="e.g. 12g"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Warranty</label>
                <input
                  className={inputClass}
                  value={form.warranty}
                  onChange={(e) => setField('warranty', e.target.value)}
                  placeholder="e.g. 1 Year Warranty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Short Description</label>
                <input
                  className={inputClass}
                  value={form.shortDescription}
                  onChange={(e) => setField('shortDescription', e.target.value)}
                  placeholder="One-line summary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Full Description</label>
              <textarea
                className={`${inputClass} min-h-[140px]`}
                value={form.fullDescription}
                onChange={(e) => setField('fullDescription', e.target.value)}
                placeholder="Detailed product content"
              />
            </div>

            <div className="flex flex-wrap gap-6 pt-1">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isBestSeller}
                  onChange={(e) => setField('isBestSeller', e.target.checked)}
                />
                Best Seller
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isNewArrival}
                  onChange={(e) => setField('isNewArrival', e.target.checked)}
                />
                New Arrival
              </label>
            </div>
          </section>

          <section className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold">Product Type</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="product-type"
                  checked={!form.hasVariants}
                  onChange={() => setField('hasVariants', false)}
                />
                Simple Product (No variants)
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="product-type"
                  checked={form.hasVariants}
                  onChange={() => setField('hasVariants', true)}
                />
                Variant Product (With color/size variants)
              </label>
            </div>
          </section>

          {!form.hasVariants && (
            <section className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
              <h2 className="text-lg font-semibold">Simple Product Inventory</h2>

              <div className="max-w-xs">
                <label className="block text-sm font-medium mb-1">Total Stock</label>
                <input
                  type="number"
                  className={inputClass}
                  min={0}
                  value={form.simpleStock}
                  onChange={(e) => setField('simpleStock', Number(e.target.value))}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium">Multiple Image Upload</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="block w-full text-sm"
                  onChange={(e) => {
                    addSimpleImages(e.target.files);
                    e.currentTarget.value = '';
                  }}
                />

                <p className="text-xs text-gray-500 dark:text-gray-400">Drag and drop thumbnails to reorder.</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {form.simpleImages.map((file, index) => (
                    <div
                      key={getFileKey(file, index)}
                      draggable
                      onDragStart={() => setDragSimpleIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragSimpleIndex == null || dragSimpleIndex === index) return;
                        setForm((prev) => ({
                          ...prev,
                          simpleImages: reorderList(prev.simpleImages, dragSimpleIndex, index),
                        }));
                        setDragSimpleIndex(null);
                      }}
                      className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-2"
                    >
                      <div className="aspect-square rounded-lg bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 overflow-hidden">
                        <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[11px] mt-1 truncate" title={file.name}>{file.name}</p>
                      <Button type="button" size="sm" variant="danger" className="w-full mt-2" onClick={() => removeSimpleImage(index)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {form.hasVariants && (
            <section className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Variants</h2>
                <Button type="button" size="sm" onClick={() => setForm((prev) => ({ ...prev, variants: [...prev.variants, createVariant()] }))}>
                  + Add Variant
                </Button>
              </div>

              {form.variants.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No variants added yet. Click Add Variant.</p>
              )}

              <div className="space-y-4">
                {form.variants.map((variant) => (
                  <div key={variant.variantId} className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Variant ID: {variant.variantId}</h3>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => setForm((prev) => ({ ...prev, variants: prev.variants.filter((v) => v.variantId !== variant.variantId) }))}
                      >
                        Delete Variant
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium mb-1">Color Name (optional)</label>
                        <input
                          className={inputClass}
                          value={variant.color}
                          onChange={(e) => updateVariant(variant.variantId, { color: e.target.value })}
                          placeholder="e.g. Midnight Black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Color Hex</label>
                        <input
                          type="color"
                          className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                          value={variant.colorHex || '#6b7280'}
                          onChange={(e) => updateVariant(variant.variantId, { colorHex: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Size (optional)</label>
                        <input
                          className={inputClass}
                          value={variant.size}
                          onChange={(e) => updateVariant(variant.variantId, { size: e.target.value })}
                          placeholder="e.g. 7"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Stock</label>
                        <input
                          type="number"
                          min={0}
                          className={inputClass}
                          value={variant.stock}
                          onChange={(e) => updateVariant(variant.variantId, { stock: Number(e.target.value) })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Price Override</label>
                        <input
                          type="number"
                          min={0}
                          className={inputClass}
                          placeholder="optional"
                          value={variant.priceOverride ?? ''}
                          onChange={(e) => {
                            const next = e.target.value.trim();
                            updateVariant(variant.variantId, { priceOverride: next === '' ? null : Number(next) });
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium">Variant Images</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="block w-full text-sm"
                        onChange={(e) => {
                          addVariantImages(variant.variantId, e.target.files);
                          e.currentTarget.value = '';
                        }}
                      />

                      <p className="text-xs text-gray-500 dark:text-gray-400">Drag and drop thumbnails to reorder.</p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {variant.images.map((file, index) => (
                          <div
                            key={getFileKey(file, index)}
                            draggable
                            onDragStart={() => setDragVariantImage({ variantId: variant.variantId, index })}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (!dragVariantImage) return;
                              if (dragVariantImage.variantId !== variant.variantId) return;
                              if (dragVariantImage.index === index) return;

                              setForm((prev) => ({
                                ...prev,
                                variants: prev.variants.map((v) =>
                                  v.variantId === variant.variantId
                                    ? { ...v, images: reorderList(v.images, dragVariantImage.index, index) }
                                    : v
                                ),
                              }));
                              setDragVariantImage(null);
                            }}
                            className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 p-2"
                          >
                            <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
                              <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                            </div>
                            <p className="text-[11px] mt-1 truncate" title={file.name}>{file.name}</p>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              className="w-full mt-2"
                              onClick={() => removeVariantImage(variant.variantId, index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-black/20">
                      <label className="block text-sm font-medium">Variant Video</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Upload a short video up to 10 seconds for this variant.</p>
                      <input
                        type="file"
                        accept="video/*"
                        className="block w-full text-sm"
                        onChange={(e) => {
                          updateVariant(variant.variantId, { video: e.target.files?.[0] || null });
                          e.currentTarget.value = '';
                        }}
                      />
                      {variant.video && (
                        <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs dark:border-white/10">
                          <span className="min-w-0 truncate">{variant.video.name}</span>
                          <button type="button" className="shrink-0 text-red-600 dark:text-red-400" onClick={() => updateVariant(variant.variantId, { video: null })}>
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" isLoading={isSaving}>Save Product</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
