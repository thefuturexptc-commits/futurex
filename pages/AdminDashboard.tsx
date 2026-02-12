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
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal States
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // New/Edit Product Form State
  const initialProductState: Partial<Product> = {
    name: '',
    price: 0,
    category: 'Smart Bands',
    description: '',
    stock: 0,
    images: [],
    videoUrl: '',
    features: [],
    specs: {},
    warranty: '',
    isFeatured: false,
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
            // If uploadFile returns empty string (failure/too large), we keep existing or set to empty?
            // Usually if user selects a file and it fails, we shouldn't keep the OLD file. 
            // But if it fails, the user is alerted. 
            // We'll update only if newUrl is truthy, or explicitly set empty if we want to clear it on error.
            if (newUrl) {
                finalVideoUrl = newUrl;
            } else {
                // If it failed (too large/offline), we might want to clear it or handle graceful degradation
                // For now, let's assume if it failed, we don't save a broken video URL.
                // But if they selected a file, they probably want that specific file.
                // Ideally, the 'alert' in uploadFile warns them.
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
                          {Object.entries(analytics.categoryRevenue).map(([cat, revenue]) => (
                              <div key={cat}>
                                  <div className="flex justify-between text-sm mb-1">
                                      <span className="font-medium dark:text-gray-300">{cat}</span>
                                      <span className="font-bold dark:text-white">₹{revenue.toLocaleString()}</span>
                                  </div>
                                  <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2.5">
                                      <div 
                                        className="bg-primary-500 h-2.5 rounded-full transition-all duration-1000" 
                                        style={{ width: `${((revenue as number) / analytics.maxCategoryRevenue) * 100}%` }}
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
                          {analytics.topProducts.map((p, i) => (
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
                                      <p className="text-xs text-green-500">₹{((p.sold as number) * p.price).toLocaleString()}</p>
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
                   
                   {(productForm.videoUrl || selectedVideoFile) && (
                       <div className="p-2 bg-gray-50 dark:bg-white/5 rounded border border-gray-200 dark:border-white/10 mb-2">
                           {selectedVideoFile ? (
                               <span className="text-sm text-green-600 font-medium">Selected: {selectedVideoFile.name}</span>
                           ) : (
                               <span className="text-sm text-gray-600 dark:text-gray-400 truncate block">Current: {productForm.videoUrl}</span>
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
                   <p className="text-xs text-gray-500">Supported formats: MP4, WebM</p>
               </div>
               
               <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                 <Button type="button" variant="outline" onClick={() => setShowProductModal(false)} disabled={isUploading}>Cancel</Button>
                 <Button type="submit" isLoading={isUploading}>
                     {isUploading ? 'Uploading & Saving...' : 'Save Product'}
                 </Button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};