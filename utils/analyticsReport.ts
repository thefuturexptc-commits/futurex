import type { SiteAnalyticsEvent, User } from '../types';

// Resolve only recorded account IDs and sessions; shared IPs are not identities.
export const enrichAnalyticsCustomers = (events: SiteAnalyticsEvent[], users: User[]) => {
  const accounts = new Map(users.map(user => [user.id, user]));
  const sessions = new Map<string, Partial<SiteAnalyticsEvent>>();
  [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).forEach(event => {
    if (!event.sessionId) return;
    const recorded = sessions.get(event.sessionId) || {};
    const previous = event.userId && recorded.userId && event.userId !== recorded.userId ? {} : recorded;
    sessions.set(event.sessionId, {
      userId: event.userId || previous.userId,
      userName: event.userName || previous.userName,
      userEmail: event.userEmail || previous.userEmail,
      userPhone: event.userPhone || previous.userPhone,
    });
  });
  return events.map(event => {
    const session = sessions.get(event.sessionId) || {};
    // Do not attribute another account's contact details after an account switch.
    const identity = event.userId && session.userId && event.userId !== session.userId ? {} : session;
    const account = accounts.get(event.userId || identity.userId || '');
    return {
      ...event,
      userName: event.userName || account?.name || identity.userName,
      userEmail: event.userEmail || account?.email || identity.userEmail,
      userPhone: event.userPhone || account?.phone || identity.userPhone,
    };
  });
};

const csvCell = (value: unknown) => {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const buildLocationCsv = (events: SiteAnalyticsEvent[]) => {
  const headers = ['Time (IST)', 'Event', 'Customer', 'Email', 'Phone', 'User ID', 'Session', 'Country', 'State', 'City', 'Pincode', 'Location source', 'IP address', 'Product', 'Product ID', 'Quantity', 'Value (INR)', 'Page', 'Traffic source'];
  const rows = [...events].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map(event => [
    new Date(event.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    event.event, event.userName || (event.userEmail || event.userPhone ? 'Customer' : 'Anonymous visitor'),
    event.userEmail, event.userPhone, event.userId, event.sessionId,
    event.country, event.region, event.city, event.pincode, event.locationSource,
    event.ipAddress, event.productName, event.productId, event.quantity, event.value,
    event.pagePath, event.source,
  ]);
  return '\uFEFF' + [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
};

export const downloadLocationCsv = (events: SiteAnalyticsEvent[]) => {
  const url = URL.createObjectURL(new Blob([buildLocationCsv(events)], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `futurex-location-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
