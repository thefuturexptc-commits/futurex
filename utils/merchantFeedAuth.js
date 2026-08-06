import crypto from 'crypto';

const getCredentials = () => ({
  username: process.env.MERCHANT_FEED_USERNAME || '',
  password: process.env.MERCHANT_FEED_PASSWORD || '',
});

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const isMerchantFeedAuthEnabled = () => {
  const { username, password } = getCredentials();
  return Boolean(username && password);
};

export const verifyMerchantFeedAuth = (authorization = '') => {
  if (!isMerchantFeedAuthEnabled()) return true;
  if (!authorization.startsWith('Basic ')) return false;

  const encoded = authorization.slice('Basic '.length).trim();
  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex < 0) return false;

  const suppliedUsername = decoded.slice(0, separatorIndex);
  const suppliedPassword = decoded.slice(separatorIndex + 1);
  const { username, password } = getCredentials();

  return safeEqual(suppliedUsername, username) && safeEqual(suppliedPassword, password);
};

export const setMerchantFeedAuthChallenge = (res) => {
  res.setHeader('WWW-Authenticate', 'Basic realm="TheFutureX Merchant Feed"');
};
