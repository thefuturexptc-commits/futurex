import React, { useMemo } from 'react';
import { SectionHeader } from '../common/SectionHeader';
import type { SiteAnalyticsEvent } from '../../../types';

const siteUrl = 'https://thefuturex.in/';
const sitemapUrl = 'https://thefuturex.in/sitemap.xml';
const robotsUrl = 'https://thefuturex.in/robots.txt';

const seoChecks = [
  {
    title: 'Product Snippets',
    description: 'Product schema is page-scoped and should appear only on product detail pages.',
    status: 'Fixed',
  },
  {
    title: 'Sitemap',
    description: 'Public XML sitemap is available for crawlers and copied during production builds.',
    status: 'Live file',
  },
  {
    title: 'Metadata',
    description: 'Route titles, descriptions, canonical URLs, robots tags, and social tags update per page.',
    status: 'Route scoped',
  },
  {
    title: 'Search Console',
    description: 'Deploy first, then validate fixed rich-result warnings and request indexing.',
    status: 'Manual step',
  },
];

const affectedUrls = [
  'https://thefuturex.in/',
  'https://thefuturex.in/smart-bands',
  'https://thefuturex.in/info/contact',
  'https://thefuturex.in/product/tfx5-ai-smart-band',
];

const validationRows = [
  {
    url: 'https://thefuturex.in/',
    pageType: 'Homepage',
    expectedSchema: 'Organization, WebSite, LocalBusiness',
    productSchema: 'Removed',
    action: 'Request indexing',
  },
  {
    url: 'https://thefuturex.in/smart-bands',
    pageType: 'Category',
    expectedSchema: 'CollectionPage, BreadcrumbList',
    productSchema: 'Removed',
    action: 'Request indexing',
  },
  {
    url: 'https://thefuturex.in/info/contact',
    pageType: 'Info page',
    expectedSchema: 'No Product schema',
    productSchema: 'Removed',
    action: 'Request indexing',
  },
  {
    url: 'https://thefuturex.in/login',
    pageType: 'Account page',
    expectedSchema: 'No Product schema, noindex',
    productSchema: 'Removed',
    action: 'Request indexing if still reported',
  },
  {
    url: 'https://thefuturex.in/product/tfx5-ai-smart-band',
    pageType: 'Product',
    expectedSchema: 'Product, Offer, BreadcrumbList, FAQPage',
    productSchema: 'Present',
    action: 'Test rich result',
  },
];

const getInspectionUrl = (url: string) =>
  `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(siteUrl)}&id=${encodeURIComponent(url)}`;

const getRichResultsUrl = (url: string) =>
  `https://search.google.com/test/rich-results?url=${encodeURIComponent(url)}`;

const externalLinkClass =
  'inline-flex min-h-9 items-center justify-center rounded-lg border border-cyan-600/40 bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-900 transition hover:border-cyan-500 hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-950/40 dark:text-cyan-100 dark:hover:bg-cyan-900/50';

const cleanText = (value?: string) => value?.trim() || '';

const formatLocation = (event: Pick<SiteAnalyticsEvent, 'city' | 'region' | 'country' | 'pincode'>) => {
  const location = [cleanText(event.city), cleanText(event.region), cleanText(event.country)].filter(Boolean).join(', ');
  const pincode = cleanText(event.pincode);
  if (location && pincode) return `${location} - ${pincode}`;
  if (location) return location;
  if (pincode) return `Pincode ${pincode}`;
  return 'Not detected';
};

const hasDetectedLocation = (location: string, pincode: string) =>
  Boolean((location && location !== 'Not detected') || pincode);

const mergeLocation = (
  visitor: {
    ipAddress: string;
    location: string;
    pincode: string;
    locationSource: SiteAnalyticsEvent['locationSource'] | '';
    locationAccuracy: number | '';
  },
  event: SiteAnalyticsEvent
) => {
  const nextLocation = formatLocation(event);
  const nextPincode = cleanText(event.pincode);
  const nextIpAddress = cleanText(event.ipAddress);
  const nextHasLocation = hasDetectedLocation(nextLocation, nextPincode);
  const currentHasLocation = hasDetectedLocation(visitor.location, visitor.pincode);

  if (!visitor.ipAddress && nextIpAddress) visitor.ipAddress = nextIpAddress;
  if ((!currentHasLocation && nextHasLocation) || (visitor.location === 'Not detected' && nextLocation !== 'Not detected')) {
    visitor.location = nextLocation;
  }
  if (!visitor.pincode && nextPincode) visitor.pincode = nextPincode;
  if ((visitor.location === 'Not detected' || !visitor.location) && visitor.pincode) {
    visitor.location = `Pincode ${visitor.pincode}`;
  }
  if (!visitor.locationSource && event.locationSource) visitor.locationSource = event.locationSource;
  if (!visitor.locationAccuracy && event.locationAccuracy) visitor.locationAccuracy = event.locationAccuracy;
};

const cleanPhone = (value = '') => value || '-';

