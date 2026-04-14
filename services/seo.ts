const SITE_NAME = 'TheFutureX';
const SITE_URL = 'https://thefuturex.in';
const DEFAULT_DESCRIPTION =
  'Shop smart bands, smart rings, smart fans, and health monitoring wearables from TheFutureX.';
const DEFAULT_IMAGE = `${SITE_URL}/images/fav.webp`;

interface SeoMetadata {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'product';
  robots?: string;
}

const ensureMeta = (selector: string, create: () => HTMLMetaElement): HTMLMetaElement => {
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (existing) return existing;
  const meta = create();
  document.head.appendChild(meta);
  return meta;
};

const setMetaName = (name: string, content: string) => {
  const meta = ensureMeta(`meta[name="${name}"]`, () => {
    const next = document.createElement('meta');
    next.name = name;
    return next;
  });
  meta.content = content;
};

const setMetaProperty = (property: string, content: string) => {
  const meta = ensureMeta(`meta[property="${property}"]`, () => {
    const next = document.createElement('meta');
    next.setAttribute('property', property);
    return next;
  });
  meta.content = content;
};

const setCanonical = (href: string) => {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
};

export const stripHtml = (value = ''): string =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const absoluteUrl = (path = '/'): string => {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
};

export const setSeoMetadata = ({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  robots = 'index, follow',
}: SeoMetadata) => {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  document.title = fullTitle;
  setMetaName('description', description);
  setMetaName('robots', robots);
  setMetaName('twitter:card', 'summary_large_image');
  setMetaName('twitter:title', fullTitle);
  setMetaName('twitter:description', description);
  setMetaName('twitter:image', imageUrl);
  setMetaProperty('og:type', type);
  setMetaProperty('og:site_name', SITE_NAME);
  setMetaProperty('og:title', fullTitle);
  setMetaProperty('og:description', description);
  setMetaProperty('og:url', canonicalUrl);
  setMetaProperty('og:image', imageUrl);
  setCanonical(canonicalUrl);
};

export const setJsonLd = (id: string, data: Record<string, unknown>) => {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
};

export const removeJsonLd = (id: string) => {
  document.getElementById(id)?.remove();
};
