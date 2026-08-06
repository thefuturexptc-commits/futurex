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

const cleanText = (value?: string) => value?.trim() || '';

const formatVisitorLocation = (event: Pick<SiteAnalyticsEvent, 'city' | 'region' | 'country' | 'pincode'>) => {
  const location = [cleanText(event.city), cleanText(event.region), cleanText(event.country)].filter(Boolean).join(', ');
  const pincode = cleanText(event.pincode);
  if (location && pincode) return `${location} - ${pincode}`;
  if (location) return location;
  if (pincode) return `Pincode ${pincode}`;
  return '-';
};

const hasDetectedLocation = (location: string, pincode: string) =>
  Boolean((location && location !== '-') || pincode);

const mergeLocation = (
  visitor: {
    ipAddress: string;
    location: string;
    pincode: string;
    locationSource: SiteAnalyticsEvent['locationSource'] | '';
  },
  event: SiteAnalyticsEvent
) => {
  const nextLocation = formatVisitorLocation(event);
  const nextPincode = cleanText(event.pincode);
  const nextIpAddress = cleanText(event.ipAddress);
  const nextHasLocation = hasDetectedLocation(nextLocation, nextPincode);
  const currentHasLocation = hasDetectedLocation(visitor.location, visitor.pincode);

  if (!visitor.ipAddress && nextIpAddress) visitor.ipAddress = nextIpAddress;
  if ((!currentHasLocation && nextHasLocation) || (visitor.location === '-' && nextLocation !== '-')) {
    visitor.location = nextLocation;
  }
  if (!visitor.pincode && nextPincode) visitor.pincode = nextPincode;
  if ((visitor.location === '-' || !visitor.location) && visitor.pincode) {
    visitor.location = `Pincode ${visitor.pincode}`;
  }
  if (!visitor.locationSource && event.locationSource) visitor.locationSource = event.locationSource;
};

const cleanPhone = (phone?: string) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '-';
  return digits.startsWith('91') ? `+${digits}` : `+91 ${digits.slice(-10)}`;
};

const formatLocationSource = (source?: SiteAnalyticsEvent['locationSource']) => {
  if (source === 'precise') return 'Precise GPS';
  if (source === 'checkout') return 'Checkout';
  if (source === 'detected') return 'Detected';
  if (source === 'lookup') return 'IP Lookup';
  return '-';
};

type LocationEventFilter = 'all' | 'checkout' | SiteAnalyticsEvent['event'];

const checkoutEventNames = new Set<SiteAnalyticsEvent['event']>(['begin_checkout', 'add_shipping_info', 'add_payment_info']);

const isCheckoutEvent = (eventName: SiteAnalyticsEvent['event']) => checkoutEventNames.has(eventName);

const formatEventName = (eventName: SiteAnalyticsEvent['event'] | 'checkout') => {
  const labels: Record<string, string> = {
    page_view: 'Page view',
    product_view: 'Product view',
    add_to_cart: 'Add to cart',
    begin_checkout: 'Begin checkout',
    add_shipping_info: 'Shipping info',
    add_payment_info: 'Payment info',
    checkout: 'Checkout',
    purchase: 'Purchase',
    login: 'Login',
    location_update: 'Location update',
  };
  return labels[eventName] || eventName.replace(/_/g, ' ');
};

const safeDecode = (value?: string) => {
  const raw = cleanText(value);
  if (!raw) return '';
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' ')).trim();
  } catch {
    return raw.replace(/%20/g, ' ').trim();
  }
};

const normalizeLocationValue = (value?: string) => safeDecode(value) || 'Unknown';

const formatLocationLabel = (event: SiteAnalyticsEvent) => {
  const city = safeDecode(event.city);
  const pincode = cleanText(event.pincode);
  const region = safeDecode(event.region);
  const country = safeDecode(event.country);
  if (city && pincode) return `${city} - ${pincode}`;
  if (city && region) return `${city}, ${region}`;
  if (city) return city;
  if (pincode) return `Pincode ${pincode}`;
  if (region) return region;
  if (country) return country;
  return 'Unknown location';
};

