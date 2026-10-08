import fs from 'node:fs';
import path from 'node:path';
import { createSign, createVerify } from 'node:crypto';
import {
  deleteProductFromMerchant,
  ensureMerchantDataSource,
  ensureMerchantApiRegistration,
  getMerchantSyncConfig,
  syncAllProducts,
  upsertProduct,
} from '../services/merchant-api/merchantService.js';

const send = (res, status, body) => res.status(status).json(body);
const SUPERADMIN_EMAIL = 'thefuturex.ptc@gmail.com';
let firebaseSigningCerts = null;
let firebaseSigningCertsExpireAt = 0;
let serviceAccountAccessToken = null;
let serviceAccountAccessTokenExpireAt = 0;

const getServiceAccountCredentials = () => {
  const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (rawCredentials) return JSON.parse(rawCredentials);

  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialPath) throw new Error('Server service account credentials are not configured.');
  const keyPath = path.isAbsolute(credentialPath) ? credentialPath : path.resolve(process.cwd(), credentialPath);
  if (!fs.existsSync(keyPath)) throw new Error('Server could not find the configured service account key.');
  return JSON.parse(fs.readFileSync(keyPath, 'utf8'));
};

const getProjectId = (credentials) => process.env.VITE_FIREBASE_PROJECT_ID || credentials.project_id;

const getFirebaseSigningCerts = async () => {
  if (firebaseSigningCerts && Date.now() < firebaseSigningCertsExpireAt) return firebaseSigningCerts;
  const response = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
  if (!response.ok) throw new Error(`Could not load Firebase token verification certificates (${response.status}).`);
  firebaseSigningCerts = await response.json();
  const maxAge = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/i)?.[1] || 3600);
  firebaseSigningCertsExpireAt = Date.now() + maxAge * 1000;
  return firebaseSigningCerts;
};

const verifyFirebaseIdToken = async (token) => {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (header.alg !== 'RS256' || !header.kid) return null;

    const certificates = await getFirebaseSigningCerts();
    const certificate = certificates[header.kid];
    if (!certificate) return null;
    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${parts[0]}.${parts[1]}`);
    verifier.end();
    if (!verifier.verify(certificate, Buffer.from(parts[2], 'base64url'))) return null;

    const credentials = getServiceAccountCredentials();
    const projectId = getProjectId(credentials);
    const now = Math.floor(Date.now() / 1000);
    if (!projectId || claims.aud !== projectId || claims.iss !== `https://securetoken.google.com/${projectId}` ||
        !claims.sub || claims.sub.length > 128 || !claims.exp || claims.exp <= now ||
        !claims.iat || claims.iat > now + 300) return null;
    return { ...claims, uid: claims.sub };
  } catch {
    return null;
  }
};

const signServiceAccountAssertion = (credentials, scope) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    iss: credentials.client_email,
    scope,
    aud: credentials.token_uri || 'https://oauth2.googleapis.com/token',
    iat: issuedAt,
    exp: issuedAt + 3600,
  })}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  return `${unsigned}.${signer.sign(credentials.private_key, 'base64url')}`;
};

const getServiceAccountAccessToken = async (credentials) => {
  if (serviceAccountAccessToken && Date.now() < serviceAccountAccessTokenExpireAt) return serviceAccountAccessToken;
  const tokenUri = credentials.token_uri || 'https://oauth2.googleapis.com/token';
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: signServiceAccountAssertion(credentials, 'https://www.googleapis.com/auth/datastore'),
  });
  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const result = await response.json();
  if (!response.ok || !result.access_token) throw new Error(`Could not authorize Firestore role lookup (${response.status}).`);
  serviceAccountAccessToken = result.access_token;
  serviceAccountAccessTokenExpireAt = Date.now() + Math.max(60, Number(result.expires_in || 3600) - 60) * 1000;
  return serviceAccountAccessToken;
};

const getFirestoreUserRole = async (claims, credentials) => {
  const projectId = getProjectId(credentials);
  const token = await getServiceAccountAccessToken(credentials);
  const documentPath = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(claims.uid)}`;
  const response = await fetch(documentPath, { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Could not read the admin role from Firestore (${response.status}).`);
  const document = await response.json();
  return document.fields?.role?.stringValue || null;
};

const requireAdmin = async (req) => {
  const authorization = req.headers?.authorization || '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;

  try {
    const claims = await verifyFirebaseIdToken(token);
    if (!claims) return null;
    if (claims.admin === true || claims.role === 'admin' || claims.role === 'superadmin') return claims;
    if (String(claims.email || '').toLowerCase() === SUPERADMIN_EMAIL) return claims;
    const role = await getFirestoreUserRole(claims, getServiceAccountCredentials());
    return role === 'admin' || role === 'superadmin' ? claims : null;
  } catch (error) {
    console.warn('Merchant API request authentication failed:', error?.message || 'unknown error');
    return null;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    send(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  const adminIdentity = await requireAdmin(req);
  if (!adminIdentity) {
    send(res, 401, { ok: false, error: 'Sign in with an admin account to manage Merchant API listings.' });
    return;
  }

  let registrationState = { registeredNow: false };
  try {
    const { action, product, products } = req.body || {};

    registrationState = await ensureMerchantApiRegistration(adminIdentity.email);

    if (action === 'status' || action === 'initialize') {
      const dataSource = await ensureMerchantDataSource();
      send(res, 200, { ok: true, config: { ...getMerchantSyncConfig(), dataSource }, registrationState });
      return;
    }

    if (action === 'delete') {
      const productId = req.body?.productId || product?.id;
      const deleted = await deleteProductFromMerchant(productId);
      send(res, 200, { ok: true, deleted, merchantId: getMerchantSyncConfig().merchantId, registrationState });
      return;
    }

    if (action === 'bulk') {
      if (!Array.isArray(products)) {
        send(res, 400, { ok: false, error: 'products must be an array.' });
        return;
      }

      const results = await syncAllProducts(products);
      const failed = results.filter((result) => !result.ok);
      const pendingRegistration = Boolean(registrationState.registeredNow && failed.length && failed.every((result) => result.status === 401 || result.status === 403));
      send(res, pendingRegistration ? 202 : failed.length ? 207 : 200, {
        ok: failed.length === 0 || pendingRegistration,
        pendingRegistration,
        merchantId: getMerchantSyncConfig().merchantId,
        synced: results.length - failed.length,
        failed: failed.length,
        results,
        registrationState,
      });
      return;
    }

    if (!product) {
      send(res, 400, { ok: false, error: 'product is required.' });
      return;
    }

    const synced = await upsertProduct(product);
    send(res, 200, { ok: true, merchantId: getMerchantSyncConfig().merchantId, synced, registrationState });
  } catch (error) {
    console.error('Merchant API sync failed', error);
    const status = error?.response?.status || error?.status;
    if (registrationState.registeredNow && (status === 401 || status === 403)) {
      send(res, 202, {
        ok: true,
        pendingRegistration: true,
        error: 'The Cloud project was registered. Google says Merchant API access can take about five minutes to activate.',
      });
      return;
    }
    send(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Merchant API sync failed.',
    });
  }
}
