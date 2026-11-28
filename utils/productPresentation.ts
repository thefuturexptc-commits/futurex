import type { Product } from '../types';
import { getCatalogOffer } from './catalogPricing.js';
import { getMerchantProductId, getVariantProductId } from './merchantProductId.js';
import { getColorVariants, getMerchantAvailability } from './productOfferAvailability.js';
import { buildProductSeoRecord, getProductSlug, resolveUrl, SITE_URL, stripHtml } from './productSeoData.js';
import { buildReviewSchema, buildSalePriceSpecification, productOfferPolicies } from './productSchema.js';
import { getProductOverview } from './productOverviews.js';
import { getProductDetailContent } from './productDetailContent.ts';
import { correctRingModel, getProductModelNumbers } from './productModel.ts';
import { getProductFaqs, getProductWarranty } from './productFaqs.ts';
import { buildFaqSchema } from './faqSchema.js';
import { getQ8ProContent, Q8_PRO_TITLE } from './q8ProContent.ts';
import { get4319bContent, WALL_MOUNT_4319B_TITLE } from './wallMount4319bContent.ts';
import { QG830_TITLE } from './qg830Content.ts';
import { TP09_PRO_LISTING_TITLE } from './tp09ProContent.ts';
import { TP02_PLUS_LISTING_TITLE } from './tp02PlusContent.ts';
import { TP12_LISTING_TITLE } from './tp12Content.ts';
import { TP02_THREE_IN_ONE_LISTING_TITLE } from './tp02ThreeInOneContent.ts';
import { DISPLAY_PRO_RING_TITLE } from './displayProRingContent.ts';
import { TOUCH_SMART_RING_TITLE } from './touchSmartRingContent.ts';
import { SMART_BAND_2208A_SLUG, SMART_BAND_2208A_TITLE, SMART_BAND_2208A_SPECS } from './smartBand2208AContent.ts';
import { SMART_SLEEP_MONITOR_SLUG, SMART_SLEEP_MONITOR_SPECS } from './smartSleepMonitoringContent.ts';

const categoryPaths: Record<string, string> = {
  'smart bands': '/smart-bands',
  'smart rings': '/smart-rings',
  'smart fans': '/bladeless-fan',
  'smart monitoring': '/smart-monitoring',
};

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': SITE_URL + '/#organization',
  name: 'The Future X',
  url: SITE_URL + '/',
  logo: resolveUrl('/images/tfx-google-logo.webp'),
};

export const buildBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [{ name: 'Home', url: SITE_URL + '/' }, ...items].map(({ name, url }, index) => ({
    '@type': 'ListItem', position: index + 1, name, item: url,
  })),
});

const listingTitles: Record<string, string> = {
  'tfx-smart-10x-air': QG830_TITLE,
  'tfxhot-and-coolair-pro': TP09_PRO_LISTING_TITLE,
  'tfx-breeze-pro': TP02_PLUS_LISTING_TITLE,
  'tfx-luxair-pro': TP12_LISTING_TITLE,
  'tfx-pureair-3-in-1': TP02_THREE_IN_ONE_LISTING_TITLE,
  'tfx-display-pro-smart-ring': DISPLAY_PRO_RING_TITLE,
  'tfx-touch-smart-ring': TOUCH_SMART_RING_TITLE,
  [SMART_BAND_2208A_SLUG]: SMART_BAND_2208A_TITLE,
};

export const getProductHeading = (product: Product) =>
  product.useCatalogTitle ? product.name :
    getQ8ProContent(product) ? Q8_PRO_TITLE :
    get4319bContent(product) ? WALL_MOUNT_4319B_TITLE :
      listingTitles[getProductSlug(product)] || product.name;

const availabilityNames = {
  in_stock: ['InStock', 'In stock'],
  out_of_stock: ['OutOfStock', 'Out of stock'],
  preorder: ['PreOrder', 'Preorder'],
  backorder: ['BackOrder', 'Backorder'],
};

export const getProductPresentation = (input: Product, colorSlug = '') => {
  const product = correctRingModel({ ...input, slug: getProductSlug(input) });
  const seo = buildProductSeoRecord(product);
  if (!seo) return null;
  const variant = getColorVariants(product).find(({ slug }) => slug === colorSlug);
  if (colorSlug && !variant) return null;
  const url = SITE_URL + '/product/' + seo.canonicalSlug + (variant ? '/' + variant.slug : '');
  const name = getProductHeading(product);
  const title = seo.seoTitle + (variant ? ' – ' + variant.name : '');
  const detail = getProductDetailContent(product);
  const overview = stripHtml(product.shortDescription || '') || getProductOverview(product, seo.canonicalSlug)?.description ||
    detail?.description || stripHtml(product.description || '') || seo.metaDescription;
  const description = stripHtml(product.description || '') || stripHtml(detail?.html || '') || overview;
  const features = product.features?.length ? product.features : detail?.features || [];
  const defaultSpecs = seo.slug === SMART_BAND_2208A_SLUG ? SMART_BAND_2208A_SPECS :
    seo.slug === SMART_SLEEP_MONITOR_SLUG ? SMART_SLEEP_MONITOR_SPECS : detail?.specs;
  const specs = { ...defaultSpecs, ...seo.specs };
  const model = getProductModelNumbers({ ...product, specs })[0];
  const warranty = getProductWarranty(product);
  const faqs = getProductFaqs(product);
  const reviews = buildReviewSchema(product.reviews);
  const variantImages = variant?.images.flat(Infinity).map(resolveUrl).filter(Boolean) || [];
  const images = variantImages.length ? variantImages : seo.images;
  const offer = getCatalogOffer(product);
  const availabilityKey = variant ? (variant.stock > 0 ? 'in_stock' : 'out_of_stock') : getMerchantAvailability(product);
  const [availability, stockLabel] = availabilityNames[availabilityKey];
  const category = { name: product.category || 'Products', url: SITE_URL + (categoryPaths[product.category?.toLowerCase().trim()] || '/shop/all') };
  const mpn = product.mpn || product.manufacturerPartNumber;
  const gtin = String(product.gtin || product.barcode || '').trim();
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': url + '#product',
    url,
    name,
    description: overview,
    image: images,
    sku: product.sku?.trim() ? product.sku.trim() + (variant ? '-' + variant.slug : '') :
      variant ? getVariantProductId(product, variant) : getMerchantProductId(product),
    brand: { '@type': 'Brand', name: product.brand || 'TheFutureX' },
    category: category.name,
    ...(variant ? { color: variant.name } : {}),
    ...(model ? { model } : {}),
    ...(mpn ? { mpn } : {}),
    ...(/^(?:\d{8}|\d{12,14})$/.test(gtin) ? { gtin } : {}),
    ...reviews,
    ...(Number.isFinite(offer.currentPrice) && offer.currentPrice > 0 ? { offers: {
      '@type': 'Offer',
      url,
      price: offer.currentPrice,
      priceCurrency: 'INR',
      availability: 'https://schema.org/' + availability,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': organizationSchema['@id'] },
      ...productOfferPolicies,
      ...buildSalePriceSpecification(offer.regularPrice, offer.currentPrice),
    } } : {}),
  };
  const schemas = {
    'product-json-ld': schema,
    'product-breadcrumb-json-ld': buildBreadcrumbSchema([category, { name, url }]),
    'product-faq-json-ld': buildFaqSchema(faqs),
    'organization-json-ld': organizationSchema,
  };
  return {
    url, name, title, overview, description, features, specs, model, stockLabel, warranty,
    faqs, reviews, images, offer, category, schemas, variant, metaDescription: seo.metaDescription, keywords: seo.keywords,
  };
};