const eventVisitorKey = (event: SiteAnalyticsEvent) => event.sessionId || event.userId || event.ipAddress || event.id;

const eventTime = (event: SiteAnalyticsEvent) => getEventDate(event)?.getTime() || 0;

const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

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
      productViews: rangedSiteEvents.filter((event) => event.event === 'product_view').length,
      addToCart: rangedSiteEvents.filter((event) => event.event === 'add_to_cart').length,
      beginCheckout: rangedSiteEvents.filter((event) => event.event === 'begin_checkout').length,
      shippingInfo: rangedSiteEvents.filter((event) => event.event === 'add_shipping_info').length,
      paymentInfo: rangedSiteEvents.filter((event) => event.event === 'add_payment_info').length,
      purchases: rangedSiteEvents.filter((event) => event.event === 'purchase').length,
      logins: rangedSiteEvents.filter((event) => event.event === 'login').length,
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
    const visitorMap = new Map<string, {
      sessionId: string;
      lastSeen: string;
      source: string;
      referrer: string;
      ipAddress: string;
      location: string;
      pincode: string;
      locationSource: SiteAnalyticsEvent['locationSource'] | '';
      isLoggedIn: boolean;
      phone: string;
      email: string;
      addToCart: number;
      purchases: number;
      pageViews: number;
      lastPage: string;
    }>();

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

      const sessionId = event.sessionId || event.userId || event.ipAddress || event.id;
      const visitor = visitorMap.get(sessionId) || {
        sessionId,
        lastSeen: event.timestamp,
        source,
        referrer: event.referrer || '',
        ipAddress: event.ipAddress || '',
        location: formatVisitorLocation(event),
        pincode: event.pincode || '',
        locationSource: event.locationSource || '',
        isLoggedIn: Boolean(event.isLoggedIn),
        phone: event.userPhone || '',
        email: event.userEmail || '',
        addToCart: 0,
        purchases: 0,
        pageViews: 0,
        lastPage: event.pagePath || '/',
      };
      if (new Date(event.timestamp).getTime() >= new Date(visitor.lastSeen).getTime()) {
        visitor.lastSeen = event.timestamp;
        visitor.source = source || visitor.source;
        visitor.lastPage = event.pagePath || visitor.lastPage;
      }
      visitor.referrer = visitor.referrer || event.referrer || '';
      mergeLocation(visitor, event);
      visitor.isLoggedIn = Boolean(event.isLoggedIn || visitor.isLoggedIn);
      visitor.phone = visitor.phone || event.userPhone || '';
      visitor.email = visitor.email || event.userEmail || '';
      if (event.event === 'page_view') visitor.pageViews += 1;
      if (event.event === 'add_to_cart') visitor.addToCart += Number(event.quantity || 1);
      if (event.event === 'purchase') visitor.purchases += 1;
      visitorMap.set(sessionId, visitor);
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
    const visitorDetails = Array.from(visitorMap.values())
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
      .slice(0, 50);

    return {
      totalEvents: rangedSiteEvents.length,
      pageViews: pageViews.length,
      uniqueVisitors,
      actionCounts,
      topPages,
      topAddToCartProducts,
      trafficSources,
      visitorDetails,
    };
  }, [rangedSiteEvents]);

  const [locationFilters, setLocationFilters] = useState<{
    dateFrom: string;
    dateTo: string;
    eventType: LocationEventFilter;
    country: string;
    region: string;
    city: string;
    product: string;
  }>(() => {
    const today = new Date();
    const start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      dateFrom: toDateInput(start),
      dateTo: toDateInput(today),
      eventType: 'all',
      country: 'all',
      region: 'all',
      city: 'all',
      product: 'all',
    };
  });

  const updateLocationFilter = <K extends keyof typeof locationFilters>(key: K, value: (typeof locationFilters)[K]) => {
    setLocationFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'country' ? { region: 'all', city: 'all' } : {}),
      ...(key === 'region' ? { city: 'all' } : {}),
    }));
  };

  const locationOptions = useMemo(() => {
    const countries = new Set<string>();
    const regions = new Set<string>();
    const cities = new Set<string>();
    const productsMap = new Map<string, string>();

    rangedSiteEvents.forEach((event) => {
      const country = normalizeLocationValue(event.country);
      const region = normalizeLocationValue(event.region);
      const city = normalizeLocationValue(event.city);

      if (country !== 'Unknown') countries.add(country);
      if (
        region !== 'Unknown' &&
        (locationFilters.country === 'all' || country === locationFilters.country)
      ) {
        regions.add(region);
      }
      if (
        city !== 'Unknown' &&
        (locationFilters.country === 'all' || country === locationFilters.country) &&
        (locationFilters.region === 'all' || region === locationFilters.region)
      ) {
        cities.add(city);
      }

      const productKey = event.productId || event.productName || '';
      if (productKey) productsMap.set(productKey, event.productName || productKey);
    });

    return {
      countries: Array.from(countries).sort(),
      regions: Array.from(regions).sort(),
      cities: Array.from(cities).sort(),
      products: Array.from(productsMap.entries()).sort((a, b) => a[1].localeCompare(b[1])),
    };
  }, [locationFilters.country, locationFilters.region, rangedSiteEvents]);

  const filteredLocationEvents = useMemo(() => {
    const fromTime = locationFilters.dateFrom ? new Date(`${locationFilters.dateFrom}T00:00:00`).getTime() : 0;
    const toTime = locationFilters.dateTo ? new Date(`${locationFilters.dateTo}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;

    return rangedSiteEvents.filter((event) => {
      const time = eventTime(event);
      if (time < fromTime || time > toTime) return false;
      if (locationFilters.eventType === 'checkout') {
        if (!isCheckoutEvent(event.event)) return false;
      } else if (locationFilters.eventType !== 'all' && event.event !== locationFilters.eventType) {
        return false;
      }

      const country = normalizeLocationValue(event.country);
      const region = normalizeLocationValue(event.region);
      const city = normalizeLocationValue(event.city);
      const productKey = event.productId || event.productName || '';

      if (locationFilters.country !== 'all' && country !== locationFilters.country) return false;
      if (locationFilters.region !== 'all' && region !== locationFilters.region) return false;
      if (locationFilters.city !== 'all' && city !== locationFilters.city) return false;
      if (locationFilters.product !== 'all' && productKey !== locationFilters.product) return false;
      return true;
    });
  }, [locationFilters, rangedSiteEvents]);

  const locationSummary = useMemo(() => {
    const groupByLocationValue = (selector: (event: SiteAnalyticsEvent) => string) => {
      const map = new Map<string, { label: string; events: number; visitors: Set<string> }>();
      filteredLocationEvents.forEach((event) => {
        const label = selector(event);
        if (!label || label === 'Unknown') return;
        const existing = map.get(label) || { label, events: 0, visitors: new Set<string>() };
        existing.events += 1;
        const visitorKey = eventVisitorKey(event);
        if (visitorKey) existing.visitors.add(visitorKey);
        map.set(label, existing);
      });
      return Array.from(map.values())
        .map((entry) => ({ ...entry, visitors: entry.visitors.size }))
        .sort((a, b) => b.events - a.events)
        .slice(0, 8);
    };

    const activityMap = new Map<string, {
      key: string;
      label: string;
      city: string;
      region: string;
      country: string;
      pincode: string;
      events: number;
      visitors: Set<string>;
      pageViews: number;
      productViews: number;
      addToCart: number;
      checkouts: number;
      purchases: number;
      logins: number;
      latest: string;
    }>();

    const cartMap = new Map<string, {
      key: string;
      productName: string;
      productId: string;
      location: string;
      quantity: number;
      events: number;
      value: number;
    }>();

    const bestLocationByVisitor = new Map<string, {
      city: string;
      region: string;
      country: string;
      pincode: string;
      label: string;
      score: number;
      latestTime: number;
    }>();

    filteredLocationEvents.forEach((event) => {
      const visitorKey = eventVisitorKey(event);
      if (!visitorKey) return;
      const city = safeDecode(event.city);
      const region = safeDecode(event.region);
      const country = safeDecode(event.country);
      const pincode = cleanText(event.pincode);
      if (!city && !region && !country && !pincode) return;

      const score = Number(Boolean(city)) * 8 + Number(Boolean(region)) * 4 + Number(Boolean(country)) * 2 + Number(Boolean(pincode));
      const label = formatLocationLabel(event);
      const latestTime = eventTime(event);
      const existing = bestLocationByVisitor.get(visitorKey);
      if (!existing || score > existing.score || (score === existing.score && latestTime > existing.latestTime)) {
        bestLocationByVisitor.set(visitorKey, { city, region, country, pincode, label, score, latestTime });
      }
    });

    filteredLocationEvents.forEach((event) => {
      const visitorKey = eventVisitorKey(event);
      const bestLocation = visitorKey ? bestLocationByVisitor.get(visitorKey) : undefined;
      const eventCity = safeDecode(event.city);
      const eventRegion = safeDecode(event.region);
      const eventCountry = safeDecode(event.country);
      const eventPincode = cleanText(event.pincode);
      const city = eventCity || bestLocation?.city || '';
      const region = eventRegion || bestLocation?.region || '';
      const country = eventCountry || bestLocation?.country || '';
      const pincode = eventPincode || bestLocation?.pincode || '';
      const label = city && pincode
        ? `${city} - ${pincode}`
        : city && region
          ? `${city}, ${region}`
          : city || (pincode ? `Pincode ${pincode}` : region || country || 'Unknown location');
      const key = [city, region, country, pincode].filter(Boolean).join('|') || label;
      const existing = activityMap.get(key) || {
        key,
        label,
        city,
        region,
        country,
        pincode,
        events: 0,
        visitors: new Set<string>(),
        pageViews: 0,
        productViews: 0,
        addToCart: 0,
        checkouts: 0,
        purchases: 0,
        logins: 0,
        latest: event.timestamp,
      };

      existing.events += 1;
      if (visitorKey) existing.visitors.add(visitorKey);
      if (event.event === 'page_view') existing.pageViews += 1;
      if (event.event === 'product_view') existing.productViews += 1;
      if (event.event === 'add_to_cart') existing.addToCart += 1;
      if (isCheckoutEvent(event.event)) existing.checkouts += 1;
      if (event.event === 'purchase') existing.purchases += 1;
      if (event.event === 'login') existing.logins += 1;
      if (eventTime(event) > new Date(existing.latest).getTime()) existing.latest = event.timestamp;
      activityMap.set(key, existing);

      if (event.event === 'add_to_cart') {
        const productId = event.productId || event.productName || 'unknown';
        const cartKey = `${productId}|${key}`;
        const cart = cartMap.get(cartKey) || {
          key: cartKey,
          productName: event.productName || productId,
          productId,
          location: label,
          quantity: 0,
          events: 0,
          value: 0,
        };
        cart.quantity += Number(event.quantity || 1);
        cart.events += 1;
        cart.value += Number(event.value || 0);
        cartMap.set(cartKey, cart);
      }
    });

    const activityByLocation = Array.from(activityMap.values())
      .map((entry) => ({ ...entry, visitors: entry.visitors.size }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 20);

    const addToCartByLocation = Array.from(cartMap.values())
      .sort((a, b) => b.events - a.events || b.quantity - a.quantity)
      .slice(0, 12);

    const recentEvents = [...filteredLocationEvents]
      .sort((a, b) => eventTime(b) - eventTime(a))
      .slice(0, 80);

    return {
      totalEvents: filteredLocationEvents.length,
      totalVisitors: new Set(filteredLocationEvents.map(eventVisitorKey).filter(Boolean)).size,
      totalSessions: new Set(filteredLocationEvents.map((event) => event.sessionId).filter(Boolean)).size,
      pageViews: filteredLocationEvents.filter((event) => event.event === 'page_view').length,
      productViews: filteredLocationEvents.filter((event) => event.event === 'product_view').length,
      addToCart: filteredLocationEvents.filter((event) => event.event === 'add_to_cart').length,
      checkouts: filteredLocationEvents.filter((event) => isCheckoutEvent(event.event)).length,
      logins: filteredLocationEvents.filter((event) => event.event === 'login').length,
      countries: groupByLocationValue((event) => normalizeLocationValue(event.country)),
      regions: groupByLocationValue((event) => normalizeLocationValue(event.region)),
      cities: groupByLocationValue((event) => normalizeLocationValue(event.city)),
      activityByLocation,
      addToCartByLocation,
      recentEvents,
    };
  }, [filteredLocationEvents]);

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

  const renderLocationRankList = (
    title: string,
    subtitle: string,
    rows: Array<{ label: string; events: number; visitors: number }>
  ) => (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-dark-surface">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      <div className="space-y-3">
        {rows.map((row) => {
          const width = Math.max(8, Math.min(100, (row.events / Math.max(1, rows[0]?.events || 1)) * 100));
          return (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-semibold text-gray-900 dark:text-white" title={row.label}>{row.label}</span>
                <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{row.visitors} visitors</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                <div className="h-full rounded-full bg-primary-500" style={{ width: `${width}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{row.events} events</p>
            </div>
          );
        })}
        {rows.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-white/10">
            No location data in this filter yet.
          </p>
        )}
      </div>
    </div>
  );

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

      <section className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Location Analytics</h2>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300">
                Realtime
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Anonymous visitor activity by page, product, cart action, checkout, login, and approximate IP or checkout location.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setLocationFilters({
                dateFrom: '',
                dateTo: '',
                eventType: 'all',
                country: 'all',
                region: 'all',
                city: 'all',
                product: 'all',
              })
            }
          >
            Reset filters
          </Button>
        </div>

        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-dark-surface">
          <div className="mb-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Filters</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Refine visitor events by date, location, event type, or product.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Date from
              <input
                type="date"
                value={locationFilters.dateFrom}
                onChange={(event) => updateLocationFilter('dateFrom', event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </label>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Date to
              <input
                type="date"
                value={locationFilters.dateTo}
                onChange={(event) => updateLocationFilter('dateTo', event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </label>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Event type
              <select
                value={locationFilters.eventType}
                onChange={(event) => updateLocationFilter('eventType', event.target.value as LocationEventFilter)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All events</option>
                <option value="page_view">Page views</option>
                <option value="product_view">Product views</option>
                <option value="add_to_cart">Add to cart</option>
                <option value="checkout">Checkouts</option>
                <option value="purchase">Purchases</option>
                <option value="login">Logins</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Country
              <select
                value={locationFilters.country}
                onChange={(event) => updateLocationFilter('country', event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All countries</option>
                {locationOptions.countries.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              State
              <select
                value={locationFilters.region}
                onChange={(event) => updateLocationFilter('region', event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All states</option>
                {locationOptions.regions.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              City
              <select
                value={locationFilters.city}
                onChange={(event) => updateLocationFilter('city', event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All cities</option>
                {locationOptions.cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Product
              <select
                value={locationFilters.product}
                onChange={(event) => updateLocationFilter('product', event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All products</option>
                {locationOptions.products.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          {[
            ['Total visitors', locationSummary.totalVisitors, `${locationSummary.totalSessions} sessions`],
            ['Page views', locationSummary.pageViews, 'Anonymous page visits'],
            ['Product views', locationSummary.productViews, 'Product detail opens'],
            ['Add to cart', locationSummary.addToCart, 'Cart actions'],
            ['Checkouts', locationSummary.checkouts, 'Checkout step events'],
            ['Logins', locationSummary.logins, 'Successful login events'],
          ].map(([label, value, hint]) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-dark-surface">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          {renderLocationRankList('Visitors by Country', 'Unique anonymous visitors by country', locationSummary.countries)}
          {renderLocationRankList('Visitors by State', 'Unique anonymous visitors by state', locationSummary.regions)}
          {renderLocationRankList('Visitors by City', 'Unique anonymous visitors by city', locationSummary.cities)}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-dark-surface">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Activity by Location</h3>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">Location-wise event counts for pages, product views, cart activity, checkouts, purchases, and logins.</p>
            <div className="space-y-3">
              {locationSummary.activityByLocation.map((location) => (
                <div key={location.key} className="rounded-lg border border-gray-100 p-4 dark:border-white/10">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{location.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{location.events} events - {location.visitors} visitors</p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(location.latest).toLocaleString()}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs sm:grid-cols-6">
                    {[
                      ['Page', location.pageViews],
                      ['Product', location.productViews],
                      ['Cart', location.addToCart],
                      ['Checkout', location.checkouts],
                      ['Purchase', location.purchases],
                      ['Login', location.logins],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md bg-gray-50 px-2 py-2 text-gray-700 dark:bg-white/5 dark:text-gray-300">
                        <p className="font-bold text-gray-900 dark:text-white">{value}</p>
                        <p>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {locationSummary.activityByLocation.length === 0 && (
                <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-white/10">
                  No location activity yet. New visits will appear here in realtime after deployment.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-dark-surface">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Add to Cart Activity by Location</h3>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">Product-wise cart activity grouped by location.</p>
            <div className="space-y-3">
              {locationSummary.addToCartByLocation.map((item) => (
                <div key={item.key} className="rounded-lg border border-gray-100 p-4 dark:border-white/10">
                  <p className="line-clamp-2 font-semibold text-gray-900 dark:text-white">{item.productName}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{item.location}</span>
                    <span>{item.productId}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-md bg-gray-50 p-2 dark:bg-white/5">
                      <p className="font-bold text-gray-900 dark:text-white">{item.quantity}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">qty</p>
                    </div>
                    <div className="rounded-md bg-gray-50 p-2 dark:bg-white/5">
                      <p className="font-bold text-gray-900 dark:text-white">{item.events}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">events</p>
                    </div>
                    <div className="rounded-md bg-gray-50 p-2 dark:bg-white/5">
                      <p className="font-bold text-gray-900 dark:text-white">Rs {Math.round(item.value).toLocaleString()}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">value</p>
                    </div>
                  </div>
                </div>
              ))}
              {locationSummary.addToCartByLocation.length === 0 && (
                <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-white/10">
                  No add-to-cart location activity yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-dark-surface">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Visitors</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Latest filtered activity across pages, product views, carts, checkout, and login.</p>
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{locationSummary.totalVisitors} visitors - {locationSummary.totalEvents} events</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1280px] text-sm">
              <thead className="bg-gray-50 dark:bg-white/5">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-500">Time</th>
                  <th className="px-3 py-2 text-left text-gray-500">Event</th>
                  <th className="px-3 py-2 text-left text-gray-500">Visitor / Session</th>
                  <th className="px-3 py-2 text-left text-gray-500">Location</th>
                  <th className="px-3 py-2 text-left text-gray-500">Page</th>
                  <th className="px-3 py-2 text-left text-gray-500">Product</th>
                  <th className="px-3 py-2 text-left text-gray-500">Qty</th>
                  <th className="px-3 py-2 text-left text-gray-500">Price</th>
                  <th className="px-3 py-2 text-left text-gray-500">Device</th>
                </tr>
              </thead>
              <tbody>
                {locationSummary.recentEvents.map((event, index) => (
                  <tr key={event.id || `${event.timestamp}-${index}`} className={index % 2 === 0 ? 'bg-white dark:bg-dark-surface' : 'bg-gray-50/60 dark:bg-white/5'}>
                    <td className="whitespace-nowrap px-3 py-2 text-gray-700 dark:text-gray-300">{new Date(event.timestamp).toLocaleString()}</td>
                    <td className="px-3 py-2 font-semibold text-gray-900 dark:text-white">{formatEventName(isCheckoutEvent(event.event) ? 'checkout' : event.event)}</td>
                    <td className="max-w-[210px] px-3 py-2 text-gray-700 dark:text-gray-300">
                      <p className="truncate" title={eventVisitorKey(event)}>{eventVisitorKey(event)}</p>
                      <p className="truncate text-[11px] text-gray-500 dark:text-gray-400" title={event.sessionId}>{event.sessionId || '-'}</p>
                    </td>
                    <td className="max-w-[200px] px-3 py-2 text-gray-700 dark:text-gray-300">
                      <p className="truncate font-semibold" title={formatLocationLabel(event)}>{formatLocationLabel(event)}</p>
                      <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                        {formatLocationSource(event.locationSource)} {event.ipAddress ? `- ${event.ipAddress}` : ''}
                      </p>
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-gray-700 dark:text-gray-300" title={event.pageLocation || event.pagePath || '-'}>
                      {event.pagePath || event.pageLocation || '-'}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-gray-700 dark:text-gray-300" title={event.productName || '-'}>
                      {event.productName || '-'}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{event.quantity || '-'}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{event.value ? `Rs ${Math.round(event.value).toLocaleString()}` : '-'}</td>
                    <td className="max-w-[180px] truncate px-3 py-2 text-gray-700 dark:text-gray-300" title={event.userAgent || '-'}>
                      {event.userAgent || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {locationSummary.recentEvents.length === 0 && (
              <p className="mt-4 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-white/10">
                No recent visitor activity matches these filters.
              </p>
            )}
          </div>
        </div>
      </section>

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

      <div className="bg-white dark:bg-dark-surface p-6 rounded-xl border border-gray-200 dark:border-white/10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Visitor Details</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          New visits show IP, login, phone, source, and referrer. Location is real only when detected from hosting headers, IP lookup, or checkout address.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-[1260px] text-sm">
            <thead className="bg-gray-50 dark:bg-white/5">
              <tr>
                <th className="px-3 py-2 text-left text-gray-500">Last Seen</th>
                <th className="px-3 py-2 text-left text-gray-500">Source</th>
                <th className="px-3 py-2 text-left text-gray-500">Referrer</th>
                <th className="px-3 py-2 text-left text-gray-500">IP</th>
                <th className="px-3 py-2 text-left text-gray-500">Location</th>
                <th className="px-3 py-2 text-left text-gray-500">Pincode</th>
                <th className="px-3 py-2 text-left text-gray-500">Geo</th>
                <th className="px-3 py-2 text-left text-gray-500">Login</th>
                <th className="px-3 py-2 text-left text-gray-500">Phone</th>
                <th className="px-3 py-2 text-left text-gray-500">Page Views</th>
                <th className="px-3 py-2 text-left text-gray-500">Add To Cart</th>
                <th className="px-3 py-2 text-left text-gray-500">Purchases</th>
                <th className="px-3 py-2 text-left text-gray-500">Last Page</th>
              </tr>
            </thead>
            <tbody>
              {siteSummary.visitorDetails.map((visitor, idx) => (
                <tr key={visitor.sessionId} className={idx % 2 === 0 ? 'bg-white dark:bg-dark-surface' : 'bg-gray-50/60 dark:bg-white/5'}>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{new Date(visitor.lastSeen).toLocaleString()}</td>
                  <td className="px-3 py-2 font-semibold text-gray-900 dark:text-white">{visitor.source}</td>
                  <td className="max-w-[180px] truncate px-3 py-2 text-gray-700 dark:text-gray-300" title={visitor.referrer || '-'}>
                    {visitor.referrer || '-'}
                  </td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{visitor.ipAddress || 'Not captured yet'}</td>
                  <td className="max-w-[180px] truncate px-3 py-2 text-gray-700 dark:text-gray-300" title={visitor.location || 'Not detected'}>
                    {visitor.location || 'Not detected'}
                  </td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{visitor.pincode || '-'}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{formatLocationSource(visitor.locationSource || undefined)}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{visitor.isLoggedIn ? 'Logged in' : 'Guest'}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{cleanPhone(visitor.phone)}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{visitor.pageViews}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{visitor.addToCart}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{visitor.purchases}</td>
                  <td className="max-w-[180px] truncate px-3 py-2 text-gray-700 dark:text-gray-300" title={visitor.lastPage}>
                    {visitor.lastPage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {siteSummary.visitorDetails.length === 0 && (
            <p className="mt-4 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-white/10">
              No visitor detail data yet. New visits after this update will appear here.
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
