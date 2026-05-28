<<<<<<< HEAD

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
  getOfferLeads,
  getProductNotifyRequests,
  getProducts,
  getSiteAnalyticsEvents,
  seedDatabase,
  updateOrderStatus,
  updateOrderTracking,
  updateProduct,
  updateProductContentFields,
  updateWebsiteSettings,
  uploadFile,
} from '../services/backend';
import { deleteProductFromMerchant, syncAllProductsToMerchant, syncProductToMerchant } from '../services/merchantSync';
import { OfferLead, Order, Product, ProductNotifyRequest, SiteAnalyticsEvent, User, UserPermissions } from '../types';
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
  videoUrl: string;
  selectedVideoFile: File | null;
  selectedFiles: File[];
  dragImageIndex: number | null;
}

interface BulkStockUndoState {
  amount: number;
  products: Array<{ id: string; name: string; previousStock: number; nextStock: number }>;
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

const uploadPermanentProductVideo = async (file: File, path: string): Promise<string> => {
  const url = await uploadFile(file, path);
  if (!isPermanentImageUrl(url)) {
    throw new Error(`Video "${file.name}" could not be saved to cloud storage. Please retry with a smaller MP4 file or check Firebase Storage access.`);
  }
  return url;
};

const getVideoDuration = (file: File): Promise<number> =>
  new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unable to read video duration.'));
    };
    video.src = url;
  });

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
const ADMIN_LAST_BULK_STOCK_UNDO_KEY = 'aura_admin_last_bulk_stock_undo';
const ADMIN_MERCHANT_AUTO_SYNC_KEY = 'aura_admin_merchant_auto_sync_done';

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
=======
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    getProducts, getAllOrders, addProduct, deleteProduct, updateOrderStatus, 
    updateProduct, getCategories, addCategory, deleteCategory, updateWebsiteSettings, getWebsiteSettings,
    getAllUsers, addNewAdmin, seedDatabase, uploadFile
} from '../services/backend';
import { Product, Order, User } from '../types';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { updatePrimaryColor, primaryColor, updateLogoUrl, logoUrl } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'analytics' | 'inventory' | 'products' | 'orders' | 'categories' | 'admins' | 'settings'>('analytics');
  
  // Data State
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
<<<<<<< HEAD
  const [notifyRequests, setNotifyRequests] = useState<ProductNotifyRequest[]>([]);
  const [offerLeads, setOfferLeads] = useState<OfferLead[]>([]);
  const [siteAnalyticsEvents, setSiteAnalyticsEvents] = useState<SiteAnalyticsEvent[]>([]);
  const [lastBulkStockUpdate, setLastBulkStockUpdate] = useState<BulkStockUndoState | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(ADMIN_LAST_BULK_STOCK_UNDO_KEY);
      return raw ? (JSON.parse(raw) as BulkStockUndoState) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [merchantSyncWarning, setMerchantSyncWarning] = useState('');
  const [auditError, setAuditError] = useState('');
  const [analyticsRange, setAnalyticsRange] = useState<AnalyticsRange>('30d');

=======
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal States
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

