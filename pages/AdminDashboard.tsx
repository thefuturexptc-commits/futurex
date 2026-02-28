
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RichTextEditor } from '../components/RichTextEditor';
import { useAuth } from '../context/AuthContext';
import {
  addCategory,
  addAuditLog,
  addNewAdmin,
  addProduct,
  deleteAdmin,
  deleteCategory,
  deleteProduct,
  getAllOrders,
  getAllUsers,
  getAuditLogs,
  getCategories,
  getProducts,
  seedDatabase,
  updateOrderStatus,
  updateProduct,
  updateWebsiteSettings,
  uploadFile,
} from '../services/backend';
import { Order, Product, ProductColor, ProductVariation, User, UserPermissions } from '../types';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { ConfirmModal } from '../components/admin/common/ConfirmModal';
import { AnalyticsRange, AdminAuditEntry } from '../components/admin/types';
import { AnalyticsTab } from '../components/admin/tabs/AnalyticsTab';
import { InventoryTab } from '../components/admin/tabs/InventoryTab';
import { ProductsTab } from '../components/admin/tabs/ProductsTab';
import { OrdersTab } from '../components/admin/tabs/OrdersTab';
import { CategoriesTab } from '../components/admin/tabs/CategoriesTab';
import { AdminsTab } from '../components/admin/tabs/AdminsTab';
import { SettingsTab } from '../components/admin/tabs/SettingsTab';

type TabKey = 'analytics' | 'inventory' | 'products' | 'orders' | 'categories' | 'admins' | 'settings';

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
}

