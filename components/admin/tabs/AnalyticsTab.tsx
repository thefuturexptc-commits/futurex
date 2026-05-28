import React, { useEffect, useMemo, useState } from 'react';
import { Order, Product, SiteAnalyticsEvent } from '../../../types';
import { Button } from '../../ui/Button';
import { SectionHeader } from '../common/SectionHeader';
import { AnalyticsRange, filterOrdersByRange } from '../types';

interface Props {
  products: Product[];
  orders: Order[];
  siteEvents: SiteAnalyticsEvent[];
  range: AnalyticsRange;
  onRangeChange: (range: AnalyticsRange) => void;
}

const rangeOptions: Array<{ label: string; value: AnalyticsRange }> = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'All Time', value: 'all' },
];

const getOrderDate = (order: Order): Date | null => {
  const rawDate = order.date || order.createdAt || '';
  const value = rawDate as unknown as
    | string
    | number
    | Date
    | { seconds?: number; toDate?: () => Date };
  const date =
    value instanceof Date
      ? value
      : typeof value === 'object' && value && typeof value.toDate === 'function'
        ? value.toDate()
        : typeof value === 'object' && value && typeof value.seconds === 'number'
          ? new Date(value.seconds * 1000)
          : new Date(typeof value === 'string' || typeof value === 'number' ? value : '');
  return Number.isFinite(date.getTime()) ? date : null;
};

const getOrderTotal = (order: Order): number => {
  const total = Number(order.total || 0);
  return Number.isFinite(total) ? total : 0;
};

const getItemValue = (item: Order['items'][number]): number => {
  const price = Number(item.price || 0);
  const quantity = Number(item.quantity || 0);
  return Number.isFinite(price) && Number.isFinite(quantity) ? price * quantity : 0;
};

const getItemQuantity = (item: Order['items'][number]): number => {
  const quantity = Number(item.quantity || 0);
  return Number.isFinite(quantity) ? quantity : 0;
};

const getEventDate = (event: SiteAnalyticsEvent): Date | null => {
  const date = new Date(event.timestamp || '');
  return Number.isFinite(date.getTime()) ? date : null;
};

const filterEventsByRange = (events: SiteAnalyticsEvent[], range: AnalyticsRange): SiteAnalyticsEvent[] => {
  if (range === 'all') return events;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const start = Date.now() - days * 24 * 60 * 60 * 1000;
  return events.filter((event) => {
    const date = getEventDate(event);
    return date ? date.getTime() >= start : false;
  });
};

const normalizePath = (path?: string) => {
  if (!path) return '/';
  return path.split('?')[0] || '/';
};

