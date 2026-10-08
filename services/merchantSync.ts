import { Product } from '../types';
import { auth } from './firebaseConfig';

export type MerchantSyncResponse = {
  ok: boolean;
  merchantId?: string;
  synced?: number | unknown;
  failed?: number;
  results?: Array<{ ok: boolean; productId: string; error?: string; status?: number }>;
  error?: string;
  config?: {
    merchantId?: string;
    dataSource?: string | null;
    hasServiceAccountJson?: boolean;
    hasCredentialsPath?: boolean;
  };
  registration?: { name?: string; gcpIds?: string[] };
  registrationState?: { registeredNow?: boolean };
  pendingRegistration?: boolean;
};

const callMerchantSync = async (body: unknown): Promise<MerchantSyncResponse> => {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) throw new Error('Sign in with your admin account to sync Merchant API listings.');

  const idToken = await user.getIdToken();
  const response = await fetch('/api/merchant-sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({})) as MerchantSyncResponse;
  if (!response.ok && response.status !== 207 && response.status !== 202) {
    throw new Error(data.error || `Merchant API request failed with status ${response.status}.`);
  }
  if (data.ok === false && response.status !== 207 && response.status !== 202) {
    throw new Error(data.error || 'Merchant API sync failed.');
  }
  return data;
};

export const initializeMerchantApi = () => callMerchantSync({ action: 'initialize' });

export const syncProductToMerchant = (product: Product) => callMerchantSync({ action: 'upsert', product });

export const syncAllProductsToMerchant = (products: Product[]) => callMerchantSync({ action: 'bulk', products });

export const deleteProductFromMerchant = (productId: string) => callMerchantSync({ action: 'delete', productId });
