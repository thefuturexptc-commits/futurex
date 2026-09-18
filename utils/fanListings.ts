import type { Product } from '../types';

// Keep storefront headings and marketplace labels in one place.
export const FAN_FLIPKART_LISTINGS = [
  {
    family: 'fan' as const,
    match: /\btp\s*-?\s*02\b(?!\s*plus)/i,
    product: 'The Futurex TFX-TP02 3-in-1 Bladeless Tower Fan with Air Purifier & LED Light',
    code: 'FANHGFHRP7AZWWX7',
    url: 'https://www.flipkart.com/futurex-tfx-tp02-3-1-year-warranty-bldc-motor-tower-fan/p/itm40fc888dfc521?pid=FANHGFHRP7AZWWX7',
  },
  {
    family: 'fan' as const,
    match: /\bq8(?:\s*pro)?\b/i,
    product: 'The Futurex Q8 PRO Bladeless Tower Fan with Hot & Cool Modes & Remote Control',
    code: 'FANHE6R3DGEPYU6S',
    url: 'https://www.flipkart.com/futurex-q8-pro-6-months-warranty-tower-fan/p/itm0e517add10d0c?pid=FANHE6R3DGEPYU6S',
  },
  {
    family: 'fan' as const,
    match: /\btp\s*-?\s*09(?:\s*pro)?\b(?!\s*-\s*1)/i,
    product: 'The Futurex TP09 PRO Bladeless Tower Fan with Hot & Cool Modes & Remote Control',
    code: 'FANHE8ZUUMNZEMYS',
    url: 'https://www.flipkart.com/futurex-tp09-pro-12-months-warranty-remote-controlled-tower-fan/p/itm63090878457ac?pid=FANHE8ZUUMNZEMYS',
  },
  {
    family: 'fan' as const,
    match: /\btp\s*-?\s*02\s*plus\b/i,
    product: 'The Futurex TP02 PLUS Bladeless Tower Fan with BLDC Motor & Remote Control',
    code: '',
    url: 'https://www.flipkart.com/futurex-tp02-plus-12-months-warranty-bldc-motor-remote-energy-saving-remote-controlled-tower-fan/p/itm2bb0575ea42a7',
  },
  {
    family: 'fan' as const,
    match: /\btp\s*-?\s*20\s*-\s*12\b/i,
    product: 'The Futurex TP20-12 Bladeless Tower Fan with HEPA Air Purifier & Remote Control',
    code: '',
    url: 'https://www.flipkart.com/futurex-tp20-12-12-months-warranty-remote-controlled-tower-fan/p/itm180ed79c3900b',
  },
  {
    family: 'fan' as const,
    match: /\bqg\s*-?\s*830\b/i,
    product: 'The Futurex QG830 Bladeless Tower Fan with Hot & Cool Modes & 10 Cooling Speeds',
    code: '',
    url: 'https://www.flipkart.com/futurex-qg830-12-months-warranty-tower-fan/p/itmc5c0a1e658635',
  },
];

const getFanModelIdentity = (product: Product): string => {
  const models = [product.modelNumber, ...(product.modelNumbers || []), ...Object.entries(product.specs || {})
    .filter(([key]) => /^model(?:[\s_-]*(?:number|no\.?|name))?$/i.test(key.trim()))
    .map(([, value]) => value)].filter(Boolean);
  return models.length ? models.join(' ') : product.name;
};

const addFanConstructionDetails = (title: string, product: Product): string => {
  const specs = Object.entries(product.specs || {});
  const readSpec = (pattern: RegExp) => specs.find(([key, value]) => pattern.test(key.trim()) && String(value).trim())?.[1]?.trim();
  const identity = getFanModelIdentity(product);
  const material = readSpec(/^(?:body[\s_-]*)?material$/i)
    || (/\btp\s*-?\s*09(?:\s*pro)?\b/i.test(identity) ? 'ABS' : '');
  const heating = readSpec(/^heating[\s_-]*(?:technology|element|system)$/i)
    || (/\b(?:qg\s*-?\s*830|q8(?:\s*pro)?|4319b|tp\s*-?\s*09(?:\s*pro)?)\b/i.test(identity) ? 'PTC Ceramic Heating' : '');
  let result = title;
  if (heating && !result.toLowerCase().includes(heating.toLowerCase())) {
    result += ` | ${heating}`;
  }
  if (material && !result.toLowerCase().includes(`${material} Body`.toLowerCase())) {
    result += ` | ${material} Body`;
  }
  return result;
};

export const getFanTitle = (product: Product): string | undefined => {
  if (!/\bfans?\b/i.test(`${product.category} ${product.name}`)) return undefined;
  const identity = getFanModelIdentity(product);
  if (/\btp\s*-?\s*12\b/i.test(identity)) {
    return addFanConstructionDetails('The Futurex TP12 3-in-1 Bladeless Tower Fan with HEPA Air Purifier & Plasma Purification', product);
  }
  if (/\b4319b\b/i.test(identity)) {
    return addFanConstructionDetails('The Futurex 4319B Bladeless Wall-Mount Fan with Hot & Cool Modes & Remote Control', product);
  }
  const title = getFanFlipkartListing(product)?.product
    || FAN_FLIPKART_LISTINGS.find((listing) => listing.match.test(identity))?.product;
  return title ? addFanConstructionDetails(title, product) : undefined;
};

export const getFanFlipkartListing = (product: Product) => {
  const links = [product.flipkartUrl, ...(product.marketplaceLinks || []).map((link) => link.url)].filter(Boolean);
  const linked = FAN_FLIPKART_LISTINGS.find((listing) => links.some((url) => (listing.code && url.includes(listing.code)) || url.split('?')[0] === listing.url.split('?')[0]));
  if (linked) return { ...linked, product: addFanConstructionDetails(linked.product, product) };
  // An explicitly linked, different listing must not inherit another model's title.
  if (links.some((url) => /flipkart\.com/i.test(url))) return undefined;
  if (!/\b(fan|fans)\b/i.test(`${product.category} ${product.name}`)) return undefined;
  const identity = getFanModelIdentity(product);
  const listing = FAN_FLIPKART_LISTINGS.find((listing) => listing.match.test(identity));
  return listing ? { ...listing, product: addFanConstructionDetails(listing.product, product) } : undefined;
};
