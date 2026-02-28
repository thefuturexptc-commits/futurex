import React, { useMemo, useState } from 'react';
import { Product } from '../../../types';
import { Button } from '../../ui/Button';
import { Pagination } from '../common/Pagination';
import { SectionHeader } from '../common/SectionHeader';
import { StatusBadge } from '../common/StatusBadge';
import { TableSkeleton } from '../common/TableSkeleton';

interface Props {
  products: Product[];
  isLoading: boolean;
  onQuickStockUpdate: (product: Product, amount: number) => Promise<void> | void;
  onBulkStockUpdate: (amount: number, productIds: string[]) => Promise<void> | void;
}

export const InventoryTab: React.FC<Props> = ({ products, isLoading, onQuickStockUpdate, onBulkStockUpdate }) => {
  const [query, setQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [bulkAmount, setBulkAmount] = useState(10);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const available = p.stock - (p.reservedStock || 0);
      const matchText = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      const matchStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && available > 0 && available < 10) ||
        (stockFilter === 'out' && available <= 0);
      return matchText && matchStock;
    });
  }, [products, query, stockFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const lowStockIds = useMemo(
    () => filtered.filter((p) => p.stock - (p.reservedStock || 0) < 10).map((p) => p.id),
    [filtered]
  );

  const exportCsv = () => {
    const rows = filtered.map((p) => [
      p.id,
      p.name,
      p.category,
      p.stock,
      p.reservedStock || 0,
      p.sold || 0,
      p.stock - (p.reservedStock || 0),
      p.salePrice || p.price,
    ]);
    const csv = [['ID', 'Name', 'Category', 'Stock', 'Reserved', 'Sold', 'Available', 'UnitPrice'], ...rows]
      .map((r) => r.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    setPage(1);
  }, [query, stockFilter]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionHeader
        title="Inventory"
        subtitle="Real-time stock monitoring, bulk actions, and export"
        right={
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search product or id"
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            />
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out')}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              <option value="all">All Stock</option>
              <option value="low">Low Stock (&lt;10)</option>
              <option value="out">Out of Stock</option>
            </select>
            <Button size="sm" variant="outline" onClick={exportCsv}>Export CSV</Button>
          </div>
        }
      />

      <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-white/10 p-4 flex flex-wrap items-center gap-2">
        <input
          type="number"
          value={bulkAmount}
          onChange={(e) => setBulkAmount(Number(e.target.value) || 0)}
          className="h-10 w-32 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
        <Button size="sm" onClick={() => onBulkStockUpdate(bulkAmount, lowStockIds)}>Bulk Update Low Stock</Button>
        <span className="text-sm text-gray-500">{lowStockIds.length} products eligible</span>
      </div>

      {isLoading ? (
        <TableSkeleton rows={10} cols={7} />
      ) : (
        <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-white/10 overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Available</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reserved</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sold</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p, idx) => {
                const available = p.stock - (p.reservedStock || 0);
                const total = Number(p.stock || 0);
                const sold = Number(p.sold || 0);
                const status = available <= 0 ? 'Out of Stock' : available < 10 ? 'Low Stock' : 'In Stock';
                return (
                  <tr
                    key={p.id}
                    className={`${idx % 2 === 0 ? 'bg-white dark:bg-dark-surface' : 'bg-gray-50/60 dark:bg-white/5'} hover:bg-primary-50/40 dark:hover:bg-primary-900/10`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <img src={p.images[0]} alt="" className="h-10 w-10 rounded object-cover bg-gray-100 dark:bg-white/10" />
                        <div>
                          <p className="font-semibold">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{total}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">{available}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{p.reservedStock || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{sold}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">Rs {p.salePrice || p.price}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => onQuickStockUpdate(p, 10)}>+10</Button>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">No matching inventory rows.</td>
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
