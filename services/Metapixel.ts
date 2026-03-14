// ============================================================
// META PIXEL (Facebook Pixel) Integration — The Futurex
// ============================================================
// Add your Pixel ID to .env:
//   VITE_META_PIXEL_ID=YOUR_PIXEL_ID_HERE
// ============================================================

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string;

// ── Initialize Pixel ──────────────────────────────────────────
export const initMetaPixel = (): void => {
  if (!PIXEL_ID) {
    console.warn('[MetaPixel] VITE_META_PIXEL_ID is not set. Pixel will not fire.');
    return;
  }

  const win = window as any;
  if (typeof win.fbq === 'function') return; // already initialized

  // Inject fbq stub
  (function (f: any, b: Document, e: string, v: string) {
    let n: any;
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  (window as any).fbq('init', PIXEL_ID);
  (window as any).fbq('track', 'PageView');

  if (import.meta.env.DEV) {
    console.log(`[MetaPixel] Initialized with Pixel ID: ${PIXEL_ID}`);
  }
};

// ── Helper: safe fbq call ─────────────────────────────────────
const fbq = (...args: any[]): void => {
  const win = window as any;
  if (typeof win.fbq === 'function') {
    win.fbq(...args);
    if (import.meta.env.DEV) {
      console.log('[MetaPixel] Event fired:', ...args);
    }
  }
};

// ── Standard Events ───────────────────────────────────────────

/** Fire on every route change */
export const trackPageView = (): void => {
  fbq('track', 'PageView');
};

/** Fire when a product detail page is viewed */
export const trackViewContent = (product: {
  id: string;
  name: string;
  category: string;
  price: number;
}): void => {
  fbq('track', 'ViewContent', {
    content_ids: [product.id],
    content_name: product.name,
    content_category: product.category,
    content_type: 'product',
    value: product.price,
    currency: 'INR',
  });
};

/** Fire when user adds a product to cart */
export const trackAddToCart = (product: {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}): void => {
  fbq('track', 'AddToCart', {
    content_ids: [product.id],
    content_name: product.name,
    content_category: product.category,
    content_type: 'product',
    value: product.price * product.quantity,
    currency: 'INR',
    num_items: product.quantity,
  });
};

/** Fire when user reaches checkout page */
export const trackInitiateCheckout = (params: {
  items: Array<{ id: string; quantity: number; price: number }>;
  totalValue: number;
}): void => {
  fbq('track', 'InitiateCheckout', {
    content_ids: params.items.map((i) => i.id),
    content_type: 'product',
    num_items: params.items.reduce((sum, i) => sum + i.quantity, 0),
    value: params.totalValue,
    currency: 'INR',
  });
};

/** Fire when user adds payment info (reaches payment page) */
export const trackAddPaymentInfo = (params: {
  items: Array<{ id: string; quantity: number; price: number }>;
  totalValue: number;
}): void => {
  fbq('track', 'AddPaymentInfo', {
    content_ids: params.items.map((i) => i.id),
    content_type: 'product',
    value: params.totalValue,
    currency: 'INR',
  });
};

/** Fire on successful purchase / order placed */
export const trackPurchase = (params: {
  orderId: string;
  items: Array<{ id: string; name: string; quantity: number; price: number }>;
  totalValue: number;
}): void => {
  fbq('track', 'Purchase', {
    content_ids: params.items.map((i) => i.id),
    content_type: 'product',
    num_items: params.items.reduce((sum, i) => sum + i.quantity, 0),
    value: params.totalValue,
    currency: 'INR',
    order_id: params.orderId,
  });
};

/** Fire on user registration / signup */
export const trackCompleteRegistration = (method: 'email' | 'google' | 'phone' = 'email'): void => {
  fbq('track', 'CompleteRegistration', {
    content_name: 'Signup',
    status: true,
    method,
  });
};

/** Fire on search */
export const trackSearch = (searchString: string): void => {
  fbq('track', 'Search', {
    search_string: searchString,
  });
};

/** Custom event: category page viewed */
export const trackCategoryView = (category: string): void => {
  fbq('trackCustom', 'CategoryView', {
    category_name: category,
  });
};

/** Custom event: support chat opened */
export const trackSupportChatOpen = (): void => {
  fbq('trackCustom', 'SupportChatOpened');
};
