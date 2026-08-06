const SITE_NAME = 'TheFutureX';
const SITE_URL = 'https://thefuturex.in';
const DEFAULT_DESCRIPTION =
 'Shop smart bands, smart rings, smart fans and monitoring wearables from TheFutureX.';
const DEFAULT_IMAGE = `${SITE_URL}/images/tfx-google-logo.webp`;

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
  const titleHasBrand = title.includes(SITE_NAME) || /The Future X/i.test(title);
  const fullTitle = titleHasBrand ? title : `${title} | ${SITE_NAME}`;
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

const parseJsonLd = (value: string | null): unknown => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const hasSchemaType = (node: unknown, schemaType: string): boolean => {
  if (!node || typeof node !== 'object') return false;
  if (Array.isArray(node)) return node.some((item) => hasSchemaType(item, schemaType));

  const record = node as Record<string, unknown>;
  const type = record['@type'];
  const matchesType = Array.isArray(type)
    ? type.includes(schemaType)
    : type === schemaType;
  if (matchesType) return true;

  return Object.values(record).some((value) => hasSchemaType(value, schemaType));
};

export const removeProductJsonLd = () => {
  document
    .querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')
    .forEach((script) => {
      const data = parseJsonLd(script.textContent);
      if (hasSchemaType(data, 'Product') || hasSchemaType(data, 'ProductGroup')) {
        script.remove();
      }
    });
};

export const setHomepageJsonLd = () => {
  setJsonLd('homepage-json-ld', {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'The Future X',
        alternateName: ['TFX', 'TheFutureX', 'The Future X India'],
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/images/tfx-google-logo.webp`,
        image: `${SITE_URL}/images/tfx-google-logo.webp`,
        description: DEFAULT_DESCRIPTION,
        sameAs: ['https://www.instagram.com/thefuturex.in/'],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'The Future X',
        alternateName: 'TFX',
        url: `${SITE_URL}/`,
        publisher: {
          '@id': `${SITE_URL}/#organization`,
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${SITE_URL}/#localbusiness`,
        name: 'The Future X',
        alternateName: 'TFX',
        url: `${SITE_URL}/`,
        image: `${SITE_URL}/images/tfx-google-logo.webp`,
        logo: `${SITE_URL}/images/tfx-google-logo.webp`,
        telephone: '+918530340676',
        email: 'thefuturex.ptc@gmail.com',
        priceRange: 'INR',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Office No: 201-202, Hirubai Residency, Besides Vedant Hospital, Near Virar East-West Flyover',
          addressLocality: 'Virar West',
          addressRegion: 'Maharashtra',
          postalCode: '401303',
          addressCountry: 'IN',
        },
        areaServed: {
          '@type': 'Country',
          name: 'India',
        },
      },
    ],
  });
};

export const setCollectionPageJsonLd = ({
  path,
  name,
  description,
}: {
  path: string;
  name: string;
  description: string;
}) => {
  const url = absoluteUrl(path);
  setJsonLd('collection-page-json-ld', {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#collection`,
        name,
        description,
        url,
        isPartOf: {
          '@id': `${SITE_URL}/#website`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${SITE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name,
            item: url,
          },
        ],
      },
    ],
  });
};

const PAGE_SCOPED_JSON_LD_IDS = [
  'homepage-json-ld',
  'collection-page-json-ld',
  'product-json-ld',
  'product-breadcrumb-json-ld',
  'product-faq-json-ld',
  'smart-bands-product-json-ld',
  'smart-bands-faq-json-ld',
  'smart-rings-product-json-ld',
  'smart-rings-faq-json-ld',
  'smart-monitoring-product-json-ld',
  'smart-monitoring-faq-json-ld',
  'smart-fans-product-json-ld',
  'smart-fans-faq-json-ld',
  'info-page-faq-json-ld',
];

export const removePageScopedJsonLd = () => {
  PAGE_SCOPED_JSON_LD_IDS.forEach(removeJsonLd);
  removeProductJsonLd();
};
