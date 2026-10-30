import type { Product } from '../types';
import { getFanDetailContent } from './fanDetailContent';
import { getTouchSmartRingContent } from './touchSmartRingContent';
import { getDisplayProRingContent } from './displayProRingContent';
import { getRingProContent } from './ringProContent';

interface ProductDetailContent {
  description: string;
  html: string;
  careHtml: string;
  warrantyHtml: string;
  features: string[];
  specs: Record<string, string>;
  faqs: Array<{ q: string; a: string }>;
  highlights: string[];
}

export const getProductDetailContent = (
  product?: Pick<Product, 'name' | 'slug' | 'specs'> | null
): ProductDetailContent | null => getDisplayProRingContent(product) || getTouchSmartRingContent(product) || getRingProContent(product) || getFanDetailContent(product);
