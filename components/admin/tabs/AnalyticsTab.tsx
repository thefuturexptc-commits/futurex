import React, { useEffect, useMemo, useState } from 'react';
import { Order, Product } from '../../../types';
import { Button } from '../../ui/Button';
import { SectionHeader } from '../common/SectionHeader';
import { AnalyticsRange, filterOrdersByRange } from '../types';

interface Props {
  products: Product[];
  orders: Order[];
  range: AnalyticsRange;
  onRangeChange: (range: AnalyticsRange) => void;
}

const rangeOptions: Array<{ label: string; value: AnalyticsRange }> = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'All Time', value: 'all' },
];

export const AnalyticsTab: React.FC<Props> = ({ products, orders, range, onRangeChange }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const rangedOrders = useMemo(() => filterOrdersByRange(orders, range), [orders, range]);
  const yearlyOrders = useMemo(
    () => orders.filter((o) => new Date(o.date).getFullYear() === selectedYear),
    [orders, selectedYear]
  );

  const availableYears = useMemo(() => {
    const years = new Set(orders.map((o) => new Date(o.date).getFullYear()));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [orders, currentYear]);

  useEffect(() => {
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0] || currentYear);
    }
  }, [availableYears, selectedYear, currentYear]);

  const summary = useMemo(() => {
    const totalRevenue = rangedOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = rangedOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalCustomers = new Set(rangedOrders.map((o) => o.userId)).size;

    const categoryRevenue: Record<string, number> = {};
    const productSales: Record<string, number> = {};

    rangedOrders.forEach((order) => {
      order.items.forEach((item) => {
        const cat = item.category || 'Uncategorized';
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + item.price * item.quantity;
        productSales[item.id] = (productSales[item.id] || 0) + item.quantity;
      });
    });

    const topProducts = products
      .map((p) => ({ ...p, sold: productSales[p.id] || 0 }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    return { totalRevenue, totalOrders, avgOrderValue, totalCustomers, categoryRevenue, topProducts };
  }, [products, rangedOrders]);

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthly = useMemo(() => {
    return monthLabels.map((label, monthIndex) => {
      const monthOrders = yearlyOrders.filter((o) => new Date(o.date).getMonth() === monthIndex);
      return {
        label,
        revenue: monthOrders.reduce((sum, o) => sum + o.total, 0),
        orders: monthOrders.length,
      };
    });
  }, [yearlyOrders]);

  const maxRevenue = Math.max(1, ...monthly.map((m) => m.revenue));
  const maxOrders = Math.max(1, ...monthly.map((m) => m.orders));
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-200 dark:border-white/10">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Revenue by Month ({selectedYear})</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Higher bar = higher revenue in that month.</p>
          <div className="flex items-center gap-2 mb-4 text-xs text-gray-600 dark:text-gray-300">
            <span className="inline-block w-3 h-3 rounded bg-primary-500" />
            <span>Blue bar: Revenue in Rs</span>
          </div>
          <div className="grid grid-cols-6 md:grid-cols-12 gap-2 items-end h-52">
            {monthly.map((m) => (
              <div key={m.label} className="flex flex-col items-center gap-2">
                <div className="w-full bg-gray-100 dark:bg-white/10 rounded-md h-40 flex items-end">
                  <div
                    className="w-full bg-primary-500 rounded-md transition-all"
                    style={{ height: `${Math.max(8, (m.revenue / maxRevenue) * 100)}%` }}
                    title={`Rs ${m.revenue.toLocaleString()}`}
                  />
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">Rs {Math.round(m.revenue).toLocaleString()}</span>
                <span className="text-xs text-gray-500">{m.label}</span>
              </div>
            ))}
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
          <svg viewBox="0 0 700 180" className="w-full h-44">
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
