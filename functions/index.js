const { onRequest } = require('firebase-functions/v2/https');
const axios = require('axios');

const firstHeaderValue = (value) => {
  if (Array.isArray(value)) return value[0] || '';
  return String(value || '');
};

const firstForwardedIp = (value) =>
  firstHeaderValue(value)
    .split(',')
    .map((part) => part.trim())
    .find(Boolean) || '';

const getClientIp = (req) =>
  firstForwardedIp(req.headers['cf-connecting-ip']) ||
  firstForwardedIp(req.headers['x-real-ip']) ||
  firstForwardedIp(req.headers['x-forwarded-for']) ||
  firstForwardedIp(req.headers['fastly-client-ip']) ||
  req.ip ||
  req.socket?.remoteAddress ||
  '';

const isPrivateOrLocalIp = (value = '') => {
  const ip = String(value).replace(/^::ffff:/, '').trim();
  return (
    !ip ||
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
};

const lookupWithIpapi = async (ipAddress) => {
  const response = await axios.get(`https://ipapi.co/${encodeURIComponent(ipAddress)}/json/`, {
    timeout: 5000,
    headers: {
      Accept: 'application/json',
      'User-Agent': 'TheFutureX/1.0 location lookup',
    },
  });

  const data = response.data || {};
  if (data.error) return {};

  return {
    city: typeof data.city === 'string' ? data.city : '',
    state: typeof data.region === 'string' ? data.region : '',
    pincode: typeof data.postal === 'string' ? data.postal : '',
    country: typeof data.country_name === 'string' ? data.country_name : '',
    provider: 'ipapi',
  };
};

const lookupWithIpwho = async (ipAddress) => {
  const response = await axios.get(`https://ipwho.is/${encodeURIComponent(ipAddress)}`, {
    timeout: 5000,
    headers: {
      Accept: 'application/json',
      'User-Agent': 'TheFutureX/1.0 location lookup',
    },
  });

  const data = response.data || {};
  if (data.success === false) return {};

  return {
    city: typeof data.city === 'string' ? data.city : '',
    state: typeof data.region === 'string' ? data.region : '',
    pincode: typeof data.postal === 'string' ? data.postal : '',
    country: typeof data.country === 'string' ? data.country : '',
    provider: 'ipwho.is',
  };
};

const hasLocationValue = (location) =>
  Boolean(location.city || location.state || location.pincode || location.country);

const lookupIpLocation = async (ipAddress) => {
  const primary = await lookupWithIpapi(ipAddress).catch(() => ({}));
  if (hasLocationValue(primary) && primary.pincode) return primary;

  const fallback = await lookupWithIpwho(ipAddress).catch(() => ({}));
  if (!hasLocationValue(primary)) return fallback;

  return {
    ...primary,
    city: primary.city || fallback.city || '',
    state: primary.state || fallback.state || '',
    pincode: primary.pincode || fallback.pincode || '',
    country: primary.country || fallback.country || '',
    provider: primary.provider || fallback.provider || 'ipapi',
  };
};

exports.getUserLocation = onRequest({ cors: true, region: 'asia-south1' }, async (req, res) => {
  if (req.method !== 'GET') {
    res.set('Allow', 'GET');
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const ipAddress = getClientIp(req);

    if (isPrivateOrLocalIp(ipAddress)) {
      res.set('Cache-Control', 'private, max-age=300');
      res.json({
        ok: true,
        ipAddress,
        city: '',
        state: '',
        region: '',
        pincode: '',
        country: '',
        locationSource: undefined,
      });
      return;
    }

    const location = await lookupIpLocation(ipAddress);
    const state = location.state || '';

    res.set('Cache-Control', 'private, max-age=300');
    res.json({
      ok: true,
      ipAddress,
      city: location.city || '',
      state,
      region: state,
      pincode: location.pincode || '',
      country: location.country || '',
      locationSource: 'lookup',
      locationProvider: location.provider || 'ipapi',
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: 'Unable to detect location',
    });
  }
});
