import type { CartItem } from '../types';

type DataLayerEvent = Record<string, unknown>;

const getDataLayer = (): DataLayerEvent[] | null => {
  if (typeof window === 'undefined') return null;
  const targetWindow = window as Window & { dataLayer?: DataLayerEvent[] };
  targetWindow.dataLayer = targetWindow.dataLayer || [];
  return targetWindow.dataLayer;
};

export const cartItemsToAnalyticsItems = (items: CartItem[]) =>
  items.map((item) => ({
    item_id: item.id,
    item_name: item.name,
    item_category: item.category,
    item_variant: [item.selectedColorName, item.selectedSize].filter(Boolean).join(' / ') || undefined,
    price: Number(item.price || item.salePrice || 0),
    quantity: Number(item.quantity || 1),
  }));

export const pushDataLayerEvent = (event: string, payload: DataLayerEvent = {}) => {
  const dataLayer = getDataLayer();
  if (!dataLayer) return;
  dataLayer.push({ ecommerce: null });
  dataLayer.push({ event, ...payload });
};

export const pushPageView = (path: string, title: string) => {
  pushDataLayerEvent('page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: title,
  });
  pushDataLayerEvent('virtual_page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: title,
  });
};