<<<<<<< HEAD
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
=======
  // New/Edit Product Form State
  const initialProductState: Partial<Product> = {
    name: '',
    price: 0,
    category: 'Smart Bands',
    description: '',
    stock: 0,
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
    images: [],
    videoUrl: '',
    features: [],
    specs: {},
    warranty: '',
    isFeatured: false,
<<<<<<< HEAD
    isBestSeller: false,
    variations: [],
    variants: [],
    defaultVariant: '',
  };

  const [productForm, setProductForm] = useState<Partial<Product>>(initialProductState);
  const [featuresString, setFeaturesString] = useState('');
  const [specsString, setSpecsString] = useState('');
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
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
  const merchantAutoSyncStartedRef = useRef(false);

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
    const results = await Promise.allSettled([
      getProducts(),
      getAllOrders(),
      getCategories(),
      getAllUsers(),
      getProductNotifyRequests(),
      getOfferLeads(),
      getSiteAnalyticsEvents(),
    ]);
    const [productsResult, ordersResult, categoriesResult, usersResult, notifyRequestsResult, offerLeadsResult, siteAnalyticsResult] = results;

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

    if (notifyRequestsResult.status === 'fulfilled') {
      setNotifyRequests(notifyRequestsResult.value);
    } else {
      errors.push(`Notify requests: ${notifyRequestsResult.reason?.message || 'Failed to load'}`);
    }

    if (offerLeadsResult.status === 'fulfilled') {
      setOfferLeads(offerLeadsResult.value);
    } else {
      errors.push(`Offer leads: ${offerLeadsResult.reason?.message || 'Failed to load'}`);
    }

    if (siteAnalyticsResult.status === 'fulfilled') {
      setSiteAnalyticsEvents(siteAnalyticsResult.value);
    } else {
      errors.push(`Site analytics: ${siteAnalyticsResult.reason?.message || 'Failed to load'}`);
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
    if (!user || products.length === 0 || merchantAutoSyncStartedRef.current) return;
    if (!(user.role === 'admin' || user.role === 'superadmin')) return;
    if (typeof window !== 'undefined' && window.sessionStorage.getItem(ADMIN_MERCHANT_AUTO_SYNC_KEY) === 'true') return;

    merchantAutoSyncStartedRef.current = true;
    void syncAllProductsToMerchant(products)
      .then((result) => {
        const failed = Number(result.failed || 0);
        if (failed > 0) {
          const firstError = result.results?.find((item) => !item.ok)?.error || 'Some products failed to sync.';
          setMerchantSyncWarning(`Merchant auto-sync warning: ${firstError}`);
          merchantAutoSyncStartedRef.current = false;
          return;
        }
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(ADMIN_MERCHANT_AUTO_SYNC_KEY, 'true');
        }
        setMerchantSyncWarning('');
      })
      .catch((error) => {
        setMerchantSyncWarning(`Merchant auto-sync warning: ${error instanceof Error ? error.message : 'Merchant sync failed.'}`);
        merchantAutoSyncStartedRef.current = false;
      });
  }, [products, user]);

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
    if (typeof window === 'undefined') return;
    if (lastBulkStockUpdate) {
      window.localStorage.setItem(ADMIN_LAST_BULK_STOCK_UNDO_KEY, JSON.stringify(lastBulkStockUpdate));
    } else {
      window.localStorage.removeItem(ADMIN_LAST_BULK_STOCK_UNDO_KEY);
    }
  }, [lastBulkStockUpdate]);

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
    setSelectedVideoFile(null);
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
            videoUrl: String(variant.videoUrl || ''),
            selectedVideoFile: null,
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
            videoUrl: String(product.videoByColor?.[color.name] || ''),
            selectedVideoFile: null,
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
    setSelectedVideoFile(null);
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
    videoUrl: '',
    selectedVideoFile: null,
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

  const handleProductVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setDataError('Please select a video file.');
      return;
    }

    try {
      const duration = await getVideoDuration(file);
      if (duration > 10) {
        setDataError('Product video must be 10 seconds or shorter.');
        return;
      }
      setDataError('');
      setSelectedVideoFile(file);
    } catch {
      setDataError('Unable to read this video. Please use a short MP4 video.');
    }
  };

  const handleVariantVideoSelect = async (variantId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setDataError('Please select a video file.');
      return;
    }

    try {
      const duration = await getVideoDuration(file);
      if (duration > 10) {
        setDataError('Variant video must be 10 seconds or shorter.');
        return;
      }
      setDataError('');
      updateVariantCard(variantId, { selectedVideoFile: file });
    } catch {
      setDataError('Unable to read this video. Please use a short MP4 video.');
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

      const uploadedVideoUrl = selectedVideoFile
        ? await uploadPermanentProductVideo(selectedVideoFile, `products/videos/${Date.now()}_${selectedVideoFile.name}`)
        : '';
      const finalVideoUrl = uploadedVideoUrl || productForm.videoUrl || '';

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
          const uploadedVariantVideoUrl = variant.selectedVideoFile
            ? await uploadPermanentProductVideo(
                variant.selectedVideoFile,
                `products/variants/videos/${Date.now()}_${variant.variantId}_${variant.selectedVideoFile.name}`
              )
            : '';
          const mergedImages = [...variant.images, ...uploadedVariantUrls];
          const finalVariantVideoUrl = uploadedVariantVideoUrl || variant.videoUrl || '';
          const normalizedSizes = (variant.sizes || [])
            .map((sizeRow) => ({ ...sizeRow, size: String(sizeRow.size || '').trim(), stock: Number(sizeRow.stock || 0) }))
            .filter((sizeRow) => sizeRow.size !== '');
          return {
            ...variant,
            priceOverride: variant.priceOverride == null ? null : Number(variant.priceOverride || 0),
            images: mergedImages.length ? mergedImages : ['https://picsum.photos/400'],
            videoUrl: finalVariantVideoUrl,
            selectedVideoFile: null,
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
            videoUrl: variant.videoUrl,
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
      const videoByColor = hasVariants
        ? normalizedVariantCards.reduce<Record<string, string>>((acc, variant) => {
            if (variant.videoUrl) acc[variant.label] = variant.videoUrl;
            return acc;
          }, {})
        : {};

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
        videoByColor,
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

      try {
        const merchantResult = await syncProductToMerchant(savedProduct);
        if (!merchantResult.ok) {
          backendSyncWarning = backendSyncWarning
            ? `${backendSyncWarning} Merchant sync failed.`
            : 'Merchant sync failed.';
        }
      } catch (syncError) {
        const merchantWarning = syncError instanceof Error ? syncError.message : 'Merchant sync failed.';
        backendSyncWarning = backendSyncWarning ? `${backendSyncWarning} ${merchantWarning}` : merchantWarning;
      }

      setShowProductModal(false);
      setSelectedVideoFile(null);
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
        try {
          await deleteProductFromMerchant(product.id);
        } catch (error) {
          alert(error instanceof Error ? `Product deleted, but Merchant delete failed: ${error.message}` : 'Product deleted, but Merchant delete failed.');
        }
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

  const handleTrackingUpdate = async (
    orderId: string,
    tracking: { trackingId?: string; trackingUrl?: string; trackingCarrier?: string }
  ) => {
    await updateOrderTracking(orderId, tracking);
    pushAudit('Order Tracking Updated', `${orderId} -> ${tracking.trackingId || '-'}`);
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
    const affectedProducts = products.filter((p) => productIds.includes(p.id));
    if (affectedProducts.length === 0) {
      alert('No low-stock products are eligible for bulk update.');
      return;
    }

    const undoState: BulkStockUndoState = {
      amount,
      products: affectedProducts.map((p) => ({
        id: p.id,
        name: p.name,
        previousStock: Number(p.stock || 0),
        nextStock: Math.max(0, Number(p.stock || 0) + amount),
      })),
    };

    await Promise.all(
      affectedProducts
        .map((p) => {
          const newStock = Math.max(0, p.stock + amount);
          const available = newStock - (p.reservedStock || 0);
          return updateProduct({ ...p, stock: newStock, inStock: available > 0 });
        })
    );
    setLastBulkStockUpdate(undoState);
    pushAudit('Bulk Stock Updated', `${productIds.length} products, amount ${amount}`);
    await refreshData();
  };

  const handleUndoBulkStockUpdate = async () => {
    if (!lastBulkStockUpdate) {
      alert('There is no bulk stock update to undo.');
      return;
    }

    const affectedIds = new Set(lastBulkStockUpdate.products.map((item) => item.id));
    const previousById = new Map(lastBulkStockUpdate.products.map((item) => [item.id, item.previousStock]));

    await Promise.all(
      products
        .filter((p) => affectedIds.has(p.id))
        .map((p) => {
          const restoredStock = previousById.get(p.id) ?? p.stock;
          const available = restoredStock - (p.reservedStock || 0);
          return updateProduct({ ...p, stock: restoredStock, inStock: available > 0 });
        })
    );

    pushAudit(
      'Bulk Stock Update Undone',
      `${lastBulkStockUpdate.products.length} products, reverted amount ${lastBulkStockUpdate.amount}`
    );
    setLastBulkStockUpdate(null);
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
      {merchantSyncWarning && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          {merchantSyncWarning}
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
        <AnalyticsTab
          products={products}
          orders={orders}
          siteEvents={siteAnalyticsEvents}
          range={analyticsRange}
          onRangeChange={setAnalyticsRange}
        />
      )}
      {activeTab === 'inventory' && (
        <InventoryTab
          products={products}
          notifyRequests={notifyRequests}
          offerLeads={offerLeads}
          isLoading={isLoading}
          lastBulkStockUpdate={lastBulkStockUpdate}
          onQuickStockUpdate={handleQuickStockUpdate}
          onBulkStockUpdate={handleBulkStockUpdate}
          onUndoBulkStockUpdate={handleUndoBulkStockUpdate}
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
          onTrackingUpdate={handleTrackingUpdate}
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

                      <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-black/20">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Variant Video</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Upload a video up to 10 seconds for this variant. It will show as the last gallery slide.</p>
                        <input
                          type="file"
                          accept="video/*"
                          className="block w-full text-sm text-gray-500 dark:text-gray-300"
                          onChange={(e) => handleVariantVideoSelect(variant.variantId, e)}
                        />
                        {variant.selectedVideoFile && (
                          <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 dark:border-white/10 dark:text-gray-300">
                            <span className="min-w-0 truncate">{variant.selectedVideoFile.name}</span>
                            <button type="button" className="shrink-0 text-red-600 dark:text-red-400" onClick={() => updateVariantCard(variant.variantId, { selectedVideoFile: null })}>
                              Remove
                            </button>
                          </div>
                        )}
                        {variant.videoUrl && (
                          <div className="overflow-hidden rounded-lg border border-gray-200 bg-black dark:border-white/10">
                            <video src={variant.videoUrl} className="h-28 w-full object-contain" controls preload="metadata" />
                          </div>
                        )}
                        <input
                          className={inputClass}
                          placeholder="Or paste variant video URL"
                          value={variant.videoUrl}
                          onChange={(e) => updateVariantCard(variant.variantId, { videoUrl: e.target.value })}
                        />
                        {variant.videoUrl && (
                          <button type="button" className="text-xs font-semibold text-red-600 dark:text-red-400" onClick={() => updateVariantCard(variant.variantId, { videoUrl: '' })}>
                            Remove saved variant video
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              <section className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Product Video</h3>
                <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">Upload an MP4/video file up to 10 seconds. It will show as the last gallery slide unless a variant has its own video.</p>
                <input type="file" accept="video/*" onChange={handleProductVideoSelect} className="mb-3 block w-full text-sm text-gray-500 dark:text-gray-300" />
                {selectedVideoFile && (
                  <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 dark:border-white/10 dark:text-gray-300">
                    <span className="min-w-0 truncate">{selectedVideoFile.name}</span>
                    <button type="button" className="shrink-0 text-red-600 dark:text-red-400" onClick={() => setSelectedVideoFile(null)}>Remove</button>
                  </div>
                )}
                {productForm.videoUrl && (
                  <div className="mb-3 overflow-hidden rounded-lg border border-gray-200 bg-black dark:border-white/10">
                    <video src={productForm.videoUrl} className="h-32 w-full object-contain" controls preload="metadata" />
                  </div>
                )}
                <input
                  className={inputClass}
                  placeholder="Or paste product video URL"
                  value={productForm.videoUrl || ''}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                />
                {productForm.videoUrl && (
                  <button type="button" className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400" onClick={() => setProductForm((prev) => ({ ...prev, videoUrl: '' }))}>
                    Remove saved video
                  </button>
                )}
              </section>

              <div className="flex justify-end gap-2 pt-3 sticky bottom-0 bg-white dark:bg-dark-surface">
                <Button type="button" variant="outline" onClick={() => setShowProductModal(false)} disabled={isUploading}>Cancel</Button>
                <Button type="submit" isLoading={isUploading}>{isUploading ? 'Saving...' : 'Save Product'}</Button>
              </div>
=======
    isBestSeller: false
  };
  const [productForm, setProductForm] = useState<Partial<Product>>(initialProductState);
  
  // Helper for specs/features strings
  const [featuresString, setFeaturesString] = useState('');
  const [specsString, setSpecsString] = useState('');

  // File Upload State
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);

  // New Category State
  const [newCategory, setNewCategory] = useState('');

  // New Admin State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  const refreshData = async () => {
     setIsLoading(true);
     try {
         const [p, o, c, u] = await Promise.all([
             getProducts(),
             getAllOrders(),
             getCategories(),
             getAllUsers()
         ]);
         setProducts(p);
         setOrders(o);
         setCategories(c);
         setUsers(u);
     } catch (e) {
         console.error("Failed to refresh admin data", e);
     } finally {
         setIsLoading(false);
     }
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  // --- ANALYTICS CALCULATIONS ---
  const analytics = useMemo(() => {
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const totalCustomers = new Set(orders.map(o => o.userId)).size;

      // Category Breakdown
      const categoryRevenue: Record<string, number> = {};
      const productSales: Record<string, number> = {};

      orders.forEach(order => {
          order.items.forEach(item => {
              const cat = item.category || 'Uncategorized';
              categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (item.price * item.quantity);
              productSales[item.id] = (productSales[item.id] || 0) + item.quantity;
          });
      });

      const maxCategoryRevenue = Math.max(...Object.values(categoryRevenue), 1); // Avoid div by zero

      const topProducts = products
          .map(p => ({ ...p, sold: (productSales[p.id] || 0) as number }))
          .sort((a, b) => b.sold - a.sold)
          .slice(0, 5);
          
      return { totalRevenue, totalOrders, avgOrderValue, totalCustomers, categoryRevenue, maxCategoryRevenue, topProducts };
  }, [orders, products]);

  // --- INVENTORY CALCULATIONS ---
  const inventoryStats = useMemo(() => {
      const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
      const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
      const lowStock = products.filter(p => p.stock < 10 && p.stock > 0);
      const outOfStock = products.filter(p => p.stock === 0);
      return { totalStock, totalValue, lowStock, outOfStock };
  }, [products]);


  if (!isAdmin) return <div className="p-10 text-center text-red-500">Access Denied. Admin only.</div>;

  // --- Product Handlers ---

  const handleOpenAddProduct = () => {
      setProductForm(initialProductState);
      setFeaturesString('');
      setSpecsString('');
      setSelectedImageFiles([]);
      setSelectedVideoFile(null);
      setIsEditing(false);
      setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
      setProductForm(product);
      setFeaturesString(product.features?.join('\n') || '');
      setSpecsString(Object.entries(product.specs || {}).map(([k, v]) => `${k}: ${v}`).join('\n'));
      setSelectedImageFiles([]);
      setSelectedVideoFile(null);
      setIsEditing(true);
      setShowProductModal(true);
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setSelectedImageFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
      }
  };

  const handleRemoveSelectedImage = (index: number) => {
      setSelectedImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (url: string) => {
      setProductForm(prev => ({
          ...prev,
          images: prev.images?.filter(img => img !== url) || []
      }));
  };

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setSelectedVideoFile(e.target.files[0]);
      }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
        // 1. Upload new images
        const uploadedImageUrls: string[] = [];
        for (const file of selectedImageFiles) {
            const path = `products/${Date.now()}_${file.name}`;
            const url = await uploadFile(file, path);
            // Only add if we got a valid string back (empty string means failed/skipped)
            if (url) uploadedImageUrls.push(url);
        }

        // 2. Upload video if selected
        // Default to existing video URL or empty string
        let finalVideoUrl = productForm.videoUrl || ''; 
        
        if (selectedVideoFile) {
            const path = `videos/${Date.now()}_${selectedVideoFile.name}`;
            const newUrl = await uploadFile(selectedVideoFile, path);
            if (newUrl) {
                finalVideoUrl = newUrl;
                if (newUrl.startsWith('blob:')) {
                    alert("⚠️ WARNING: Video upload failed to persist (Network/Size Limit). \n\nUsing a TEMPORARY SESSION URL. \n\nThis video will disappear when you refresh the page. \n\nRECOMMENDED: Upload your video to YouTube and paste the URL instead.");
                }
            }
        }

        // 3. Combine existing images with new ones
        const finalImages = [
            ...(productForm.images || []),
            ...uploadedImageUrls
        ];

        // Fallback image if none exist
        if (finalImages.length === 0) finalImages.push('https://picsum.photos/400');

        // Parse features
        const cleanFeatures = featuresString.split('\n').map(f => f.trim()).filter(f => f !== '');

        // Parse specs
        const cleanSpecs: Record<string, string> = {};
        specsString.split('\n').forEach(line => {
            const parts = line.split(':');
            if(parts.length >= 2) {
                const key = parts[0].trim();
                const val = parts.slice(1).join(':').trim();
                if(key && val) cleanSpecs[key] = val;
            }
        });

        const productData = {
            ...productForm,
            images: finalImages,
            videoUrl: finalVideoUrl,
            features: cleanFeatures,
            specs: cleanSpecs
        } as Product;

        if (isEditing && productData.id) {
            await updateProduct(productData);
        } else {
            await addProduct({
            ...productData,
            id: `p_${Date.now()}`,
            rating: 0,
            reviewCount: 0
            });
        }
        setShowProductModal(false);
        refreshData();
    } catch (error) {
        console.error("Error saving product:", error);
        alert("Failed to save product. See console for details.");
    } finally {
        setIsUploading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if(window.confirm('Are you sure?')) {
        await deleteProduct(id);
        refreshData();
    }
  };

  // --- Order Handlers ---
  const handleStatusUpdate = async (orderId: string, status: Order['status']) => {
    await updateOrderStatus(orderId, status);
    refreshData();
  };

  // --- Category Handlers ---
  const handleAddCategory = async () => {
      if(newCategory) {
          await addCategory(newCategory);
          setNewCategory('');
          refreshData();
      }
  }

  const handleDeleteCategory = async (cat: string) => {
      if(window.confirm(`Delete category ${cat}?`)) {
          await deleteCategory(cat);
          refreshData();
      }
  }

  // --- Inventory Handlers ---
  const handleQuickStockUpdate = async (product: Product, amount: number) => {
      const newStock = Math.max(0, product.stock + amount);
      await updateProduct({ ...product, stock: newStock });
      // Optimistic update
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: newStock } : p));
  }

  // --- Admin Handlers ---
  const handleAddAdmin = async (e: React.FormEvent) => {
      e.preventDefault();
      if(newAdminPassword.length < 6) {
          alert('Password must be at least 6 characters');
          return;
      }
      try {
        await addNewAdmin(newAdminEmail, newAdminName, newAdminPassword);
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPassword('');
        refreshData();
        alert('Admin added successfully. They can login with their email/password.');
      } catch (err: any) {
        alert('Error adding admin: ' + err.message);
      }
  }

  // --- Settings Handlers ---
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const color = e.target.value;
      updatePrimaryColor(color);
      updateWebsiteSettings({ primaryColor: color, logoUrl });
  };
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value;
      updateLogoUrl(url);
  }
  
  const saveSettings = async () => {
      await updateWebsiteSettings({ primaryColor, logoUrl });
      alert("Settings Saved!");
  }

  const handleSeed = async () => {
      if(confirm("This will populate the database with default products if empty. Continue?")) {
          await seedDatabase();
          refreshData();
      }
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
            {isLoading && <span className="text-sm text-primary-500 animate-pulse font-bold">Refreshing...</span>}
            <Button size="sm" variant="outline" onClick={refreshData}>
                Refresh Data
            </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2">
           {(['analytics', 'inventory', 'products', 'orders', 'categories', 'admins', 'settings'] as const).map(tab => (
               <Button 
                key={tab} 
                variant={activeTab === tab ? 'primary' : 'outline'} 
                onClick={() => setActiveTab(tab)}
                className="capitalize whitespace-nowrap"
               >
                   {tab}
               </Button>
           ))}
      </div>

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
          <div className="space-y-8 animate-fade-in-up">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                      <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Total Revenue</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">₹{analytics.totalRevenue.toLocaleString()}</p>
                      <div className="mt-2 text-xs text-green-500 font-bold">+12% vs last month</div>
                  </div>
                  <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                      <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Total Orders</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{analytics.totalOrders}</p>
                  </div>
                  <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                      <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Avg Order Value</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">₹{analytics.avgOrderValue.toFixed(0)}</p>
                  </div>
                  <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                      <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Active Customers</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{analytics.totalCustomers}</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Category Chart */}
                  <div className="bg-white dark:bg-dark-surface p-8 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Sales by Category</h3>
                      <div className="space-y-5">
                          {Object.entries(analytics.categoryRevenue).map(([cat, revenue]: [string, number]) => (
                              <div key={cat}>
                                  <div className="flex justify-between text-sm mb-1">
                                      <span className="font-medium dark:text-gray-300">{cat}</span>
                                      <span className="font-bold dark:text-white">₹{revenue.toLocaleString()}</span>
                                  </div>
                                  <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2.5">
                                      <div 
                                        className="bg-primary-500 h-2.5 rounded-full transition-all duration-1000" 
                                        style={{ width: `${(revenue / analytics.maxCategoryRevenue) * 100}%` }}
                                      ></div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Top Products */}
                  <div className="bg-white dark:bg-dark-surface p-8 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Top Performing Products</h3>
                      <div className="space-y-4">
                          {analytics.topProducts.map((p: any, i) => (
                              <div key={p.id} className="flex items-center gap-4">
                                  <span className="text-lg font-bold text-gray-400 w-6">0{i+1}</span>
                                  <div className="h-12 w-12 rounded bg-gray-100 dark:bg-white/5 overflow-hidden">
                                      <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1">
                                      <p className="font-bold text-gray-900 dark:text-white truncate">{p.name}</p>
                                      <p className="text-xs text-gray-500">{p.category}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="font-bold text-gray-900 dark:text-white">{p.sold} sold</p>
                                      <p className="text-xs text-green-500">₹{(p.sold * p.price).toLocaleString()}</p>
                                  </div>
                              </div>
                          ))}
                          {analytics.topProducts.length === 0 && <p className="text-gray-500">No sales data yet.</p>}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* INVENTORY TAB */}
      {activeTab === 'inventory' && (
          <div className="space-y-8 animate-fade-in-up">
              {/* Inventory Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm border-l-4 border-l-blue-500">
                      <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Total Inventory Value</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">₹{inventoryStats.totalValue.toLocaleString()}</p>
                  </div>
                  <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm border-l-4 border-l-purple-500">
                      <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Total Units in Stock</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{inventoryStats.totalStock}</p>
                  </div>
                  <div className={`bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm border-l-4 ${inventoryStats.lowStock.length > 0 ? 'border-l-amber-500' : 'border-l-green-500'}`}>
                      <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Low Stock Alerts</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{inventoryStats.lowStock.length}</p>
                      <p className="text-xs text-gray-500 mt-1">Items with &lt; 10 units</p>
                  </div>
              </div>

              {/* Inventory Table */}
              <div className="bg-white dark:bg-dark-surface rounded-xl shadow overflow-hidden border border-gray-200 dark:border-white/5 overflow-x-auto">
                 <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                     <h3 className="font-bold text-lg dark:text-white">Stock Control</h3>
                     <span className="text-xs text-gray-500">Real-time updates</span>
                 </div>
                 <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-white/5">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Value</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-gray-700">
                      {[...products].sort((a,b) => a.stock - b.stock).map(p => (
                        <tr key={p.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              <div className="flex items-center">
                                  <div className="h-8 w-8 rounded bg-gray-100 dark:bg-white/5 overflow-hidden mr-3">
                                    <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span>{p.name}</span>
                                    <span className="text-xs text-gray-500 font-normal">{p.id}</span>
                                  </div>
                              </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {p.stock === 0 ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  Out of Stock
                                </span>
                            ) : p.stock < 10 ? (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                                  Low Stock
                                </span>
                            ) : (
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  In Stock
                                </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-bold">
                              {p.stock} units
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              ₹{p.price}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                                onClick={() => handleQuickStockUpdate(p, 10)} 
                                className="text-primary-600 hover:text-primary-900 font-bold bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded hover:bg-primary-100 transition-colors"
                            >
                                + Quick Restock (10)
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
          </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="animate-fade-in-up">
           <div className="flex justify-end mb-4">
              <Button onClick={handleOpenAddProduct}>+ Add Product</Button>
           </div>
           <div className="bg-white dark:bg-dark-surface rounded-xl shadow overflow-hidden border border-gray-200 dark:border-white/5 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-gray-700">
                  {products.map(p => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center">
                              <img src={p.images[0]} alt="" className="h-10 w-10 rounded mr-3 object-cover" />
                              <div className="flex flex-col">
                                <span>{p.name}</span>
                                <span className="text-xs text-gray-500">{p.category}</span>
                              </div>
                          </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col gap-1">
                          {p.isBestSeller && <span className="text-xs bg-primary-900 text-primary-200 px-2 py-0.5 rounded w-fit">Best Seller</span>}
                          {p.isFeatured && <span className="text-xs bg-purple-900 text-purple-200 px-2 py-0.5 rounded w-fit">New Arrival</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">₹{p.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{p.stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button onClick={() => handleEditProduct(p)} className="text-primary-600 hover:text-primary-900">Edit</button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-fade-in-up">
           {orders.length === 0 && <div className="text-center p-10 text-gray-500">No orders found.</div>}
           {orders.map(order => {
             const orderUser = users.find(u => u.id === order.userId);
             return (
               <div key={order.id} className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/5">
                 <div className="flex flex-col md:flex-row justify-between md:items-start mb-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{order.id}</h3>
                          <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 dark:bg-white/5 rounded-full">
                            {new Date(order.date).toLocaleDateString()}
                            </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Customer Details */}
                          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 p-4 rounded-lg">
                              <p className="font-semibold text-gray-900 dark:text-gray-200 mb-1 uppercase text-xs tracking-wider">Customer</p>
                              {orderUser ? (
                                <>
                                  <p className="font-medium text-base text-gray-900 dark:text-white">{orderUser.name}</p>
                                  <p>{orderUser.email}</p>
                                  <p className="text-xs text-gray-400 mt-1">ID: {order.userId}</p>
                                </>
                              ) : (
                                <>
                                  <p className="font-medium text-amber-500">User not found (Guest?)</p>
                                  <p className="text-xs text-gray-400 mt-1">ID: {order.userId}</p>
                                </>
                              )}
                          </div>

                          {/* Shipping Details */}
                          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 p-4 rounded-lg">
                              <p className="font-semibold text-gray-900 dark:text-gray-200 mb-1 uppercase text-xs tracking-wider">Shipping To</p>
                              {order.shippingAddress ? (
                                  <>
                                    <p className="font-medium text-gray-900 dark:text-white">{order.shippingAddress.street}</p>
                                    <p>{order.shippingAddress.city}, {order.shippingAddress.zip}</p>
                                    <p>{order.shippingAddress.country}</p>
                                  </>
                              ) : (
                                  <p className="text-amber-500">Address missing</p>
                              )}
                          </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-4 mt-6 md:mt-0 md:ml-6 min-w-[200px]">
                       <div className="text-right">
                          <p className="text-sm text-gray-500 uppercase tracking-wide">Total Amount</p>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{order.total.toFixed(2)}</p>
                       </div>
                       <div className="w-full">
                           <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Order Status</label>
                           <select 
                             value={order.status} 
                             onChange={(e) => handleStatusUpdate(order.id, e.target.value as any)}
                             className={`w-full text-sm border-transparent rounded-lg shadow-sm p-2.5 font-bold focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer
                               ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                                 order.status === 'Processing' ? 'bg-blue-100 text-blue-800' : 
                                 order.status === 'Shipped' ? 'bg-purple-100 text-purple-800' : 
                                 order.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}
                             `}
                           >
                             <option value="Processing">Processing</option>
                             <option value="Shipped">Shipped</option>
                             <option value="Delivered">Delivered</option>
                             <option value="Cancelled">Cancelled</option>
                           </select>
                       </div>
                    </div>
                 </div>
                 
                 {/* Order Items */}
                 <div className="border-t border-gray-100 dark:border-white/5 pt-4 mt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Items Ordered</p>
                    <div className="space-y-3">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-white/5 overflow-hidden border border-gray-200 dark:border-white/10">
                                        <img src={item.images[0]} alt="" className="h-full w-full object-cover" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-900 dark:text-white block">{item.name}</span>
                                        <span className="text-gray-500">Qty: {item.quantity}</span>
                                    </div>
                                </div>
                                <span className="font-medium text-gray-900 dark:text-white">₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                 </div>
               </div>
             );
           })}
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
          <div className="space-y-6 animate-fade-in-up">
              <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={newCategory} 
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="New Category Name"
                    className="p-2 border rounded dark:bg-white/5 dark:text-white dark:border-white/10 flex-1"
                  />
                  <Button onClick={handleAddCategory}>Add Category</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map(cat => (
                      <div key={cat} className="flex justify-between items-center bg-white dark:bg-dark-surface p-4 rounded-lg border border-gray-200 dark:border-white/5">
                          <span className="font-medium dark:text-white">{cat}</span>
                          <button onClick={() => handleDeleteCategory(cat)} className="text-red-500 hover:text-red-700">Delete</button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* ADMINS TAB */}
      {activeTab === 'admins' && (
          <div className="space-y-8 animate-fade-in-up">
              <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-200 dark:border-white/5">
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Add New Admin</h3>
                  <form onSubmit={handleAddAdmin} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input 
                             type="text" placeholder="Name" required
                             value={newAdminName} onChange={e => setNewAdminName(e.target.value)}
                             className="p-2 border rounded dark:bg-white/5 dark:text-white dark:border-white/10"
                          />
                          <input 
                             type="email" placeholder="Email" required
                             value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)}
                             className="p-2 border rounded dark:bg-white/5 dark:text-white dark:border-white/10"
                          />
                          <input 
                             type="password" placeholder="Password (min 6 chars)" required
                             value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)}
                             className="p-2 border rounded dark:bg-white/5 dark:text-white dark:border-white/10"
                             minLength={6}
                          />
                      </div>
                      <Button type="submit">Create Admin</Button>
                  </form>
              </div>

              <div>
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Current Admins</h3>
                  <div className="space-y-2">
                      {users.filter(u => u.role === 'admin').map(admin => (
                          <div key={admin.id} className="bg-gray-50 dark:bg-white/5 p-4 rounded flex justify-between">
                              <div>
                                  <div className="font-bold dark:text-white">{admin.name}</div>
                                  <div className="text-sm text-gray-500">{admin.email}</div>
                              </div>
                              <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs h-fit">Admin</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
          <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-200 dark:border-white/5 animate-fade-in-up">
              <h3 className="text-xl font-bold mb-6 dark:text-white">Website Settings</h3>
              
              <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme Primary Color</label>
                  <div className="flex items-center gap-4">
                      <input 
                        type="color" 
                        value={primaryColor}
                        onChange={handleColorChange}
                        className="h-12 w-24 p-1 rounded cursor-pointer"
                      />
                      <span className="dark:text-white">{primaryColor}</span>
                  </div>
              </div>

              <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Custom Logo URL</label>
                  <input 
                    type="text" 
                    value={logoUrl} 
                    onChange={handleLogoChange}
                    placeholder="https://example.com/logo.png"
                    className="w-full p-2 border rounded dark:bg-white/5 dark:text-white dark:border-white/10"
                  />
                  <p className="text-sm text-gray-500 mt-2">Enter a direct image URL to replace the text logo.</p>
              </div>

              <div className="flex space-x-4">
                   <Button onClick={saveSettings}>Save Settings</Button>
                   <Button variant="secondary" onClick={handleSeed}>Seed Database (Reset)</Button>
              </div>
          </div>
      )}

      {/* Add/Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md overflow-y-auto py-10">
          <div className="bg-white dark:bg-dark-surface border dark:border-white/10 p-8 rounded-2xl w-full max-w-2xl max-h-full overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 dark:text-white">{isEditing ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSaveProduct} className="space-y-5">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                       <label className="block text-sm font-medium dark:text-gray-300 mb-1">Product Name</label>
                       <input 
                         placeholder="Name" 
                         className="w-full p-2 border rounded dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-primary-500"
                         value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} 
                         required
                       />
                   </div>
                   <div>
                       <label className="block text-sm font-medium dark:text-gray-300 mb-1">Price (₹)</label>
                       <input 
                         placeholder="Price in Rupees" type="number"
                         className="w-full p-2 border rounded dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-primary-500"
                         value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})}
                         required 
                       />
                   </div>
               </div>
               
               <div>
                   <label className="block text-sm font-medium dark:text-gray-300 mb-1">Description</label>
                   <textarea 
                     placeholder="Detailed description..."
                     className="w-full p-2 border rounded dark:bg-white/5 dark:border-white/10 dark:text-white h-24 focus:ring-2 focus:ring-primary-500"
                     value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})}
                     required
                   />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                       <label className="block text-sm font-medium dark:text-gray-300 mb-1">Category</label>
                       <select 
                         className="w-full p-2 border rounded dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-primary-500"
                         value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})}
                       >
                         {categories.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                   </div>
                   <div>
                       <label className="block text-sm font-medium dark:text-gray-300 mb-1">Stock Quantity</label>
                       <input 
                         placeholder="Units" type="number"
                         className="w-full p-2 border rounded dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-primary-500"
                         value={productForm.stock} onChange={e => setProductForm({...productForm, stock: Number(e.target.value)})}
                         required 
                       />
                   </div>
               </div>
               
               {/* New Toggles for Admin */}
               <div className="flex gap-6 py-2 bg-gray-50 dark:bg-white/5 p-4 rounded-lg">
                   <label className="flex items-center space-x-2 cursor-pointer">
                       <input 
                         type="checkbox" 
                         checked={productForm.isBestSeller}
                         onChange={e => setProductForm({...productForm, isBestSeller: e.target.checked})}
                         className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                       />
                       <span className="text-gray-900 dark:text-white font-medium">Mark as Best Seller</span>
                   </label>
                   <label className="flex items-center space-x-2 cursor-pointer">
                       <input 
                         type="checkbox" 
                         checked={productForm.isFeatured}
                         onChange={e => setProductForm({...productForm, isFeatured: e.target.checked})}
                         className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                       />
                       <span className="text-gray-900 dark:text-white font-medium">Mark as New Arrival</span>
                   </label>
               </div>

               <div>
                   <label className="block text-sm font-medium dark:text-gray-300 mb-1">Warranty Info</label>
                   <input 
                     placeholder="e.g. 1 Year Manufacturer Warranty"
                     className="w-full p-2 border rounded dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-primary-500"
                     value={productForm.warranty} onChange={e => setProductForm({...productForm, warranty: e.target.value})}
                   />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                       <label className="block text-sm font-medium dark:text-gray-300 mb-1">Features (One per line)</label>
                       <textarea 
                         placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                         className="w-full p-2 border rounded dark:bg-white/5 dark:border-white/10 dark:text-white h-32 focus:ring-2 focus:ring-primary-500"
                         value={featuresString} onChange={e => setFeaturesString(e.target.value)}
                       />
                   </div>
                   <div>
                       <label className="block text-sm font-medium dark:text-gray-300 mb-1">Specs (Format: Key: Value)</label>
                       <textarea 
                         placeholder="Weight: 10g&#10;Battery: 24h&#10;Material: Plastic"
                         className="w-full p-2 border rounded dark:bg-white/5 dark:border-white/10 dark:text-white h-32 focus:ring-2 focus:ring-primary-500"
                         value={specsString} onChange={e => setSpecsString(e.target.value)}
                       />
                   </div>
               </div>

               {/* IMAGE UPLOAD SECTION */}
               <div className="space-y-4">
                   <label className="block text-sm font-medium dark:text-gray-300">Product Images</label>
                   
                   {/* Existing & Preview Images Grid */}
                   <div className="flex flex-wrap gap-4">
                       {/* Existing Images */}
                       {productForm.images?.map((img, idx) => (
                           <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 group">
                               <img src={img} alt="" className="w-full h-full object-cover" />
                               <button
                                  type="button"
                                  onClick={() => handleRemoveExistingImage(img)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                   ×
                               </button>
                           </div>
                       ))}
                       {/* New Selected Files Preview */}
                       {selectedImageFiles.map((file, idx) => (
                           <div key={`new-${idx}`} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-primary-500 group">
                               <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover opacity-80" />
                               <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-xs font-bold">New</div>
                               <button
                                  type="button"
                                  onClick={() => handleRemoveSelectedImage(idx)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                               >
                                   ×
                               </button>
                           </div>
                       ))}
                   </div>

                   <input
                     type="file"
                     accept="image/*"
                     multiple
                     onChange={handleImageFileSelect} 
                     className="block w-full text-sm text-gray-500 dark:text-gray-400
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-primary-50 file:text-primary-700
                       hover:file:bg-primary-100
                       dark:file:bg-primary-900/20 dark:file:text-primary-400
                     "
                   />
               </div>

               {/* VIDEO UPLOAD SECTION */}
               <div className="space-y-2">
                   <label className="block text-sm font-medium dark:text-gray-300">Product Video</label>
                   
                   {/* Option 1: Manual URL */}
                   <div className="flex gap-2 mb-2">
                        <input 
                            type="text"
                            placeholder="Paste YouTube or Direct Video URL (Optional)"
                            className="flex-1 p-2 border rounded dark:bg-white/5 dark:border-white/10 dark:text-white"
                            value={productForm.videoUrl || ''}
                            onChange={(e) => setProductForm({...productForm, videoUrl: e.target.value})}
                        />
                        {productForm.videoUrl && (
                             <button
                                type="button" 
                                onClick={() => setProductForm({...productForm, videoUrl: ''})}
                                className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm font-bold"
                             >
                                 Clear
                             </button>
                        )}
                   </div>

                   {/* Option 2: Upload */}
                   <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-dark-surface text-gray-500 font-medium">OR Upload File</span>
                        </div>
                   </div>

                   {(productForm.videoUrl || selectedVideoFile) && !selectedVideoFile && productForm.videoUrl?.startsWith('http') && (
                       <div className="p-3 bg-gray-50 dark:bg-white/5 rounded border border-gray-200 dark:border-white/10 mb-2">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Current Video:</span>
                                {productForm.videoUrl?.startsWith('blob:') && (
                                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-1 rounded animate-pulse">⚠️ Temporary Session URL</span>
                                )}
                            </div>
                            <video 
                                src={productForm.videoUrl} 
                                className="w-full h-32 object-cover rounded bg-black" 
                                controls 
                            />
                            <p className="text-xs text-gray-500 mt-1 truncate">{productForm.videoUrl}</p>
                            {productForm.videoUrl?.startsWith('blob:') && (
                                <p className="text-xs text-red-500 font-bold mt-2">
                                    Warning: This video will vanish if you refresh the page. Please upload to YouTube for permanence.
                                </p>
                            )}
                       </div>
                   )}

                   <input
                     type="file"
                     accept="video/*"
                     onChange={handleVideoFileSelect}
                     className="block w-full text-sm text-gray-500 dark:text-gray-400
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-purple-50 file:text-purple-700
                       hover:file:bg-purple-100
                       dark:file:bg-purple-900/20 dark:file:text-purple-400
                     " 
                   />
                   {selectedVideoFile && <p className="text-sm text-green-600 font-medium mt-1">File selected: {selectedVideoFile.name}</p>}
                   <p className="text-xs text-gray-500 mt-1">Supported formats: MP4, WebM. (Note: Large files may fail to persist without a paid backend)</p>
               </div>
               
               <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                 <Button type="button" variant="outline" onClick={() => setShowProductModal(false)} disabled={isUploading}>Cancel</Button>
                 <Button type="submit" isLoading={isUploading}>
                     {isUploading ? 'Uploading & Saving...' : 'Save Product'}
                 </Button>
               </div>
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
            </form>
          </div>
        </div>
      )}
<<<<<<< HEAD

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

=======
    </div>
  );
};
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
