const SHIPROCKET_AUTH_URL = 'https://apiv2.shiprocket.in/v1/external/auth/login';
const SHIPROCKET_TRACK_AWB_URL = 'https://apiv2.shiprocket.in/v1/external/courier/track/awb';

let cachedToken = '';
let cachedTokenAt = 0;

const send = (res, status, body) => {
  res.status(status).json(body);
};

const getShiprocketToken = async () => {
  const now = Date.now();
  if (cachedToken && now - cachedTokenAt < 8 * 60 * 1000) {
    return cachedToken;
  }

  const email = process.env.SHIPROCKET_EMAIL || '';
  const password = process.env.SHIPROCKET_PASSWORD || '';
  if (!email || !password) {
    throw new Error('Shiprocket credentials are missing. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.');
  }

  const authRes = await fetch(SHIPROCKET_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const authData = await authRes.json();
  const token = authData?.token || '';
  if (!authRes.ok || !token) {
    const reason = authData?.message || 'Shiprocket auth failed.';
    throw new Error(reason);
  }

  cachedToken = token;
  cachedTokenAt = now;
  return token;
};

const normalizeEvents = (rawActivities = []) =>
  (Array.isArray(rawActivities) ? rawActivities : []).map((item) => ({
    status: item?.sr_status_label || item?.activity || item?.current_status || 'Update',
    activity: item?.activity || item?.status || item?.current_status || '',
    location: item?.location || item?.hub || item?.city || '',
    happenedAt: item?.date || item?.event_date || item?.scan_date || '',
  }));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    send(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  try {
    const trackingId = String(req.body?.trackingId || '').trim();
    if (!trackingId) {
      send(res, 400, { ok: false, error: 'trackingId is required.' });
      return;
    }

    const token = await getShiprocketToken();
    const trackRes = await fetch(`${SHIPROCKET_TRACK_AWB_URL}/${encodeURIComponent(trackingId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const trackData = await trackRes.json();
    if (!trackRes.ok) {
      const reason = trackData?.message || 'Shiprocket tracking request failed.';
      throw new Error(reason);
    }

    const payload = trackData?.tracking_data || {};
    const shipment = Array.isArray(payload?.shipment_track) ? payload.shipment_track[0] || {} : {};
    const activities = Array.isArray(payload?.shipment_track_activities) ? payload.shipment_track_activities : [];
    const events = normalizeEvents(activities);

    send(res, 200, {
      ok: true,
      trackingId,
      currentStatus: payload?.shipment_status || shipment?.current_status || '',
      courier: shipment?.courier_name || payload?.courier_name || '',
      etd: shipment?.etd || '',
      deliveredDate: shipment?.delivered_date || '',
      events,
      raw: payload,
    });
  } catch (error) {
    send(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to fetch Shiprocket tracking.',
    });
  }
}

