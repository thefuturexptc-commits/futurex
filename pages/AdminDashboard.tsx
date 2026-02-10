import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { firebaseService } from '../services/firebase';
import { Order } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '../components/Button';

export const AdminDashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(localStorage.getItem('site_logo'));
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to finish loading before checking role
    if (loading) return;

    if (!user) {
        navigate('/admin-login');
        return;
    }

    if (user.role !== 'admin') {
        navigate('/');
        return;
    }
    
    firebaseService.getOrders().then(setOrders);
  }, [user, loading, navigate]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        localStorage.setItem('site_logo', base64);
        setLogoPreview(base64);
        // Dispatch event so Navbar updates immediately
        window.dispatchEvent(new Event('logoUpdated'));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
      localStorage.removeItem('site_logo');
      setLogoPreview(null);
      window.dispatchEvent(new Event('logoUpdated'));
  };

  if (loading) {
      return (
          <div className="min-h-screen pt-24 flex items-center justify-center">
              <p className="text-slate-500">Verifying Admin Access...</p>
          </div>
      );
  }

  if (!user || user.role !== 'admin') {
      return null; 
  }

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  
  // Prepare chart data (Sales by Product)
  const productSales: Record<string, number> = {};
  orders.forEach(order => {
      order.items.forEach(item => {
          productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
      });
  });
  const chartData = Object.keys(productSales).map(name => ({ name: name.split(' ')[0], sales: productSales[name] }));

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-900">Admin Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-slate-500 text-sm uppercase font-bold">Total Orders</h3>
            <p className="text-3xl font-bold text-slate-900 mt-2">{orders.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-slate-500 text-sm uppercase font-bold">Total Revenue</h3>
            <p className="text-3xl font-bold text-primary mt-2">₹{totalRevenue.toLocaleString()}</p>
        </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-slate-500 text-sm uppercase font-bold">Avg Order Value</h3>
            <p className="text-3xl font-bold text-secondary mt-2">₹{orders.length ? (totalRevenue / orders.length).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Column (2/3) */}
          <div className="lg:col-span-2 space-y-12">
             {/* Chart */}
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-[400px]">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Product Sales Volume</h2>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip 
                                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }}
                                itemStyle={{ color: '#0891b2' }}
                        />
                        <Bar dataKey="sales" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Recent Orders List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Orders</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 border-b border-slate-200">
                                <th className="pb-3">Order ID</th>
                                <th className="pb-3">User</th>
                                <th className="pb-3">Total</th>
                                <th className="pb-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.slice().reverse().map(order => (
                                <tr key={order.id}>
                                    <td className="py-3 text-slate-600 font-mono text-sm">{order.id}</td>
                                    <td className="py-3 text-slate-900">{order.userName}</td>
                                    <td className="py-3 text-slate-600">₹{order.total.toLocaleString()}</td>
                                    <td className="py-3">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>

          {/* Sidebar Settings (1/3) */}
          <div className="space-y-8">
             {/* Logo Settings */}
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                 <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                     <ImageIcon className="w-5 h-5 text-primary" /> Site Settings
                 </h2>
                 <p className="text-sm text-slate-500 mb-4">Customize your branding.</p>
                 
                 <div className="mb-4">
                     <p className="text-sm font-medium text-slate-900 mb-2">Logo</p>
                     <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center mb-4 border border-dashed border-slate-300 overflow-hidden">
                         {logoPreview ? (
                             <img src={logoPreview} alt="Logo Preview" className="h-full object-contain" />
                         ) : (
                             <span className="text-slate-400 text-sm">No logo set</span>
                         )}
                     </div>
                     <div className="flex gap-2">
                         <label className="flex-1 cursor-pointer">
                             <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                             <div className="bg-primary text-white text-center py-2 px-4 rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors">
                                 Upload New
                             </div>
                         </label>
                         {logoPreview && (
                            <Button variant="outline" size="sm" onClick={removeLogo}>Remove</Button>
                         )}
                     </div>
                 </div>
             </div>
          </div>
      </div>
    </div>
  );
};