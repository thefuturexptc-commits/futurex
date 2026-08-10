import React, { useMemo, useState } from 'react';
import { OfferLead, Product, ProductNotifyRequest } from '../../../types';
import { Button } from '../../ui/Button';
import { Pagination } from '../common/Pagination';
import { SectionHeader } from '../common/SectionHeader';
import { StatusBadge } from '../common/StatusBadge';
import { TableSkeleton } from '../common/TableSkeleton';
import { productMatchesSearch } from '../../../utils/productSearch';

interface Props {
  products: Product[];
  notifyRequests: ProductNotifyRequest[];
  offerLeads: OfferLead[];
  isLoading: boolean;
  lastBulkStockUpdate?: {
    amount: number;
    products: Array<{ id: string; name: string; previousStock: number; nextStock: number }>;
  } | null;
  onQuickStockUpdate: (product: Product, amount: number) => Promise<void> | void;
  onBulkStockUpdate: (amount: number, productIds: string[]) => Promise<void> | void;
  onUndoBulkStockUpdate: () => Promise<void> | void;
}

type NotifyTarget = Pick<Product, 'id' | 'name'>;

export const InventoryTab: React.FC<Props> = ({
  products,
  notifyRequests,
  offerLeads,
  isLoading,
  lastBulkStockUpdate,
  onQuickStockUpdate,
  onBulkStockUpdate,
  onUndoBulkStockUpdate,
}) => {
  const [query, setQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [bulkAmount, setBulkAmount] = useState(10);
  const [page, setPage] = useState(1);
  const [viewNotifyProduct, setViewNotifyProduct] = useState<NotifyTarget | null>(null);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const available = p.stock - (p.reservedStock || 0);
      const matchText = !q || productMatchesSearch(p, q);
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

  const notifyRequestsByProduct = useMemo(() => {
    return notifyRequests.reduce<Record<string, ProductNotifyRequest[]>>((acc, request) => {
      acc[request.productId] = [...(acc[request.productId] || []), request];
      return acc;
    }, {});
  }, [notifyRequests]);

  const selectedNotifyRequests = viewNotifyProduct ? notifyRequestsByProduct[viewNotifyProduct.id] || [] : [];
  const notifyTargetsById = useMemo(() => {
    const targets: Record<string, NotifyTarget> = {};
    products.forEach((product) => {
      if ((notifyRequestsByProduct[product.id] || []).length > 0) {
        targets[product.id] = { id: product.id, name: product.name };
      }
    });
    notifyRequests.forEach((request) => {
      if (!targets[request.productId]) {
        targets[request.productId] = {
          id: request.productId,
          name: request.productName || request.productId,
        };
      }
    });
    return targets;
  }, [notifyRequests, notifyRequestsByProduct, products]);
  const notifyTargetCount = Object.keys(notifyTargetsById).length;
  const latestNotifyRequest = notifyRequests[0];
  const latestNotifyProduct = latestNotifyRequest ? notifyTargetsById[latestNotifyRequest.productId] || null : null;
  const latestOfferLeads = useMemo(() => offerLeads.slice(0, 8), [offerLeads]);

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
              className="h-10 rounded-lg border border-white/15 bg-slate-900 px-3 text-sm text-white bg-slate-800 text-white border-white/15"
            />
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out')}
              className="h-10 rounded-lg border border-white/15 bg-slate-900 px-3 text-sm text-white bg-slate-800 text-white border-white/15"
            >
              <option value="all">All Stock</option>
              <option value="low">Low Stock (&lt;10)</option>
              <option value="out">Out of Stock</option>
            </select>
            <Button size="sm" variant="outline" onClick={exportCsv}>Export CSV</Button>
          </div>
        }
      />

      <div className="bg-slate-900 rounded-xl border border-white/10 p-4 flex flex-wrap items-center gap-2">
        <input
          type="number"
          value={bulkAmount}
          onChange={(e) => setBulkAmount(Number(e.target.value) || 0)}
          className="h-10 w-32 rounded-lg border border-white/15 bg-slate-900 px-3 text-sm text-white bg-slate-800 text-white border-white/15"
        />
        <Button size="sm" onClick={() => onBulkStockUpdate(bulkAmount, lowStockIds)}>Bulk Update Low Stock</Button>
        <Button size="sm" variant="outline" onClick={onUndoBulkStockUpdate} disabled={!lastBulkStockUpdate}>
          Undo Last Bulk Update
        </Button>
        <span className="text-sm text-slate-400">{lowStockIds.length} products eligible</span>
        {lastBulkStockUpdate && (
          <span className="text-sm text-slate-400">
            Last bulk: {lastBulkStockUpdate.products.length} product{lastBulkStockUpdate.products.length === 1 ? '' : 's'}, amount {lastBulkStockUpdate.amount}
          </span>
        )}
      </div>

      <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">Notify Requests</p>
            <h3 className="mt-1 text-lg font-bold text-gray-950 text-white">
              {notifyRequests.length} customer alert{notifyRequests.length === 1 ? '' : 's'}
            </h3>
            <p className="mt-1 text-sm text-slate-300">
              {notifyTargetCount} product{notifyTargetCount === 1 ? '' : 's'} or coming-soon item{notifyTargetCount === 1 ? '' : 's'} have pending notify-me contacts.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => latestNotifyProduct && setViewNotifyProduct(latestNotifyProduct)}
            disabled={!latestNotifyProduct}
          >
            View Latest
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Offer Leads</p>
            <h3 className="mt-1 text-lg font-bold text-gray-950 text-white">
              {offerLeads.length} popup number{offerLeads.length === 1 ? '' : 's'} saved
            </h3>
            <p className="mt-1 text-sm text-slate-300">
              These are stored in the backend collection <span className="font-semibold">offer_leads</span>. Local fallback key: <span className="font-semibold">aura_mock_offer_leads</span>.
            </p>
          </div>
          <div className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-emerald-100">
            NEW10 fans | NEW5 rings & bands
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-emerald-100 bg-slate-900 border-white/10 bg-white/5">
          {latestOfferLeads.length > 0 ? (
            <table className="min-w-full">
              <thead className="bg-emerald-50/80 bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">Codes</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {latestOfferLeads.map((lead) => (
                  <tr key={lead.id} className="border-t border-emerald-100 border-white/10">
                    <td className="px-4 py-3 text-sm font-semibold text-white">{lead.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{lead.phone}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{lead.couponCodes.join(', ')}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {lead.productName || lead.source.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {new Date(lead.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-slate-400">No offer popup numbers yet.</p>
          )}
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={10} cols={9} />
      ) : (
        <div className="bg-slate-900 rounded-xl border border-white/10 overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Notify</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Available</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Reserved</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Sold</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Price</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p, idx) => {
                const available = p.stock - (p.reservedStock || 0);
                const total = Number(p.stock || 0);
                const sold = Number(p.sold || 0);
                const status = available <= 0 ? 'Out of Stock' : available < 10 ? 'Low Stock' : 'In Stock';
                const productNotifyRequests = notifyRequestsByProduct[p.id] || [];
                return (
                  <tr
                    key={p.id}
                    className={`${idx % 2 === 0 ? 'bg-slate-900' : 'bg-white/5'} hover:bg-primary-500/10`}
                  >
                    <td className="px-4 py-3 text-sm text-white">
                      <div className="flex items-center gap-3">
                        <img src={p.images[0]} alt="" className="h-10 w-10 rounded object-cover bg-white/10 bg-white/10" />
                        <div>
                          <p className="font-semibold">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      <button
                        type="button"
                        onClick={() => setViewNotifyProduct(p)}
                        disabled={productNotifyRequests.length === 0}
                        className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-800 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-transparent disabled:text-gray-400"
                      >
                        {productNotifyRequests.length} request{productNotifyRequests.length === 1 ? '' : 's'}
                      </button>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={status} /></td>
                    <td className="px-4 py-3 text-sm text-slate-300">{total}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-white">{available}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{p.reservedStock || 0}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{sold}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">Rs {p.salePrice || p.price}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => onQuickStockUpdate(p, 10)}>+10</Button>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-400">No matching inventory rows.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />

      {viewNotifyProduct && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#080910] p-5 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary-300">Notify requests</p>
                <h3 className="mt-2 text-xl font-bold">{viewNotifyProduct.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{selectedNotifyRequests.length} customer alert request{selectedNotifyRequests.length === 1 ? '' : 's'}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewNotifyProduct(null)}
                className="rounded-full border border-white/10 px-2 py-1 text-sm text-slate-300 hover:bg-white/10 border-white/10"
                aria-label="Close notify requests popup"
              >
                X
              </button>
            </div>

            <div className="mt-5 max-h-[55vh] overflow-y-auto rounded-xl border border-white/10">
              {selectedNotifyRequests.length > 0 ? (
                <table className="min-w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">Color</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedNotifyRequests.map((request) => (
                      <tr key={request.id} className="border-t border-white/10 border-white/10">
                        <td className="px-4 py-3 text-sm font-semibold">{request.contact}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{request.contactType}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{request.selectedColorName || '-'}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">
                          {new Date(request.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="px-4 py-8 text-center text-sm text-slate-400">No notify requests yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};