export const AnalyticsTab: React.FC<Props> = ({ products, orders, siteEvents, range, onRangeChange }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const rangedOrders = useMemo(() => filterOrdersByRange(orders, range), [orders, range]);
  const rangedSiteEvents = useMemo(() => filterEventsByRange(siteEvents, range), [siteEvents, range]);
  const yearlyOrders = useMemo(
    () => orders.filter((o) => getOrderDate(o)?.getFullYear() === selectedYear),
    [orders, selectedYear]
  );

  const availableYears = useMemo(() => {
    const years = new Set(
      orders
        .map((o) => getOrderDate(o)?.getFullYear())
        .filter((year): year is number => Number.isFinite(year))
    );
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [orders, currentYear]);

  useEffect(() => {
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0] || currentYear);
    }
  }, [availableYears, selectedYear, currentYear]);

  const summary = useMemo(() => {
    const totalRevenue = rangedOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);
    const totalOrders = rangedOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalCustomers = new Set(rangedOrders.map((o) => o.userId).filter(Boolean)).size;

    const categoryRevenue: Record<string, number> = {};
    const productSales: Record<string, number> = {};

    rangedOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const cat = item.category || 'Uncategorized';
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + getItemValue(item);
        productSales[item.id] = (productSales[item.id] || 0) + getItemQuantity(item);
      });
    });

    const topProducts = products
      .map((p) => ({ ...p, sold: productSales[p.id] || 0 }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    return { totalRevenue, totalOrders, avgOrderValue, totalCustomers, categoryRevenue, topProducts };
  }, [products, rangedOrders]);

  const siteSummary = useMemo(() => {
    const pageViews = rangedSiteEvents.filter((event) => event.event === 'page_view');
    const uniqueVisitors = new Set(rangedSiteEvents.map((event) => event.sessionId).filter(Boolean)).size;
    const actionCounts = {
      addToCart: rangedSiteEvents.filter((event) => event.event === 'add_to_cart').length,
      beginCheckout: rangedSiteEvents.filter((event) => event.event === 'begin_checkout').length,
      shippingInfo: rangedSiteEvents.filter((event) => event.event === 'add_shipping_info').length,
      paymentInfo: rangedSiteEvents.filter((event) => event.event === 'add_payment_info').length,
      purchases: rangedSiteEvents.filter((event) => event.event === 'purchase').length,
    };

    const pageMap = new Map<string, { path: string; title: string; views: number; visitors: Set<string> }>();
    pageViews.forEach((event) => {
      const path = normalizePath(event.pagePath);
      const existing = pageMap.get(path) || {
        path,
        title: event.pageTitle || path,
        views: 0,
        visitors: new Set<string>(),
      };
      existing.views += 1;
      if (event.sessionId) existing.visitors.add(event.sessionId);
      pageMap.set(path, existing);
    });

    const productActionMap = new Map<string, { id: string; name: string; category: string; adds: number; value: number }>();
    const sourceMap = new Map<string, { source: string; visitors: Set<string>; pageViews: number; addToCart: number; purchases: number }>();

    rangedSiteEvents.forEach((event) => {
      const source = event.source || 'Website';
      const existing = sourceMap.get(source) || {
        source,
        visitors: new Set<string>(),
        pageViews: 0,
        addToCart: 0,
        purchases: 0,
      };
      if (event.sessionId) existing.visitors.add(event.sessionId);
      if (event.event === 'page_view') existing.pageViews += 1;
      if (event.event === 'add_to_cart') existing.addToCart += 1;
      if (event.event === 'purchase') existing.purchases += 1;
      sourceMap.set(source, existing);
    });

    rangedSiteEvents
      .filter((event) => event.event === 'add_to_cart')
      .forEach((event) => {
        const id = event.productId || event.productName || 'unknown';
        const existing = productActionMap.get(id) || {
          id,
          name: event.productName || id,
          category: event.productCategory || 'Uncategorized',
          adds: 0,
          value: 0,
        };
        existing.adds += Number(event.quantity || 1);
        existing.value += Number(event.value || 0);
        productActionMap.set(id, existing);
      });

    const topPages = Array.from(pageMap.values())
      .map((page) => ({ ...page, visitors: page.visitors.size }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);
    const topAddToCartProducts = Array.from(productActionMap.values())
      .sort((a, b) => b.adds - a.adds)
      .slice(0, 8);
    const trafficSources = Array.from(sourceMap.values())
      .map((source) => ({ ...source, visitors: source.visitors.size }))
      .sort((a, b) => b.pageViews - a.pageViews)
      .slice(0, 8);

    return {
      totalEvents: rangedSiteEvents.length,
      pageViews: pageViews.length,
      uniqueVisitors,
      actionCounts,
      topPages,
      topAddToCartProducts,
      trafficSources,
    };
  }, [rangedSiteEvents]);

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthly = useMemo(() => {
    return monthLabels.map((label, monthIndex) => {
      const monthOrders = yearlyOrders.filter((o) => getOrderDate(o)?.getMonth() === monthIndex);
      return {
        label,
        revenue: monthOrders.reduce((sum, o) => sum + getOrderTotal(o), 0),
        orders: monthOrders.length,
      };
    });
  }, [yearlyOrders]);

  const maxRevenue = Math.max(1, ...monthly.map((m) => m.revenue));
  const maxOrders = Math.max(1, ...monthly.map((m) => m.orders));
  const hasMonthlyRevenue = monthly.some((m) => m.revenue > 0);
  const totalCatRevenue = Math.max(1, Object.values(summary.categoryRevenue).reduce((sum, n) => sum + n, 0));
  const piePalette = ['#0ea5e9', '#10b981', '#f97316', '#8b5cf6', '#ef4444', '#14b8a6'];

  const pie = useMemo(() => {
    const entries = Object.entries(summary.categoryRevenue);
    if (entries.length === 0) return 'conic-gradient(#e5e7eb 0deg 360deg)';
    let angle = 0;
    const slices = entries.map(([, value], i) => {
      const next = angle + (value / totalCatRevenue) * 360;
      const part = `${piePalette[i % piePalette.length]} ${angle}deg ${next}deg`;
      angle = next;
      return part;
    });
    return `conic-gradient(${slices.join(',')})`;
  }, [summary.categoryRevenue, totalCatRevenue]);

  const orderLinePoints = useMemo(() => {
    const width = 700;
    const height = 180;
    return monthly
      .map((m, idx) => {
        const x = (idx / (monthly.length - 1)) * width;
        const y = height - (m.orders / maxOrders) * height;
        return `${x},${Math.max(8, y)}`;
      })
      .join(' ');
  }, [monthly, maxOrders]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <SectionHeader
        title="Analytics"
        subtitle="Revenue, demand trend, and category-level performance (auto-updates as new monthly data arrives)"
        right={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {rangeOptions.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={range === opt.value ? 'primary' : 'outline'}
                onClick={() => onRangeChange(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Total Revenue</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">Rs {summary.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{summary.totalOrders}</p>
        </div>
        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Avg Order Value</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">Rs {summary.avgOrderValue.toFixed(0)}</p>
        </div>
        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Active Customers</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{summary.totalCustomers}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Page Views</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{siteSummary.pageViews}</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Website visits tracked in selected range</p>
        </div>
        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Unique Visitors</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{siteSummary.uniqueVisitors}</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Based on browser sessions</p>
        </div>
        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Add To Cart</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{siteSummary.actionCounts.addToCart}</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Product add events</p>
        </div>
        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Checkout Actions</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{siteSummary.actionCounts.beginCheckout}</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Checkout started events</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-200 dark:border-white/10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Most Visited Pages</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Similar to Vercel/Firebase page analytics, grouped by page URL.</p>
          <div className="space-y-3">
            {siteSummary.topPages.map((page) => (
              <div key={page.path} className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{page.title || page.path}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{page.path}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{page.views}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{page.visitors} visitors</p>
                  </div>
                </div>
              </div>
            ))}
            {siteSummary.topPages.length === 0 && (
              <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-white/10">
                No page visit analytics yet. Open a few website pages after deploying this update.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-200 dark:border-white/10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Customer Actions</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Tracks important shopping actions from the website.</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Add to Cart', siteSummary.actionCounts.addToCart],
              ['Begin Checkout', siteSummary.actionCounts.beginCheckout],
              ['Shipping Info', siteSummary.actionCounts.shippingInfo],
              ['Payment Info', siteSummary.actionCounts.paymentInfo],
              ['Purchases', siteSummary.actionCounts.purchases],
              ['All Events', siteSummary.totalEvents],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 p-3 dark:bg-white/5">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          <h4 className="mt-6 text-sm font-semibold text-gray-900 dark:text-white">Most Added Products</h4>
          <div className="mt-3 space-y-2">
            {siteSummary.topAddToCartProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 dark:border-white/10">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{product.name}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{product.category}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{product.adds}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Rs {Math.round(product.value).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {siteSummary.topAddToCartProducts.length === 0 && (
              <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-white/10">
                No add-to-cart analytics yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-200 dark:border-white/10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Traffic Source</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Shows whether visitors came from Meta Ads, Google Ads, Instagram, Facebook, WhatsApp, Google, or direct website visits.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-white/5">
              <tr>
                <th className="px-3 py-2 text-left text-gray-500">Source</th>
                <th className="px-3 py-2 text-left text-gray-500">Visitors</th>
                <th className="px-3 py-2 text-left text-gray-500">Page Views</th>
                <th className="px-3 py-2 text-left text-gray-500">Add To Cart</th>
                <th className="px-3 py-2 text-left text-gray-500">Purchases</th>
              </tr>
            </thead>
            <tbody>
              {siteSummary.trafficSources.map((source, idx) => (
                <tr key={source.source} className={idx % 2 === 0 ? 'bg-white dark:bg-dark-surface' : 'bg-gray-50/60 dark:bg-white/5'}>
                  <td className="px-3 py-2 font-semibold text-gray-900 dark:text-white">{source.source}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{source.visitors}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{source.pageViews}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{source.addToCart}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{source.purchases}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {siteSummary.trafficSources.length === 0 && (
            <p className="mt-4 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-white/10">
              No traffic source data yet.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-200 dark:border-white/10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Revenue by Month ({selectedYear})</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Higher bar = higher revenue in that month.</p>
          <div className="flex items-center gap-2 mb-4 text-xs text-gray-600 dark:text-gray-300">
            <span className="inline-block w-3 h-3 rounded bg-primary-500" />
            <span>Blue bar: Revenue in Rs</span>
          </div>
          {!hasMonthlyRevenue && (
            <p className="mb-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-500 dark:border-white/10 dark:bg-white/5">
              No revenue orders found for {selectedYear}. New paid/COD orders will appear here after they are placed.
            </p>
          )}
          <div className="overflow-x-auto pb-2">
            <div className="grid h-56 min-w-[760px] grid-cols-12 items-end gap-3">
              {monthly.map((m) => (
                <div key={m.label} className="flex min-w-0 flex-col items-center gap-2">
                  <div className="flex h-40 w-full items-end rounded-md bg-gray-100 dark:bg-white/10">
                    <div
                      className={`w-full rounded-md transition-all ${m.revenue > 0 ? 'bg-primary-500' : 'bg-gray-300 dark:bg-white/20'}`}
                      style={{ height: `${m.revenue > 0 ? Math.max(10, (m.revenue / maxRevenue) * 100) : 4}%` }}
                      title={`Rs ${m.revenue.toLocaleString()}`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">Rs {Math.round(m.revenue).toLocaleString()}</span>
                  <span className="text-xs text-gray-500">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-200 dark:border-white/10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Category Share</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Shows which category contributes most revenue.</p>
          <div className="w-44 h-44 mx-auto rounded-full" style={{ background: pie }} />
          <div className="mt-4 space-y-2">
            {Object.entries(summary.categoryRevenue).map(([cat, rev], idx) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: piePalette[idx % piePalette.length] }} />
                  {cat}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {Math.round((rev / totalCatRevenue) * 100)}% (Rs {rev.toLocaleString()})
                </span>
              </div>
            ))}
            {Object.keys(summary.categoryRevenue).length === 0 && (
              <p className="text-sm text-gray-500">No category data in selected range.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-200 dark:border-white/10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Orders by Month ({selectedYear})</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Line up means more orders, line down means fewer orders.</p>
        <div className="flex items-center gap-2 mb-4 text-xs text-gray-600 dark:text-gray-300">
          <span className="inline-block w-3 h-3 rounded bg-emerald-500" />
          <span>Green line: Number of orders</span>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-white/10 p-3 overflow-x-auto">
          <svg viewBox="0 0 700 180" className="h-44 min-w-[700px]">
            <polyline
              points={orderLinePoints}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {monthly.map((m, idx) => {
              const x = (idx / (monthly.length - 1)) * 700;
              const y = 180 - (m.orders / maxOrders) * 180;
              return (
                <g key={`dot-${m.label}`}>
                  <circle cx={x} cy={Math.max(8, y)} r="4" fill="#10b981" />
                  <text x={x} y={Math.max(8, y) - 8} textAnchor="middle" fontSize="10" fill="currentColor" className="text-gray-600 dark:text-gray-300">
                    {m.orders}
                  </text>
                  <text x={x} y={176} textAnchor="middle" fontSize="11" fill="currentColor" className="text-gray-500">
                    {m.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-200 dark:border-white/10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Simple Monthly Summary ({selectedYear})</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-white/5">
              <tr>
                <th className="px-3 py-2 text-left text-gray-500">Month</th>
                <th className="px-3 py-2 text-left text-gray-500">Revenue</th>
                <th className="px-3 py-2 text-left text-gray-500">Orders</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((m, idx) => (
                <tr key={`row-${m.label}`} className={idx % 2 === 0 ? 'bg-white dark:bg-dark-surface' : 'bg-gray-50/60 dark:bg-white/5'}>
                  <td className="px-3 py-2 text-gray-900 dark:text-white">{m.label}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">Rs {m.revenue.toLocaleString()}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{m.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
