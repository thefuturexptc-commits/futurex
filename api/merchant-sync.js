import { deleteProductFromMerchant, getMerchantSyncConfig, syncAllProducts, upsertProduct } from '../services/merchant-api/merchantService.js';

const send = (res, status, body) => {
  res.status(status).json(body);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    send(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  try {
    const { action, product, products } = req.body || {};

    if (action === 'status') {
      send(res, 200, { ok: true, config: getMerchantSyncConfig() });
      return;
    }

    if (action === 'delete') {
      const productId = req.body?.productId || product?.id;
      const deleted = await deleteProductFromMerchant(productId);
      send(res, 200, { ok: true, deleted });
      return;
    }

    if (action === 'bulk') {
      if (!Array.isArray(products)) {
        send(res, 400, { ok: false, error: 'products must be an array.' });
        return;
      }

      const results = await syncAllProducts(products);
      const failed = results.filter((result) => !result.ok);
      send(res, failed.length ? 207 : 200, {
        ok: failed.length === 0,
        merchantId: getMerchantSyncConfig().merchantId,
        synced: results.length - failed.length,
        failed: failed.length,
        results,
      });
      return;
    }

    if (!product) {
      send(res, 400, { ok: false, error: 'product is required.' });
      return;
    }

    const synced = await upsertProduct(product);
    send(res, 200, { ok: true, merchantId: getMerchantSyncConfig().merchantId, synced });
  } catch (error) {
    console.error('Merchant sync failed', error);
    send(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Merchant sync failed.',
    });
  }
}