const formatLocationSource = (source?: SiteAnalyticsEvent['locationSource']) => {
  if (source === 'precise') return 'Precise GPS';
  if (source === 'checkout') return 'Checkout';
  if (source === 'detected') return 'Host detected';
  if (source === 'lookup') return 'IP lookup';
  return '-';
};

interface SeoTabProps {
  siteEvents: SiteAnalyticsEvent[];
}

type SeoVisitorRow = {
  sessionId: string;
  lastSeen: string;
  ipAddress: string;
  location: string;
  pincode: string;
  source: string;
  referrer: string;
  isLoggedIn: boolean;
  email: string;
  phone: string;
  pageViews: number;
  addToCart: number;
  purchases: number;
  lastPage: string;
  locationSource: SiteAnalyticsEvent['locationSource'] | '';
  locationAccuracy: number | '';
};

export const SeoTab: React.FC<SeoTabProps> = ({ siteEvents }) => {
  const visitorRows = useMemo(() => {
    const visitorMap = new Map<string, SeoVisitorRow>();

    siteEvents.forEach((event) => {
      const sessionId = event.sessionId || event.userId || event.ipAddress || event.id;
      const existing =
        visitorMap.get(sessionId) || {
          sessionId,
          lastSeen: event.timestamp,
          ipAddress: event.ipAddress || '',
          location: formatLocation(event),
          pincode: event.pincode || '',
          source: event.source || 'Website',
          referrer: event.referrer || '',
          isLoggedIn: Boolean(event.isLoggedIn),
          email: event.userEmail || '',
          phone: event.userPhone || '',
          pageViews: 0,
          addToCart: 0,
          purchases: 0,
          lastPage: event.pagePath || '/',
          locationSource: event.locationSource || '',
          locationAccuracy: event.locationAccuracy || '',
        };

      if (new Date(event.timestamp).getTime() >= new Date(existing.lastSeen).getTime()) {
        existing.lastSeen = event.timestamp;
        existing.source = event.source || existing.source;
        existing.lastPage = event.pagePath || existing.lastPage;
      }

      mergeLocation(existing, event);
      existing.referrer = existing.referrer || event.referrer || '';
      existing.isLoggedIn = Boolean(existing.isLoggedIn || event.isLoggedIn);
      existing.email = existing.email || event.userEmail || '';
      existing.phone = existing.phone || event.userPhone || '';
      if (event.event === 'page_view') existing.pageViews += 1;
      if (event.event === 'add_to_cart') existing.addToCart += Number(event.quantity || 1);
      if (event.event === 'purchase') existing.purchases += 1;

      visitorMap.set(sessionId, existing);
    });

    return Array.from(visitorMap.values())
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
      .slice(0, 50);
  }, [siteEvents]);

  const loggedInVisitorRows = useMemo(
    () => visitorRows.filter((visitor) => visitor.isLoggedIn),
    [visitorRows]
  );

  const guestVisitorRows = useMemo(
    () => visitorRows.filter((visitor) => !visitor.isLoggedIn),
    [visitorRows]
  );

  const renderVisitorList = (rows: SeoVisitorRow[], emptyMessage: string) => (
    <div className="mt-4 overflow-x-auto rounded-lg border border-gray-100 dark:border-white/10">
      <table className="min-w-[980px] w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-white/5 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3">Last seen</th>
            <th className="px-4 py-3">IP</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Pincode</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Page views</th>
            <th className="px-4 py-3">Last page</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/10">
          {rows.map((visitor) => (
            <tr key={visitor.sessionId} className="bg-white dark:bg-dark-surface">
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{new Date(visitor.lastSeen).toLocaleString()}</td>
              <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{visitor.ipAddress || 'Not captured yet'}</td>
              <td className="max-w-[190px] truncate px-4 py-3 text-gray-700 dark:text-gray-300" title={visitor.location}>
                {visitor.location}
              </td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{visitor.pincode || '-'}</td>
              <td className="max-w-[190px] truncate px-4 py-3 text-gray-700 dark:text-gray-300" title={visitor.email || '-'}>
                {visitor.email || '-'}
              </td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{cleanPhone(visitor.phone)}</td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{visitor.pageViews}</td>
              <td className="max-w-[190px] truncate px-4 py-3 text-gray-700 dark:text-gray-300" title={visitor.lastPage}>
                {visitor.lastPage}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="border-t border-gray-100 p-5 text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
          {emptyMessage}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionHeader
        title="SEO"
        subtitle="Search snippets, indexing checks, sitemap status, and Search Console fixes"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {seoChecks.map(({ title, description, status }) => (
          <div key={title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-dark-surface">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
                {status}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-dark-surface">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Product Snippet Fix</h3>
        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
          Product and Offer structured data has been removed from category and info pages. Keep Product schema only on
          product detail pages so Google does not show the wrong product under the wrong URL.
        </p>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {affectedUrls.map((url) => (
            <div key={url} className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Affected URL</p>
              <p className="mt-2 break-all text-sm font-semibold text-gray-900 dark:text-white">{url}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={getInspectionUrl(url)} target="_blank" rel="noreferrer" className={externalLinkClass}>
                  URL Inspection
                </a>
                <a href={getRichResultsUrl(url)} target="_blank" rel="noreferrer" className={externalLinkClass}>
                  Rich Results Test
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <a href={sitemapUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-cyan-400 dark:border-white/10 dark:bg-dark-surface">
          <p className="text-sm font-bold text-gray-900 dark:text-white">Open sitemap.xml</p>
          <p className="mt-2 break-all text-xs leading-5 text-gray-500 dark:text-gray-400">{sitemapUrl}</p>
        </a>
        <a href={robotsUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-cyan-400 dark:border-white/10 dark:bg-dark-surface">
          <p className="text-sm font-bold text-gray-900 dark:text-white">Open robots.txt</p>
          <p className="mt-2 break-all text-xs leading-5 text-gray-500 dark:text-gray-400">{robotsUrl}</p>
        </a>
        <a href="https://search.google.com/search-console/sitemaps" target="_blank" rel="noreferrer" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-cyan-400 dark:border-white/10 dark:bg-dark-surface">
          <p className="text-sm font-bold text-gray-900 dark:text-white">Submit sitemap</p>
          <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">Submit sitemap.xml in Google Search Console after deployment.</p>
        </a>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-dark-surface">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Search Console Validation Data</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
              Use this table while validating the Product snippets fix in Google Search Console.
            </p>
          </div>
          <span className="w-fit rounded-full bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-100">
            Latest local build ready
          </span>
        </div>

        <div className="mt-5 overflow-x-auto rounded-lg border border-gray-100 dark:border-white/10">
          <table className="min-w-[920px] w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-white/5 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">Page type</th>
                <th className="px-4 py-3">Expected schema</th>
                <th className="px-4 py-3">Product schema</th>
                <th className="px-4 py-3">Next action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {validationRows.map((row) => (
                <tr key={row.url} className="bg-white dark:bg-dark-surface">
                  <td className="max-w-[280px] break-all px-4 py-3 font-semibold text-gray-900 dark:text-white">{row.url}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.pageType}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.expectedSchema}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-black uppercase tracking-wide ${
                        row.productSchema === 'Present'
                          ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-100'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200'
                      }`}
                    >
                      {row.productSchema}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-dark-surface">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Logged-in Visitors</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                Customers with account/session data, including location, phone, email, IP, and last page.
              </p>
            </div>
            <span className="w-fit rounded-full bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-100">
              {loggedInVisitorRows.length} logged in
            </span>
          </div>
          {renderVisitorList(loggedInVisitorRows, 'No logged-in visitor activity yet.')}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-dark-surface">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Guest Visitors</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                Visitors without login, still showing IP lookup location, pincode, source, and page activity.
              </p>
            </div>
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700 dark:bg-white/10 dark:text-slate-200">
              {guestVisitorRows.length} guests
            </span>
          </div>
          {renderVisitorList(guestVisitorRows, 'No guest visitor activity yet.')}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-dark-surface">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Visitor Details</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
              Shows IP, location, pincode, source, login details, phone, add to cart, purchases, and last visited page.
            </p>
          </div>
          <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
            {visitorRows.length} visitors
          </span>
        </div>

        <div className="mt-5 overflow-x-auto rounded-lg border border-gray-100 dark:border-white/10">
          <table className="min-w-[1180px] w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-white/5 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Last seen</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Pincode</th>
                <th className="px-4 py-3">Precision</th>
                <th className="px-4 py-3">Accuracy</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Login</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Page views</th>
                <th className="px-4 py-3">Add cart</th>
                <th className="px-4 py-3">Purchases</th>
                <th className="px-4 py-3">Last page</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {visitorRows.map((visitor) => (
                <tr key={visitor.sessionId} className="bg-white dark:bg-dark-surface">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{new Date(visitor.lastSeen).toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{visitor.ipAddress || 'Not captured yet'}</td>
                  <td className="max-w-[190px] truncate px-4 py-3 text-gray-700 dark:text-gray-300" title={visitor.location}>
                    {visitor.location}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{visitor.pincode || '-'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatLocationSource(visitor.locationSource || undefined)}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {visitor.locationAccuracy ? `~${visitor.locationAccuracy}m` : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{visitor.source}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{visitor.isLoggedIn ? 'Logged in' : 'Guest'}</td>
                  <td className="max-w-[190px] truncate px-4 py-3 text-gray-700 dark:text-gray-300" title={visitor.email || '-'}>
                    {visitor.email || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{cleanPhone(visitor.phone)}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{visitor.pageViews}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{visitor.addToCart}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{visitor.purchases}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-gray-700 dark:text-gray-300" title={visitor.lastPage}>
                    {visitor.lastPage}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visitorRows.length === 0 && (
          <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500 dark:border-white/15 dark:text-gray-400">
            No visitor activity yet. New website visits after deployment will appear here.
          </div>
        )}
      </div>

      <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-5 text-sm text-cyan-900 dark:border-cyan-900/40 dark:bg-cyan-950/30 dark:text-cyan-100">
        Deploy the latest build first. Then open URL Inspection for the affected URLs, request indexing, and click
        Validate fix inside Search Console Product snippets.
      </div>
    </div>
  );
};
