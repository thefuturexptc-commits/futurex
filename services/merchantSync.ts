import { Product } from '../types';

type MerchantSyncResponse = {
  ok: boolean;
  synced?: unknown;
  failed?: number;
  results?: Array<{ ok: boolean; productId: string; error?: string }>;
  error?: string;
};

const callMerchantSync = async (body: unknown): Promise<MerchantSyncResponse> => {
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
