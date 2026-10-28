type ProductImageRecord = {
  name?: string;
  slug?: string;
  category?: string;
  image?: string;
  images?: string[];
  variants?: Array<{ images?: string[] }>;
};

type BlogImageRecord = {
  title?: string;
  slug?: string;
  excerpt?: string;
  keywords?: string[];
  featuredProduct?: { href?: string; image?: string };
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Pick a catalog product photo for a blog hero, matching the article topic. */
export const getBlogProductImage = (post: BlogImageRecord, products: ProductImageRecord[]) => {
  const imageProducts = [...products, ...staticProductSeoRecords];
  const articleText = normalize(`${post.title || ''} ${post.slug || ''} ${post.excerpt || ''} ${(post.keywords || []).join(' ')}`);
  const hrefSlug = post.featuredProduct?.href?.split('/').filter(Boolean).pop() || '';
  const preferredCategory = /fan|cooling|air purifier/.test(articleText)
    ? 'smart fans'
    : /ring/.test(articleText)
      ? 'smart rings'
      : /sleep|heart rate|spo2|monitor|recovery/.test(articleText)
        ? 'smart monitoring'
        : 'smart bands';

  const ranked = imageProducts
    .map((product) => {
      const productText = normalize(`${product.name || ''} ${product.slug || ''} ${product.category || ''}`);
      const image = product.images?.find(Boolean) || product.variants?.flatMap((variant) => variant.images || []).find(Boolean) || product.image || '';
      let score = 0;
      if (hrefSlug && normalize(product.slug || '').replace(/\s+/g, '-') === hrefSlug) score += 100;
      if (normalize(product.category || '') === preferredCategory) score += 20;
      for (const word of articleText.split(' ').filter((word) => word.length > 3)) {
        if (productText.includes(word)) score += 1;
      }
      return { image, score };
    })
    .filter((candidate) => candidate.image && !/banner/i.test(candidate.image))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.image || post.featuredProduct?.image || '';
};
import { staticProductSeoRecords } from './productSeoData.js';

