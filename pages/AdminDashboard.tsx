
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RichTextEditor } from '../components/RichTextEditor';
import { useAuth } from '../context/AuthContext';
import {
  addCategory,
  addAuditLog,
  addNewAdmin,
  addProduct,
  deleteAdmin,
  deleteCategory,
  deleteOrder,
  deleteProduct,
  getAllOrders,
  getAllUsers,
  getAuditLogs,
  getCategories,
  getProducts,
  seedDatabase,
  updateOrderStatus,
  updateProduct,
  updateProductContentFields,
  updateWebsiteSettings,
  uploadFile,
} from '../services/backend';
import { Order, Product, User, UserPermissions } from '../types';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { ConfirmModal } from '../components/admin/common/ConfirmModal';
import { AnalyticsRange, AdminAuditEntry } from '../components/admin/types';
import { AnalyticsTab } from '../components/admin/tabs/AnalyticsTab';
import { InventoryTab } from '../components/admin/tabs/InventoryTab';
import { ProductsTab } from '../components/admin/tabs/ProductsTab';
import { OrdersTab } from '../components/admin/tabs/OrdersTab';
import { CategoriesTab } from '../components/admin/tabs/CategoriesTab';
import { ReviewsTab } from '../components/admin/tabs/ReviewsTab';
import { SupportTab } from '../components/admin/tabs/SupportTab';
import { AdminsTab } from '../components/admin/tabs/AdminsTab';
import { SettingsTab } from '../components/admin/tabs/SettingsTab';

type TabKey = 'analytics' | 'inventory' | 'products' | 'orders' | 'categories' | 'reviews' | 'support' | 'admins' | 'settings';

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
}

interface AdminVariantCard {
  variantId: string;
  color: string;
  colorHex: string;
  sizes: Array<{ id: string; size: string; stock: number }>;
  priceOverride: number | null;
  images: string[];
  selectedFiles: File[];
  dragImageIndex: number | null;
}

const inputClass =
  'w-full p-2 border border-white/15 bg-gray-900 text-white rounded dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-primary-500';
