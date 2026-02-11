import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    getProducts, getAllOrders, addProduct, deleteProduct, updateOrderStatus, 
    updateProduct, getCategories, addCategory, deleteCategory, updateWebsiteSettings, getWebsiteSettings,
    getAllUsers, addNewAdmin, seedDatabase
} from '../services/backend';
import { Product, Order, User } from '../types';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { updatePrimaryColor, primaryColor, updateLogoUrl, logoUrl } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'categories' | 'admins' | 'settings'>('products');
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Modal States
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // New/Edit Product Form State
  const initialProductState: Partial<Product> = {
    name: '',
    price: 0,
    category: 'Smart Bands',
    description: '',
    stock: 0,
    images: [''],
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

  // New Category State
  const [newCategory, setNewCategory] = useState('');

  // New Admin State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

  const refreshData = () => {
     getProducts().then(setProducts);
     // Use getAllOrders for Admin to ensure we see EVERYTHING
     getAllOrders().then(setOrders);
     getCategories().then(setCategories);
     getAllUsers().then(setUsers);
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  if (!isAdmin) return <div className="p-10 text-center text-red-500">Access Denied. Admin only.</div>;

  // --- Product Handlers ---

  const handleOpenAddProduct = () => {
      setProductForm(initialProductState);
      setFeaturesString('');
      setSpecsString('');
      setIsEditing(false);
      setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
      setProductForm(product);
      setFeaturesString(product.features?.join('\n') || '');
      setSpecsString(Object.entries(product.specs || {}).map(([k, v]) => `${k}: ${v}`).join('\n'));
      setIsEditing(true);
      setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up empty strings in arrays
    const cleanImages = productForm.images?.filter(i => i.trim() !== '') || ['https://picsum.photos/400'];
    
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
        images: cleanImages.length ? cleanImages : ['https://picsum.photos/400'],
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

  // --- Admin Handlers ---
  const handleAddAdmin = async (e: React.FormEvent) => {
      e.preventDefault();
      await addNewAdmin(newAdminEmail, newAdminName);
      setNewAdminName('');
      setNewAdminEmail('');
      refreshData();
      alert('Admin added. They can login with their email/password.');
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
        <div className="flex flex-wrap gap-2">
           {(['products', 'orders', 'categories', 'admins', 'settings'] as const).map(tab => (
               <Button 
                key={tab} 
                variant={activeTab === tab ? 'primary' : 'outline'} 
                onClick={() => setActiveTab(tab)}
                className="capitalize"
               >
                   {tab}
               </Button>
           ))}
        </div>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div>
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
        <div className="space-y-6">
           {orders.map(order => {
             const orderUser = users.find(u => u.id === order.userId);
             return (
               <div key={order.id} className="bg-white dark:bg-dark-surface p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/5">
                 <div className="flex flex-col md:flex-row justify-between md:items-start mb-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{order.id}</h3>
                          <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 dark:bg-white/5 rounded-full">
                            {new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString()}
                          </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Customer Details */}
                          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-white/5 p-4 rounded-lg">
                              <p className="font-semibold text-gray-900 dark:text-gray-200 mb-1 uppercase text-xs tracking-wider">Customer</p>
                              <p className="font-medium text-base text-gray-900 dark:text-white">{orderUser ? orderUser.name : 'Guest User'}</p>
                              <p>{orderUser ? orderUser.email : 'No email available'}</p>
                              <p className="text-xs text-gray-400 mt-1">ID: {order.userId}</p>
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
          <div className="space-y-6">
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
          <div className="space-y-8">
              <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-200 dark:border-white/5">
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Add New Admin</h3>
                  <form onSubmit={handleAddAdmin} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-200 dark:border-white/5">
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

               <div>
                   <label className="block text-sm font-medium dark:text-gray-300 mb-1">Image URLs (comma separated)</label>
                   <textarea
                     placeholder="https://..., https://..." 
                     className="w-full p-2 border rounded dark:bg-white/5 dark:border-white/10 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
                     value={productForm.images?.join(', ')} 
                     onChange={e => setProductForm({...productForm, images: e.target.value.split(',').map(s => s.trim())})} 
                   />
               </div>

               <div>
                   <label className="block text-sm font-medium dark:text-gray-300 mb-1">Video URL (YouTube or MP4)</label>
                   <input
                     placeholder="https://youtube.com/watch?v=..." 
                     className="w-full p-2 border rounded dark:bg-white/5 dark:border-white/10 dark:text-white focus:ring-2 focus:ring-primary-500"
                     value={productForm.videoUrl || ''} 
                     onChange={e => setProductForm({...productForm, videoUrl: e.target.value})} 
                   />
               </div>
               
               <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                 <Button type="button" variant="outline" onClick={() => setShowProductModal(false)}>Cancel</Button>
                 <Button type="submit">Save Product</Button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};