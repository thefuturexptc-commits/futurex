const firstHeaderValue = (value) => {
  if (Array.isArray(value)) return value[0] || '';
  return String(value || '');
};

const firstForwardedIp = (value) =>
  firstHeaderValue(value)
    .split(',')
    .map((part) => part.trim())
    .find(Boolean) || '';

const getHeader = (req, name) => firstHeaderValue(req.headers?.[name.toLowerCase()]);

const decodeHeader = (value) => {
  const raw = firstHeaderValue(value);
  if (!raw) return '';
  try {
    return decodeURIComponent(raw.replace(/\+/g, '%20'));
  } catch {
    return raw;
  }
};

const normalizeCountry = (value) => {
  const country = firstHeaderValue(value).trim();
  if (!country) return '';
  if (country.toUpperCase() === 'IN') return 'India';
  return country;
};

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

const lookupIpLocation = async (ipAddress) => {
  if (isPrivateOrLocalIp(ipAddress)) return {};

  try {
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(ipAddress)}/json/`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'TheFutureX/1.0 location lookup',
      },
    });
    if (!response.ok) return {};
    const data = await response.json();
    if (data?.error) return {};

    return {
      city: typeof data.city === 'string' ? data.city : '',
      region: typeof data.region === 'string' ? data.region : '',
      country: typeof data.country_name === 'string' ? data.country_name : '',
      pincode: typeof data.postal === 'string' ? data.postal : '',
    };
  } catch {
    return {};
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
    return;
  }

  const ipAddress =
    firstForwardedIp(req.headers['cf-connecting-ip']) ||
    firstForwardedIp(req.headers['x-real-ip']) ||
    firstForwardedIp(req.headers['x-forwarded-for']) ||
    req.socket?.remoteAddress ||
    '';
  const detectedCity = decodeHeader(req.headers['x-vercel-ip-city'] || req.headers['cf-ipcity']);
  const detectedRegion = decodeHeader(req.headers['x-vercel-ip-country-region'] || req.headers['cf-region']);
  const detectedCountry = normalizeCountry(req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry']);
  const detectedPincode = getHeader(req, 'x-vercel-ip-postal-code') || getHeader(req, 'cf-postal-code');
  const needsLookup = !detectedCity || !detectedRegion || !detectedCountry || !detectedPincode;
  const lookupLocation = needsLookup ? await lookupIpLocation(ipAddress) : {};
  const hasLookupLocation = Boolean(
    lookupLocation.city || lookupLocation.region || lookupLocation.country || lookupLocation.pincode
  );
  const hasDetectedLocation = Boolean(detectedCity || detectedRegion || detectedCountry || detectedPincode);

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    ipAddress,
    city: detectedCity || lookupLocation.city || '',
    state: detectedRegion || lookupLocation.region || '',
    region: detectedRegion || lookupLocation.region || '',
    country: detectedCountry || lookupLocation.country || '',
    pincode: detectedPincode || lookupLocation.pincode || '',
    locationSource: hasDetectedLocation ? 'detected' : hasLookupLocation ? 'lookup' : undefined,
    userAgent: getHeader(req, 'user-agent'),
  });
}
