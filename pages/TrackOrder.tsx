import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getCachedOrderById, getOrderById } from '../services/backend';
import { Order } from '../types';

type TrackingEvent = {
  status: string;
  activity: string;
  location: string;
  happenedAt: string;
};

type ShiprocketTrackResponse = {
  ok: boolean;
  trackingId: string;
  currentStatus: string;
  courier: string;
  etd: string;
  deliveredDate: string;
  events: TrackingEvent[];
  error?: string;
};

type ProgressStep = { label: string; done: boolean };

const toSafeText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

const normalizeStatus = (status: unknown) => toSafeText(status).toLowerCase().trim();

const deriveProgress = (status: unknown): ProgressStep[] => {
  const s = normalizeStatus(status);
  const delivered = s.includes('deliver');
  const shipped = delivered || s.includes('ship') || s.includes('transit') || s.includes('out for delivery');
  const processing = shipped || s.includes('process') || s.includes('pickup') || s.includes('assigned');

  return [
    { label: 'Order Confirmed', done: true },
    { label: 'Shipped', done: shipped || processing },
    { label: 'Out for Delivery', done: delivered || s.includes('out for delivery') },
    { label: 'Delivered', done: delivered },
  ];
};

const statusPillClass = (status: unknown) => {
  const s = normalizeStatus(status);
  if (s.includes('deliver')) return 'bg-emerald-50 text-emerald-700 border-emerald-300';
  if (s.includes('cancel') || s.includes('return') || s.includes('fail')) return 'bg-red-50 text-red-700 border-red-300';
  if (s.includes('ship') || s.includes('transit') || s.includes('out for delivery')) return 'bg-cyan-50 text-cyan-700 border-cyan-300';
  return 'bg-amber-50 text-amber-700 border-amber-300';
};

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export const TrackOrder: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');
  const [trackingData, setTrackingData] = useState<ShiprocketTrackResponse | null>(null);

  const orderId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get('orderId') || '').trim();
  }, [location.search]);

  useEffect(() => {
    setOrderSearch(orderId);
  }, [orderId]);

  const submitOrderSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = orderSearch.trim();
    if (!value) return;
    navigate(`/track-order?orderId=${encodeURIComponent(value)}`);
  };

  useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      if (!orderId) {
        setLoadingOrder(false);
        return;
      }
      const cachedOrder = getCachedOrderById(orderId);
      if (cachedOrder) {
        setOrder(cachedOrder);
        setLoadingOrder(false);
      } else {
        setLoadingOrder(true);
      }

      try {
        const exactOrder = await getOrderById(orderId);
        if (!cancelled) setOrder(exactOrder || cachedOrder);
      } catch {
        if (!cancelled && !cachedOrder) setOrder(null);
      } finally {
        if (!cancelled) setLoadingOrder(false);
      }
    };

    void loadOrder();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4500);

    const fetchTracking = async () => {
      if (!order?.trackingId) {
        setTrackingData(null);
        window.clearTimeout(timeoutId);
        return;
      }
      setTrackingLoading(true);
      setTrackingError('');
      try {
        const res = await fetch('/api/shiprocket-track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackingId: order.trackingId, orderId: order.id }),
          signal: controller.signal,
        });
        const data = (await res.json()) as ShiprocketTrackResponse;
        if (!res.ok || !data?.ok) {
          setTrackingError(data?.error || 'Unable to fetch live tracking updates right now.');
          setTrackingData(null);
          return;
        }
        setTrackingData(data); 
      } catch {
        setTrackingError('Live courier updates are taking longer than expected. Showing saved order details for now.');
        setTrackingData(null);
      } finally {
        window.clearTimeout(timeoutId);
        setTrackingLoading(false);
      }
    };

    void fetchTracking();

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [order?.trackingId, order?.id]);

  if (loadingOrder) {
    return <div className="track-order-page tfx-standard-page min-h-screen bg-slate-50 p-8 text-center text-slate-800">Loading order tracking...</div>;
  }

  if (!order || !orderId) {
    return (
      <div className="track-order-page tfx-standard-page min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:py-12">
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-[0_18px_50px_rgba(15,63,70,0.08)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0284c7]">TheFutureX Shipment Tracker</p>
          <h1 className="mt-3 text-2xl font-black sm:text-4xl">{orderId ? 'Order not found' : 'Track your order'}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {orderId ? 'We could not find this order for your account. Please check the order ID and try again.' : 'Enter your TheFutureX order ID to view saved shipment details and live courier updates when available.'}
          </p>
          <form onSubmit={submitOrderSearch} className="mx-auto mt-6 flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              value={orderSearch}
              onChange={(event) => setOrderSearch(event.target.value)}
              placeholder="Enter order ID"
              className="min-h-12 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#0284c7] focus:ring-4 focus:ring-[#0284c7]/15"
            />
            <Button type="submit">Track Order</Button>
          </form>
          <Link to={user ? '/profile' : '/shop/all'} className="mt-5 inline-block text-sm font-bold text-[#0369a1] hover:text-[#075985]">
            {user ? 'Back to Profile' : 'Continue Shopping'}
          </Link>
        </div>
      </div>
    );
  }

  const status = toSafeText(trackingData?.currentStatus) || toSafeText(order.status) || 'Processing';
  const courier = toSafeText(trackingData?.courier) || toSafeText(order.trackingCarrier) || 'Shiprocket';
  const events = trackingData?.events || [];
  const progress = deriveProgress(status);

  return (
    <div className="track-order-page tfx-standard-page min-h-screen bg-slate-50 px-3 py-6 text-slate-950 sm:px-5 sm:py-10">
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_24px_70px_rgba(15,63,70,0.10)] sm:p-7">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0284c7]">TheFutureX Shipment Tracker</p>
            <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-4xl">Track Your Order</h1>
            <p className="mt-2 text-sm text-slate-600">Saved order details load first; live courier updates refresh when available.</p>
          </div>
          <span className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-bold ${statusPillClass(status)}`}>
            {status || 'Processing'}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Order ID</p>
            <p className="mt-2 break-all font-mono text-base">{order.id}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">AWB / Tracking ID</p>
            <p className="mt-2 break-all font-mono text-base">{order.trackingId || '-'}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2 lg:col-span-1">
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">Courier</p>
            <p className="mt-2 text-base">{courier}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0284c7]">Delivery Progress</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {progress.map((step, idx) => (
              <div key={step.label} className={`rounded-xl border p-4 ${step.done ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step.done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {idx + 1}
                </span>
                <p className={`mt-3 text-base font-semibold ${step.done ? 'text-emerald-900' : 'text-slate-600'}`}>{step.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0284c7]">Recent Tracking Activity</p>
            {trackingLoading && <span className="text-xs font-bold text-cyan-700">Refreshing...</span>}
          </div>

          {trackingError && (
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-800">
              {trackingError}
            </div>
          )}

          {events.length > 0 ? (
            <div className="mt-4 space-y-4">
              {events.map((event, idx) => (
                <div key={`${event.status}_${event.happenedAt}_${idx}`} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[170px_1fr]">
                  <div className="text-sm text-slate-500">
                    <p>{formatDateTime(event.happenedAt)}</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{toSafeText(event.status) || 'Update'}</p>
                    <p className="text-sm text-slate-600">{toSafeText(event.activity) || 'Shipment update'}</p>
                    {toSafeText(event.location) && <p className="mt-1 text-sm font-semibold text-[#0369a1]">{toSafeText(event.location)}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No detailed tracking events yet. Please check again shortly.
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={user ? '/profile' : '/shop/all'}>
            <Button variant="outline">{user ? 'Back to My Account' : 'Continue Shopping'}</Button>
          </Link>
          {order.trackingUrl && (
            <a href={order.trackingUrl} target="_blank" rel="noreferrer">
              <Button>Open Official Courier Link</Button>
            </a>
          )}
        </div>

        <div className="mt-4 text-xs text-slate-500">
          ETA: {formatDateTime(trackingData?.etd)} {trackingData?.deliveredDate ? `| Delivered At: ${formatDateTime(trackingData.deliveredDate)}` : ''}
        </div>
      </div>
    </div>
  );
};
