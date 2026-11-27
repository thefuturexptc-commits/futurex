import type { Product } from '../types';
import { getProductSlug } from './productSeoData.js';
import { getProductDetailContent } from './productDetailContent.ts';
import { TP09_PRO_LISTING_FAQS } from './tp09ProContent.ts';
import { TP02_PLUS_LISTING_FAQS } from './tp02PlusContent.ts';
import { TP02_THREE_IN_ONE_LISTING_FAQS } from './tp02ThreeInOneContent.ts';
import { TP12_LISTING_FAQS } from './tp12Content.ts';
import { get4319bContent, WALL_MOUNT_4319B_FAQS } from './wallMount4319bContent.ts';
import { SMART_BAND_2208A_SLUG, SMART_BAND_2208A_FAQS } from './smartBand2208AContent.ts';
import { SMART_SLEEP_MONITOR_SLUG, SMART_SLEEP_MONITOR_FAQS } from './smartSleepMonitoringContent.ts';
import { getQ8ProContent, Q8_PRO_FAQS } from './q8ProContent.ts';

const TFX5_SUPPLIED_FAQS = [
  { q: 'What does The FutureX AI Smart Band TFX5 track?', a: 'It supports heart rate, SpO2, HRV, sleep, stress, steps, distance, calories and activity-related monitoring through the connected app.' },
  { q: 'Does the TFX5 have a screen?', a: 'No. The TFX5 is a screenless fitness tracker. Supported information is available through the TFX Vital App.' },
  { q: 'How do I charge the TFX5?', a: 'Remove the battery pack, place it in the charging dock and connect the Type-C charging cable to a compatible power source.' },
  { q: 'How long does the battery last?', a: 'The advertised battery life is approximately 7?10 days, depending on usage and settings.' },
  { q: 'Is the TFX5 a medical device?', a: 'No. It is intended for general fitness and wellness monitoring, not medical diagnosis or treatment.' },
];

export const getProductFamily = (product: Pick<Product, 'name' | 'category'>) => {
  const productFamilyText = `${product.category} ${product.name}`.toLowerCase();
  return /\b(band|bracelet)\b/.test(productFamilyText)
    ? 'band'
    : /\bring\b/.test(productFamilyText)
      ? 'ring'
      : /\bfan\b/.test(productFamilyText)
        ? 'fan'
        : /\b(glass|glasses|eyewear|ai\s*glass)\b/.test(productFamilyText)
          ? 'glasses'
          : /\b(monitor|watch|belt|spo2|ecg|blood\s*pressure|glucose|sleep|bedside|recovery)\b/.test(productFamilyText)
            ? 'monitoring'
            : 'wearable';
};

export const normalizeProductFaqs = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  const rows = new Map<string, { q: string; a: string }>();
  for (const item of value) {
    const q = String(item?.q ?? item?.question ?? '').trim();
    const a = String(item?.a ?? item?.answer ?? '').trim();
    if (q && a && !rows.has(q.toLowerCase())) rows.set(q.toLowerCase(), { q, a });
  }
  return [...rows.values()];
};

