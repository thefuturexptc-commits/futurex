import fs from 'node:fs';
import path from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import {
  deleteProductFromMerchant,
  ensureMerchantDataSource,
  getMerchantSyncConfig,
  registerMerchantApiProject,
  syncAllProducts,
  upsertProduct,
} from '../services/merchant-api/merchantService.js';

const send = (res, status, body) => res.status(status).json(body);
const SUPERADMIN_EMAIL = 'thefuturex.ptc@gmail.com';

const getFirebaseAdminApp = () => {
  const existing = getApps().find((app) => app.name === 'merchant-api-auth');
  if (existing) return existing;

  const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  let credentials;
  if (rawCredentials) {
    credentials = JSON.parse(rawCredentials);
  } else {
    const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentialPath) throw new Error('Firebase admin auth needs the service account credentials configured on the server.');
    const keyPath = path.isAbsolute(credentialPath) ? credentialPath : path.resolve(process.cwd(), credentialPath);
    if (!fs.existsSync(keyPath)) throw new Error('Firebase admin auth could not find the configured service account key.');
    credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  }

  return initializeApp({
    credential: cert(credentials),
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || credentials.project_id,
  }, 'merchant-api-auth');
};

const requireAdmin = async (req) => {
  const authorization = req.headers?.authorization || '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return false;

  try {
    const app = getFirebaseAdminApp();
    const decoded = await getAuth(app).verifyIdToken(token);
    if (decoded.admin === true || decoded.role === 'admin' || decoded.role === 'superadmin') return true;
    if (String(decoded.email || '').toLowerCase() === SUPERADMIN_EMAIL) return true;
    const user = await getFirestore(app).collection('users').doc(decoded.uid).get();
    const role = user.data()?.role;
    return role === 'admin' || role === 'superadmin';
  } catch (error) {
    console.warn('Merchant API request authentication failed.');
    return false;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    send(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  if (!(await requireAdmin(req))) {
    send(res, 401, { ok: false, error: 'Sign in with an admin account to manage Merchant API listings.' });
    return;
  }

  try {
    const { action, product, products } = req.body || {};

    if (action === 'status' || action === 'initialize') {
      const dataSource = await ensureMerchantDataSource();
      send(res, 200, { ok: true, config: { ...getMerchantSyncConfig(), dataSource } });
      return;
    }

    if (action === 'register') {
      const registration = await registerMerchantApiProject(req.body?.developerEmail);
      send(res, 200, { ok: true, registration });
      return;
    }

    if (action === 'delete') {
      const productId = req.body?.productId || product?.id;
      const deleted = await deleteProductFromMerchant(productId);
      send(res, 200, { ok: true, deleted, merchantId: getMerchantSyncConfig().merchantId });
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
    console.error('Merchant API sync failed', error);
    send(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Merchant API sync failed.',
    });
  }
}
