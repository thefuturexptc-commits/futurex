import { Product } from '../types';

type MerchantSyncResponse = {
  ok: boolean;
  merchantId?: string;
  synced?: unknown;
  failed?: number;
  results?: Array<{ ok: boolean; productId: string; error?: string }>;
  error?: string;
  feedUrl?: string;
};

const MERCHANT_FEED_URL = '/merchant-feed.xml';
const MERCHANT_SYNC_MODE = import.meta.env.VITE_MERCHANT_SYNC_MODE || 'feed';

const callMerchantSync = async (body: unknown): Promise<MerchantSyncResponse> => {
  if (MERCHANT_SYNC_MODE === 'feed') {
    const payload = body as { action?: string; product?: Product; products?: Product[]; productId?: string };
    const products = Array.isArray(payload.products) ? payload.products : payload.product ? [payload.product] : [];

    return {
      ok: true,
      feedUrl: MERCHANT_FEED_URL,
      synced: {
        mode: 'feed',
        action: payload.action || 'upsert',
        productCount: products.length,
        productId: payload.productId || payload.product?.id,
      },
      results: products.map((product) => ({ ok: true, productId: product.id })),
    };
  }

  const response = await fetch('/api/merchant-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(async () => {
    const text = await response.text().catch(() => '');
    return { ok: false, error: text || `Merchant sync request failed with status ${response.status}.` };
  })) as MerchantSyncResponse;

  if (!response.ok && response.status !== 207) {
    throw new Error(data.error || `Merchant sync request failed with status ${response.status}.`);
  }

  if (data.ok === false && response.status !== 207) {
    throw new Error(data.error || 'Merchant sync failed.');
  }

  return data;
};

export const syncProductToMerchant = (product: Product) =>
  callMerchantSync({ 
    action: 'upsert',
    product,
  });

export const syncAllProductsToMerchant = (products: Product[]) =>
  callMerchantSync({
    action: 'bulk',
    products,
  });

export const deleteProductFromMerchant = (productId: string) =>
  callMerchantSync({
    action: 'delete',
    productId,
  });
