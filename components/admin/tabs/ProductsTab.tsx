import React, { useMemo, useState } from 'react';
import { Product } from '../../../types';
import { getProductSlug } from '../../../services/backend';
import { Button } from '../../ui/Button';
import { Pagination } from '../common/Pagination';
import { SectionHeader } from '../common/SectionHeader';
import { StatusBadge } from '../common/StatusBadge';
import { TableSkeleton } from '../common/TableSkeleton';
import { productMatchesSearch } from '../../../utils/productSearch';

interface Props {
  products: Product[];
  categories: string[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export const ProductsTab: React.FC<Props> = ({
  products,
  categories,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price' | 'stock' | 'bestSeller'>('newest');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const getTotalStock = (product: Product) => {
      if (product.variants?.length) {
        return product.variants.reduce(
          (sum, variant) => sum + (variant.sizes || []).reduce((sizeSum, sizeRow) => sizeSum + Number(sizeRow.stock || 0), 0),
          0
        );
      }
      return Number(product.stock || 0);
    };

    const q = query.toLowerCase().trim();
    const rows = products.filter((p) => {
      const matchText = !q || productMatchesSearch(p, q);
      const matchCategory = category === 'all' || p.category === category;
      return matchText && matchCategory;
    });

    return [...rows].sort((a, b) => {
      if (sortBy === 'price') return (b.salePrice || b.price) - (a.salePrice || a.price);
      if (sortBy === 'stock') return getTotalStock(b) - getTotalStock(a);
      if (sortBy === 'bestSeller') return Number(Boolean(b.isBestSeller)) - Number(Boolean(a.isBestSeller));
      return Number(b.id.split('_')[1] || 0) - Number(a.id.split('_')[1] || 0);
    });
  }, [products, query, category, sortBy]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  React.useEffect(() => {
    setPage(1);
  }, [query, category, sortBy]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionHeader
        title="Products"
        subtitle="Search, sort, preview, and manage catalog at scale"
        right={<Button onClick={onAdd}>+ Add Product</Button>}
      />

      <div className="bg-slate-900 rounded-xl border border-white/10 p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search product"
          className="h-10 rounded-lg border border-white/15 bg-slate-900 px-3 text-sm text-white bg-slate-800 text-white border-white/15"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded-lg border border-white/15 bg-slate-900 px-3 text-sm text-white bg-slate-800 text-white border-white/15"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'newest' | 'price' | 'stock' | 'bestSeller')}
          className="h-10 rounded-lg border border-white/15 bg-slate-900 px-3 text-sm text-white bg-slate-800 text-white border-white/15"
        >
          <option value="newest">Newest</option>
          <option value="price">Price High-Low</option>
          <option value="stock">Stock High-Low</option>
          <option value="bestSeller">Best Seller First</option>
        </select>
        <div className="text-sm text-slate-400 flex items-center">{filtered.length} products</div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={10} cols={7} />
      ) : (
        <div className="bg-slate-900 rounded-xl border border-white/10 overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Stock (A/R/S/T)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Flags</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p, idx) => {
                const total = p.variants?.length
                  ? p.variants.reduce(
                      (sum, variant) =>
                        sum + (variant.sizes || []).reduce((sizeSum, sizeRow) => sizeSum + Number(sizeRow.stock || 0), 0),
                      0
                    )
                  : Number(p.stock || 0);
                const available = total - (p.reservedStock || 0);
                const reserved = Number(p.reservedStock || 0);
                const sold = Number(p.sold || 0);
                const stockStatus = available <= 0 ? 'Out of Stock' : available < 10 ? 'Low Stock' : 'In Stock';
                return (
                  <tr
                    key={p.id}
                    className={`${idx % 2 === 0 ? 'bg-slate-900' : 'bg-white/5'} hover:bg-primary-500/10`}
                  >
                    <td className="px-4 py-3 text-sm text-white">
                      <div className="flex items-center gap-3">
                        <img src={p.images[0]} alt="" className="h-10 w-10 rounded object-cover" />
                        <div>
                          <p className="font-semibold">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={stockStatus} /></td>
                    <td className="px-4 py-3 text-sm text-white">Rs {p.salePrice || p.price}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      <span className="font-semibold text-white">{available}</span>
                      <span className="mx-1">/</span>
                      <span>{reserved}</span>
                      <span className="mx-1">/</span>
                      <span>{sold}</span>
                      <span className="mx-1">/</span>
                      <span>{total}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {p.isBestSeller ? 'Best Seller ' : ''}
                      {p.isFeatured ? 'New Arrival' : ''}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => window.open(`/product/${getProductSlug(p)}`, '_blank')}>Preview</Button>
                        <Button size="sm" variant="outline" onClick={() => onEdit(p)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => onDelete(p)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">No matching products.</td>
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