const createProductId = () => `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const isPermanentImageUrl = (url: string): boolean => {
  if (!url) return false;
  const lowered = url.trim().toLowerCase();
  return (
    /^https?:\/\//i.test(lowered) &&
    !lowered.startsWith('http://localhost') &&
    !lowered.includes('localhost') &&
    !lowered.startsWith('blob:') &&
    !lowered.startsWith('data:')
  );
};

const uploadPermanentProductImage = async (file: File, path: string): Promise<string> => {
  const url = await uploadFile(file, path);
  if (!isPermanentImageUrl(url)) {
    throw new Error(`Image "${file.name}" could not be saved to cloud storage. Please retry with a smaller WebP/JPG image or check Firebase Storage access.`);
  }
  return url;
};

const parseFeatureLines = (value: string): string[] =>
  value
    .split('\n')
    .map((feature) => feature.trim())
    .filter(Boolean);

const parseSpecsText = (value: string): Record<string, string> => {
  const specs: Record<string, string> = {};
  value.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const match = trimmed.match(/^(.+?)\s*(?::|=|\s-\s)\s*(.+)$/);
    if (!match) return;
    const key = match[1].replace(/^\s*(?:[-*\u2022]\s*|\d+[.)]\s*)/, '').trim();
    const val = match[2].trim();
    if (key && val) specs[key] = val;
  });
  return specs;
};
const createVariantSizeRow = () => ({ id: `sz_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, size: '', stock: 0 });
const ADMIN_ACTIVE_TAB_KEY = 'aura_admin_active_tab';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';
  const {
    updatePrimaryColor,
    primaryColor,
    updateLogoUrl,
    logoUrl,
    socialLinks,
    updateSocialLinks,
    footerSections,
    updateFooterSections,
    pageContent,
    updatePageContent,
  } = useTheme();

  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window === 'undefined') return 'analytics';
    const stored = window.localStorage.getItem(ADMIN_ACTIVE_TAB_KEY) as TabKey | null;
    return stored || 'analytics';
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [auditError, setAuditError] = useState('');
  const [analyticsRange, setAnalyticsRange] = useState<AnalyticsRange>('30d');

  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const initialProductState: Partial<Product> = {
    name: '',
    category: 'Smart Bands',
    description: '',
    mrp: 0,
    salePrice: 0,
    price: 0,
    stock: 0,
    reservedStock: 0,
    sold: 0,
    weight: '',
    bandType: '',
    colors: [],
    inStock: true,
    images: [],
    videoUrl: '',
    features: [],
    specs: {},
    warranty: '',
    isFeatured: false,
    isBestSeller: false,
    variations: [],
    variants: [],
    defaultVariant: '',
  };

  const [productForm, setProductForm] = useState<Partial<Product>>(initialProductState);
  const [featuresString, setFeaturesString] = useState('');
  const [specsString, setSpecsString] = useState('');
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [dragImageIndex, setDragImageIndex] = useState<number | null>(null);
  const parsedSpecsPreview = useMemo(() => parseSpecsText(specsString), [specsString]);
  const [hasVariants, setHasVariants] = useState(false);
  const [variantCards, setVariantCards] = useState<AdminVariantCard[]>([]);
  const [defaultVariant, setDefaultVariant] = useState('');

  const [newCategory, setNewCategory] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminPermissions, setNewAdminPermissions] = useState<UserPermissions>({
    analytics: true,
    products: true,
    orders: true,
    inventory: true,
    categories: true,
    support: true,
    admins: false,
    settings: false,
  });

  const [auditLog, setAuditLog] = useState<AdminAuditEntry[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [settingsAutoSaveState, setSettingsAutoSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const settingsAutoSaveTimerRef = useRef<number | null>(null);
  const settingsBootstrappedRef = useRef(false);

  const pushAudit = useCallback(
    async (action: string, details?: string) => {
      const entry = {
        action,
        actor: user?.email || user?.name || 'Unknown',
        details,
      };
      try {
        await addAuditLog(entry);
        const logs = await getAuditLogs();
        setAuditLog(logs as AdminAuditEntry[]);
        setAuditError('');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Audit log write failed';
        setAuditError(message);
        setAuditLog((prev) => [
          {
            id: `audit_${Date.now()}`,
            action: entry.action,
            actor: entry.actor,
            details: entry.details,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 30));
      }
    },
    [user]
  );

  const hasTabAccess = useCallback(
    (tab: TabKey) => {
      const tabRequirements: Record<TabKey, keyof UserPermissions | null> = {
        analytics: 'analytics',
        inventory: 'inventory',
        products: 'products',
        orders: 'orders',
        categories: 'categories',
        reviews: 'products',
        support: 'orders',
        admins: 'admins',
        settings: 'settings',
      };
      if (isSuperAdmin) return true;
      if (tab === 'admins') return false;
      const required = tabRequirements[tab];
      return required ? Boolean(user?.permissions?.[required]) : false;
    },
    [isSuperAdmin, user?.permissions]
  );

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'analytics', label: 'Analytics' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'products', label: 'Products' },
    { key: 'orders', label: 'Orders' },
    { key: 'categories', label: 'Categories' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'support', label: 'Support' },
    { key: 'admins', label: 'Admins' },
    { key: 'settings', label: 'Settings' },
  ];

  const availableTabs = useMemo(() => tabs.filter((tab) => hasTabAccess(tab.key)).map((tab) => tab.key), [hasTabAccess]);
  const canManageSettings = hasTabAccess('settings');

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setDataError('');
    const results = await Promise.allSettled([getProducts(), getAllOrders(), getCategories(), getAllUsers()]);
    const [productsResult, ordersResult, categoriesResult, usersResult] = results;

    const errors: string[] = [];

    if (productsResult.status === 'fulfilled') {
      setProducts(productsResult.value);
    } else {
      errors.push(`Products: ${productsResult.reason?.message || 'Failed to load'}`);
    }

    if (ordersResult.status === 'fulfilled') {
      setOrders(ordersResult.value);
    } else {
      errors.push(`Orders: ${ordersResult.reason?.message || 'Failed to load'}`);
    }

    if (categoriesResult.status === 'fulfilled') {
      setCategories(categoriesResult.value);
    } else {
      errors.push(`Categories: ${categoriesResult.reason?.message || 'Failed to load'}`);
    }

    if (usersResult.status === 'fulfilled') {
      setUsers(usersResult.value);
    } else {
      errors.push(`Users: ${usersResult.reason?.message || 'Failed to load'}`);
    }

    if (errors.length > 0) {
      setDataError(errors.join(' | '));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData, user]);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const logs = await getAuditLogs();
        setAuditLog(logs as AdminAuditEntry[]);
        setAuditError('');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load audit logs.';
        setAuditError(message);
      }
    };
    loadLogs();
  }, []);

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0] || 'analytics');
    }
  }, [activeTab, availableTabs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ADMIN_ACTIVE_TAB_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!canManageSettings || activeTab !== 'settings') {
      setSettingsAutoSaveState('idle');
      return;
    }

    if (!settingsBootstrappedRef.current) {
      settingsBootstrappedRef.current = true;
      return;
    }

    if (settingsAutoSaveTimerRef.current) {
      window.clearTimeout(settingsAutoSaveTimerRef.current);
    }

    settingsAutoSaveTimerRef.current = window.setTimeout(async () => {
      try {
        setSettingsAutoSaveState('saving');
        await updateWebsiteSettings(
          { primaryColor, logoUrl, socialLinks, footerSections, pageContent },
          { requireCloud: true }
        );
        setSettingsAutoSaveState('saved');
      } catch {
        setSettingsAutoSaveState('error');
      }
    }, 900);

    return () => {
      if (settingsAutoSaveTimerRef.current) {
        window.clearTimeout(settingsAutoSaveTimerRef.current);
        settingsAutoSaveTimerRef.current = null;
      }
    };
  }, [activeTab, canManageSettings, primaryColor, logoUrl, socialLinks, footerSections, pageContent]);

  useEffect(() => {
    if (hasVariants) {
      setSelectedImageFiles([]);
      setProductForm((prev) => ({ ...prev, images: [], stock: 0, reservedStock: 0, sold: 0 }));
    } else {
      setVariantCards([]);
      setDefaultVariant('');
    }
  }, [hasVariants]);

  useEffect(() => {
    if (!hasVariants) return;
    const labels = variantCards
      .map((variant) => variant.color.trim())
      .filter((label) => label !== '');
    if (labels.length === 0) return;
    if (!labels.includes(defaultVariant)) {
      setDefaultVariant(labels[0]);
    }
  }, [hasVariants, variantCards, defaultVariant]);

  if (!isAdmin) return <div className="p-10 text-center text-red-500">Access Denied. Admin only.</div>;

  const handleOpenAddProduct = () => {
    setProductForm(initialProductState);
    setFeaturesString('');
    setSpecsString('');
    setSelectedImageFiles([]);
    setHasVariants(false);
    setVariantCards([]);
    setDefaultVariant('');
    setIsEditing(false);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    const reservedStock = Number(product.reservedStock || 0);
    const stock = Number(product.stock || 0);
    const basePrice = Number(product.salePrice ?? product.price ?? 0);
    const rawVariants = Array.isArray(product.variants) ? product.variants : [];
    const editingHasVariants = rawVariants.length > 0 || Boolean(product.colors?.length || product.variations?.length);
    const builtCards: AdminVariantCard[] =
      rawVariants.length > 0
        ? rawVariants.map((variant, index) => ({
            variantId: `v_${index}_${Date.now()}`,
            color: String(variant.colorName || variant.color || '').trim(),
            colorHex: String(variant.colorHex || variant.hex || '#6b7280'),
            sizes:
              (variant.sizes || [])
                .map((sizeRow) => ({
                  id: createVariantSizeRow().id,
                  size: String(sizeRow.size || '').trim(),
                  stock: Number(sizeRow.stock || 0),
                }))
                .filter((sizeRow) => sizeRow.size !== '') || [],
            priceOverride: Number(variant.price || basePrice) !== basePrice ? Number(variant.price || 0) : null,
            images: variant.images || [],
            selectedFiles: [],
            dragImageIndex: null,
          }))
        : (product.colors || []).map((color, index) => ({
            variantId: `v_legacy_${index}_${Date.now()}`,
            color: color.name,
            colorHex: color.hex || '#6b7280',
            sizes: [{ ...createVariantSizeRow(), size: 'Standard', stock: Number(color.stock || 0) }],
            priceOverride: null,
            images: color.images || [],
            selectedFiles: [],
            dragImageIndex: null,
          }));
    setProductForm({
      ...product,
      mrp: product.mrp ?? product.price,
      salePrice: product.salePrice ?? product.price,
      reservedStock,
      sold: Number(product.sold || 0),
      weight: product.weight || '',
      bandType: product.bandType || '',
      colors: product.colors || [],
      inStock: product.inStock ?? stock - reservedStock > 0,
    });
    setFeaturesString(product.features?.join('\n') || '');
    setSpecsString(Object.entries(product.specs || {}).map(([k, v]) => `${k}: ${v}`).join('\n'));
    setSelectedImageFiles([]);
    setHasVariants(editingHasVariants);
    setVariantCards(builtCards);
    setDefaultVariant(product.defaultVariant || builtCards[0]?.color || '');
    setIsEditing(true);
    setShowProductModal(true);
  };

  const createVariantCard = (): AdminVariantCard => ({
    variantId: `v_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    color: '',
    colorHex: '#6b7280',
    sizes: [createVariantSizeRow()],
    priceOverride: null,
    images: [],
    selectedFiles: [],
    dragImageIndex: null,
  });

  const addVariantCard = () => {
    setVariantCards((prev) => [...prev, createVariantCard()]);
  };

  const removeVariantCard = (variantId: string) => {
    setVariantCards((prev) => {
      const next = prev.filter((variant) => variant.variantId !== variantId);
      const labels = next.map((variant) => variant.color.trim()).filter((label) => label !== '');
      if (!labels.includes(defaultVariant)) {
        setDefaultVariant(labels[0] || '');
      }
      return next;
    });
  };

  const updateVariantCard = (variantId: string, patch: Partial<AdminVariantCard>) => {
    setVariantCards((prev) => prev.map((variant) => (variant.variantId === variantId ? { ...variant, ...patch } : variant)));
  };

  const addSizeRow = (variantId: string) => {
    setVariantCards((prev) =>
      prev.map((variant) =>
        variant.variantId === variantId ? { ...variant, sizes: [...variant.sizes, createVariantSizeRow()] } : variant
      )
    );
  };

  const updateSizeRow = (
    variantId: string,
    sizeId: string,
    field: 'size' | 'stock',
    value: string | number
  ) => {
    setVariantCards((prev) =>
      prev.map((variant) => {
        if (variant.variantId !== variantId) return variant;
        return {
          ...variant,
          sizes: variant.sizes.map((sizeRow) =>
            sizeRow.id === sizeId
              ? { ...sizeRow, [field]: field === 'stock' ? Number(value || 0) : String(value) }
              : sizeRow
          ),
        };
      })
    );
  };

  const removeSizeRow = (variantId: string, sizeId: string) => {
    setVariantCards((prev) =>
      prev.map((variant) => {
        if (variant.variantId !== variantId) return variant;
        const filtered = variant.sizes.filter((sizeRow) => sizeRow.id !== sizeId);
        return { ...variant, sizes: filtered.length > 0 ? filtered : [createVariantSizeRow()] };
      })
    );
  };

  const addVariantFiles = (variantId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);
    setVariantCards((prev) =>
      prev.map((variant) => {
        if (variant.variantId !== variantId) return variant;
        const seen = new Set(variant.selectedFiles.map((f) => `${f.name}_${f.size}_${f.lastModified}`));
        const next = [...variant.selectedFiles];
        incoming.forEach((file) => {
          const key = `${file.name}_${file.size}_${file.lastModified}`;
          if (!seen.has(key)) {
            seen.add(key);
            next.push(file);
          }
        });
        return { ...variant, selectedFiles: next };
      })
    );
  };

  const removeVariantExistingImage = (variantId: string, imageIndex: number) => {
    setVariantCards((prev) =>
      prev.map((variant) =>
        variant.variantId === variantId
          ? { ...variant, images: variant.images.filter((_, idx) => idx !== imageIndex) }
          : variant
      )
    );
  };

  const removeVariantSelectedFile = (variantId: string, fileIndex: number) => {
    setVariantCards((prev) =>
      prev.map((variant) =>
        variant.variantId === variantId
          ? { ...variant, selectedFiles: variant.selectedFiles.filter((_, idx) => idx !== fileIndex) }
          : variant
      )
    );
  };

  const reorderVariantImage = (variantId: string, fromIndex: number, toIndex: number) => {
    setVariantCards((prev) =>
      prev.map((variant) => {
        if (variant.variantId !== variantId) return variant;
        const next = [...variant.images];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return { ...variant, images: next };
      })
    );
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const incoming = Array.from(e.target.files);
      setSelectedImageFiles((prev) => {
        const seen = new Set(prev.map((f) => `${f.name}_${f.size}_${f.lastModified}`));
        const next = [...prev];
        incoming.forEach((file) => {
          const key = `${file.name}_${file.size}_${file.lastModified}`;
          if (!seen.has(key)) {
            seen.add(key);
            next.push(file);
          }
        });
        return next;
      });
      // Reset so selecting the same file again still fires onChange.
      e.target.value = '';
    }
  };

  const reorderExistingImages = (fromIndex: number, toIndex: number) => {
    setProductForm((prev) => {
      const arr = [...(prev.images || [])];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      return { ...prev, images: arr };
    });
  };
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const uploadedImageUrls: string[] = [];
      for (const file of selectedImageFiles) {
        const path = `products/${Date.now()}_${file.name}`;
        const url = await uploadPermanentProductImage(file, path);
        if (url) uploadedImageUrls.push(url);
      }

      const finalVideoUrl = productForm.videoUrl || '';

      const finalImages = [...(productForm.images || []), ...uploadedImageUrls];
      if (!hasVariants && finalImages.length === 0) finalImages.push('https://picsum.photos/400');

      const cleanFeatures = parseFeatureLines(featuresString);
      const cleanSpecs = parseSpecsText(specsString);

      const normalizedVariantCards = await Promise.all(
        variantCards.map(async (variant, idx) => {
          const uploadedVariantUrls: string[] = [];
          for (const file of variant.selectedFiles) {
            const path = `products/variants/${Date.now()}_${variant.variantId}_${file.name}`;
            const url = await uploadPermanentProductImage(file, path);
            if (url) uploadedVariantUrls.push(url);
          }
          const mergedImages = [...variant.images, ...uploadedVariantUrls];
          const normalizedSizes = (variant.sizes || [])
            .map((sizeRow) => ({ ...sizeRow, size: String(sizeRow.size || '').trim(), stock: Number(sizeRow.stock || 0) }))
            .filter((sizeRow) => sizeRow.size !== '');
          return {
            ...variant,
            priceOverride: variant.priceOverride == null ? null : Number(variant.priceOverride || 0),
            images: mergedImages.length ? mergedImages : ['https://picsum.photos/400'],
            sizes: normalizedSizes.length > 0 ? normalizedSizes : [{ ...createVariantSizeRow(), size: 'Standard', stock: 0 }],
            label: variant.color.trim() || `Variant ${idx + 1}`,
          };
        })
      );

      const sanitizedColors = hasVariants
        ? normalizedVariantCards.map((variant) => ({
            name: variant.label,
            hex: variant.colorHex || '#6b7280',
            images: variant.images,
            stock: variant.sizes.reduce((sum, sizeRow) => sum + Number(sizeRow.stock || 0), 0),
            reservedStock: 0,
            sold: 0,
          }))
        : [];

      const mappedVariations = hasVariants
        ? normalizedVariantCards.flatMap((variant) =>
            variant.sizes.map((sizeRow) => ({
              id: `${variant.variantId}_${sizeRow.id}`,
              size: sizeRow.size,
              weight: productForm.weight || '',
              color: variant.color || '',
              price: Number(variant.priceOverride ?? productForm.salePrice ?? productForm.price ?? 0),
              stock: Number(sizeRow.stock || 0),
            }))
          )
        : [];

      const mappedVariants = hasVariants
        ? normalizedVariantCards.map((variant) => ({
            colorName: variant.label,
            colorHex: variant.colorHex || '#6b7280',
            price: Number(variant.priceOverride ?? productForm.salePrice ?? productForm.price ?? 0),
            images: variant.images,
            sizes: variant.sizes.map((sizeRow) => ({ size: sizeRow.size, stock: Number(sizeRow.stock || 0) })),
          }))
        : [];

      const aggregateStock = hasVariants
        ? normalizedVariantCards.reduce(
            (sum, variant) => sum + variant.sizes.reduce((sizeSum, sizeRow) => sizeSum + Number(sizeRow.stock || 0), 0),
            0
          )
        : Number(productForm.stock || 0);
      const aggregateReserved = hasVariants ? 0 : Number(productForm.reservedStock || 0);
      const aggregateSold = hasVariants ? 0 : Number(productForm.sold || 0);
      const variantDisplayImages = hasVariants
        ? normalizedVariantCards.flatMap((variant) => variant.images).slice(0, 12)
        : finalImages;

      const productData = {
        ...productForm,
        mrp: Number(productForm.mrp || 0),
        salePrice: Number(productForm.salePrice || 0),
        price: Number(productForm.salePrice || productForm.price || 0),
        stock: aggregateStock,
        reservedStock: aggregateReserved,
        sold: aggregateSold,
        inStock: aggregateStock - aggregateReserved > 0,
        weight: productForm.weight || '',
        bandType: (productForm.category || '').toLowerCase() === 'smart bands' ? productForm.bandType || '' : '',
        colors: sanitizedColors,
        variants: mappedVariants,
        defaultVariant: hasVariants ? (defaultVariant || mappedVariants[0]?.colorName || '') : '',
        variations: mappedVariations,
        images: variantDisplayImages,
        videoUrl: finalVideoUrl,
        features: cleanFeatures,
        specs: cleanSpecs,
      } as Product;

      const savedProduct = isEditing && productData.id
        ? productData
        : { ...productData, id: createProductId(), rating: 0, reviewCount: 0 };

      setProducts((prev) => {
        const exists = prev.some((item) => item.id === savedProduct.id);
        return exists
          ? prev.map((item) => (item.id === savedProduct.id ? savedProduct : item))
          : [savedProduct, ...prev];
      });

      let backendSyncWarning = '';
      if (isEditing && productData.id) {
        try {
          await updateProductContentFields(savedProduct.id, {
            description: savedProduct.description || '',
            features: cleanFeatures,
            specs: cleanSpecs,
          });
        } catch (syncError) {
          backendSyncWarning = syncError instanceof Error ? syncError.message : 'Content fields backend sync failed after local save.';
        }
        try {
          await updateProduct(savedProduct);
        } catch (syncError) {
          const updateWarning = syncError instanceof Error ? syncError.message : 'Backend sync failed after local save.';
          backendSyncWarning = backendSyncWarning ? `${backendSyncWarning} ${updateWarning}` : updateWarning;
        }
        pushAudit('Product Updated', `${savedProduct.name} (${savedProduct.id})`);
      } else {
        try {
          await addProduct(savedProduct);
        } catch (syncError) {
          backendSyncWarning = syncError instanceof Error ? syncError.message : 'Backend sync failed after local save.';
        }
        pushAudit('Product Created', savedProduct.name);
      }

      setShowProductModal(false);
      if (backendSyncWarning) {
        alert(`Product updated on this device. Backend sync warning: ${backendSyncWarning}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save product. Please retry.';
      alert(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setConfirmState({
      open: true,
      title: 'Delete Product',
      message: `Delete ${product.name}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        await deleteProduct(product.id);
        pushAudit('Product Deleted', `${product.name} (${product.id})`);
        await refreshData();
      },
    });
  };

  const handleStatusUpdate = async (orderId: string, status: Order['status']) => {
    await updateOrderStatus(orderId, status);
    pushAudit('Order Status Updated', `${orderId} -> ${status}`);
    await refreshData();
  };

  const handleDeleteOrder = (order: Order) => {
    setConfirmState({
      open: true,
      title: 'Delete Order',
      message: `Delete order ${order.id}? This removes it from the admin order list.`,
      confirmLabel: 'Delete Order',
      onConfirm: async () => {
        await deleteOrder(order.id);
        pushAudit('Order Deleted', order.id);
        await refreshData();
      },
    });
  };

  const handleDeleteOrders = (targetOrders: Order[]) => {
    const uniqueOrders = targetOrders.filter(
      (order, index, list) => list.findIndex((item) => item.id === order.id) === index
    );
    if (uniqueOrders.length === 0) return;

    setConfirmState({
      open: true,
      title: 'Delete Selected Orders',
      message: `Delete ${uniqueOrders.length} selected order${uniqueOrders.length === 1 ? '' : 's'}? This removes them from the admin order list.`,
      confirmLabel: 'Delete Selected',
      onConfirm: async () => {
        await Promise.all(uniqueOrders.map((order) => deleteOrder(order.id)));
        pushAudit('Orders Bulk Deleted', uniqueOrders.map((order) => order.id).join(', '));
        await refreshData();
      },
    });
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await addCategory(newCategory.trim());
      pushAudit('Category Added', newCategory.trim());
      setNewCategory('');
      await refreshData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add category.';
      alert(message);
    }
  };

  const handleDeleteCategory = (cat: string) => {
    setConfirmState({
      open: true,
      title: 'Delete Category',
      message: `Delete category ${cat}?`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await deleteCategory(cat);
          pushAudit('Category Deleted', cat);
          await refreshData();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete category.';
          alert(message);
        }
      },
    });
  };

  const handleQuickStockUpdate = async (product: Product, amount: number) => {
    const newStock = Math.max(0, product.stock + amount);
    const availableAfterUpdate = newStock - (product.reservedStock || 0);
    await updateProduct({ ...product, stock: newStock, inStock: availableAfterUpdate > 0 });
    pushAudit('Stock Updated', `${product.name}: +${amount}`);
    await refreshData();
  };

  const handleBulkStockUpdate = async (amount: number, productIds: string[]) => {
    await Promise.all(
      products
        .filter((p) => productIds.includes(p.id))
        .map((p) => {
          const newStock = Math.max(0, p.stock + amount);
          const available = newStock - (p.reservedStock || 0);
          return updateProduct({ ...p, stock: newStock, inStock: available > 0 });
        })
    );
    pushAudit('Bulk Stock Updated', `${productIds.length} products, amount ${amount}`);
    await refreshData();
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      alert('Only superadmin can create admins.');
      return;
    }
    if (newAdminPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    try {
      await addNewAdmin(newAdminEmail, newAdminName, newAdminPassword, newAdminPermissions);
      pushAudit('Admin Added', newAdminEmail);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminPermissions({
        analytics: true,
        products: true,
        orders: true,
        inventory: true,
        categories: true,
        support: true,
        admins: false,
        settings: false,
      });
      await refreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Error adding admin: ${msg}`);
    }
  };

  const handleDeleteAdmin = (adminId: string) => {
    if (!isSuperAdmin) {
      alert('Only superadmin can delete admins.');
      return;
    }
    if (adminId === user?.id) {
      alert('You cannot remove yourself.');
      return;
    }
    const admin = users.find((u) => u.id === adminId);
    setConfirmState({
      open: true,
      title: 'Remove Admin',
      message: `Remove ${admin?.email || adminId}?`,
      confirmLabel: 'Remove',
      onConfirm: async () => {
        await deleteAdmin(adminId);
        pushAudit('Admin Removed', admin?.email || adminId);
        await refreshData();
      },
    });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    updatePrimaryColor(color);
  };

  const handlePresetColorSelect = (color: string) => {
    updatePrimaryColor(color);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    updateLogoUrl(url);
  };

  const saveSettings = async () => {
    try {
      await updateWebsiteSettings(
        { primaryColor, logoUrl, socialLinks, footerSections, pageContent },
        { requireCloud: true }
      );
      setSettingsAutoSaveState('saved');
      pushAudit('Settings Updated');
      alert('Settings Saved');
    } catch (error) {
      setSettingsAutoSaveState('error');
      const message = error instanceof Error ? error.message : 'Backend sync failed.';
      alert(message);
    }
  };

  const handleSeed = () => {
    setConfirmState({
      open: true,
      title: 'Seed Database',
      message: 'Populate the database with default products if empty?',
      confirmLabel: 'Seed',
      onConfirm: async () => {
        await seedDatabase();
        pushAudit('Database Seeded');
        await refreshData();
      },
    });
  };

  return (
    <div className="admin-dashboard-dark min-h-screen max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10 text-white bg-dark-bg">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Enterprise control center for products, orders, and growth analytics</p>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300 mt-2">TheFutureX Admin Theme</p>
        </div>
        <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={refreshData}>Refresh Data</Button>
      </div>

      {dataError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
          Data load error: {dataError}
        </div>
      )}
      {auditError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Audit log warning: {auditError}
        </div>
      )}
      {activeTab === 'settings' && settingsAutoSaveState === 'saving' && (
        <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-700 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-200">
          Saving settings changes...
        </div>
      )}
      {activeTab === 'settings' && settingsAutoSaveState === 'saved' && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
          Settings auto-saved.
        </div>
      )}
      {activeTab === 'settings' && settingsAutoSaveState === 'error' && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
          Auto-save failed. Your draft is still kept locally. Use Save Settings to retry.
        </div>
      )}

      <div className="mb-8 rounded-xl border border-white/10 bg-dark-surface p-2 overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => {
            const allowed = hasTabAccess(tab.key);
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => allowed && setActiveTab(tab.key)}
                disabled={!allowed}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border ${
                  activeTab === tab.key
                    ? 'bg-primary-600 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                    : allowed
                    ? 'bg-transparent text-gray-300 border-transparent hover:bg-white/10'
                    : 'bg-white/5 text-gray-500 border-transparent cursor-not-allowed'
                }`}
              >
                {tab.label} {!allowed ? 'Locked' : ''}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'analytics' && (
        <AnalyticsTab products={products} orders={orders} range={analyticsRange} onRangeChange={setAnalyticsRange} />
      )}
      {activeTab === 'inventory' && (
        <InventoryTab
          products={products}
          isLoading={isLoading}
          onQuickStockUpdate={handleQuickStockUpdate}
          onBulkStockUpdate={handleBulkStockUpdate}
        />
      )}
      {activeTab === 'products' && (
        <ProductsTab
          products={products}
          categories={categories}
          isLoading={isLoading}
          onAdd={handleOpenAddProduct}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />
      )}
      {activeTab === 'orders' && (
        <OrdersTab
          orders={orders}
          users={users}
          isLoading={isLoading}
          onStatusUpdate={handleStatusUpdate}
          onDeleteOrder={handleDeleteOrder}
          onDeleteOrders={handleDeleteOrders}
        />
      )}
      {activeTab === 'categories' && (
        <CategoriesTab
          categories={categories}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}
      {activeTab === 'reviews' && (
        <ReviewsTab products={products} />
      )}
      {activeTab === 'support' && (
        <SupportTab />
      )}
      {activeTab === 'admins' && (
        <AdminsTab
          users={users}
          isSuperAdmin={isSuperAdmin}
          currentUserId={user?.id}
          newAdminName={newAdminName}
          setNewAdminName={setNewAdminName}
          newAdminEmail={newAdminEmail}
          setNewAdminEmail={setNewAdminEmail}
          newAdminPassword={newAdminPassword}
          setNewAdminPassword={setNewAdminPassword}
          newAdminPermissions={newAdminPermissions}
          setNewAdminPermissions={setNewAdminPermissions}
          onAddAdmin={handleAddAdmin}
          onDeleteAdmin={handleDeleteAdmin}
        />
      )}
      {activeTab === 'settings' && (
        <SettingsTab
          primaryColor={primaryColor}
          logoUrl={logoUrl}
          socialLinks={socialLinks}
          footerSections={footerSections}
          pageContent={pageContent}
          onColorChange={handleColorChange}
          onPresetColorSelect={handlePresetColorSelect}
          onLogoChange={handleLogoChange}
          onSocialLinksChange={updateSocialLinks}
          onFooterSectionsChange={updateFooterSections}
          onPageContentChange={updatePageContent}
          onSave={saveSettings}
          onSeed={handleSeed}
        />
      )}

      <div className="mt-10 bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-white/10 p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Admin Audit Log</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {auditLog.map((log) => (
            <div key={log.id} className="text-sm text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-white/10 pb-2">
              <p className="font-semibold text-gray-900 dark:text-white">{log.action}</p>
              <p>{log.details || 'No details'}</p>
              <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()} by {log.actor}</p>
            </div>
          ))}
          {auditLog.length === 0 && <p className="text-sm text-gray-500">No admin actions recorded yet.</p>}
        </div>
      </div>
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-3xl max-h-[92dvh] rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-white/10 p-4 sm:p-6 overflow-hidden flex flex-col">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 shrink-0">{isEditing ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSaveProduct} className="space-y-4 overflow-y-auto pr-2">
              <section className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Basic Product Details</h3>
                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Product ID</label>
                    <input className={inputClass} value={productForm.id || ''} readOnly />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Product Name</label>
                    <input className={inputClass} value={productForm.name || ''} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Category</label>
                    <select className={inputClass} value={productForm.category || ''} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}>
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">MRP</label>
                    <input type="number" className={inputClass} value={productForm.mrp ?? 0} onChange={(e) => setProductForm({ ...productForm, mrp: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Sale Price</label>
                    <input type="number" className={inputClass} value={productForm.salePrice ?? 0} onChange={(e) => setProductForm({ ...productForm, salePrice: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Weight</label>
                    <input className={inputClass} value={productForm.weight || ''} onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Warranty</label>
                    <input className={inputClass} value={productForm.warranty || ''} onChange={(e) => setProductForm({ ...productForm, warranty: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Band Type (Optional)</label>
                  <input className={inputClass} value={productForm.bandType || ''} onChange={(e) => setProductForm({ ...productForm, bandType: e.target.value })} placeholder="e.g. Sport Loop" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Full Description</label>
                  <RichTextEditor value={productForm.description || ''} onChange={(html) => setProductForm((prev) => ({ ...prev, description: html }))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Key Features</label>
                    <textarea
                      className={`${inputClass} min-h-[120px]`}
                      value={featuresString}
                      onChange={(e) => setFeaturesString(e.target.value)}
                      placeholder={'Add one bullet per line\nExample:\n- IP68 Waterproof\n- 10-Day Battery'}
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Each line becomes one point on the product page. Use - or * for dots, or 1. 2. 3. for a numbered list.
                    </p>
                    {featuresString.trim() && (
                      <ul className={`mt-3 space-y-2 rounded-lg border border-white/10 bg-black/20 p-3 pl-7 text-sm text-gray-200 ${featuresString.split('\n').some((feature) => /^\s*\d+[.)]\s*/.test(feature)) ? 'list-decimal' : 'list-disc'}`}>
                        {featuresString
                          .split('\n')
                          .map((feature) => feature.replace(/^\s*(?:[-*\u2022]\s*|\d+[.)]\s*)/, '').trim())
                          .filter(Boolean)
                          .map((feature, idx) => (
                            <li key={`${feature}_${idx}`}>{feature}</li>
                          ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Specifications (Key: Value)</label>
                    <textarea
                      className={`${inputClass} min-h-[120px]`}
                      value={specsString}
                      onChange={(e) => setSpecsString(e.target.value)}
                      placeholder={'Battery: 60mAh\nWater Resistance = IP68\nMaterial - Stainless Steel'}
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Use Key: Value, Key = Value, or Key - Value. These exact rows appear in the user Specs tab.
                    </p>
                    {Object.keys(parsedSpecsPreview).length > 0 && (
                      <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-gray-200">
                        {Object.entries(parsedSpecsPreview).map(([key, value]) => (
                          <div key={key} className="flex items-start justify-between gap-3 border-b border-white/10 py-2 last:border-b-0">
                            <span className="font-semibold text-white">{key}</span>
                            <span className="text-right text-gray-300">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={Boolean(productForm.isBestSeller)} onChange={(e) => setProductForm({ ...productForm, isBestSeller: e.target.checked })} />
                    Best Seller
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={Boolean(productForm.isFeatured)} onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })} />
                    New Arrival
                  </label>
                </div>
              </section>

              <section className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Product Type</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="radio" name="productType" checked={!hasVariants} onChange={() => setHasVariants(false)} />
                    Simple Product (No Color / No Size)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="radio" name="productType" checked={hasVariants} onChange={() => setHasVariants(true)} />
                    Variant Product (With Color / Size)
                  </label>
                </div>
              </section>

              {!hasVariants && (
                <section className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Simple Inventory</h3>
                  <div className="max-w-xs">
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Total Stock</label>
                    <input type="number" className={inputClass} value={productForm.stock ?? 0} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Current Images (drag to reorder)</label>
                    <div className="flex flex-wrap gap-3">
                      {(productForm.images || []).map((img, idx) => (
                        <div
                          key={`${img}_${idx}`}
                          draggable
                          onDragStart={() => setDragImageIndex(idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (dragImageIndex === null || dragImageIndex === idx) return;
                            reorderExistingImages(dragImageIndex, idx);
                            setDragImageIndex(null);
                          }}
                          className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10"
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setProductForm((prev) => ({ ...prev, images: (prev.images || []).filter((_, i) => i !== idx) }))}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs"
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <input type="file" accept="image/*" multiple onChange={handleImageFileSelect} className="block w-full text-sm text-gray-500 dark:text-gray-300" />
                  {selectedImageFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300">New images selected: {selectedImageFiles.length}</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedImageFiles.map((file, idx) => (
                          <div key={`${file.name}_${file.size}_${file.lastModified}_${idx}`} className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 px-2 py-1 text-xs text-gray-700 dark:text-gray-300">
                            <span className="max-w-[180px] truncate">{file.name}</span>
                            <button type="button" className="text-red-600 dark:text-red-400" onClick={() => setSelectedImageFiles((prev) => prev.filter((_, fileIdx) => fileIdx !== idx))}>
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {hasVariants && (
                <section className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Product Variants</h3>
                    <Button type="button" size="sm" variant="outline" onClick={addVariantCard}>+ Add Variant</Button>
                  </div>
                  {variantCards.length > 0 && (
                    <div className="max-w-sm">
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Default Variant</label>
                      <select
                        className={inputClass}
                        value={defaultVariant}
                        onChange={(e) => setDefaultVariant(e.target.value)}
                      >
                        <option value="">Select default variant</option>
                        {variantCards
                          .map((variant) => variant.color.trim())
                          .filter((label) => label !== '')
                          .map((label) => (
                            <option key={label} value={label}>
                              {label}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                  {variantCards.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No variants added yet.</p>}
                  {variantCards.map((variant, idx) => (
                    <div key={variant.variantId} className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Variant #{idx + 1}</p>
                        <Button type="button" size="sm" variant="danger" onClick={() => removeVariantCard(variant.variantId)}>Delete Variant</Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                        <div className="lg:col-span-2">
                          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Color Name (Optional)</label>
                          <input className={inputClass} value={variant.color} onChange={(e) => updateVariantCard(variant.variantId, { color: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Color Hex</label>
                          <input type="color" className="h-10 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" value={variant.colorHex} onChange={(e) => updateVariantCard(variant.variantId, { colorHex: e.target.value })} />
                        </div>
                        <div className="lg:col-span-2">
                          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Price Override</label>
                          <input type="number" className={inputClass} value={variant.priceOverride ?? ''} onChange={(e) => updateVariantCard(variant.variantId, { priceOverride: e.target.value === '' ? null : Number(e.target.value) })} />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            size="sm"
                            variant={defaultVariant === variant.color.trim() ? 'primary' : 'outline'}
                            onClick={() => setDefaultVariant(variant.color.trim())}
                            disabled={!variant.color.trim()}
                          >
                            Set as default
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sizes & Stock</label>
                          <Button type="button" size="sm" variant="outline" onClick={() => addSizeRow(variant.variantId)}>+ Add Size</Button>
                        </div>
                        {(variant.sizes || []).map((sizeRow) => (
                          <div key={sizeRow.id} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                            <div className="sm:col-span-3">
                              <input
                                className={inputClass}
                                placeholder="Size (e.g. 7, 8, L, XL)"
                                value={sizeRow.size}
                                onChange={(e) => updateSizeRow(variant.variantId, sizeRow.id, 'size', e.target.value)}
                              />
                            </div>
                            <div className="sm:col-span-1">
                              <input
                                type="number"
                                className={inputClass}
                                placeholder="Stock"
                                value={sizeRow.stock}
                                onChange={(e) => updateSizeRow(variant.variantId, sizeRow.id, 'stock', Number(e.target.value))}
                              />
                            </div>
                            <div className="sm:col-span-1">
                              <Button type="button" size="sm" variant="danger" className="w-full" onClick={() => removeSizeRow(variant.variantId, sizeRow.id)}>
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Total variant stock: {(variant.sizes || []).reduce((sum, sizeRow) => sum + Number(sizeRow.stock || 0), 0)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Variant Images (drag to reorder)</label>
                        <div className="flex flex-wrap gap-3">
                          {variant.images.map((img, imageIdx) => (
                            <div
                              key={`${img}_${imageIdx}`}
                              draggable
                              onDragStart={() => updateVariantCard(variant.variantId, { dragImageIndex: imageIdx })}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => {
                                if (variant.dragImageIndex === null || variant.dragImageIndex === imageIdx) return;
                                reorderVariantImage(variant.variantId, variant.dragImageIndex, imageIdx);
                                updateVariantCard(variant.variantId, { dragImageIndex: null });
                              }}
                              className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10"
                            >
                              <img src={img} alt="" className="w-full h-full object-cover" />
                              <button type="button" onClick={() => removeVariantExistingImage(variant.variantId, imageIdx)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs">x</button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="block w-full text-sm text-gray-500 dark:text-gray-300"
                        onChange={(e) => {
                          addVariantFiles(variant.variantId, e.target.files);
                          e.target.value = '';
                        }}
                      />
                      {variant.selectedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {variant.selectedFiles.map((file, fileIdx) => (
                            <div key={`${variant.variantId}_${file.name}_${fileIdx}`} className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 px-2 py-1 text-xs text-gray-700 dark:text-gray-300">
                              <span className="max-w-[180px] truncate">{file.name}</span>
                              <button type="button" className="text-red-600 dark:text-red-400" onClick={() => removeVariantSelectedFile(variant.variantId, fileIdx)}>Remove</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              )}

              <section className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Optional Product Video</h3>
                <input
                  className={inputClass}
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={productForm.videoUrl || ''}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                />
              </section>

              <div className="flex justify-end gap-2 pt-3 sticky bottom-0 bg-white dark:bg-dark-surface">
                <Button type="button" variant="outline" onClick={() => setShowProductModal(false)} disabled={isUploading}>Cancel</Button>
                <Button type="submit" isLoading={isUploading}>{isUploading ? 'Saving...' : 'Save Product'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmState?.open)}
        title={confirmState?.title || ''}
        message={confirmState?.message || ''}
        confirmLabel={confirmState?.confirmLabel || 'Confirm'}
        onCancel={() => setConfirmState(null)}
        onConfirm={async () => {
          if (!confirmState) return;
          await confirmState.onConfirm();
          setConfirmState(null);
        }}
      />
    </div>
  );
};


