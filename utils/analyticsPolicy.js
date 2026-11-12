export const isAdminPath = (path = '') => /^\/admin(?:\/|\?|$)/i.test(path);

// Exclude the whole session, including storefront visits before an admin login.
export function filterStorefrontEvents(events, admins = []) {
  const ids = new Set(admins.map(user => user.id));
  const emails = new Set(admins.map(user => String(user.email || '').toLowerCase()));
  emails.add('thefuturex.ptc@gmail.com');
  const internal = event => isAdminPath(event.pagePath) || event.isAdmin === true ||
    ['admin', 'superadmin'].includes(event.userRole) || ids.has(event.userId) ||
    emails.has(String(event.userEmail || '').toLowerCase());
  const sessions = new Set(events.filter(internal).map(event => event.sessionId).filter(Boolean));
  return events.filter(event => !internal(event) && !sessions.has(event.sessionId));
}

export function buildConversionFunnel(events) {
  const stages = [new Set(), new Set(), new Set(), new Set()];
  const progress = new Map();
  for (const event of [...events].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))) {
    const key = event.sessionId;
    if (!key) continue;
    const stage = ['page_view', 'add_to_cart', 'begin_checkout', 'purchase'].indexOf(event.event);
    const next = progress.get(key) || 0;
    if (stage === next) {
      stages[stage].add(key);
      progress.set(key, next + 1);
    }
  }
  return stages.map(stage => stage.size);
}