const inputClass =
  'w-full p-2 border border-gray-300 bg-white text-gray-900 rounded dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-primary-500';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';
  const { updatePrimaryColor, primaryColor, updateLogoUrl, logoUrl } = useTheme();

  const [activeTab, setActiveTab] = useState<TabKey>('analytics');
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
  };

  const [productForm, setProductForm] = useState<Partial<Product>>(initialProductState);
  const [featuresString, setFeaturesString] = useState('');
  const [specsString, setSpecsString] = useState('');
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [colorBlocks, setColorBlocks] = useState<ProductColor[]>([]);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [dragImageIndex, setDragImageIndex] = useState<number | null>(null);

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
    admins: false,
    settings: false,
  });

  const [auditLog, setAuditLog] = useState<AdminAuditEntry[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

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
    { key: 'admins', label: 'Admins' },
    { key: 'settings', label: 'Settings' },
  ];

  const availableTabs = useMemo(() => tabs.filter((tab) => hasTabAccess(tab.key)).map((tab) => tab.key), [hasTabAccess]);

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

  if (!isAdmin) return <div className="p-10 text-center text-red-500">Access Denied. Admin only.</div>;

  const handleOpenAddProduct = () => {
    setProductForm(initialProductState);
    setFeaturesString('');
    setSpecsString('');
    setVariations([]);
    setColorBlocks([]);
    setSelectedImageFiles([]);
    setSelectedVideoFile(null);
    setIsEditing(false);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    const reservedStock = Number(product.reservedStock || 0);
    const stock = Number(product.stock || 0);
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
    setVariations(product.variations || []);
    setColorBlocks(product.colors || []);
    setSelectedImageFiles([]);
    setSelectedVideoFile(null);
    setIsEditing(true);
    setShowProductModal(true);
  };

  const handleAddVariation = () => {
    setVariations((prev) => [...prev, { id: `v_${Date.now()}`, size: '', weight: '', color: '', price: 0, stock: 0 }]);
  };

  const handleRemoveVariation = (id: string) => {
    setVariations((prev) => prev.filter((v) => v.id !== id));
  };

  const handleVariationChange = <K extends keyof ProductVariation>(id: string, field: K, value: ProductVariation[K]) => {
    setVariations((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const addColorBlock = () => {
    setColorBlocks((prev) => [
      ...prev,
      { name: '', hex: '#6b7280', images: [...(productForm.images || [])], stock: 0, reservedStock: 0, sold: 0 },
    ]);
  };

  const removeColorBlock = (index: number) => {
    setColorBlocks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateColorBlock = (index: number, field: keyof ProductColor, value: unknown) => {
    setColorBlocks((prev) => prev.map((c, idx) => (idx === index ? { ...c, [field]: value } : c)));
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

  const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setSelectedVideoFile(e.target.files[0]);
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
        const url = await uploadFile(file, path);
        if (url) uploadedImageUrls.push(url);
      }

      let finalVideoUrl = productForm.videoUrl || '';
      if (selectedVideoFile) {
        const path = `videos/${Date.now()}_${selectedVideoFile.name}`;
        const newUrl = await uploadFile(selectedVideoFile, path);
        if (newUrl) finalVideoUrl = newUrl;
      }

      const finalImages = [...(productForm.images || []), ...uploadedImageUrls];
      if (finalImages.length === 0) finalImages.push('https://picsum.photos/400');

      const cleanFeatures = featuresString
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f !== '');

      const cleanSpecs: Record<string, string> = {};
      specsString.split('\n').forEach((line) => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join(':').trim();
          if (key && val) cleanSpecs[key] = val;
        }
      });

      const sanitizedColors = colorBlocks
        .filter((c) => c.name.trim() !== '')
        .map((c) => ({
          ...c,
          images: c.images?.length ? c.images : finalImages,
          stock: Number(c.stock || 0),
          reservedStock: Number(c.reservedStock || 0),
          sold: Number(c.sold || 0),
        }));

      const aggregateStock = sanitizedColors.reduce((sum, c) => sum + c.stock, 0);
      const aggregateReserved = sanitizedColors.reduce((sum, c) => sum + c.reservedStock, 0);
      const aggregateSold = sanitizedColors.reduce((sum, c) => sum + c.sold, 0);

      const productData = {
        ...productForm,
        mrp: Number(productForm.mrp || 0),
        salePrice: Number(productForm.salePrice || 0),
        price: Number(productForm.salePrice || productForm.price || 0),
        stock: sanitizedColors.length ? aggregateStock : Number(productForm.stock || 0),
        reservedStock: sanitizedColors.length ? aggregateReserved : Number(productForm.reservedStock || 0),
        sold: sanitizedColors.length ? aggregateSold : Number(productForm.sold || 0),
        inStock: sanitizedColors.length
          ? aggregateStock - aggregateReserved > 0
          : Number(productForm.stock || 0) - Number(productForm.reservedStock || 0) > 0,
        weight: productForm.weight || '',
        bandType: (productForm.category || '').toLowerCase() === 'smart bands' ? productForm.bandType || '' : '',
        colors: sanitizedColors,
        variations,
        images: finalImages,
        videoUrl: finalVideoUrl,
        features: cleanFeatures,
        specs: cleanSpecs,
      } as Product;

      if (isEditing && productData.id) {
        await updateProduct(productData);
        pushAudit('Product Updated', `${productData.name} (${productData.id})`);
      } else {
        await addProduct({ ...productData, id: `p_${Date.now()}`, rating: 0, reviewCount: 0 });
        pushAudit('Product Created', productData.name);
      }

      setShowProductModal(false);
      await refreshData();
    } catch (error) {
      void error;
      alert('Failed to save product. Please retry.');
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

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    await addCategory(newCategory.trim());
    pushAudit('Category Added', newCategory.trim());
    setNewCategory('');
    await refreshData();
  };

  const handleDeleteCategory = (cat: string) => {
    setConfirmState({
      open: true,
      title: 'Delete Category',
      message: `Delete category ${cat}?`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        await deleteCategory(cat);
        pushAudit('Category Deleted', cat);
        await refreshData();
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
    updateWebsiteSettings({ primaryColor: color, logoUrl });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    updateLogoUrl(url);
  };

  const saveSettings = async () => {
    await updateWebsiteSettings({ primaryColor, logoUrl });
    pushAudit('Settings Updated');
    alert('Settings Saved');
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
    <div className="min-h-screen max-w-7xl mx-auto px-4 py-10 text-gray-900 dark:text-white">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enterprise control center for products, orders, and growth analytics</p>
        </div>
        <Button size="sm" variant="outline" onClick={refreshData}>Refresh Data</Button>
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

      <div className="mb-8 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-surface p-2 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const allowed = hasTabAccess(tab.key);
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => allowed && setActiveTab(tab.key)}
              disabled={!allowed}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                  : allowed
                  ? 'bg-transparent text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-100 dark:hover:bg-white/10'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-400 border-transparent cursor-not-allowed'
              }`}
            >
              {tab.label} {!allowed ? 'Locked' : ''}
            </button>
          );
        })}
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
        <OrdersTab orders={orders} users={users} isLoading={isLoading} onStatusUpdate={handleStatusUpdate} />
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
          onColorChange={handleColorChange}
          onLogoChange={handleLogoChange}
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
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-white/10 p-6 overflow-hidden flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 shrink-0">{isEditing ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleSaveProduct} className="space-y-4 overflow-y-auto pr-2">
              <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Basic Product Details</h3>
                {isEditing && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Product ID</label>
                    <input
                      className={inputClass}
                      value={productForm.id || ''}
                      readOnly
                    />
                  </div>
                )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Product Name</label>
                  <input className={inputClass} placeholder="e.g. Aura Band X1" value={productForm.name || ''} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Category</label>
                  <select className={inputClass} value={productForm.category || ''} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}>
                    <option value="">e.g. Smart Bands</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Sale Price</label>
                  <input type="number" className={inputClass} placeholder="e.g. 149" value={productForm.salePrice ?? 0} onChange={(e) => setProductForm({ ...productForm, salePrice: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">MRP</label>
                  <input type="number" className={inputClass} placeholder="e.g. 199" value={productForm.mrp ?? 0} onChange={(e) => setProductForm({ ...productForm, mrp: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Stock</label>
                  <input type="number" className={inputClass} placeholder="e.g. 50" value={productForm.stock ?? 0} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Weight</label>
                  <input className={inputClass} placeholder="e.g. 24g" value={productForm.weight || ''} onChange={(e) => setProductForm({ ...productForm, weight: e.target.value })} />
                </div>
              </div>

              {(productForm.category || '').toLowerCase() === 'smart bands' && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Band Type</label>
                  <select className={inputClass} value={productForm.bandType || ''} onChange={(e) => setProductForm({ ...productForm, bandType: e.target.value })}>
                    <option value="">e.g. Sport Loop</option>
                    <option value="Smart Bracelet">Smart Bracelet</option>
                    <option value="Classic Strap">Classic Strap</option>
                    <option value="Sport Loop">Sport Loop</option>
                    <option value="Metal Chain">Metal Chain</option>
                  </select>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">e.g. Fitness band with ECG + sleep tracking.</p>
                <RichTextEditor value={productForm.description || ''} onChange={(html) => setProductForm((prev) => ({ ...prev, description: html }))} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Warranty</label>
                  <input className={inputClass} placeholder="e.g. 1 Year Manufacturer Warranty" value={productForm.warranty || ''} onChange={(e) => setProductForm({ ...productForm, warranty: e.target.value })} />
                </div>
                <div className="flex items-end gap-4 pb-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={Boolean(productForm.isBestSeller)} onChange={(e) => setProductForm({ ...productForm, isBestSeller: e.target.checked })} />
                    Best Seller
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={Boolean(productForm.isFeatured)} onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })} />
                    New Arrival
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <textarea className={`${inputClass} h-28`} placeholder="e.g. Battery: 14 days" value={specsString} onChange={(e) => setSpecsString(e.target.value)} />
                <textarea className={`${inputClass} h-28`} placeholder="e.g. Sleep Tracking" value={featuresString} onChange={(e) => setFeaturesString(e.target.value)} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Color Variants</label>
                  <Button type="button" size="sm" variant="outline" onClick={addColorBlock}>+ Add Color</Button>
                </div>
                {colorBlocks.map((color, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <input className={inputClass} placeholder="e.g. Midnight Black" value={color.name} onChange={(e) => updateColorBlock(idx, 'name', e.target.value)} />
                    <input className={inputClass} placeholder="e.g. #111111" value={color.hex} onChange={(e) => updateColorBlock(idx, 'hex', e.target.value)} />
                    <input type="number" className={inputClass} placeholder="e.g. 30" value={color.stock} onChange={(e) => updateColorBlock(idx, 'stock', Number(e.target.value))} />
                    <input type="number" className={inputClass} placeholder="e.g. 2" value={color.reservedStock} onChange={(e) => updateColorBlock(idx, 'reservedStock', Number(e.target.value))} />
                    <div className="flex items-center gap-2">
                      <input type="number" className={inputClass} placeholder="e.g. 18" value={color.sold} onChange={(e) => updateColorBlock(idx, 'sold', Number(e.target.value))} />
                      <Button type="button" size="sm" variant="danger" onClick={() => removeColorBlock(idx)}>X</Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Product Variations</label>
                  <Button type="button" size="sm" variant="outline" onClick={handleAddVariation}>+ Add Variation</Button>
                </div>
                {variations.map((v) => (
                  <div key={v.id} className="grid grid-cols-1 md:grid-cols-6 gap-2">
                    <input className={inputClass} placeholder="e.g. Size 7" value={v.size || ''} onChange={(e) => handleVariationChange(v.id, 'size', e.target.value)} />
                    <input className={inputClass} placeholder="e.g. 18g" value={v.weight || ''} onChange={(e) => handleVariationChange(v.id, 'weight', e.target.value)} />
                    <input className={inputClass} placeholder="e.g. Matte Black" value={v.color || ''} onChange={(e) => handleVariationChange(v.id, 'color', e.target.value)} />
                    <input type="number" className={inputClass} placeholder="e.g. 1299" value={v.price || 0} onChange={(e) => handleVariationChange(v.id, 'price', Number(e.target.value))} />
                    <input type="number" className={inputClass} placeholder="e.g. 20" value={v.stock} onChange={(e) => handleVariationChange(v.id, 'stock', Number(e.target.value))} />
                    <Button type="button" size="sm" variant="danger" onClick={() => handleRemoveVariation(v.id)}>Remove</Button>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Current Images (drag to reorder)</label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="file" accept="image/*" multiple onChange={handleImageFileSelect} className="block w-full text-sm text-gray-500 dark:text-gray-300" />
                <input type="file" accept="video/*" onChange={handleVideoFileSelect} className="block w-full text-sm text-gray-500 dark:text-gray-300" />
              </div>
              {selectedImageFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    New images selected: {selectedImageFiles.length}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedImageFiles.map((file, idx) => (
                      <div
                        key={`${file.name}_${file.size}_${file.lastModified}_${idx}`}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 px-2 py-1 text-xs text-gray-700 dark:text-gray-300"
                      >
                        <span className="max-w-[180px] truncate">{file.name}</span>
                        <button
                          type="button"
                          className="text-red-600 dark:text-red-400"
                          onClick={() =>
                            setSelectedImageFiles((prev) =>
                              prev.filter((_, fileIdx) => fileIdx !== idx)
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