export const getProductFaqs = (product: Product) => {
  if (Array.isArray(product.faqs)) return normalizeProductFaqs(product.faqs);
  const slug = getProductSlug(product);
  const productFamily = getProductFamily(product);
  const detailedProductContent = getProductDetailContent(product);
  const isTfxV5Band = productFamily === 'band' && /\btfx\s*5\b|\btfx5\b|\bv5\b|\bai\s*v5\b/i.test(product.name);
  const isQ8ProProduct = getQ8ProContent(product);
  const isTp09ProListing = slug === 'tfxhot-and-coolair-pro';
  const isTp02PlusListing = slug === 'tfx-breeze-pro';
  const isTp12Listing = slug === 'tfx-luxair-pro';
  const isTp02ThreeInOneListing = slug === 'tfx-pureair-3-in-1';
  const isWallMount4319bListing = get4319bContent(product);
  const isStandardBand = slug === SMART_BAND_2208A_SLUG;
  const isSmartSleepMonitor = slug === SMART_SLEEP_MONITOR_SLUG;
  const familyProductFaqs: Record<string, Array<{ q: string; a: string }>> = {
    band: [
      { q: `What does ${product.name} track?`, a: `${product.name} supports fitness and wellness tracking such as activity, sleep, heart rate and connected app insights depending on the model.` },
      { q: `Does ${product.name} support SpO2 monitoring?`, a: 'Selected The FutureX smart band models support blood oxygen (SpO2) monitoring. Check the product specifications for the exact model features.' },
      { q: 'Can this smart band connect to a smartphone?', a: 'Yes. Compatible The FutureX smart bands connect to smartphones using Bluetooth and app integration for wellness summaries and trend review.' },
      { q: 'Is this smart band suitable for daily wear?', a: 'Yes. The FutureX smart bands are designed with lightweight everyday wearability for work, workouts, sleep tracking and daily activities.' },
    ],
    ring: [
      { q: `What can ${product.name} track?`, a: `${product.name} is designed for compact wellness tracking such as activity, sleep, heart rate trends and app-connected insights depending on the model.` },
      { q: 'Does this smart ring connect to an app?', a: 'Yes. The FutureX smart rings connect with compatible smartphones through app-based sync for wellness, activity and sleep insights.' },
      { q: 'Is this smart ring suitable for daily wear?', a: 'Yes. The FutureX smart rings use a compact ring form factor designed for daily wellness monitoring, activity tracking and overnight sleep tracking.' },
      { q: 'How is a smart ring different from a smart band?', a: 'A smart ring offers discreet ring-style tracking, while a smart band is worn on the wrist and may suit users who prefer wrist-based fitness tracking.' },
    ],
    fan: [
      { q: 'What is a bladeless fan?', a: 'A bladeless fan uses airflow amplification technology to circulate air without exposed rotating blades.' },
      { q: 'Can this fan be used in a bedroom?', a: 'Yes. Many The FutureX bladeless fans are suitable for bedrooms because they offer smooth airflow, modern styling and selected quiet operating modes.' },
      { q: 'Can hot and cool fan models be used year-round?', a: 'Selected The FutureX hot and cool models provide cooling airflow and heating functionality for year-round indoor comfort.' },
      { q: 'Do bladeless fans require less maintenance?', a: 'Bladeless fans can be easier to clean because there are no exposed blades, though filters, vents and surfaces should still be maintained as recommended.' },
    ],
    monitoring: [
      { q: `What does ${product.name} monitor?`, a: `${product.name} is designed to support connected fitness or sleep monitoring through sensors and compatible app connectivity depending on the model.` },
      { q: 'Can this smart monitoring device connect to a phone?', a: 'Yes. Compatible smart monitoring products connect to supported smartphones or apps to display fitness and wellness data.' },
      { q: 'Who should use a heart rate monitoring device?', a: 'Heart rate monitoring devices are useful for running, cycling, gym workouts, cardio training and sports activities where real-time heart rate tracking matters.' },
      { q: 'How can sleep tracking help daily wellness?', a: 'Sleep tracking can help users understand sleep duration, rest patterns, routine consistency and recovery trends over time.' },
    ],
    glasses: [
      { q: 'What can smart glasses be used for?', a: 'Smart glasses can support hands-free calling, music, voice assistant access and selected capture features depending on the model.' },
      { q: 'Do smart glasses connect to a smartphone?', a: 'Yes. Compatible smart glasses connect with supported smartphones through Bluetooth for calling, media and smart controls.' },
      { q: 'Are smart glasses suitable for everyday use?', a: 'The FutureX smart glasses are designed as modern eyewear with connected features for daily convenience, travel and hands-free use.' },
    ],
    wearable: [
      { q: `What is ${product.name} used for?`, a: `${product.name} is designed for everyday connected wellness, smart convenience and practical daily use depending on its features.` },
      { q: 'Does this product support app connectivity?', a: 'Compatible The FutureX products support app or Bluetooth connectivity for setup, summaries or connected features depending on the model.' },
    ],
  };
  const suppliedFaqs = isTfxV5Band ? TFX5_SUPPLIED_FAQS
    : isQ8ProProduct ? Q8_PRO_FAQS
    : isTp09ProListing ? TP09_PRO_LISTING_FAQS
    : isTp02PlusListing ? TP02_PLUS_LISTING_FAQS
    : isTp12Listing ? TP12_LISTING_FAQS
    : isTp02ThreeInOneListing ? TP02_THREE_IN_ONE_LISTING_FAQS
    : isWallMount4319bListing ? WALL_MOUNT_4319B_FAQS
    : isStandardBand ? SMART_BAND_2208A_FAQS
    : isSmartSleepMonitor ? SMART_SLEEP_MONITOR_FAQS : [];
  const suppliedFaqQuestions = new Set(suppliedFaqs.map(({ q }) => q));
  const existingFaqs = [
    ...(detailedProductContent ? detailedProductContent.faqs : familyProductFaqs[productFamily] || familyProductFaqs.wearable),
    { q: 'What is the delivery timeline?', a: 'Orders are typically delivered within 3 to 7 business days.' },
    { q: 'Is there a return or refund policy?', a: 'TheFutureX follows a no-return, no-refund policy. If the product has a verified manufacturing defect at delivery, you can request an exchange within 7 days.' },
    { q: 'How do I claim warranty?', a: 'Register the product from the warranty registration page, then share feedback with your order ID, product name, issue description, and photo/video proof.' },
  ];
  return [...suppliedFaqs, ...existingFaqs.filter(({ q }) => !suppliedFaqQuestions.has(q))];
};

export const getProductWarranty = (product: Product) =>
  product.warranty?.trim() ||
  Object.entries(product.specs || {}).find(([key, value]) => /^warranty(?: period)?$/i.test(key.trim()) && String(value).trim())?.[1] ||
  (getProductFamily(product) === 'fan' ? '1-year limited motor warranty' : '6-month limited warranty');
