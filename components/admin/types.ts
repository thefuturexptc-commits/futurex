import { Order, Product } from '../../types';

export type AnalyticsRange = '7d' | '30d' | '90d' | 'all';

export interface AdminAuditEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  details?: string;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  totalCustomers: number;
  categoryRevenue: Record<string, number>;
  topProducts: Array<Product & { sold: number }>;
}

export interface MonthlyPoint {
  label: string;
  revenue: number;
  orders: number;
}

export const getRangeStart = (range: AnalyticsRange): Date | null => {
  if (range === 'all') return null;
  const now = new Date();
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
};

export const filterOrdersByRange = (orders: Order[], range: AnalyticsRange): Order[] => {
  const start = getRangeStart(range);
  if (!start) return orders;
  return orders.filter((o) => new Date(o.date) >= start);
};

export const buildMonthlyPoints = (orders: Order[]): MonthlyPoint[] => {
  const now = new Date();
  const points: MonthlyPoint[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-US', { month: 'short' });
    const monthOrders = orders.filter((o) => {
      const od = new Date(o.date);
      const k = `${od.getFullYear()}-${String(od.getMonth() + 1).padStart(2, '0')}`;
      return k === key;
    });
    points.push({
      label,
      revenue: monthOrders.reduce((sum, o) => sum + o.total, 0),
      orders: monthOrders.length,
    });
  }
  return points;
};
