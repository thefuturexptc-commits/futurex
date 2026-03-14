import React, { useMemo, useState } from 'react';
import { Order, User } from '../../../types';
import { Button } from '../../ui/Button';
import { Pagination } from '../common/Pagination';
import { SectionHeader } from '../common/SectionHeader';
import { StatusBadge } from '../common/StatusBadge';
import { TableSkeleton } from '../common/TableSkeleton';

interface Props {
  orders: Order[];
  users: User[];
  isLoading: boolean;
  onStatusUpdate: (orderId: string, status: Order['status']) => Promise<void> | void;
}

export const OrdersTab: React.FC<Props> = ({ orders, users, isLoading, onStatusUpdate }) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    const now = Date.now();
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const email = users.find((u) => u.id === order.userId)?.email?.toLowerCase() || '';
      const textMatch = !q || order.id.toLowerCase().includes(q) || email.includes(q);
      const statusMatch = statusFilter === 'all' || order.status === statusFilter;
      const ageDays = (now - new Date(order.date).getTime()) / (1000 * 60 * 60 * 24);
      const dateMatch =
        dateFilter === 'all' ||
        (dateFilter === '7d' && ageDays <= 7) ||
        (dateFilter === '30d' && ageDays <= 30) ||
        (dateFilter === '90d' && ageDays <= 90);
      return textMatch && statusMatch && dateMatch;
    });
  }, [orders, users, query, statusFilter, dateFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const generateInvoice = (order: Order) => {
    const customer = users.find((u) => u.id === order.userId);
    const lines = order.items
      .map((item) => `${item.name} x${item.quantity} - Rs ${(item.price * item.quantity).toFixed(2)}`)
      .join('\n');
    const html = `
      <html><body style="font-family:Arial;padding:24px;">
      <h2>Invoice - ${order.id}</h2>
      <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
      <p><strong>Customer:</strong> ${customer?.name || 'Unknown'} (${customer?.email || order.userId})</p>
      <pre style="white-space:pre-wrap;border:1px solid #ddd;padding:12px;">${lines}</pre>
      <p><strong>Total:</strong> Rs ${order.total.toFixed(2)}</p>
      </body></html>
    `;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  React.useEffect(() => {
    setPage(1);
  }, [query, statusFilter, dateFilter]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionHeader title="Orders" subtitle="Track fulfillment and customer transactions" />

      <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-white/10 p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by order id or customer email"
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | Order['status'])}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        >
          <option value="all">All Status</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Returned">Returned</option>
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        >
          <option value="all">All Time</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">{filtered.length} orders</div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-white/10 overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((order, idx) => {
                const customer = users.find((u) => u.id === order.userId);
                return (
                  <tr
                    key={order.id}
                    className={`${idx % 2 === 0 ? 'bg-white dark:bg-dark-surface' : 'bg-gray-50/60 dark:bg-white/5'} hover:bg-primary-50/40 dark:hover:bg-primary-900/10`}
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">{order.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      <p className="font-medium text-gray-900 dark:text-white">{customer?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{customer?.email || order.userId}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{new Date(order.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                      <select
                        value={order.status}
                        onChange={(e) => onStatusUpdate(order.id, e.target.value as Order['status'])}
                        className="mt-2 h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                      >
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Returned">Returned</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">Rs {order.total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => generateInvoice(order)}>Generate Invoice PDF</Button>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">No matching orders.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
    </div>
  );
};
