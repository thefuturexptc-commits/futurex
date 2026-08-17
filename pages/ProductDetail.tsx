import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Product, ProductColor, ProductPublicReview } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { addOfferLead, addProductNotifyRequest, addProductReview, getProductById, getProductReviews, getProductSlug, getProducts, getUserOrders, toProductSlug, uploadFile } from '../services/backend';
import { ProductImageCarousel } from '../components/ProductImageCarousel';
import { ProductCard } from '../components/ProductCard';
import { ProductComparisonSection } from '../components/ProductComparisonSection';
import { absoluteUrl, removeJsonLd, setJsonLd, setProductSocialMetadata, setSeoMetadata, stripHtml } from '../services/seo';
import { formatInrAmount, getAutomaticOfferItemPricing, getPrepaidDiscountForItems, isTfxV5Band as isTfxV5OfferExcluded } from '../utils/coupons';
import { getProductModelIdentifiers } from '../utils/productSearch';
import { productToAnalyticsItem, pushDataLayerEvent } from '../services/analytics';
import { buildProductSeoRecord } from '../utils/productSeoData.js';
import ringLowProfile from '../assets/images/ring-low-profile.webp';
import ringWellness from '../assets/images/ring-wellness.webp';
import ringDailySync from '../assets/images/ring-daily-sync.webp';
import ringAiWellness from '../assets/images/ring-ai-wellness.webp';
import ringSleepHero from '../assets/images/ring-sleep-hero.webp';
import ringProCharging from '../assets/images/tfx-ring-pro-charging.webp';
import ringTouchProOverviewVideo from '../assets/images/ring-touch-pro-overview.mp4';
import ringOverviewWaterproof from '../assets/images/ring-overview-waterproof.jpg';
import ringOverviewColors from '../assets/images/ring-overview-colors.jpg';
import displayRingOverviewHand from '../assets/images/display-ring-overview-hand.webp';
import displayRingOverviewGoldBanner from '../assets/images/display-ring-overview-gold-banner.webp';
import tfxRingBannerWaterResistant from '../assets/images/tfx-ring-banner-22.webp';
import tfxRingBannerStyleIntelligence from '../assets/images/tfx-ring-banner-23.webp';
import tfxRingBannerLastingPower from '../assets/images/tfx-ring-banner-21.webp';
import tfxVitalDashboard from '../assets/images/tfxvital-wellness-dashboard.jpeg';
import tfxVitalAge from '../assets/images/tfxvital-vital-age-estimate.jpg';
import tfxVitalAppOverviewBanner from '../assets/images/tfx-vital-app-overview-banner.webp';
import bandProof from '../assets/images/band-proof.webp';
import bandLongBattery from '../assets/images/band-long-battery.webp';
import bandScreenlessComfort from '../assets/images/band-screenless-comfort.webp';
import bandFashionableWear from '../assets/images/band-fashionable-wear.webp';
import bandLifestyle from '../assets/images/band-men-women-lifestyle.webp';
import tfxV5BannerOne from '../assets/images/tfx-v5-banner-01.webp';
import tfxV5BannerTwo from '../assets/images/tfx-v5-banner-02.webp';
import premiumBandModelBanner from '../assets/images/premium-band-model-banner.webp';
import premiumBandLifestyleHiking from '../assets/images/premium-band-lifestyle-hiking.webp';
import premiumBandWaterproofPool from '../assets/images/premium-band-waterproof-pool.webp';
import premiumBandFashionTravel from '../assets/images/premium-band-fashion-travel.webp';
import fanFamilyHero from '../assets/images/fan-family-hero.webp';
import fanSlideOne from '../assets/images/fan-slide-1.webp';
import fanSlideTwo from '../assets/images/fan-slide-2.webp';
import fanSlideThree from '../assets/images/fan-slide-3.webp';
import monitoringHero from '../assets/images/monitoring-proactive-wellness-hero.webp';
import monitoringHeartRate from '../assets/images/monitoring-hero-heart-rate.webp';
import monitoringPhonePhoto from '../assets/images/monitoring-phone-photo.webp';

const featureMarkerPattern = /^\s*(?:[-*\u2022]\s*|\d+[.)]\s*)/;
const cleanFeatureText = (feature: string) => feature.replace(featureMarkerPattern, '').trim();

const getYouTubeEmbedUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    const videoId = host === 'youtu.be'
      ? pathParts[0]
      : parsed.pathname.startsWith('/embed/') || parsed.pathname.startsWith('/shorts/')
        ? pathParts[1]
        : ['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)
          ? parsed.searchParams.get('v') || ''
          : '';

    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
};

const ProductOverviewVideo: React.FC<{ src: string; title: string; className: string }> = ({ src, title, className }) => {
  const embedUrl = getYouTubeEmbedUrl(src);

  if (embedUrl) {
    return (
      <iframe
        src={`${embedUrl}?rel=0&modestbranding=1&playsinline=1&controls=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
        title={title}
        className={className}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="eager"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  return (
    <video className={className} autoPlay muted loop playsInline preload="metadata" controls aria-label={title}>
      <source src={src} type="video/mp4" />
    </video>
  );
};
const normalizeOptionKey = (value?: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const uniqueCleanValues = (values: Array<string | number | undefined | null>): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => String(value ?? '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
    )
  );
const sortRingSizeLabels = (sizes: string[]): string[] =>
  [...sizes].sort((a, b) => {
    const aNumber = Number(a);
    const bNumber = Number(b);
    if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return aNumber - bNumber;
    return a.localeCompare(b, undefined, { numeric: true });
  });
const STANDARD_RING_SIZE_OPTIONS = ['7', '8', '9', '10', '11', '12', '13'];
type RingCatalogSizeOption = { size: string; inStock: boolean };
const ringCatalogSizes = (sizes: string[], outOfStockSizes: string[] = []): RingCatalogSizeOption[] =>
  sizes.map((size) => ({ size, inStock: !outOfStockSizes.includes(size) }));
const RING_COLOR_SIZE_CATALOGS: Record<'display' | 'nonDisplay' | 'metal', Record<string, RingCatalogSizeOption[]>> = {
  display: {
    black: ringCatalogSizes(STANDARD_RING_SIZE_OPTIONS, ['7']),
    silver: ringCatalogSizes(STANDARD_RING_SIZE_OPTIONS, ['7']),
    'rose-gold': ringCatalogSizes(STANDARD_RING_SIZE_OPTIONS, ['7', '12']),
  },
  nonDisplay: {
    black: ringCatalogSizes(['8', '9', '10', '11', '12', '13'], ['9']),
    silver: ringCatalogSizes(['8', '9', '12', '13']),
    'rose-gold': ringCatalogSizes(['8', '9', '10', '11', '12', '13']),
  },
  metal: {
    black: ringCatalogSizes(STANDARD_RING_SIZE_OPTIONS),
    silver: ringCatalogSizes(STANDARD_RING_SIZE_OPTIONS),
    'rose-gold': ringCatalogSizes(STANDARD_RING_SIZE_OPTIONS),
  },
};
const RING_CATALOG_COLOR_LABELS: Record<string, string> = {
  black: 'Black',
  silver: 'Silver',
  'rose-gold': 'Rose Gold',
};
const normalizeRingCatalogColorKey = (color?: string): string => {
  const key = normalizeOptionKey(color);
  if (key.includes('rose') || key === 'gold' || key.includes('gold')) return 'rose-gold';
  if (key.includes('silver')) return 'silver';
  if (key.includes('black')) return 'black';
  return key;
};
const getRingColorSizeCatalog = (productName?: string): Record<string, RingCatalogSizeOption[]> | null => {
  const text = String(productName || '').toLowerCase();
  if (/\b(display|screen|oled)\b/.test(text)) return RING_COLOR_SIZE_CATALOGS.display;
  if (/\b(touch|non\s*-?\s*display)\b/.test(text)) return RING_COLOR_SIZE_CATALOGS.nonDisplay;
  if (/\b(metal|ring\s*pro|pro\s*smart\s*ring)\b/.test(text)) return RING_COLOR_SIZE_CATALOGS.metal;
  return null;
};
const getRingCatalogSizesForColor = (catalog: Record<string, RingCatalogSizeOption[]>, color?: string): RingCatalogSizeOption[] => {
  const key = normalizeRingCatalogColorKey(color);
  return catalog[key] || [];
};
const formatRingColorSizeCatalog = (catalog: Record<string, RingCatalogSizeOption[]>): string =>
  Object.entries(catalog)
    .map(([color, sizes]) =>
      `${RING_CATALOG_COLOR_LABELS[color] || formatSpecLabel(color)}: ${sizes
        .map((option) => (option.inStock ? option.size : `${option.size} (Out of stock)`))
        .join(', ')}`
    )
    .join(' | ');
const getFanProfileKey = (name?: string): keyof typeof FAN_PROFILES => {
  const text = String(name || '').toLowerCase();
  if (/\btp\s*-?\s*09\b|\btp09\b/i.test(text)) return 'tp09Pro';
  if (/\btfx\s*hot\b|cool\s*air\s*pro|coolair\s*pro|hot\s*&\s*coolair\s*pro|hot\s+and\s+coolair\s+pro/i.test(text)) return 'tp09Pro';
  if (/\b(10x|10\s*x|smart\s*10)\b/.test(text)) return 'smart10x';
  if (/\b(hepa|pureair\s*pro|pure\s*air\s*pro)\b/.test(text)) return 'hepaPureAir';
  if (/\b(breeze|upgraded\s*airflow)\b/.test(text)) return 'breezePro';
  if (/\b(pure|3\s*-?\s*in\s*-?\s*1|tp\s*-?\s*02|tp02|filter|filtration|purifier)\b/.test(text)) return 'pureAir';
  if (/\b(lux|premium)\b/.test(text)) return 'luxAir';
  if (/\b(wall|airwall|wall\s*mounted)\b/.test(text)) return 'airWall';
  if (/\b(hot|coolair|cool\s*air|heat|heater|tp\s*-?\s*09|tp09)\b/.test(text)) return 'hotCool';
  return 'advance';
};
const getMonitoringProfileKey = (name?: string): keyof typeof MONITORING_PROFILES => {
  const text = String(name || '').toLowerCase();
  if (/\b(sleep|recovery|rest)\b/.test(text)) return 'sleepTracker';
  return 'heartRateChestBelt';
};
const formatSpecLabel = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getSpecGroupLabel = (key: string) => {
  const text = key.toLowerCase();
  if (/(shape|style|colour|color|finish|design|material|body|case|band)/.test(text)) return 'Style';
  if (/(battery|charging|charge|recharge|power|mah|watt|voltage|runtime|standby)/.test(text)) return 'Battery';
  if (/(display|screen|touch\s*display|resolution|brightness)/.test(text)) return 'Display';
  if (/(compatibility|compatible|operating\s*system|android|ios|phone|app\s*support)/.test(text)) return 'Compatibility';
  if (/(guide|manual|care|instructions|package|box|included|items\s*included|contents)/.test(text)) return 'User guide';
  if (/(connectivity|bluetooth|wifi|wireless|app|sync|remote)/.test(text)) return 'Connectivity';
  if (/(measurement|dimension|height|width|length|depth|size|weight|diameter|sweep|capacity)/.test(text)) return 'Measurements';
  if (/(warranty|brand|model|product|highlights|suitable|type|series|sku|code|item)/.test(text)) return 'Item details';
  return 'Additional details';
};

const buildSpecGroups = (entries: Array<[string, unknown]>) => {
  const order = [
    'Additional details',
    'Style',
    'Battery',
    'Display',
    'Compatibility',
    'User guide',
    'Item details',
    'Connectivity',
    'Measurements',
  ];
  const grouped = entries.reduce<Record<string, Array<[string, unknown]>>>((acc, entry) => {
    const group = getSpecGroupLabel(entry[0]);
    acc[group] = [...(acc[group] || []), entry];
    return acc;
  }, {});

  return order
    .filter((title) => grouped[title]?.length)
    .map((title) => ({ title, entries: grouped[title] }));
};

const SPEC_GROUP_ICON_PATHS: Record<string, React.ReactNode> = {
  Style: (
    <>
      <circle cx="9" cy="12" r="4.2" />
      <circle cx="15" cy="12" r="4.2" />
    </>
  ),
  Battery: (
    <>
      <rect x="2.5" y="8" width="16" height="8" rx="2" />
      <path d="M18.5 10.2v3.6" strokeWidth="2.4" />
      <path d="M6.5 10.5v3" />
    </>
  ),
  Display: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </>
  ),
  Compatibility: (
    <>
      <rect x="7.5" y="2" width="9" height="20" rx="2" />
      <path d="M11 18h2" strokeWidth="2.4" />
    </>
  ),
  'User guide': (
    <>
      <path d="M6 2.5h8.5L19 7v14.5H6z" />
      <path d="M14.5 2.5V7H19" />
      <path d="M9 12.5h6M9 16.5h6" />
    </>
  ),
  Connectivity: <path d="M7 6.5l10 11-5 4.5v-19l5 4.5-10 11" />,
  Measurements: (
    <>
      <rect x="2.5" y="8.5" width="19" height="7" rx="1.4" />
      <path d="M6.5 8.5v2.6M10.5 8.5v2.6M14.5 8.5v2.6M18.5 8.5v2.6" />
    </>
  ),
  'Item details': (
    <>
      <path d="M20 12.3L11.7 20.6 2.9 11.8 3 3l8.8-.1z" />
      <circle cx="7.6" cy="7.6" r="1.6" />
    </>
  ),
  'Additional details': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8.2h.01M11 11.3h1.2v5.4h.8" strokeWidth="2.1" />
    </>
  ),
};

const SpecGroupIcon: React.FC<{ title: string; className?: string; size?: number }> = ({ title, className = 'h-5 w-5', size = 20 }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ display: 'block', flexShrink: 0 }}
  >
    {SPEC_GROUP_ICON_PATHS[title] || SPEC_GROUP_ICON_PATHS['Additional details']}
  </svg>
);

const FEATURED_BAND_PRODUCT_SLUG = 'ai-v5-smart-band-heart-rate-spo2-fitness-tracker';
const MEGA_PRICE_DROP_BAND_SLUGS = ['tfx5-ai-smart-band', FEATURED_BAND_PRODUCT_SLUG];
const DISPLAY_PRO_PRODUCT_SLUG = 'tfx-display-pro-smart-ring';
const DISPLAY_PRO_YOUTUBE_URL = 'https://www.youtube.com/watch?v=3hO1-gjdWhg';
const TFX5_BAND_FEATURES = [
  '24/7 heart rate monitoring',
  'Blood oxygen SpO2 tracking',
  'Blood pressure wellness trends',
  'VO2 max tracking',
  'Vital age assessment',
  'AI-powered health insights',
  'Recovery insights from stress and lifestyle patterns',
  'Sleep quality tracking',
  'Stress and mood tracking',
  "Women's health tracking",
  'GPS tracking',
  'Workout modes for gym, running, yoga, cycling, walking, and sports',
  'Step counting',
  'Calories burned, distance, and activity duration tracking',
  'IP68 water and dust resistance',
  'Bluetooth 5.0 app sync for Android and iOS',
  'Screenless design with LED status indicator',
  'Wireless charging dock included',
  '7-10 day rechargeable battery',
  'Stainless steel build with free-size unisex fit',
  '12 months domestic brand warranty',
];

const TFX_SMART_BAND_DESCRIPTION =
  'The TFX Smart Band - Modern Fitness Tracking Band is designed for users who want a simple and convenient way to monitor daily activity and wellness metrics. Featuring a lightweight and comfortable design, this smart band can be worn throughout the day while tracking essential fitness and lifestyle data. The band helps users stay informed about their activity levels, movement patterns, and daily routines through companion app connectivity. Its minimalist design makes it suitable for both professional and active lifestyles.';

const TFX5_SMART_BAND_DESCRIPTION =
 'The Futurex AI Smart Band TFX5 is a screenless fitness and wellness tracker built for daily wear without wrist distractions. It tracks heart rate, blood oxygen SpO2, blood pressure wellness trends, VO2, vital age, sleep quality, stress, mood, recovery, steps, calories burned, distance, activity duration, GPS activity, and workout routines, then turns the data into simple AI-powered app insights. The IP68 water and dust resistant design, Bluetooth 5.0 Android and iOS sync, wireless charging dock, 7-10 day rechargeable battery, free-size unisex fit, and women\'s health tracking make it practical for workouts, outdoor use, sleep tracking, and everyday health management.';

const TFX_SMART_BAND_FEATURES = [
  'Activity tracking',
  'Sleep monitoring',
  'Heart rate monitoring',
  'Lightweight design',
  'Bluetooth connectivity',
  'Long battery performance',
  'Everyday wearability',
  'Companion mobile app support',
  'Modern minimalist appearance',
  'Comfortable daily use',
];

const TFX_SMART_BAND_SPECS: Record<string, string> = {
  'Product Highlights': 'Fitness and activity tracking, sleep monitoring, heart rate monitoring, lightweight wearable design, Bluetooth connectivity, companion mobile app support, comfortable daily use, modern minimalist appearance',
  'Suitable For': 'Daily activity monitoring, walking and fitness routines, wellness tracking, students, professionals, and general lifestyle monitoring',
  'Package Contents': 'TFX Smart Band, charging cable, user manual',
  Connectivity: 'Bluetooth connectivity with compatible mobile devices',
  'App Support': 'Companion mobile app support',
  Design: 'Slim, lightweight, comfortable wearable design',
  'Battery Performance': 'Long battery performance with efficient power management',
};

const TFX5_SMART_BAND_SPECS: Record<string, string> = {
  'Product Highlights': 'Screenless AI smart band with heart rate, SpO2, blood pressure wellness trends, VO2, vital age, sleep quality, stress, mood, recovery, GPS activity, steps, calories, distance, and workout tracking',
  'Suitable For': 'Unisex daily use, health monitoring, workouts, gym, running, walking, cycling, yoga, sports, outdoor use, casual wear, sleep tracking, and fitness routines',
  'Technical Features': 'Multiple sensors, digital readings, screenless LED indicator, Bluetooth 5.0, Bluetooth Low Energy app sync, IP68 water and dust resistance, wireless charging, and rechargeable Li-Po battery',
  'Package Contents': '1 x TFX5 AI Smart Band, 1 x wireless charging dock, 1 x user manual',
  Material: 'Stainless steel',
  'Display Type': 'Screenless design with LED status indicator',
  Sensors: 'Heart rate, SpO2, blood pressure wellness trends, VO2, sleep, stress, mood, recovery, activity, step, calorie, distance, and GPS activity sensors',
  Connectivity: 'Bluetooth 5.0 with Bluetooth Low Energy app-based sync and up to 10 m connectivity range',
  'App Support': 'TFX Vital app support for Android and iOS smartphones',
  Battery: 'Rechargeable lithium polymer battery with 7-10 days battery life and about 1 hour charge time',
  'Water Resistance': 'IP68 water and dust resistant design with listed 10 m water-resistant depth',
  'Activity Tracking': 'GPS tracking, recovery check, stress count, calories count, step count, sleep tracking, activity duration, calories burned, and distance',
  'Health Features': 'AI Health Score, AI-powered insights, 24/7 vitals tracking, women\'s health tracking, and complete health management',
  Warranty: '12 months domestic brand warranty covering manufacturing defects',
  'Care Instructions': 'Avoid prolonged exposure to soap or chemicals, wipe dry after use, and charge with the provided dock only',
};

const isInvalidTfx5BandSpec = ([key, value]: [string, unknown]): boolean => {
  const text = `${key} ${String(value || '')}`.toLowerCase();
  if (/\b(chest\s*strap|chest\s*belt|cycling|running|endurance|cardio|sports\s*performance)\b/.test(text)) {
    return true;
  }
  if (/\b(battery\s*capacity|charging)\b/.test(key.toLowerCase()) && /\b(60\s*mah|210\s*mah)\b/.test(text)) {
    return true;
  }
  return false;
};

const TFX_DISPLAY_PRO_RING_DESCRIPTION =
 'The TFX Display Pro Smart Ring combines wearable technology with a compact ring design, offering convenient access to essential and activity information directly from the ring. Featuring an integrated display, this smart ring allows users to view selected data while maintaining a lightweight and comfortable form factor suitable for everyday wear. Designed for fitness tracking, activity monitoring and wellness insights, the TFX Display Pro Smart Ring helps users stay connected to their daily metrics throughout work, exercise, travel and daily activities.';

const TFX_RING_PRO_DESCRIPTION =
 'The TFX Ring Pro Smart Ring with App Control is designed for users who want a compact wearable for daily fitness, sleep, and wellness tracking. With companion app connectivity, the ring helps users review activity, heart rate trends, sleep patterns, and everyday progress from a lightweight stainless steel form factor. Its comfortable design supports day and night wear, making it practical for workouts, routines, travel, and connected daily use.';

const TFX_TOUCH_RING_DESCRIPTION =
 'The TFX Touch Smart Ring combines a sleek wearable design with fitness tracking functionality. Designed for users who prefer a discreet alternative to traditional smartwatches, this smart ring helps monitor daily activities, wellness metrics and fitness progress while maintaining a lightweight and comfortable profile. Its compact design makes it suitable for continuous wear throughout the day, supporting users in tracking movement, sleep and wellness trends through connected mobile app integration.';

const TFX_DISPLAY_PRO_RING_FEATURES = [
  'OLED display',
  'Touch navigation',
  '24/7 heart rate monitoring',
  'Blood oxygen SpO2 monitoring',
  'Sleep tracking',
  'Temperature monitoring',
  'Step counter',
  'Calories burned',
  'Bluetooth BLE',
  'IP68 waterproof',
  '4-5 days rechargeable battery life',
];

const TFX_RING_PRO_FEATURES = [
  '24/7 heart rate monitoring',
  'Blood oxygen SpO2',
  'Sleep tracking',
  'Body temperature',
  'Activity tracking',
  'Calories burned',
  'Step counter',
  'Bluetooth BLE',
  'IP68 water resistant',
  '4-5 days rechargeable battery life',
];

const TFX_TOUCH_RING_FEATURES = [
  'Heart rate monitoring',
  'Blood oxygen SpO2',
  'Sleep tracking',
  'Steps',
  'Calories',
  'Sports modes',
  'Touch display',
  'BLE 5.0',
  'IP68 water resistant',
  '4-5 days rechargeable battery life',
];

const TFX_DISPLAY_PRO_RING_SPECS: Record<string, string> = {
  Brand: 'The FutureX',
  'Product Highlights': 'OLED display, touch navigation, heart rate monitoring, blood oxygen SpO2 monitoring, sleep tracking, temperature monitoring, step counter, calories, Bluetooth BLE, IP68 waterproof design, and long battery life',
  'Suitable For': 'Daily wellness monitoring, fitness tracking, sleep monitoring, activity tracking, quick on-ring viewing, and everyday wearable technology',
  'Package Contents': 'Smart ring, magnetic charging cable, charging dock, and user manual',
  'Product Overview': 'OLED display, touch button, heart rate sensor, SpO2 sensor, and charging contacts',
  'Display Screens': 'Time, heart rate, SpO2, steps, calories, battery, and sports',
  Charging: 'Place the ring on the magnetic charger, connect the USB cable, and fully charge before first use',
  'App Pairing': 'Install the Qring app, turn Bluetooth on, pair the device, and sync health data',
  'App Name': 'Qring',
  Compatibility: 'Compatible with iOS and Android smartphones',
  Sensors: 'Heart rate sensor, SpO2 sensor, and temperature monitoring sensor',
  Display: 'OLED display with touch navigation and quick viewing of supported health, activity, battery, and sports screens',
  Connectivity: 'Bluetooth BLE app sync with compatible smartphones',
  Battery: 'Rechargeable battery with 4-5 days usage on a full charge',
  'Water Resistance': 'IP68 waterproof',
  'User Manual': 'The FutureX TFX Smart Ring user manual included in the box',
};

const TFX_RING_PRO_SPECS: Record<string, string> = {
  Brand: 'The FutureX',
  'Product Highlights': '24/7 heart rate monitoring, blood oxygen SpO2, sleep tracking, body temperature, activity tracking, calories burned, step counter, Bluetooth BLE, IP68 water resistance, and rechargeable battery',
  'Suitable For': 'Active lifestyles, wellness monitoring, fitness enthusiasts, daily activity tracking, sleep tracking, and everyday smart ring use',
  'Package Contents': 'Smart ring, magnetic charging cable, charging dock, and user manual',
  'Product Overview': 'Heart rate sensor, SpO2 sensor, temperature sensor, water-resistant design, and charging contacts',
  Charging: 'Place the ring on the magnetic charger, connect the USB cable, check the LED charging indicator, and fully charge before first use',
  'App Name': 'Qring',
  'App Connection': 'Download the Qring app, enable Bluetooth, open the app, tap Add Device, and select Smart Ring',
  Compatibility: 'Compatible with iOS and Android smartphones',
  'Wearing Guide': 'Wear on the index finger recommended, middle finger, or ring finger, and ensure the sensor touches the skin',
  Sensors: 'Heart rate sensor, SpO2 sensor, and temperature sensor',
  Connectivity: 'Bluetooth BLE app sync with compatible mobile devices',
  Design: 'Metal edition smart ring form factor designed for day and night wear',
  Battery: 'Rechargeable battery with 4-5 days usage on a full charge',
  'Water Resistance': 'IP68 water resistant',
  'User Manual': 'The FutureX TFX Smart Ring user manual included in the box',
};

const TFX_TOUCH_RING_SPECS: Record<string, string> = {
  Brand: 'The FutureX',
  'Product Highlights': 'Heart rate, SpO2, sleep, steps, calories, sports modes, touch display, BLE 5.0, IP68 water resistance, and rechargeable battery',
  'Suitable For': 'Fitness tracking, daily activity monitoring, sleep analysis, wellness tracking, touch controls, and everyday wearable technology',
  'Box Specifications': 'Smart ring, magnetic charging cable, charging dock, user manual, Qring app support, iOS and Android compatibility, BLE 5.0 connectivity, touch display, IP68 water resistance, and rechargeable battery',
  'Package Contents': 'Smart ring, magnetic charging cable, charging dock, and user manual',
  'Product Overview': 'Heart rate sensor, SpO2 sensor, temperature sensor, touch display, and charging contacts',
  Charging: 'Place the ring on the magnetic charger, connect the USB cable, check the LED charging indicator, and fully charge before first use',
  'App Name': 'Qring',
  'App Connection': 'Download the Qring app, enable Bluetooth, open the app, tap Add Device, and select Smart Ring',
  Compatibility: 'Compatible with iOS and Android smartphones',
  'Wearing Guide': 'Wear on the index finger recommended, middle finger, or ring finger, and ensure the sensor touches the skin',
  'Touch Controls': 'Single tap wakes the display, double tap changes the screen, and long press starts measurement',
  Controls: 'Touch operation with single tap, double tap, and long press gestures',
  Connectivity: 'BLE 5.0 app sync with compatible smartphones',
  Sensors: 'Heart rate sensor, SpO2 sensor, and temperature sensor',
  Design: 'Touch edition smart ring with touch display for convenient interaction',
  Battery: 'Rechargeable battery with 4-5 days usage on a full charge',
  'Water Resistance': 'IP68 water resistant',
  'User Manual': 'The FutureX TFX Smart Ring user manual included in the box',
};

const FAN_PROFILES = {
  advance: {
    description:
      'The TFX Advance All-Season Bladeless Fan is designed to provide smooth and consistent airflow throughout the year. Featuring bladeless air circulation technology, the fan delivers comfortable cooling while maintaining a modern and space-efficient design suitable for homes, offices, bedrooms, and living areas. Its streamlined construction helps improve safety around children and pets while offering convenient operation and adjustable airflow settings for everyday comfort.',
    features: [
      'Bladeless airflow technology',
      'Multi-season comfort',
      'Adjustable airflow settings',
      'Quiet operation',
      'Modern tower design',
      'Easy maintenance',
      'Child-friendly design',
      'Space-saving construction',
    ],
    specs: {
      'Product Highlights': 'Bladeless airflow technology, adjustable airflow settings, modern tower design, quiet operation, easy maintenance, suitable for home and office use, child-friendly design, space-saving construction',
      'Suitable For': 'Homes, offices, bedrooms, living areas, and year-round indoor comfort',
      Airflow: 'Smooth and uninterrupted bladeless airflow without exposed blades',
      Modes: 'Multi-season indoor comfort with adjustable airflow intensity',
      Design: 'Modern tower design with a compact, space-efficient footprint',
      Maintenance: 'Bladeless construction simplifies routine cleaning and upkeep',
    },
  },
  tp09Pro: {
    description:
      'The FutureX TP09 PLUS Bladeless Hot & Cool Tower Fan is designed to deliver powerful, year-round comfort with advanced technology, premium safety, and modern style. Equipped with a high-performance BLDC motor up to 14,000 RPM, 10-speed airflow control, and a PTC ceramic heating system, it provides fast cooling in summer and efficient heating during winter. The 180-degree wide-angle oscillation distributes air evenly across the room, ensuring every corner receives consistent airflow. Its bladeless design offers a safer and more comfortable experience than conventional fans. With no exposed blades, it is an excellent choice for homes with children, pets, and elderly family members, while also making it easier to clean and maintain. The smooth, uninterrupted airflow reduces harsh air blasts, creating a more natural and pleasant cooling experience that is ideal for bedrooms, offices, nurseries, and living rooms. Designed for everyday convenience, the TP09 PLUS features remote control operation, a 9-hour timer, quiet low-noise performance, and adjustable temperature settings for personalized comfort. Its sleek, space-saving tower design complements modern interiors while delivering powerful airflow without occupying much floor space. Whether you are looking for safe cooling, energy-efficient heating, whisper-quiet operation, or premium airflow performance, the The FutureX TP09 PLUS Bladeless Hot & Cool Tower Fan is the perfect all-season solution. For complete peace of mind, it is backed by a 1-Year Warranty on the Motor and Internal Components, ensuring dependable performance and long-lasting reliability.',
    features: [
      'Hot and cool dual function',
      'Advanced bladeless technology',
      'Powerful BLDC motor up to 14,000 RPM',
      'PTC ceramic heating system',
      '10 speed levels',
      '180-degree auto oscillation',
      '382 CFM high air delivery',
      'Touch control panel and remote operation',
      '9-hour timer',
      'Quiet low-noise operation',
      'Tip-over switch protection',
      'Child and pet safe design',
      'Energy-efficient performance',
      'Durable ABS body',
      'Modern space-saving premium tower design',
      '1-year motor and internal components warranty',
    ],
    specs: {
      'Product Highlights': 'Hot and cool dual function, advanced bladeless technology, powerful BLDC motor up to 14,000 RPM, PTC ceramic heating, 10 speed levels, 180-degree auto oscillation, 382 CFM high air delivery, remote control, touch control panel, 9-hour timer, quiet low-noise operation, tip-over switch, child and pet safe design, energy-efficient performance, and premium space-saving tower design',
      'Key Features': 'PTC tube, PTC heating unit, PTC ceramic heater, strong high-speed airflow, lightweight body, 1-year motor and internal electrical components warranty, no exposed blades, ABS body, low power consumption, automatic timer, touch control panel, remote control, quiet operation, fast heating, 180-degree auto oscillation, 10 speed levels, BLDC motor, and smooth hot/cool airflow',
      'Selected Features': 'High air delivery, BLDC motor with remote, BLDC motor, remote controlled, silent operation, LED indicators',
      'Suitable For': 'Year-round temperature comfort, workspaces, living room, kitchen, bedroom, corporate offices, indoor use, office, and home',
      'Items Included': 'Remote controller cell, remote, user manual, bladeless fan',
      'Package Contents': 'TP09 PLUS tower fan, remote, remote controller cell, user manual',
      'Model Number': 'TP09 PLUS',
      'Model Name': 'TP-09PRO',
      Color: 'White',
      'Brand Color': 'White',
      Type: 'Tower Fan',
      'Number of Blades': '0',
      'Number of Speed Settings': '10',
      'Motor Speed': '14000 RPM',
      'Power Consumption': '60 W',
      'Power Requirement': 'AC 220-240 V, 50/60 Hz; power rating 35 W in cool mode and 1950 W in hot mode',
      'Operational Current': '0.27 A',
      'Other Power Features': 'Low-noise operation, high-speed airflow, stable performance on 220-240V AC supply, optimized power consumption, advanced PTC ceramic heating, and efficient BLDC motor',
      Weight: '4 kg',
      'Domestic Warranty': '12 Months',
      'International Warranty': '0 Months',
      'Warranty Summary': '1 Year Manufacturer Warranty',
      'Warranty Service Type': 'Customer needs to contact the company',
      'Covered in Warranty': 'Manufacturing defects, motor, and internal electrical components',
      'Not Covered in Warranty': 'Physical damage, water damage, wear and tear, mishandled accessories',
      'Blade Sweep': '0 mm',
      Remote: 'Yes',
      'BEE Star Rating': 'NA',
      'Motor Technology': 'BLDC',
      Series: 'Basic',
      'Installation Type': 'NA',
      'Number of Shipping Packages': '1',
      'Box Height': '75.5 cm',
      'Box Width': '26.5 cm',
      'Box Length': '24 cm',
      'Pack of': '1',
      Material: 'ABS Material',
      'Body Material': 'Element for hot and cool model, internal components with BLDC motor and PTC ceramic heating, perforated ABS intake grille, reinforced ABS base housing, ABS air loop with premium matte finish, and high-quality ABS engineering plastic body',
      'Blade Material': 'ABS air loop with a premium matte finish',
      Motor: 'DC Brushless Motor',
      Modes: 'Cool mode: 1-10 speeds',
      Timer: '9 hours timer',
      Oscillation: '180-degree auto oscillation',
      Swing: '180-degree wide-angle air circulation',
      'Tilting Angle': '0 degree',
      Safety: 'Tip-over switch',
      Airflow: '382 CFM airflow with soft natural wind, high-performance cooling, long air throw, and smooth airflow suitable for pregnant women, babies, elders, children, and pets',
      'Design Type': 'Premium',
      Finish: 'Elegant white premium matte finish',
      'Search Keywords': 'The FutureX TP09 PLUS, TFXHot and CoolAir Pro, bladeless hot and cool fan, bladeless tower fan, hot and cool fan, PTC ceramic heating, BLDC motor fan, 14,000 RPM motor, 10 speed control, 180-degree auto oscillation, 9-hour timer, remote control fan, touch control panel, quiet operation, low-noise fan, child safe fan, pet safe fan, no exposed blades, easy to clean, home cooling solution, winter heater fan, bedroom fan, living room fan, office fan, premium tower fan, space-saving fan, modern bladeless fan, energy efficient fan, all-season comfort',
    },
  },
  hotCool: {
    description:
      'The TFX Hot & CoolAir Pro combines cooling and heating functions in a single bladeless appliance, making it suitable for changing indoor temperature requirements throughout the year. The system provides airflow circulation for cooling during warmer months and heated airflow for added comfort during cooler conditions. Designed with a modern bladeless structure, the unit supports comfortable operation while complementing a variety of residential and office environments.',
    features: [
      'Cooling and heating functions',
      'Bladeless technology',
      'Adjustable temperature control',
      'Oscillation function',
      'Remote operation',
      'Modern design',
      'Year-round comfort solution',
      'Suitable for multiple room types',
    ],
    specs: {
      'Product Highlights': 'Hot and cool functionality, bladeless airflow system, adjustable temperature settings, oscillation support, remote control operation, modern indoor design, year-round comfort solution',
      'Suitable For': 'Bedrooms, offices, living rooms, workspaces, and year-round temperature comfort',
      Modes: 'Cooling airflow and heated airflow modes',
      Control: 'Remote operation with adjustable fan functions and settings',
      Oscillation: 'Oscillation function helps distribute airflow across a wider area',
      Design: 'Modern bladeless structure for residential and office environments',
    },
  },
  airWall: {
    description:
      'The TFX AirWall Pro Smart Wall-Mounted Bladeless Fan is designed for efficient airflow distribution while maximizing floor space. Its wall-mounted installation makes it suitable for homes, offices, retail spaces, and commercial environments where space optimization is important. The bladeless design helps provide smooth airflow while maintaining a modern appearance and convenient operation.',
    features: [
      'Wall-mounted design',
      'Bladeless airflow system',
      'Smart operation',
      'Wide air distribution',
      'Modern appearance',
      'Easy cleaning',
      'Space-saving design',
      'Suitable for home and office environments',
    ],
    specs: {
      'Product Highlights': 'Wall-mounted installation, bladeless technology, smart airflow controls, space-saving design, wide air circulation, modern appearance, suitable for home and office environments',
      'Suitable For': 'Homes, offices, retail spaces, commercial environments, and floor-space optimization',
      Installation: 'Wall-mounted design helps save floor space',
      Airflow: 'Wide bladeless air distribution for larger indoor spaces',
      Control: 'Smart operation with convenient airflow adjustment',
      Maintenance: 'Accessible design for routine cleaning',
    },
  },
  luxAir: {
    description:
      'The TFX LuxAir Pro Premium Bladeless Fan combines modern aesthetics with efficient airflow performance. Designed for users seeking a refined cooling solution, the fan delivers smooth airflow while maintaining a compact and visually appealing design. Suitable for bedrooms, offices, lounges, and living spaces, the LuxAir Pro provides comfortable air circulation with adjustable operating modes.',
    features: [
      'Premium bladeless design',
      'Adjustable airflow modes',
      'Quiet performance',
      'Compact footprint',
      'Easy maintenance',
      'Premium design',
      'Space-efficient construction',
      'Residential and office use',
    ],
    specs: {
      'Product Highlights': 'Premium design, bladeless airflow technology, adjustable airflow settings, quiet operation, space-efficient construction, suitable for residential and office use',
      'Suitable For': 'Bedrooms, offices, lounges, living spaces, and refined indoor cooling',
      Airflow: 'Smooth bladeless airflow with adjustable operating modes',
      Design: 'Modern premium appearance for contemporary interiors',
      Noise: 'Quiet performance for everyday indoor environments',
      Maintenance: 'Bladeless construction supports convenient cleaning',
    },
  },
  breezePro: {
    description:
      'The TFX Breeze Pro Bladeless Tower Fan is designed to provide smooth, consistent airflow for homes, offices, bedrooms, and living spaces. Featuring an upgraded airflow system and modern bladeless technology, the fan helps circulate air efficiently while maintaining a sleek and space-saving design. Its streamlined construction supports everyday comfort while reducing the maintenance typically associated with traditional exposed-blade fans. Suitable for modern interiors, the TFX Breeze Pro combines functionality with contemporary styling.',
    features: [
      'Upgraded airflow technology',
      'Bladeless design',
      'Multiple speed settings',
      'Oscillation function',
      'Quiet operation',
      'Modern tower design',
      'Space-saving construction',
      'Easy maintenance',
    ],
    specs: {
      'Product Highlights': 'Bladeless airflow technology, upgraded air circulation system, multiple speed settings, oscillation support, quiet performance, modern tower design, space-saving construction, easy maintenance',
      'Suitable For': 'Bedrooms, living rooms, offices, apartments, home workspaces, and indoor cooling applications',
      'Package Contents': 'TFX Breeze Pro Bladeless Tower Fan, remote control, user manual',
      Airflow: 'Upgraded airflow technology delivers consistent and balanced air circulation',
      Speed: 'Multiple speed settings for room conditions and personal preference',
      Oscillation: 'Oscillation function distributes airflow across a wider area',
      Design: 'Modern bladeless tower design with a compact footprint',
    },
  },
  hepaPureAir: {
    description:
      'The TFX HEPA PureAir Pro Bladeless Tower Fan combines advanced airflow technology with integrated HEPA filtration support to help improve indoor air circulation. Designed for modern homes and workspaces, the unit delivers smooth bladeless airflow while incorporating a filtration system intended to capture airborne particles as air passes through the unit. Its sleek tower design makes it suitable for bedrooms, offices, living rooms, and shared indoor environments where efficient airflow and air management are priorities.',
    features: [
      'HEPA filtration system',
      'Bladeless airflow technology',
      'Air circulation support',
      'Multiple airflow settings',
      'Oscillation function',
      'Modern tower design',
      'User-friendly controls',
      'Remote operation support',
    ],
    specs: {
      'Product Highlights': 'HEPA filtration support, bladeless airflow technology, air circulation system, multiple speed settings, oscillation support, modern tower design, home and office suitability, easy maintenance',
      'Suitable For': 'Living rooms, bedrooms, offices, indoor environments, home workspaces, and everyday air circulation',
      'Technical Features': 'HEPA filtration system, bladeless airflow technology, oscillation function, adjustable airflow modes, tower fan design, remote operation support',
      Filtration: 'HEPA filtration components support indoor air management',
      Airflow: 'Smooth and uninterrupted bladeless airflow without exposed blades',
      Controls: 'User-friendly controls with convenient airflow adjustment',
      Design: 'Space-efficient tower fan design for modern homes and workspaces',
    },
  },
  pureAir: {
    description:
      'The TFX PureAir 3-in-1 Bladeless Tower Fan combines air circulation, filtration support, and modern bladeless airflow technology in a single appliance. Designed for indoor comfort, the unit helps circulate air efficiently while incorporating filtration components that assist with air management. Its tower-style design makes it suitable for homes, offices, bedrooms, and shared indoor spaces.',
    features: [
      '3-in-1 functionality',
      'Bladeless airflow technology',
      'Air filtration support',
      'Oscillation function',
      'Modern tower design',
      'User-friendly controls',
      'Home and office suitability',
      'Easy maintenance',
    ],
    specs: {
      'Product Highlights': '3-in-1 functionality, bladeless technology, air filtration support, oscillation function, modern tower design, home and office suitability, easy maintenance',
      'Suitable For': 'Homes, offices, bedrooms, shared indoor spaces, and air circulation with filtration support',
      Functionality: 'Combines airflow circulation with integrated filtration support',
      Filtration: 'Filtration components assist indoor air management',
      Oscillation: 'Oscillation function helps distribute airflow throughout the room',
      Controls: 'User-friendly controls for convenient operation and airflow adjustment',
    },
  },
  smart10x: {
    description:
      'The TFX Smart 10X Air Bladeless Hot & Cool Fan is designed to provide versatile indoor comfort through cooling and heating functionality combined with modern airflow technology. Its bladeless construction helps deliver smooth airflow while supporting safer operation in family environments. Suitable for year-round use, the Smart 10X Air is designed for bedrooms, living rooms, offices, and personal workspaces.',
    features: [
      'Hot and cool functionality',
      'Bladeless airflow system',
      'Adjustable operating modes',
      'Oscillation support',
      'Smart control features',
      'Modern compact design',
      'Year-round use',
      'Family-safe airflow',
    ],
    specs: {
      'Product Highlights': 'Cooling and heating modes, bladeless airflow technology, adjustable settings, oscillation support, smart controls, modern design, suitable for year-round use',
      'Suitable For': 'Bedrooms, living rooms, offices, personal workspaces, and family environments',
      Modes: 'Cooling and heated airflow modes for year-round comfort',
      Controls: 'Smart control features for airflow settings and operating modes',
      Oscillation: 'Oscillation support improves air distribution across the room',
      Design: 'Modern compact bladeless design for contemporary indoor spaces',
    },
  },
};

const MONITORING_PROFILES = {
  heartRateChestBelt: {
    description:
      'The Future X Bluetooth Heart Rate Monitor Chest Belt is designed for users seeking accurate heart rate tracking during workouts, training sessions, and daily fitness activities. Using chest-strap sensor technology, the device captures heart rate data and transmits it wirelessly to compatible fitness apps, smart devices, and training platforms. Suitable for running, cycling, gym workouts, endurance training, and sports activities, the chest belt provides real-time heart rate monitoring to help users better understand workout intensity and performance metrics. Its adjustable and lightweight chest strap is designed for comfort during extended training sessions while maintaining a secure fit throughout movement.',
    features: [
      'Real-time heart rate monitoring',
      'Bluetooth connectivity',
      'Chest strap sensor technology',
      'Fitness training support',
      'Adjustable chest belt',
      'Lightweight construction',
      'App compatibility',
      'Workout performance monitoring',
    ],
    specs: {
      'Product Highlights': 'Bluetooth heart rate monitoring, chest strap sensor technology, real-time heart rate tracking, wireless connectivity, adjustable chest belt, fitness app compatibility, workout performance monitoring, lightweight and comfortable design',
      'Suitable For': 'Running, cycling, gym workouts, fitness training, cardio exercise, sports performance monitoring, and endurance training',
      'Package Contents': 'Heart rate monitor sensor, adjustable chest strap, user manual',
      Connectivity: 'Bluetooth connectivity with compatible smartphones, fitness applications, sports watches, and training platforms',
      Sensor: 'Chest strap sensor technology captures heart rate information directly from the chest area',
      Design: 'Adjustable and lightweight chest belt for extended training sessions',
      'App Support': 'Compatible fitness and training applications',
    },
  },
  sleepTracker: {
    description:
      'TheFutureX Smart Sleep Tracking Monitoring System is designed to help users monitor sleep habits and gain insights into sleep patterns through advanced sleep-tracking technology. The device collects sleep-related data and provides information that may help users better understand their nightly rest and recovery routines. Its compact design allows convenient placement and integration into daily sleep environments, making it suitable for individuals focused on sleep awareness, wellness tracking, and lifestyle monitoring. The system works alongside compatible applications to provide detailed sleep reports and trend analysis over time.',
    features: [
      'Sleep monitoring',
      'Sleep pattern analysis',
      'Wellness insights',
      'Compact monitoring design',
      'Wireless connectivity',
      'Long-term sleep tracking',
      'Companion app support',
      'Home monitoring solution',
    ],
    specs: {
      'Product Highlights': 'Sleep monitoring technology, sleep pattern tracking, wellness insights, wireless connectivity, companion app support, compact design, long-term sleep trend analysis, home monitoring solution',
 'Suitable For': 'Sleep awareness, wellness monitoring, lifestyle tracking, recovery tracking and daily monitoring',
      'Package Contents': 'Smart sleep monitoring device, charging cable, user manual',
      Tracking: 'Sleep duration, sleep cycle patterns, sleep trends, and historical sleep information',
      Connectivity: 'Wireless connectivity with compatible devices and applications',
      Design: 'Compact monitoring design suitable for bedrooms and personal sleep environments',
      'App Support': 'Connected applications provide detailed sleep reports and trend analysis over time',
    },
  },
};

type ProductDetailTabKey = 'description' | 'features' | 'comparison' | 'more-information' | 'specs' | 'battery' | 'faq' | 'reviews';

const getCategoryPathForSchema = (category = '') => {
  const normalized = category.trim().toLowerCase();
  if (normalized === 'smart bands') return '/smart-bands';
  if (normalized === 'smart rings') return '/smart-rings';
  if (normalized === 'smart fans') return '/bladeless-fan';
  if (normalized === 'smart monitoring') return '/smart-monitoring';
  if (normalized === 'smart glasses') return '/smart-glasses';
  return '/shop/all';
};

const getProductFaqSchema = (productName: string) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: `Is ${productName} available in India?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${productName} is available from The Future X in India when the product page shows it in stock.`,
      },
    },
    {
      '@type': 'Question',
      name: `Does ${productName} come with warranty support?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Future X provides warranty and support information on the product page and order support pages.',
      },
    },
  ],
});

type SeoComparisonBrief = {
  eyebrow: string;
  title: string;
  intro: string;
  columns: [string, string];
  rows: Array<[string, string, string]>;
  verdict: string;
  keywords: string[];
};

const getCurrentPriceText = (price: number) => (price > 0 ? `₹${price.toLocaleString('en-IN')}` : 'See current listing');

const getProductSpecValue = (product: Product, patterns: RegExp[], fallback = 'See current listing') => {
  const entries = Object.entries(product.specs || {});
  const match = entries.find(([key, value]) => patterns.some((pattern) => pattern.test(`${key} ${value}`)));
  if (match) return String(match[1]);

  const feature = (product.features || []).find((item) => patterns.some((pattern) => pattern.test(item)));
  return feature || fallback;
};

const getSeoComparisonBrief = (product: Product, productFamily: string, price: number): SeoComparisonBrief | null => {
  const productName = product.name;
  const productPrice = getCurrentPriceText(price);
  const battery = getProductSpecValue(product, [/battery|7\s*day|charging|runtime/i]);
  const waterResistance = getProductSpecValue(product, [/ip68|5\s*atm|water|splash|dust/i]);
  const sensors = getProductSpecValue(product, [/heart|spo2|spO2|hrv|stress|temperature|sensor|sleep/i]);
  const app = getProductSpecValue(product, [/app|bluetooth|connect/i], 'TheFutureX app / compatible app');

  if (productFamily === 'band') {
    return {
      eyebrow: 'Smart band comparison',
      title: `${productName} vs Other Brands`,
      intro:
        'Screen-free smart bands are popular in India because they keep daily health tracking simple without adding another distracting display. Here is a practical comparison of TheFutureX and other brands on price, battery, sensors, water resistance, and app-led insights.',
      columns: [productName, 'Other Brands'],
      rows: [
        ['Price', productPrice, 'Varies by model and offer'],
        ['Design', 'Screenless smart health band built for distraction-free wear', 'Usually screenless or basic wearable designs'],
        ['Feature stack', 'Heart rate, SpO2, HRV, stress, sleep, recovery, strain, activity, calories, and smart wellness trends', 'Usually basic heart rate, steps, sleep, and selected alerts'],
        ['AI health insights', 'AI coach style insights, BioAge / Vital Age style wellness review, weekly reports, and long-term trend analysis', 'Usually basic summaries without deeper AI coaching'],
        ['Recovery and readiness', 'Recovery cues, strain awareness, body energy style guidance, and sleep quality context in one flow', 'Often missing deeper recovery and readiness guidance'],
        ['Health alerts', 'SpO2 awareness, irregular heart-rate style alerts, stress cues, and wellness reminders on supported models', 'Usually simple reminders and basic notification alerts'],
        ['App experience', 'TheFutureX app reports with trend charts, wellness summaries, and smarter habit guidance', 'Brand app support varies and is often focused on basic sync'],
        ['Battery life', battery, 'Varies by model'],
        ['Water resistance', waterResistance, '5 ATM'],
        ['Sensors', sensors, 'Sensor set varies by model; check current listing'],
        ['Sleep tracking', 'Sleep stages, sleep score style summaries, recovery context, and app-based improvement insights', 'Basic sleep tracking on many models'],
        ['Smart alerts', 'AI health reports, app summaries, smart reminders, and wellness trend cues', 'Usually reminders, call alerts, and basic notifications'],
        ['Charging', getProductSpecValue(product, [/wireless|charging|dock|magnetic/i], 'Wireless charging dock on supported models'), 'Charging method varies by model'],
        ['App', app, 'Brand app support varies'],
      ],
      verdict:
        'TheFutureX is built for buyers who want more than basic band alerts. It brings together AI health reports, SpO2, HRV, sleep tracking, stress, recovery, strain, smart wellness reminders, and long-term app trend review in one screen-free smart band experience.',
      keywords: [
        'thefuturex vs other smart bands',
        'best screen-free smart band india 2026',
        'smart band without screen india',
        'other brands smart band alternative',
        'thefuturex v5 review',
        'smart band 7 day battery india',
        'ai smart health band india',
      ],
    };
  }

  if (productFamily === 'ring') {
    const isDisplayRingComparison = /\bdisplay|screen\b/i.test(productName);
    const displayRingComparisonRows: Array<[string, string, string]> = [
      ['Built-in display', 'Yes, quick stats on the ring', 'Usually no built-in display'],
      ['On-ring convenience', 'Display models let users check quick stats without opening the phone', 'Usually phone app required for every detail'],
    ];
    const ringComparisonRows: Array<[string, string, string]> = [
      ['Price', productPrice, 'Varies by model and offer'],
      ...(isDisplayRingComparison ? displayRingComparisonRows : []),
      [
        'Feature stack',
        isDisplayRingComparison
          ? 'Built-in display, heart rate, SpO2, HRV, sleep, temperature trends, activity tracking, app sync, and app reports on supported models'
          : 'Heart rate, SpO2, HRV, sleep, temperature trends, activity tracking, app sync, and app reports on supported models',
        'Often focused on only a few core tracking features',
      ],
      ['AI wellness insights', 'AI-assisted health summaries, recovery context, sleep insights, and long-term wellness trends', 'Usually basic metric history and selected alerts'],
      ['App connectivity', 'Companion app support for wellness review, sleep reports, activity history, and supported settings', 'App features vary by model and brand'],
      ['Sleep and recovery', 'Sleep tracking with HRV-style recovery context and app-based nightly summaries', 'Available on selected models, often with fewer insights'],
      ['Material', getProductSpecValue(product, [/steel|metal|titanium|material/i]), 'Material varies by model'],
      ['Water resistance', waterResistance, 'Varies by model'],
      ['Battery life', battery, 'Varies by model'],
      ['Charging', getProductSpecValue(product, [/wireless|charging|dock|magnetic/i], 'Wireless charging dock on supported models'), 'Charging method varies by model'],
      ['Sensors', sensors, 'Common health sensors vary by model'],
      ['App experience', 'TheFutureX app support for wellness review, sleep reports, activity history, and trend tracking', 'Brand app support varies'],
    ];

    return {
      eyebrow: 'Smart ring comparison',
      title: `${productName} vs Other Brands`,
      intro:
        isDisplayRingComparison
          ? 'Smart rings are becoming a serious wearable category in India. This chart compares TheFutureX against other brands on display, price, battery, water resistance, app connectivity, sleep tracking, and daily usability.'
          : 'Smart rings are becoming a serious wearable category in India. This chart compares TheFutureX against other brands on price, battery, water resistance, app connectivity, sleep tracking, and daily usability.',
      columns: [productName, 'Other Brands'],
      rows: ringComparisonRows,
      verdict:
        isDisplayRingComparison
          ? 'TheFutureX Display Pro stands out by combining a smart ring form factor with a built-in display, wellness tracking, sleep and recovery insights, app sync, and app-based health reports. Other brands may cover basic tracking, but TheFutureX is built to feel more complete in daily use.'
          : 'TheFutureX stands out by combining a smart ring form factor with wellness tracking, sleep and recovery insights, app sync, and app-based health reports. Other brands may cover basic tracking, but TheFutureX is built to feel more complete in daily use.',
      keywords: [
        'thefuturex vs other smart rings',
        'smart ring with display india',
        'best smart ring under 5000',
        'other brands smart ring alternative',
        'smart ring with screen india',
        'thefuturex display pro ring review',
        'smart ring comparison india 2026',
      ],
    };
  }

  if (productFamily === 'monitoring' && /\bsleep|bedside|recovery|rest\b/i.test(`${product.name} ${product.description}`)) {
    return {
      eyebrow: 'Sleep tracker comparison',
      title: `${productName} vs Other Brands`,
      intro:
        'The core question for sleep tracking is simple: do you want to wear a device to bed, or track sleep without wearing anything on your wrist? This comparison frames the real trade-off between a non-wearable TheFutureX sleep monitor and other brands.',
      columns: [productName, 'Other Brands'],
      rows: [
        ['Tracking style', 'Non-wearable bedside sleep monitor', 'Wearable band on the wrist'],
        ['Comfort while sleeping', 'Nothing to wear during sleep', 'Requires wearing a band overnight'],
        ['Feature focus', 'Built specifically around sleep monitoring, sleep patterns, wellness insights, nightly routine review, and recovery context', 'Often sleep is only one small feature inside a general wearable'],
        ['Sleep insights', 'Sleep duration, pattern review, historical sleep trends, and app-based night reports', 'Usually basic sleep stages with limited bedtime context'],
        ['Ease of use', 'Place it near the bed and review sleep data without wearing a device', 'Must be worn correctly and charged before sleeping'],
        ['Wellness reports', 'Designed for focused sleep and recovery reports over time', 'Usually mixed into a general fitness dashboard'],
        ['Best use case', 'Sleep duration, sleep patterns, and nightly routine review', '24/7 activity, heart rate, alerts, and sleep stages'],
        ['Setup', getProductSpecValue(product, [/setup|wireless|app|connect/i], 'Simple bedside setup with app review'), 'Pair band, wear correctly, and keep charged'],
        ['Sleep tracking', 'Designed specifically for sleep monitoring', 'Sleep tracking is one feature among many'],
        ['Daytime tracking', 'Focused on sleep and recovery context', 'Better for steps, workouts, and daily alerts'],
      ],
      verdict:
        'Choose TheFutureX if you want more focused sleep features without wearing band hardware at night. It is designed around comfort, sleep insights, recovery context, and nightly app reports instead of treating sleep as a small add-on feature.',
      keywords: [
        'non wearable sleep tracker india',
        'sleep monitor without wearing band',
        'best sleep tracker device india',
        'track sleep without smartwatch',
        'bedside sleep monitor india',
        'sleep stage tracker device',
      ],
    };
  }

  if (productFamily === 'fan') {
    return {
      eyebrow: 'Fan comparison',
      title: `${productName} vs Other Brands`,
      intro:
        'Bladeless tower fans and regular fans solve the same cooling problem in different ways. This comparison focuses on safety, noise, space, controls, and all-season comfort so buyers can see how TheFutureX offers more practical features than other brands.',
      columns: [productName, 'Other Brands'],
      rows: [
        ['Design', 'Bladeless tower fan for compact rooms', 'Often exposed blade or basic tower designs'],
        ['Feature stack', 'Bladeless airflow, safety-focused design, quiet operation, remote controls, oscillation, timer, and selected 3-in-1 comfort features', 'Usually limited to basic cooling and speed control'],
        ['All-season comfort', 'Selected models support cooling, heating, and air purification in one product', 'Usually fan-only cooling'],
        ['Air quality support', 'Selected HEPA / purifier models support cleaner indoor airflow while cooling the room', 'Usually no purification feature'],
        ['Smart controls', 'Remote, touch, timer, mode controls, and flexible airflow settings on supported models', 'Usually basic buttons or speed control'],
        ['Safety', 'No exposed spinning blades, easier around family spaces', 'Many models use exposed blades behind a grille'],
        ['Noise and airflow', getProductSpecValue(product, [/quiet|silent|airflow|oscillation|speed/i], 'Smooth, quiet tower airflow'), 'Strong direct airflow, noise varies by model'],
        ['Floor space', 'Slim tower footprint', 'Wider stand and head need more room'],
        ['Controls', getProductSpecValue(product, [/remote|touch|timer|control|mode/i], 'Remote and mode controls on supported models'), 'Usually basic speed and swing controls'],
        ['Extra functions', getProductSpecValue(product, [/heat|heater|purifier|filter|hepa|cool|3\s*in\s*1/i], 'Cooling-focused; selected TheFutureX models add heat or purification'), 'Fan-only in most models'],
        ['Upfront cost', productPrice, 'Usually cheaper upfront'],
      ],
      verdict:
        'A regular fan is often the lowest-cost option, but TheFutureX shows more practical comfort features: bladeless safety, quiet tower airflow, compact footprint, remote control, oscillation, timer, and selected cooling, heating, and purification options in one modern appliance.',
      keywords: [
        'bladeless fan vs normal fan',
        'bladeless tower fan india',
        '3 in 1 fan cooler heater purifier india',
        'best bladeless fan for bedroom india',
        'silent tower fan india',
        'smart fan with remote india',
        'wall mounted bladeless fan india',
      ],
    };
  }

  return null;
};

const CompareCrownIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M3 8.5l4 3 5-6 5 6 4-3-1.6 9.5a1 1 0 01-1 .84H5.6a1 1 0 01-1-.84L3 8.5z"
      fill="currentColor"
    />
    <circle cx="3" cy="6.5" r="1.6" fill="currentColor" />
    <circle cx="12" cy="4" r="1.6" fill="currentColor" />
    <circle cx="21" cy="6.5" r="1.6" fill="currentColor" />
  </svg>
);

const CompareCheckIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <circle cx="10" cy="10" r="9" fill="currentColor" fillOpacity="0.18" />
    <path d="M6 10.2l2.4 2.4L14.2 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CompareDotIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.5" />
    <circle cx="10" cy="10" r="2.2" fill="currentColor" fillOpacity="0.6" />
  </svg>
);

const ProductSeoComparisonChart: React.FC<{ brief: SeoComparisonBrief }> = ({ brief }) => {
  const showExtraCopy = brief.eyebrow !== 'Smart ring comparison';
  const sectionRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef as any}
      id="comparison"
      className="relative scroll-mt-32 overflow-hidden bg-[#05070d] px-4 py-12 text-white sm:scroll-mt-36 sm:px-6 lg:px-8 lg:py-16"
    >
      <style>{`
        @keyframes tfxCompareGlowA { 0%,100% { transform: translate(-8%,-8%) scale(1); opacity:.5; } 50% { transform: translate(6%,4%) scale(1.18); opacity:.85; } }
        @keyframes tfxCompareGlowB { 0%,100% { transform: translate(8%,6%) scale(1); opacity:.35; } 50% { transform: translate(-6%,-8%) scale(1.22); opacity:.65; } }
        @keyframes tfxCompareShimmer { from { background-position: 0% 0; } to { background-position: -200% 0; } }
        @keyframes tfxCompareCrownFloat { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-4px) rotate(4deg); } }
        .tfx-compare-glow-a { animation: tfxCompareGlowA 9s ease-in-out infinite; }
        .tfx-compare-glow-b { animation: tfxCompareGlowB 11s ease-in-out infinite; }
        .tfx-compare-title-shine {
          background: linear-gradient(110deg, #fef3c7 10%, #fff 30%, #a5f3fc 50%, #fff 70%, #fef3c7 90%);
          background-size: 220% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: tfxCompareShimmer 6s linear infinite;
        }
        .tfx-compare-crown { display: inline-block; animation: tfxCompareCrownFloat 3.2s ease-in-out infinite; }
        .tfx-compare-header {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
        }
        .tfx-compare-header-in { opacity: 1; transform: translateY(0); }
        .tfx-compare-card {
          opacity: 0;
          transform: translateY(24px) scale(0.99);
          transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s, transform 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s;
        }
        .tfx-compare-card-in { opacity: 1; transform: translateY(0) scale(1); }
        .tfx-compare-row {
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1), background-color 0.3s ease;
        }
        .tfx-compare-row-in { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) {
          .tfx-compare-glow-a, .tfx-compare-glow-b, .tfx-compare-title-shine, .tfx-compare-crown,
          .tfx-compare-header, .tfx-compare-card, .tfx-compare-row {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      <div aria-hidden="true" className="tfx-compare-glow-a pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div aria-hidden="true" className="tfx-compare-glow-b pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className={`tfx-compare-header ${inView ? 'tfx-compare-header-in' : ''} grid gap-5 ${showExtraCopy ? 'lg:grid-cols-[0.86fr_1.14fr]' : ''}`}>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                <path d="M10 1.4l2.3 5.5 5.9.5-4.5 3.9 1.4 5.8L10 14 5 17.1l1.4-5.8-4.5-3.9 5.9-.5z" />
              </svg>
              {brief.eyebrow}
            </span>
            <h2 className="tfx-compare-title-shine mt-3 font-display text-3xl font-black leading-tight sm:text-5xl">{brief.title}</h2>
          </div>
          {showExtraCopy && (
            <p className="max-w-3xl text-sm font-semibold leading-7 text-slate-300 sm:text-base">{brief.intro}</p>
          )}
        </div>

        <div
          className={`tfx-compare-card ${inView ? 'tfx-compare-card-in' : ''} mt-7 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03] shadow-[0_28px_90px_rgba(2,6,23,0.5)] backdrop-blur-sm`}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] table-fixed border-collapse text-left text-[11px] sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.05] text-xs uppercase tracking-[0.12em] text-slate-200">
                  <th className="w-[26%] px-3 py-4 font-black sm:w-[28%] sm:px-6">Feature</th>
                  <th className="relative w-[39%] bg-gradient-to-b from-amber-400/12 via-cyan-400/6 to-transparent px-3 py-4 font-black sm:w-[36%] sm:px-6">
                    <span className="tfx-compare-crown absolute -top-2 right-3 text-base sm:right-6">
                      <CompareCrownIcon className="h-4 w-4 text-amber-300 sm:h-5 sm:w-5" />
                    </span>
                    <span className="bg-gradient-to-r from-amber-200 via-yellow-100 to-cyan-200 bg-clip-text text-transparent">{brief.columns[0]}</span>
                  </th>
                  <th className="w-[35%] px-3 py-4 font-black text-slate-400 sm:w-[36%] sm:px-6">{brief.columns[1]}</th>
                </tr>
              </thead>
              <tbody>
                {brief.rows.map(([feature, first, second], i) => (
                  <tr
                    key={feature}
                    className={`tfx-compare-row group border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.04] ${inView ? 'tfx-compare-row-in' : ''}`}
                    style={{ transitionDelay: inView ? `${Math.min(i, 12) * 55}ms` : '0ms' }}
                  >
                    <td className="break-words px-3 py-3.5 font-bold leading-4 text-slate-100 sm:px-6 sm:leading-6">{feature}</td>
                    <td className="break-words bg-gradient-to-r from-amber-400/10 via-cyan-400/5 to-transparent px-3 py-3.5 font-semibold leading-4 text-white transition-transform duration-300 group-hover:translate-x-0.5 sm:px-6 sm:leading-6">
                      <span className="flex items-start gap-2">
                        <CompareCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                        <span>{first}</span>
                      </span>
                    </td>
                    <td className="break-words px-3 py-3.5 font-semibold leading-4 text-slate-400 sm:px-6 sm:leading-6">
                      <span className="flex items-start gap-2">
                        <CompareDotIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                        <span>{second}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showExtraCopy && brief.keywords.length > 0 && (
            <div className="border-t border-white/10 px-4 py-5 sm:px-6 lg:px-8">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Trending searches</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {brief.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[11px] font-bold text-cyan-100 transition-colors duration-300 hover:border-cyan-300/40 hover:bg-cyan-300/15"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const TRUST_TILE_ICONS: Record<'shipping' | 'cod' | 'warranty' | 'secure', React.ReactNode> = {
  shipping: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="7.5" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </svg>
  ),
  cod: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M9.6 9.8c0-1.1 1-1.9 2.4-1.9s2.4.8 2.4 1.7c0 1.2-1.1 1.7-2.4 2.2-1.4.5-2.4 1.1-2.4 2.3 0 1 1 1.8 2.4 1.8s2.4-.8 2.4-1.9" />
      <path d="M12 6.8v1.1M12 16.1v1.1" />
    </svg>
  ),
  warranty: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l7 3.2v5.9c0 4.4-2.9 7.3-7 8.9-4.1-1.6-7-4.5-7-8.9V6.2z" />
      <path d="M9.2 12.3l1.8 1.8 3.8-4" />
    </svg>
  ),
  secure: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  ),
};

const productCheckoutTrustSignals: Array<{ title: string; mobileTitle: string; text: string; icon: keyof typeof TRUST_TILE_ICONS }> = [
  { title: 'Free shipping across India', mobileTitle: 'Free shipping', text: '', icon: 'shipping' },
  { title: 'COD available on eligible orders', mobileTitle: 'Cash on delivery', text: '', icon: 'cod' },
  { title: 'Brand warranty support', mobileTitle: 'Brand warranty', text: 'TheFutureX help', icon: 'warranty' },
  { title: 'Secure checkout', mobileTitle: 'Secure checkout', text: 'UPI, cards, wallet', icon: 'secure' },
];

const getWarrantyDisplayText = (product: Product, productFamily: string) => {
  const listedWarranty = String(product.warranty || product.specs?.Warranty || '').trim();
  if (listedWarranty) return listedWarranty;
  if (productFamily === 'fan') return '1-year limited motor warranty';
  return '6-month limited warranty';
};

const ProductCheckoutTrustBlock: React.FC<{ product?: Product; productFamily?: string; dark?: boolean }> = ({
  product,
  productFamily = 'wearable',
  dark = false,
}) => {
  const [isWarrantyExpanded, setIsWarrantyExpanded] = useState(false);
  const warrantyText = product ? getWarrantyDisplayText(product, productFamily) : 'Brand-backed help';
  const registrationPath = product ? `/register-warranty?product=${encodeURIComponent(product.name)}` : '/register-warranty';
  const tileTitleClass = dark
    ? 'break-words text-[10px] font-semibold leading-3 text-primary-200 sm:text-xs sm:leading-normal'
    : 'break-words text-[10px] font-semibold leading-3 text-slate-950 sm:text-xs sm:leading-normal';
  const tileTextClass = dark
    ? 'mt-1 break-words text-[11px] font-medium leading-4 text-gray-300'
    : 'mt-1 break-words text-[11px] font-medium leading-4 text-slate-600';
  const tileMutedClass = dark
    ? 'mt-1 break-words text-[10px] font-medium leading-4 text-gray-400'
    : 'mt-1 break-words text-[10px] font-medium leading-4 text-slate-500';
  const tileLinkClass = dark
    ? 'inline-flex text-[11px] font-semibold text-primary-200 hover:text-white'
    : 'inline-flex text-[11px] font-semibold text-[#8a6a20] hover:text-slate-950';
  const tileBaseClass = dark
    ? 'tfx-trust-tile min-w-0 border-r border-white/10 px-1 py-3 text-center last:border-r-0 sm:rounded-xl sm:border sm:border-white/10 sm:bg-white/5 sm:px-3.5 sm:py-3.5 sm:text-left sm:shadow-[0_10px_24px_rgba(0,0,0,0.12)]'
    : 'tfx-trust-tile min-w-0 border-r border-slate-200 px-1 py-3 text-center last:border-r-0 sm:rounded-xl sm:border sm:border-slate-200 sm:bg-[#fbfaf7] sm:px-3.5 sm:py-3.5 sm:text-left sm:shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
  const iconChipClass = dark
    ? 'tfx-trust-tile-icon mx-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/15 text-primary-300 sm:mx-0'
    : 'tfx-trust-tile-icon mx-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#a9812f]/10 text-[#8a6a20] sm:mx-0';
  return (
    <div className="relative mt-4">
      <style>{`
        .tfx-trust-tile {
          position: relative;
          overflow: hidden;
          opacity: 0;
          transform: translateY(10px);
          animation: tfx-trust-tile-in 550ms ease-out forwards;
          transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease, width 220ms ease;
        }
        .tfx-trust-tile:hover {
          transform: translateY(-3px);
          border-color: rgba(169,129,47,0.35);
          box-shadow: 0 16px 32px rgba(15,23,42,0.10);
        }
        @keyframes tfx-trust-tile-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tfx-trust-tile-icon svg { display: block; }
        .tfx-trust-tile--shipping .tfx-trust-tile-icon svg {
          animation: tfx-trust-truck-drive 2.4s ease-in-out infinite;
        }
        @keyframes tfx-trust-truck-drive {
          0% { transform: translateX(0); }
          45% { transform: translateX(3px); }
          50% { transform: translateX(3px); }
          95% { transform: translateX(0); }
          100% { transform: translateX(0); }
        }
        .tfx-trust-tile--secure .tfx-trust-tile-icon svg {
          transform-origin: 50% 85%;
          animation: tfx-trust-lock-secure 3s ease-in-out infinite;
        }
        @keyframes tfx-trust-lock-secure {
          0%, 55%, 100% { transform: rotate(0deg); }
          62% { transform: rotate(-9deg); }
          69% { transform: rotate(7deg); }
          76% { transform: rotate(-4deg); }
          83% { transform: rotate(0deg); }
        }
        .tfx-trust-tile--warranty .tfx-trust-tile-icon svg {
          animation: tfx-trust-shield-pop 3s ease-in-out infinite;
        }
        @keyframes tfx-trust-shield-pop {
          0%, 50%, 100% { transform: scale(1); }
          58% { transform: scale(1.18); }
          66% { transform: scale(0.96); }
          74% { transform: scale(1.06); }
          82% { transform: scale(1); }
        }
        .tfx-trust-tile--cod .tfx-trust-tile-icon svg {
          animation: tfx-trust-coin-flip 2.6s ease-in-out infinite;
        }
        @keyframes tfx-trust-coin-flip {
          0%, 40%, 100% { transform: rotateY(0deg); }
          20% { transform: rotateY(180deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .tfx-trust-tile { opacity: 1; transform: none; animation: none; }
          .tfx-trust-tile--shipping .tfx-trust-tile-icon svg,
          .tfx-trust-tile--secure .tfx-trust-tile-icon svg,
          .tfx-trust-tile--warranty .tfx-trust-tile-icon svg,
          .tfx-trust-tile--cod .tfx-trust-tile-icon svg {
            animation: none;
          }
        }
      `}</style>
      <div className={`grid grid-cols-4 rounded-2xl border ${dark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-[#fbfaf7]'} sm:grid-cols-2 sm:gap-3 sm:border-0 sm:bg-transparent`}>
        {productCheckoutTrustSignals.map((signal, index) => {
          const { title, mobileTitle, text, icon } = signal;
          const isWarrantyTile = title === 'Brand warranty support';
          const tileClass = `${tileBaseClass} tfx-trust-tile--${icon} ${isWarrantyTile && isWarrantyExpanded ? 'col-span-4 sm:col-span-2' : ''}`;
          const tileStyle = { animationDelay: `${index * 90}ms` };

          if (isWarrantyTile && product) {
            return (
              <div key={title} className={tileClass} style={tileStyle}>
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start">
                  <span className={iconChipClass}>{TRUST_TILE_ICONS[icon]}</span>
                  <div className="min-w-0">
                    <p className={tileTitleClass}><span className="sm:hidden">{mobileTitle}</span><span className="hidden sm:inline">{title}</span></p>
                    <p className={`${tileTextClass} hidden sm:block`}>{text}</p>
                    {isWarrantyExpanded ? (
                      <>
                        <p className={tileMutedClass}>{warrantyText}</p>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                          <Link to={registrationPath} className={tileLinkClass}>
                            Register product
                          </Link>
                          <Link to="/info/warranty-policy" className={tileLinkClass}>
                            Warranty policy
                          </Link>
                        </div>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setIsWarrantyExpanded((prev) => !prev)}
                      className={`mt-2 inline-flex text-[11px] font-semibold underline-offset-2 hover:underline ${dark ? 'text-primary-200' : 'text-[#8a6a20]'}`}
                    >
                      {isWarrantyExpanded ? 'Show less' : 'Read more'}
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={title} className={tileClass} style={tileStyle}>
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start">
                <span className={iconChipClass}>{TRUST_TILE_ICONS[icon]}</span>
                <div className="min-w-0">
                  <p className={tileTitleClass}><span className="sm:hidden">{mobileTitle}</span><span className="hidden sm:inline">{title}</span></p>
                  {text && <p className={`${tileTextClass} hidden sm:block`}>{text}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const formatInr = (amount: number) => `₹${Math.max(0, Math.ceil(amount || 0)).toLocaleString('en-IN')}`;

const RazorpayEmiStrip: React.FC<{ price: number; onOpen: () => void }> = ({ price, onOpen }) => {
  const payNowAmount = Math.max(1, Math.ceil(price / 9));
  const sixMonthAmount = Math.max(1, Math.ceil(price / 6));
  const nineMonthAmount = Math.max(1, Math.ceil(price / 9));

  return (
    <button
      type="button"
      onClick={onOpen}
      className="product-detail-emi-strip mt-4 w-full max-w-sm rounded-lg border-2 border-slate-950 bg-white px-3 py-2 text-left shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.12)] sm:max-w-none"
      aria-label="View Razorpay EMI options"
    >
      <span className="product-detail-emi-badge mb-1 inline-flex rounded bg-slate-950 px-3 py-0.5 text-[10px] font-black text-white">
        Razorpay EMI
      </span>
      <span className="block text-sm font-black leading-5 text-slate-950 sm:text-base">
        Pay only {formatInr(payNowAmount)} now
      </span>
      <span className="mt-1 block text-[11px] font-bold leading-4 text-slate-600">
        {formatInr(sixMonthAmount)}/month for 6 months or {formatInr(nineMonthAmount)}/month for 9 months.
      </span>
    </button>
  );
};

const ProductPaymentOfferOptions: React.FC<{ product: Product; price: number; dark?: boolean }> = ({ product, price, dark = false }) => {
  const [selectedPayment, setSelectedPayment] = useState<'online' | 'cod'>('online');
  const prepaidDiscount = getPrepaidDiscountForItems([product], price);
  const onlinePrice = Number(Math.max(0, price - prepaidDiscount).toFixed(2));
  const panelClass = dark
    ? 'mt-4 w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-white sm:max-w-none'
    : 'mt-4 w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 shadow-[0_10px_24px_rgba(15,23,42,0.08)] sm:max-w-none';
  const mutedClass = dark ? 'text-slate-300' : 'text-slate-500';
  const codPriceClass = dark ? 'text-white' : 'text-slate-950';
  const selectedRowClass = dark ? 'is-selected bg-emerald-400/10' : 'is-selected bg-emerald-50/90';
  return (
    <div className={`${panelClass} product-payment-offers ${dark ? 'product-payment-offers-dark' : ''}`}>
      <h3 className={`px-4 pt-4 text-sm font-black ${dark ? 'text-white' : 'text-slate-950'}`}>Payment offers</h3>
      <div className="mt-3 grid gap-2 px-3 pb-3" role="group" aria-label="Choose payment offer">
        <button
          type="button"
          onClick={() => setSelectedPayment('online')}
          aria-pressed={selectedPayment === 'online'}
          className={`product-payment-offer-option grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-xl px-4 py-3 text-left transition ${selectedPayment === 'online' ? selectedRowClass : ''}`}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-black">Pay Online</p>
              {prepaidDiscount > 0 && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                  Flat {formatInrAmount(prepaidDiscount)} off
                </span>
              )}
            </div>
            <p className={`mt-0.5 text-xs font-semibold ${mutedClass}`}>UPI, Card, Wallets</p>
          </div>
          <p className="text-lg font-black text-emerald-600">{formatInrAmount(onlinePrice)}</p>
          <span className={`product-payment-radio ${selectedPayment === 'online' ? 'is-selected' : ''}`} aria-hidden="true">
            <span className="product-payment-radio-dot" />
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedPayment('cod')}
          aria-pressed={selectedPayment === 'cod'}
          className={`product-payment-offer-option grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-xl px-4 py-3 text-left transition ${selectedPayment === 'cod' ? selectedRowClass : ''}`}
        >
          <div className="min-w-0">
            <p className="text-base font-black">Cash on Delivery</p>
            <p className={`mt-0.5 text-xs font-semibold ${mutedClass}`}>Pay when your order arrives</p>
          </div>
          <p className={`text-lg font-black ${codPriceClass}`}>{formatInrAmount(price)}</p>
          <span className={`product-payment-radio ${selectedPayment === 'cod' ? 'is-selected' : ''}`} aria-hidden="true">
            <span className="product-payment-radio-dot" />
          </span>
        </button>
      </div>
    </div>
  );
};

const RazorpayEmiModal: React.FC<{
  price: number;
  firstName: string;
  lastName: string;
  phone: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onClose: () => void;
  onContinue: () => void;
}> = ({ price, firstName, lastName, phone, onFirstNameChange, onLastNameChange, onPhoneChange, onClose, onContinue }) => {
  const monthlyAmount = Math.max(1, Math.ceil(price / 9));
  const installmentOptions = [
    { amount: Math.max(1, Math.ceil(price / 3)), label: '3 Months' },
    { amount: Math.max(1, Math.ceil(price / 6)), label: '6 Months' },
    { amount: Math.max(1, Math.ceil(price / 9)), label: '9 Months' },
  ];

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[380px] overflow-hidden rounded-2xl bg-white text-slate-950 shadow-[0_28px_90px_rgba(0,0,0,0.35)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full px-2 py-1 text-xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
          aria-label="Close Razorpay EMI details"
        >
          x
        </button>
        <div className="px-5 pb-5 pt-6 text-center">
          <p className="text-sm font-bold text-slate-700">Pay with Razorpay EMI</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">Pay only {formatInr(monthlyAmount)} now</h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            Indicative split. Final EMI plans, bank eligibility, interest, and charges are shown by Razorpay at checkout.
          </p>
        </div>
        <div className="product-detail-emi-graph-card mx-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid grid-cols-3 gap-3">
            {installmentOptions.map((installment) => (
              <div key={installment.label} className="text-center">
                <div className="product-detail-emi-donut mx-auto grid h-16 w-16 place-items-center rounded-full">
                  <span className="product-detail-emi-donut-hole" />
                </div>
                <p className="mt-2 text-sm font-black text-slate-950">{formatInr(installment.amount)}</p>
                <p className="text-[11px] font-bold text-slate-500">{installment.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs font-black">
            <span>Total order value</span>
            <span>{formatInr(price)}</span>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 divide-x divide-slate-300 px-5 text-center text-[11px] font-black leading-4 text-slate-700">
          <span>Razorpay secure</span>
          <span>EMI options</span>
          <span>Cards accepted</span>
        </div>
        <div className="mt-5 bg-slate-100 px-5 py-5">
          <h3 className="text-center text-sm font-black text-slate-950">Get started with Razorpay EMI</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              value={firstName}
              onChange={(event) => onFirstNameChange(event.target.value)}
              placeholder="First Name"
              className="h-10 rounded border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
            <input
              value={lastName}
              onChange={(event) => onLastNameChange(event.target.value)}
              placeholder="Last Name"
              className="h-10 rounded border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_156px]">
            <div className="flex h-11 rounded border border-slate-300 bg-white">
              <span className="grid w-12 place-items-center border-r border-slate-200 text-sm font-bold text-slate-500">+91</span>
              <input
                value={phone}
                onChange={(event) => onPhoneChange(event.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter Mobile No."
                inputMode="numeric"
                className="min-w-0 flex-1 px-3 text-sm font-semibold outline-none"
              />
            </div>
            <button
              type="button"
              onClick={onContinue}
              className="product-detail-action-button h-11 rounded bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Buy on EMI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const REVIEW_NAMES = ['Aarav', 'Priya', 'Rohan', 'Sneha', 'Vikram', 'Neha', 'Aditya', 'Kavya'];

const buildFallbackReviews = (product: Product) => {
  const featureA = cleanFeatureText(product.features?.[0] || 'overall quality');
  const featureB = cleanFeatureText(product.features?.[1] || 'daily usage');
  const specA = product.specs ? Object.entries(product.specs)[0] : null;
  const specText = specA ? `${formatSpecLabel(specA[0])} is ${specA[1]}` : 'it feels worth the price';

  return REVIEW_NAMES.slice(0, 4).map((name, index) => ({
    id: `fallback_${product.id}_${index}`,
    productId: product.id,
    name,
    rating: [5, 4, 5, 4][index],
    comment: [
      `${product.name} looks great in hand and ${featureA.toLowerCase()} is the part I noticed most after using it for a few days.`,
      `Bought this mainly for ${featureB.toLowerCase()} and it has been reliable so far. ${specText}.`,
      `The finish, fit, and everyday performance of this ${product.category.slice(0, -1).toLowerCase() || 'product'} feel well balanced. Good value overall.`,
      `Using it daily now and the experience has been smooth. Delivery was fine and the product matches the listing well.`,
    ][index],
    images: [],
  }));
};

const getDisplayReviews = (product: Product, reviews: ProductPublicReview[]) => {
  const uniqueReviews = reviews.filter((review, index, list) => {
    const signature = `${review.name}|${review.comment}`.trim().toLowerCase();
    return list.findIndex((item) => `${item.name}|${item.comment}`.trim().toLowerCase() === signature) === index;
  });

  if (uniqueReviews.length >= 4) return uniqueReviews;

  const usedNames = new Set(uniqueReviews.map((review) => review.name.trim().toLowerCase()));
  const usedComments = new Set(uniqueReviews.map((review) => review.comment.trim().toLowerCase()));
  const fallback = buildFallbackReviews(product).filter(
    (review) => !usedNames.has(review.name.trim().toLowerCase()) && !usedComments.has(review.comment.trim().toLowerCase())
  );

  return [...uniqueReviews, ...fallback].slice(0, Math.max(4, uniqueReviews.length));
};

const DetailIcon: React.FC<{ kind: 'delivery' | 'shield' | 'support' | 'payment' | 'location' }> = ({ kind }) => {
  const shared = 'h-4 w-4 stroke-current drop-shadow-[0_1px_6px_rgba(255,255,255,0.08)]';
  if (kind === 'delivery') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={shared} strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.5h10.5v6.5H3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 11h3.2l3.3 3v1H13.5z" />
        <circle cx="7.5" cy="18" r="1.5" />
        <circle cx="17.5" cy="18" r="1.5" />
      </svg>
    );
  }
  if (kind === 'shield') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={shared} strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3.2v5.9c0 4.4-2.9 7.3-7 8.9-4.1-1.6-7-4.5-7-8.9V6.2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.2 12.3l1.8 1.8 3.8-4" />
      </svg>
    );
  }
  if (kind === 'support') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={shared} strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.8a7.5 7.5 0 0115 0" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 12.8v4h2.8v-4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.7 12.8v4h2.8v-4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.5h2.2" />
      </svg>
    );
  }
  if (kind === 'payment') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={shared} strokeWidth="1.8">
        <rect x="3" y="6" width="18" height="12" rx="2.5" />
        <path strokeLinecap="round" d="M3 10h18" />
        <path strokeLinecap="round" d="M7 15h3.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className={shared} strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
};

const RevealOnScroll: React.FC<{
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  as?: 'article' | 'div';
}> = ({ children, className = '', delayMs = 0, as = 'article' }) => {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Tag = as as any;
  return (
    <Tag
      ref={ref as any}
      className={`product-reveal ${isVisible ? 'product-reveal-visible' : ''} ${className}`}
      style={{ transitionDelay: isVisible ? `${delayMs}ms` : '0ms' }}
    >
      {children}
    </Tag>
  );
};

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { openLogin } = useAuthModal();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [sizeError, setSizeError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const productThumbnailStripRef = useRef<HTMLDivElement | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const [activeDetailTab, setActiveDetailTab] = useState<ProductDetailTabKey>('description');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showAllMobileOverview, setShowAllMobileOverview] = useState(false);
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [visibleReviewCount, setVisibleReviewCount] = useState(2);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [surprisePhone, setSurprisePhone] = useState('');
  const [showEmiModal, setShowEmiModal] = useState(false);
  const [emiFirstName, setEmiFirstName] = useState('');
  const [emiLastName, setEmiLastName] = useState('');
  const [emiPhone, setEmiPhone] = useState('');
  const [surprisePriceRevealed, setSurprisePriceRevealed] = useState(false);
  const [showMobileStickyCta, setShowMobileStickyCta] = useState(false);
  const [isBuyNowPressed, setIsBuyNowPressed] = useState(false);
  const [detailTabsFixed, setDetailTabsFixed] = useState(false);
  const [detailTabsHeight, setDetailTabsHeight] = useState(48);
  const mobileCtaAnchorRef = useRef<HTMLDivElement | null>(null);
  const productGalleryRef = useRef<HTMLDivElement | null>(null);
  const detailTabsAnchorRef = useRef<HTMLDivElement | null>(null);
  const detailTabsBarRef = useRef<HTMLElement | HTMLDivElement | null>(null);
  const trackedProductViewRef = useRef('');
  const reviewImagePreviews = useMemo(
    () => reviewImages.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [reviewImages]
  );
  const loadProduct = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getProductById(id)
      .then(async (p) => {
        if (!p) {
          setError('Product not found');
        } else {
          const publicReviews = await getProductReviews(p.id);
          const embeddedReviews = p.reviews || [];
          const mergedReviews = [
            ...publicReviews,
            ...embeddedReviews.filter((embedded) => !publicReviews.some((review) => review.id && review.id === embedded.id)),
          ];
          const displayReviews = getDisplayReviews(p, mergedReviews);
          const nextReviewCount = displayReviews.length;
          const nextRating = nextReviewCount
            ? Number((displayReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / nextReviewCount).toFixed(1))
            : Number(p.rating || 0);
          setProduct({ ...p, reviews: displayReviews, reviewCount: nextReviewCount, rating: nextRating });
          setSelectedColor(p.colors?.[0] ?? null);
        }
      })
      .catch(() => setError('Failed to load product'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => loadProduct(), [loadProduct]);

  useEffect(() => {
    window.addEventListener('products-updated', loadProduct);
    return () => window.removeEventListener('products-updated', loadProduct);
  }, [loadProduct]);

  useEffect(() => {
    if (!product || !id) return;
    const canonicalSlug = getProductSlug(product);
    if (!canonicalSlug || id === canonicalSlug) return;
    navigate(`/product/${canonicalSlug}${window.location.search}`, { replace: true });
  }, [id, navigate, product]);

  useEffect(() => {
    if (!product) return;
    setShowEmiModal(true);
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const viewKey = `${product.id}:${getProductSlug(product)}`;
    if (trackedProductViewRef.current === viewKey) return;
    trackedProductViewRef.current = viewKey;
    const price = Number(product.salePrice || product.price || 0);
    pushDataLayerEvent('product_view', {
      ecommerce: {
        currency: 'INR',
        value: Number.isFinite(price) ? price : 0,
        items: [productToAnalyticsItem(product)],
      },
      page_path: `/product/${getProductSlug(product)}`,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [product]);

  useEffect(() => {
    if (!product) return;

    let cancelled = false;
    getProducts()
      .then((products) => {
        if (cancelled) return;
        const sameCategory = products.filter((item) => item.id !== product.id && item.category === product.category);
        const fallback = products.filter((item) => item.id !== product.id && item.category !== product.category);
        setRelatedProducts([...sameCategory, ...fallback].slice(0, 6));
      })
      .catch(() => {
        if (!cancelled) setRelatedProducts([]);
      });

    return () => {
      cancelled = true;
    };
  }, [product]);

  const activeImages = useMemo(() => {
    if (!product) return [];
    const selectedColorKey = normalizeOptionKey(selectedColor?.name);
    if (selectedColor?.images?.length) return selectedColor.images;
    if (selectedColorKey && product.imagesByColor) {
      const colorImages =
        product.imagesByColor[selectedColor?.name || ''] ||
        Object.entries(product.imagesByColor).find(([key]) => normalizeOptionKey(key) === selectedColorKey)?.[1];
      if (colorImages?.length) return colorImages;
    }
    const variantImages = product.variants?.find((variant) => normalizeOptionKey(variant.colorName || variant.color) === selectedColorKey)?.images;
    if (variantImages?.length) return variantImages;
    return product?.images ?? [];
  }, [selectedColor, product]);

  const getColorAvailableStock = useCallback(
    (color: ProductColor) => {
      const directStock = Number(color.stock || 0) - Number(color.reservedStock || 0);
      if (directStock > 0) return directStock;

      const colorKey = normalizeOptionKey(color.name);
      const variant = product?.variants?.find((item) => normalizeOptionKey(item.colorName || item.color) === colorKey);
      const sizeStock = (variant?.sizes || []).reduce((total, sizeRow) => total + Number(sizeRow.stock || 0), 0);
      return Math.max(0, sizeStock);
    },
    [product?.variants]
  );

  const handleSelectColor = useCallback(
    (color: ProductColor) => {
      const colorStock = getColorAvailableStock(color);
      if (colorStock <= 0) return;
      setSelectedColor(color);
      setSelectedSize('');
      setSizeError('');
      setSelectedImageIndex(0);
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set('color', normalizeOptionKey(color.name));
        return next;
      }, { replace: true });
      if (window.matchMedia('(max-width: 1023px)').matches) {
        window.setTimeout(() => {
          productGalleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
      }
    },
    [getColorAvailableStock, setSearchParams]
  );

  const salePrice = Number(product?.salePrice || product?.price || 0);
  const mrp = salePrice > 0 ? salePrice + 2000 : 0;
  const savings = Math.max(0, mrp - salePrice);
  const percent = mrp > 0 ? Math.round((savings / mrp) * 100) : 0;
  const hidePercentageOffer = product ? isTfxV5OfferExcluded(product) : false;
  const automaticOfferPricing = product ? getAutomaticOfferItemPricing(product) : null;
  const couponRate = automaticOfferPricing?.rate || 0;
  const couponDiscount = automaticOfferPricing?.unitDiscount || 0;
  const couponPrice = automaticOfferPricing?.unitOfferPrice || salePrice;
  const isProductCouponApplied = couponRate > 0;
  const couponRateLabel = automaticOfferPricing?.rateLabel || '';
  const productOfferCode = '';
  const displayedPrice = couponRate > 0 ? couponPrice : salePrice;
  const displayedSavings = Math.max(0, mrp - displayedPrice);
  const displayedPercent = mrp > 0 ? Math.round((displayedSavings / mrp) * 100) : 0;
  const isFeaturedBandProduct = Boolean(product && (id === FEATURED_BAND_PRODUCT_SLUG || getProductSlug(product) === FEATURED_BAND_PRODUCT_SLUG || toProductSlug(product.name) === FEATURED_BAND_PRODUCT_SLUG));
  const isMegaPriceDropBand = Boolean(product && (
    MEGA_PRICE_DROP_BAND_SLUGS.includes(id || '') ||
    MEGA_PRICE_DROP_BAND_SLUGS.includes(getProductSlug(product)) ||
    MEGA_PRICE_DROP_BAND_SLUGS.includes(toProductSlug(product.name))
  ));
  const normalizedCategory = String(product?.category || '').trim().toLowerCase();
  const isRingProduct = normalizedCategory === 'smart rings' || /\bsmart\s+rings?\b/.test(normalizedCategory);
  const isSmartGlassesProduct = /\b(glass|glasses|eyewear|ai\s*glass)\b/i.test(`${product?.name || ''} ${product?.category || ''}`);
  const isComingSoonProduct = isSmartGlassesProduct;

  useEffect(() => {
    if (couponRate > 0) {
      setSurprisePriceRevealed(true);
      setCouponMessage('');
    }
  }, [couponRate]);

  const stockCount = useMemo(() => {
    if (selectedColor) {
      return Number(selectedColor.stock || 0) - Number(selectedColor.reservedStock || 0);
    }
    return Number(product?.stock || 0) - Number(product?.reservedStock || 0);
  }, [selectedColor, product]);

  const canAdd = stockCount > 0 && !isComingSoonProduct;
  const productModelIdentifiers = useMemo(() => (product ? getProductModelIdentifiers(product) : []), [product]);
  const primaryProductModel = productModelIdentifiers[0] || '';
  const specEntries = useMemo(() => {
    const productText = `${product?.name || ''} ${product?.category || ''}`.toLowerCase();
    const isBandProduct = /\b(band|bracelet)\b/.test(productText);
    const isFanProductForSpecs = /\b(fan|bladeless|tower|air\s*circulation|cooling)\b/.test(productText);
    const isMonitoringProductForSpecs = /\b(monitor|watch|belt|spo2|ecg|blood\s*pressure|glucose|sleep\s*tracking|sleep\s*tracker)\b/.test(productText);
    const isV5BandProduct = isBandProduct && /\btfx\s*5\b|\btfx5\b|\bv5\b|\bai\s*v5\b/i.test(product?.name || '');
    const isRingProductForSpecs = /\bring\b/.test(productText);
    const isDisplayRingForSpecs = isRingProductForSpecs && /\b(display|screen|touch\s*display)\b/.test(productText);
    const isRingProForSpecs = isRingProductForSpecs && /\bring\s*pro\b/.test(productText);
    const isTouchRingForSpecs = isRingProductForSpecs && !isDisplayRingForSpecs && !isRingProForSpecs && /\b(touch|ip68)\b/.test(productText);
    const bandSpecs = isV5BandProduct
      ? TFX5_SMART_BAND_SPECS
      : isBandProduct
        ? TFX_SMART_BAND_SPECS
        : {};
    const ringSpecs = isDisplayRingForSpecs
      ? TFX_DISPLAY_PRO_RING_SPECS
      : isTouchRingForSpecs
        ? TFX_TOUCH_RING_SPECS
        : isRingProductForSpecs
          ? TFX_RING_PRO_SPECS
          : {};
    const fanSpecs = isFanProductForSpecs ? FAN_PROFILES[getFanProfileKey(product?.name)].specs : {};
    const monitoringSpecs = isMonitoringProductForSpecs ? MONITORING_PROFILES[getMonitoringProfileKey(product?.name)].specs : {};
    const mergedSpecs = isV5BandProduct || isRingProductForSpecs
      ? { ...(product?.specs || {}), ...bandSpecs, ...ringSpecs }
      : { ...bandSpecs, ...ringSpecs, ...fanSpecs, ...monitoringSpecs, ...(product?.specs || {}) };
    const hasModelSpec = Object.keys(mergedSpecs).some((key) => /model|sku|serial|code|item\s*no|product\s*id|pid/i.test(key));
    const specsWithModel = primaryProductModel && !hasModelSpec
      ? { 'Model Number': primaryProductModel, ...mergedSpecs }
      : mergedSpecs;

    return Object.entries(specsWithModel)
      .filter(([, value]) => String(value || '').trim().length > 0)
      .filter((entry) => !isV5BandProduct || !isInvalidTfx5BandSpec(entry));
  }, [primaryProductModel, product?.category, product?.name, product?.specs]);
  const topSpecEntries = useMemo(() => specEntries.slice(0, 6), [specEntries]);
  const selectedColorStock = selectedColor
    ? Math.max(0, Number(selectedColor.stock || 0) - Number(selectedColor.reservedStock || 0))
    : stockCount;

  useEffect(() => {
    if (!product?.colors?.length) return;
    const queryColor = normalizeOptionKey(searchParams.get('color') || '');
    if (!queryColor) return;
    const matchingColor = product.colors.find((color) => normalizeOptionKey(color.name) === queryColor);
    if (!matchingColor || selectedColor?.name === matchingColor.name) return;
    setSelectedColor(matchingColor);
    setSelectedImageIndex(0);
  }, [product?.colors, searchParams, selectedColor?.name]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants?.length) return null;
    const selectedColorKey = normalizeOptionKey(selectedColor?.name);
    return (
      product.variants.find((variant) => normalizeOptionKey(variant.colorName || variant.color) === selectedColorKey) ||
      product.variants[0]
    );
  }, [product?.variants, selectedColor?.name]);
  const ringColorSizeCatalog = useMemo(
    () => (isRingProduct ? getRingColorSizeCatalog(product?.name) : null),
    [isRingProduct, product?.name]
  );
  const availableSizes = useMemo(() => {
    if (isRingProduct && ringColorSizeCatalog) {
      const catalogSizes = getRingCatalogSizesForColor(
        ringColorSizeCatalog,
        selectedColor?.name || product?.colors?.[0]?.name
      );
      if (catalogSizes.length > 0) {
        return catalogSizes.map((option) => ({ size: option.size, stock: option.inStock ? 1 : 0 }));
      }
    }

    const explicitSizes = (selectedVariant?.sizes || [])
        .map((item) => ({ ...item, stock: Number(item.stock || 0) }))
        .filter((item) => String(item.size || '').trim().length > 0 && (!isRingProduct || Number(item.stock || 0) > 0));
    if (explicitSizes.length > 0) return explicitSizes;
    if (!isRingProduct) return [];

    return STANDARD_RING_SIZE_OPTIONS.map((size) => ({ size, stock: 1 }));
  }, [isRingProduct, product?.colors, ringColorSizeCatalog, selectedColor?.name, selectedVariant?.sizes]);
  const requiresRingSize = isRingProduct && availableSizes.length > 0;
  const infoBadges = useMemo(
    () => [
      { title: 'Secure Payment', text: 'Trusted checkout and support', icon: 'payment' as const },
      { title: 'Warranty', text: product?.warranty || 'Standard product warranty', icon: 'shield' as const },
      { 
  title: 'Cash on Delivery', 
  text: 'COD available on eligible orders.', 
  icon: 'support' as const 
},
    ],
    [product?.warranty]
  );
  const visibleSpecEntries = useMemo(
    () => (showAllSpecs || isRingProduct ? specEntries : specEntries.slice(0, 8)),
    [isRingProduct, showAllSpecs, specEntries]
  );

  useEffect(() => {
    if (!product) return;

    const productPath = `/product/${getProductSlug(product)}`;
    const image = product.images?.[0] || product.colors?.[0]?.images?.[0] || '/images/fav.webp';
    const seoRecord = buildProductSeoRecord(product);
    const baseDescription = seoRecord?.description ||
      stripHtml(product.description).slice(0, 155) ||
      product.features?.slice(0, 3).join(', ') ||
      `Shop ${product.name} from TheFutureX.`;
    const description = seoRecord?.description || (primaryProductModel && !baseDescription.toLowerCase().includes(primaryProductModel.toLowerCase())
      ? `${baseDescription.replace(/[. ]*$/, '')}. Model number: ${primaryProductModel}.`
      : baseDescription);
    const price = Number(product.salePrice || product.price || product.mrp || 0);
    const customerFacingPrice = getAutomaticOfferItemPricing(product).unitOfferPrice || price;
    const schemaPrice = Math.max(customerFacingPrice, 1).toFixed(2);
    const productImages = product.images?.length ? product.images : [image];
    const categoryPath = getCategoryPathForSchema(product.category);
    const categoryUrl = absoluteUrl(categoryPath);
    const productUrl = absoluteUrl(productPath);
    const reviewCount = Math.max(0, Number(product.reviewCount || product.reviews?.length || 0));
    const ratingValue = Math.max(1, Math.min(5, Number(product.rating || 0)));
    const productReviews = (product.reviews || []).slice(0, 3).map((review) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.name || 'TheFutureX customer',
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: Math.max(1, Math.min(5, Number(review.rating || ratingValue))).toFixed(1),
        bestRating: '5',
        worstRating: '1',
      },
      reviewBody: stripHtml(review.comment || `${product.name} customer review.`).slice(0, 300),
    }));

    setSeoMetadata({
      title: seoRecord?.seoTitle || `${product.name} - TheFutureX`,
      description,
      path: productPath,
      image,
      type: 'product',
    });
    setProductSocialMetadata(customerFacingPrice);

    const additionalProperty = Object.entries(product.specs || {})
      .filter(([name, value]) => String(name).trim() && String(value).trim())
      .slice(0, 20)
      .map(([name, value]) => ({ '@type': 'PropertyValue', name: String(name), value: String(value) }));

    const productSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${productUrl}#product`,
      name: product.name,
      description,
      image: productImages.map((item) => absoluteUrl(item)),
      model: primaryProductModel || undefined,
      mpn: primaryProductModel || undefined,
      brand: {
        '@type': 'Brand',
        name: 'The Future X',
      },
      sku: product.id,
      category: product.category,
      ...(primaryProductModel ? { mpn: primaryProductModel, model: primaryProductModel } : {}),
      ...(additionalProperty.length ? { additionalProperty } : {}),
      offers: {
        '@type': 'Offer',
        url: productUrl,
        priceCurrency: 'INR',
        price: schemaPrice,
        availability: canAdd ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
        seller: {
          '@type': 'Organization',
          name: 'The Future X',
        },
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'INR' },
          shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
        },
      },
    };
    if (reviewCount > 0 && Number.isFinite(ratingValue) && ratingValue > 0) {
      productSchema.aggregateRating = { '@type': 'AggregateRating', ratingValue: ratingValue.toFixed(1), reviewCount, bestRating: '5', worstRating: '1' };
    }
    if (productReviews.length) productSchema.review = productReviews;
    setJsonLd('product-json-ld', productSchema);

    setJsonLd('product-breadcrumb-json-ld', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://thefuturex.in/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: product.category || 'Products',
          item: categoryUrl,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: product.name,
          item: productUrl,
        },
      ],
    });

    setJsonLd('product-faq-json-ld', getProductFaqSchema(product.name));

    return () => {
      removeJsonLd('product-json-ld');
      removeJsonLd('product-breadcrumb-json-ld');
      removeJsonLd('product-faq-json-ld');
    };
  }, [canAdd, primaryProductModel, product]);

  useEffect(() => {
    if (user?.name && !reviewName) {
      setReviewName(user.name);
    }
  }, [reviewName, user]);

  useEffect(() => {
    return () => {
      reviewImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [reviewImagePreviews]);

  useEffect(() => {
    const anchor = mobileCtaAnchorRef.current;
    if (!anchor || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowMobileStickyCta(!entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(anchor);
    return () => observer.disconnect();
  }, [product]);

  useEffect(() => {
    if (!requiresRingSize) {
      setSelectedSize('');
      setSizeError('');
      return;
    }
    setSelectedSize((current) => {
      if (!current) return '';
      const stillAvailable = availableSizes.some((item) => item.stock > 0 && item.size === current);
      return stillAvailable ? current : '';
    });
    setSizeError('');
  }, [availableSizes, requiresRingSize]);

  const handleAddToCart = useCallback((options?: { openCart?: boolean; showFeedback?: boolean }) => {
    if (!product) return;
    const productToAdd = {
      ...product,
      selectedColorName: selectedColor?.name,
      selectedColorHex: selectedColor?.hex,
      selectedSize: selectedSize || undefined,
      images: activeImages.length > 0 ? activeImages : product.images,
    };
    addToCart(productToAdd, 1, { openCart: options?.openCart });
    if (options?.showFeedback !== false) {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  }, [product, selectedColor, selectedSize, activeImages, addToCart]);

  const handleApplyProductCoupon = useCallback(() => {
    const digits = surprisePhone.replace(/\D/g, '');
    const normalizedPhone = digits.length === 12 && digits.startsWith('91')
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith('0')
        ? digits.slice(1)
        : digits;

    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      setCouponMessage('Enter a valid 10-digit mobile number to unlock this offer.');
      return;
    }

    window.localStorage.setItem('tfx_surprise_coupon_phone', normalizedPhone);
    addOfferLead({
      phone: normalizedPhone,
      source: 'product_offer',
      couponCodes: productOfferCode ? [productOfferCode] : [],
      message: productOfferCode ? `${productOfferCode} for ${product?.category || product?.name || 'this product'}` : undefined,
      productId: product?.id,
      productName: product?.name,
    }).catch(() => undefined);
    setSurprisePriceRevealed(true);
    setCouponMessage('');
  }, [couponRateLabel, product, productOfferCode, surprisePhone]);

  const handleOpenNotify = useCallback(async () => {
    if (!product) return;
    if (!user) {
      openLogin('/product/' + id);
      return;
    }

    const contact = (user.email || user.phone || '').trim();
    if (!contact) {
      setNotifyMessage('Please add an email or phone number to your profile so we can notify you.');
      setShowNotifyModal(true);
      return;
    }

    setNotifySubmitting(true);
    setNotifyMessage('');
    try {
      await addProductNotifyRequest({
        productId: product.id,
        productName: product.name,
        contact,
        userId: user?.id,
        userEmail: user?.email,
        userName: user?.name,
        selectedColorName: selectedColor?.name,
      });
      setNotifyMessage('Done. We will notify you when this product is back in stock.');
      setShowNotifyModal(true);
      window.setTimeout(() => setShowNotifyModal(false), 1600);
    } catch (error) {
      setNotifyMessage(error instanceof Error ? error.message : 'Unable to save your request.');
      setShowNotifyModal(true);
    } finally {
      setNotifySubmitting(false);
    }
  }, [id, openLogin, product, selectedColor?.name, user]);

  const handleAddButtonClick = useCallback(() => {
    if (!canAdd) {
      handleOpenNotify();
      return;
    }
    if (requiresRingSize && !selectedSize) {
      setSizeError('Please select a ring size before adding to cart.');
      return;
    }
    setSizeError('');
    handleAddToCart();
  }, [canAdd, handleOpenNotify, requiresRingSize, selectedSize, handleAddToCart]);

  const handleBuyNowClick = useCallback((options?: { preferredPayment?: 'emi' }) => {
    if (!canAdd) {
      handleOpenNotify();
      return;
    }
    if (requiresRingSize && !selectedSize) {
      setSizeError('Please select a ring size before buying.');
      return;
    }
    setSizeError('');
    if (options?.preferredPayment === 'emi') {
      window.sessionStorage.setItem('tfx_preferred_payment', 'emi');
    } else {
      window.sessionStorage.removeItem('tfx_preferred_payment');
    }
    handleAddToCart({ openCart: false, showFeedback: false });
    if (!user) {
      navigate('/login?redirect=%2Fcheckout');
      return;
    }
    navigate('/checkout');
  }, [canAdd, handleAddToCart, handleOpenNotify, navigate, requiresRingSize, selectedSize, user]);

  const handleReviewImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/')).slice(0, 2);
    setReviewImages(files);
    if ((event.target.files?.length || 0) > 2) {
      setReviewMessage('Only 2 images are allowed for one review.');
    }
  };

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!product) return;
    const cleanName = reviewName.trim();
    const cleanComment = reviewComment.trim();
    if (!cleanName || !cleanComment) {
      setReviewMessage('Please enter your name and review.');
      return;
    }

    setReviewSubmitting(true);
    setReviewMessage('');
    try {
      const imageUrls: string[] = [];
      for (const file of reviewImages.slice(0, 2)) {
        const url = await uploadFile(file, `reviews/${product.id}/${Date.now()}_${file.name}`);
        if (url) imageUrls.push(url);
      }

      const savedReview = await addProductReview(product.id, {
        productId: product.id,
        name: cleanName,
        rating: reviewRating,
        comment: cleanComment,
        images: imageUrls,
        userId: user?.id,
        userEmail: user?.email,
      });

      setProduct((current) => {
        if (!current) return current;
        const nextReviews = getDisplayReviews(current, [savedReview, ...(current.reviews || [])]);
        return {
          ...current,
          reviews: nextReviews,
          reviewCount: nextReviews.length,
          rating: Number((nextReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / nextReviews.length).toFixed(1)),
        };
      });
      setReviewComment('');
      setReviewImages([]);
      setReviewRating(5);
      setReviewMessage('Review submitted. Admin can review it.');
      window.dispatchEvent(new Event('reviews-updated'));
      window.dispatchEvent(new Event('products-updated'));
    } catch {
      setReviewMessage('Unable to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    if (!product) return;

    const familyText = `${product.category || ''} ${product.name || ''}`.toLowerCase();
    const hasComparisonForScroll =
      /\b(band|bracelet|ring|fan)\b/.test(familyText) ||
      /\bsleep\b/.test(familyText);
    const sectionIds: ProductDetailTabKey[] = [
      'features',
      'description',
      ...(hasComparisonForScroll ? ['comparison' as const] : []),
      'specs',
      'faq',
    ];

    const updateActiveTabFromScroll = () => {
      if (window.innerWidth < 640) return;
      const headerHeight = Number.parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--tfx-sticky-header-height'),
        10
      ) || 80;
      const offset = headerHeight + detailTabsHeight + 16;
      const currentPosition = window.scrollY + offset;
      let currentTab = sectionIds[0];

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element && element.offsetTop <= currentPosition) {
          currentTab = id;
        }
      }

      setActiveDetailTab((previous) => (previous === currentTab ? previous : currentTab));
    };

    updateActiveTabFromScroll();
    window.addEventListener('scroll', updateActiveTabFromScroll, { passive: true });
    window.addEventListener('resize', updateActiveTabFromScroll);

    return () => {
      window.removeEventListener('scroll', updateActiveTabFromScroll);
      window.removeEventListener('resize', updateActiveTabFromScroll);
    };
  }, [detailTabsHeight, product]);

  useEffect(() => {
    if (!product) return;

    const updateDetailTabsPosition = () => {
      const anchor = detailTabsAnchorRef.current;
      const bar = detailTabsBarRef.current;
      if (!anchor) return;

      if (bar) {
        setDetailTabsHeight(bar.offsetHeight || 48);
      }

      const headerHeight = Number.parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--tfx-sticky-header-height'),
        10
      ) || 80;
      setDetailTabsFixed(anchor.getBoundingClientRect().top <= headerHeight);
    };

    updateDetailTabsPosition();
    window.addEventListener('scroll', updateDetailTabsPosition, { passive: true });
    window.addEventListener('resize', updateDetailTabsPosition);

    return () => {
      window.removeEventListener('scroll', updateDetailTabsPosition);
      window.removeEventListener('resize', updateDetailTabsPosition);
    };
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-2xl font-bold text-white">Product Not Found</p>
        <p className="text-gray-400 text-center">{error || 'This product does not exist or has been removed.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-6 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-500 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const baseDisplayedImages = activeImages.length > 0 ? activeImages : [];
  const displayedImages = baseDisplayedImages.length > 0 ? baseDisplayedImages : ['https://picsum.photos/600'];
  const selectedColorKeyForVideo = normalizeOptionKey(selectedColor?.name);
  const selectedVariantVideoUrl = selectedVariant?.videoUrl || '';
  const selectedColorVideoUrl =
    selectedColorKeyForVideo && product.videoByColor
      ? product.videoByColor[selectedColor?.name || ''] ||
        Object.entries(product.videoByColor).find(([key]) => normalizeOptionKey(key) === selectedColorKeyForVideo)?.[1] ||
        ''
      : '';
  const isDisplayProProduct =
    getProductSlug(product) === DISPLAY_PRO_PRODUCT_SLUG ||
    toProductSlug(product.name) === DISPLAY_PRO_PRODUCT_SLUG;
  const productVideoUrl =
    selectedVariantVideoUrl ||
    selectedColorVideoUrl ||
    product.videoUrl ||
    (isDisplayProProduct ? DISPLAY_PRO_YOUTUBE_URL : '');
  const productVideoIndex = displayedImages.length;
  const displayedMediaCount = displayedImages.length + (productVideoUrl ? 1 : 0);
  const shortDescription = stripHtml(product.description);
  const productFamilyText = `${normalizedCategory} ${product.name}`.toLowerCase();
  const productFamily = /\b(band|bracelet)\b/.test(productFamilyText)
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
  const isRingOverview = productFamily === 'ring';
  const hasSeoComparisonForTabs = productFamily === 'band' || productFamily === 'ring' || productFamily === 'fan' || (productFamily === 'monitoring' && /\bsleep\b/i.test(productFamilyText));
  const useMarketplaceArrangement = true;
  const isFanMarketplacePage = productFamily === 'fan';
  const productGalleryVideoFit: 'contain' | 'cover' = productFamily === 'fan' ? 'contain' : 'cover';
  const showProductOverview = productFamily !== 'fan';
  const detailTabs: Array<{ key: ProductDetailTabKey; label: string }> = [
    { key: 'features', label: 'Features' },
    ...(showProductOverview || isFanMarketplacePage ? [{ key: 'description' as const, label: isFanMarketplacePage ? 'Description' : 'Overview' }] : []),
    ...(hasSeoComparisonForTabs ? [{ key: 'comparison' as const, label: 'Comparison' }] : []),
    { key: 'specs', label: 'Specifications' },
    { key: 'faq', label: 'FAQs' },
    { key: 'reviews', label: 'Reviews' },
  ];
  const getDetailTabLabel = (tab: (typeof detailTabs)[number]) => {
    return tab.label;
  };
  const mobileDetailTabs: Array<{ key: ProductDetailTabKey; label: string }> = [
    { key: 'description', label: isFanMarketplacePage ? 'Description' : 'Overview' },
    ...(hasSeoComparisonForTabs ? [{ key: 'comparison' as const, label: 'Comparison' }] : []),
    { key: 'features', label: 'Features' },
    { key: 'specs', label: 'Specs' },
    { key: 'battery', label: 'Battery' },
    { key: 'faq', label: 'FAQ' },
  ];
  const familyProfiles = {
    band: {
 fallbackFeatures: ['Screenless Comfort', 'Long Battery Life', 'Monitoring', 'Sleep Tracking', 'Fitness Tracking', 'Stress and Recovery', 'SpO2', 'Heart Rate', 'Fashionable Wear'],
      images: [bandLifestyle, bandScreenlessComfort, bandProof, bandLongBattery, bandFashionableWear, tfxVitalDashboard, tfxVitalAge],
      sections: [
        ['Screenless Comfort for Everyday Wear', 'A quiet, lightweight band form keeps tracking comfortable through sleep, work, training, and daily movement.'],
        ['Long Battery Life for Steady Monitoring', 'Extended battery support helps keep biometric tracking consistent between charges, making the wearable easier to trust every day.'],
        ['Reliable Wellness Signals at a Glance', 'App-based summaries turn sleep, recovery, heart rate, activity, and wellness data into simple daily insights.'],
        ['Fashionable Wear for Work and Training', 'Minimal band finishes are designed to feel polished with training wear, daily outfits, and wellness routines.'],
 ['Connected App Flow for Better Habits', 'The companion app helps users review trends, reports and recovery cues without needing another distracting screen on the wrist.'],
 ['7x24 Monitoring, Always On', 'Continuous monitoring keeps heart rate, blood oxygen, sleep, activity, stress and recovery signals available across the day.'],
      ],
    },
    ring: {
 fallbackFeatures: ['Ultra-Thin Body', 'Monitoring', 'AI Insights', 'Accurate Sleep Monitor', 'Fitness Tracking', 'Stress and Recovery', 'SpO2', 'Heart Rate', '5ATM Waterproof'],
 images: [ringLowProfile, ringWellness, ringAiWellness, ringDailySync, ringSleepHero, tfxVitalDashboard, tfxVitalAge],
      sections: [
 ['Ultra Thin Comfort Without Awareness', 'A precision-built ring profile keeps the product comfortable for all-day and overnight use while supporting continuous wellness monitoring.'],
        [`Explore the power of ${product.name}`, 'Daily insights from vital-sign monitoring help users understand routines, recovery, sleep quality, and wellness trends with clear app-based summaries.'],
 ['AI Wellness Insight, Always Helping You Achieve Better ', 'AI-assisted reports make trends easier to review with weekly and monthly comparisons, practical signals and better visibility into wellness changes.'],
 ['Precise Temperature Monitoring and Wellness Trends', 'Temperature, recovery and trend-based reporting make it easier to understand body signals and daily changes over time.'],
 ['Family Sharing, Family Care Made Simple', 'Connected app workflows help users review summaries and support family wellness with a clear, simple, shareable view.'],
      ],
    },
    fan: {
      fallbackFeatures: ['Bladeless Airflow', 'Hot and Cool Modes', 'Air Purification', 'Quiet Operation', 'Remote Control', 'Safe for Home', 'Low Maintenance', 'Modern Design'],
      images: [fanFamilyHero, fanSlideOne, fanSlideTwo, fanSlideThree, fanFamilyHero, fanSlideOne, fanSlideTwo],
      sections: [
        ['Comfortable Airflow for Every Season', 'Bladeless fan engineering supports smooth cooling, warming, and air circulation for daily home comfort.'],
        ['Designed for Safe Family Spaces', 'The bladeless structure keeps airflow comfortable while making the product easier to place around children, pets, and busy rooms.'],
        ['Purification and Fresh-Air Support', 'Selected models combine circulation with purifier-style filtration features for cleaner everyday indoor air.'],
        ['Quiet Operation for Bedrooms and Workspaces', 'Low-noise airflow makes the fan suitable for sleep, work, study, and relaxed home routines.'],
        ['Modern Controls and Flexible Use', 'Remote, touch, and app-ready control flows help users adjust speed, timer, and comfort modes quickly.'],
        ['Reliable Everyday Performance', 'Strong airflow, stable construction, and easy maintenance support long-term household use.'],
      ],
    },
    glasses: {
      fallbackFeatures: ['Built-in HD Camera', 'First-Person Recording', 'Bluetooth Calling', 'Music Playback', 'Voice Assistant Support', 'Long Battery Life', 'Lightweight Eyewear', 'App Connected'],
      images: [displayedImages[0], displayedImages[1] || displayedImages[0], displayedImages[2] || displayedImages[0], displayedImages[0], displayedImages[1] || displayedImages[0], displayedImages[2] || displayedImages[0]],
      sections: [
        ['Capture Everyday Moments', 'Built-in camera support helps record quick first-person clips while keeping your hands free.'],
        ['Smart Audio on the Go', 'Bluetooth music, hands-free calling, and voice assistant support make daily use simple and connected.'],
        ['Modern Connected Eyewear', 'A lightweight smart glasses design blends lifestyle styling with practical recording and app-based controls.'],
        ['Ready for Travel and Daily Use', 'Long battery support and easy pairing keep the glasses useful for commutes, trips, and everyday moments.'],
        ['Designed for Daily Style', 'A clean eyewear profile keeps the smart features easy to wear with casual, travel, and work outfits.'],
        ['Hands-Free Utility', 'Quick controls help with calls, music, recording, and assistant access without reaching for your phone.'],
      ],
    },
    monitoring: {
 fallbackFeatures: ['Remote Monitoring', ' Dashboard', 'Heart Rate Insights', 'SpO2 Tracking', 'ECG Support', 'Risk Assessment', 'Cloud Sync', 'Care Reports'],
      images: [monitoringHero, monitoringHeartRate, monitoringPhonePhoto, tfxVitalDashboard, tfxVitalAge, monitoringHero, monitoringPhonePhoto],
      sections: [
 ['Remote Monitoring Made Practical', 'Connected monitoring tools support continuous review, risk signals and care workflows for home and professional use.'],
 ['Clinical-Style Signals in a Simple Flow', ' readings can be translated into clear summaries for users, caregivers, wellness teams and digital platforms.'],
        ['Cloud Dashboard and App-Based Review', 'Data sync and dashboard views help make long-term monitoring easier to understand and act on.'],
        ['Early Insight for Better Care Decisions', 'Trend-based reports can support earlier awareness around sleep, heart, recovery, and risk patterns.'],
 ['Built for Connected Programs', 'Monitoring products can support SDK/API integration, custom apps and enterprise deployments.'],
        ['Always-On Wellness Visibility', 'Reliable tracking keeps important indicators accessible across daily routines and care plans.'],
      ],
    },
    wearable: {
 fallbackFeatures: ['Monitoring', 'App Support', 'Sleep Tracking', 'Fitness Tracking', 'Stress Insights', 'Long Battery Life', 'Comfortable Wear', 'Connected Reports'],
 images: [displayedImages[1] || displayedImages[0], tfxVitalDashboard, tfxVitalAge, ringWellness, bandProof, monitoringPhonePhoto, ringDailySync],
      sections: [
 ['Comfortable Connected Wellness', 'A practical wearable design supports daily tracking, app summaries and wellness routines.'],
 ['App-Based Insights', 'Connected reports help users review activity, sleep, recovery and key signals with less friction.'],
        ['Reliable Signals for Daily Use', 'Biometric monitoring helps make wellness trends easier to understand over time.'],
 ['Built for Modern Programs', 'Flexible product support helps brands, wellness teams and connected platforms launch faster.'],
        ['Designed for Everyday Routines', 'The product balances comfort, battery, and simple app review for long-term use.'],
 ['Always-On Visibility', 'Continuous tracking keeps important wellness indicators available across daily life.'],
      ],
    },
  };
  const familyProfile = familyProfiles[productFamily];
  const allProductImages = [
    ...displayedImages,
    ...(product.images || []),
    ...(product.colors || []).flatMap((color) => color.images || []),
    ...(product.variants || []).flatMap((variant) => variant.images || []),
  ].filter((image) => image && !/picsum\.photos/i.test(image));
  const uniqueProductImages = Array.from(new Set(allProductImages));
  const storyImages = uniqueProductImages.length > 0
    ? Array.from({ length: 8 }, (_, index) => uniqueProductImages[index % uniqueProductImages.length])
    : familyProfile.images;
  const isDisplayProduct = /\bdisplay\b/i.test(product.name);
  const isRingProProduct = productFamily === 'ring' && /\bring\s*pro\b/i.test(product.name);
  const isTouchRingProduct = productFamily === 'ring' && !isDisplayProduct && !isRingProProduct && /\b(touch|ip68)\b/i.test(product.name);
  const fanProfile = productFamily === 'fan' ? FAN_PROFILES[getFanProfileKey(product.name)] : null;
  const monitoringProfile = productFamily === 'monitoring' ? MONITORING_PROFILES[getMonitoringProfileKey(product.name)] : null;
  const isTfxV5Band = productFamily === 'band' && /\btfx\s*5\b|\btfx5\b|\bv5\b|\bai\s*v5\b/i.test(product.name);
  const productSeoComparison = getSeoComparisonBrief(product, productFamily, salePrice);
  const isPremiumSmartBand = productFamily === 'band' && /premium|modern\s+fitness|smart\s+band/i.test(product.name) && !isTfxV5Band;
  const productFlipkartLink = product.marketplaceLinks?.find((link) => /flipkart/i.test(link.label) || /flipkart\.com/i.test(link.url));
  const tfx5FlipkartListing = {
    product: 'AI Smart Band V5',
    code: 'SBNHJY8KNNW3KWY4',
    url: 'https://www.flipkart.com/futurex-ai-smart-band-v5-wireless-charging-screenless-men-women/p/itmd2cf34f0308e8?pid=SBNHJY8KNNW3KWY4',
  };
  const fallbackFlipkartListings: Array<{
    family: typeof productFamily;
    match: RegExp;
    product: string;
    code: string;
    url: string;
  }> = [
    {
      family: 'band',
      match: /\bv5\b|\bai\s*v5\b/i,
      ...tfx5FlipkartListing,
    },
    {
      family: 'ring',
      match: /\brq11\b.*display|display.*\brq11\b/i,
      product: 'TFX RQ11 Smart Ring Display',
      code: 'STNHJKY3URWEFBBV',
      url: 'https://www.flipkart.com/futurex-tfx-rq11-smart-ring-display/p/itm0b66b77950f87?pid=STNHJKY3URWEFBBV',
    },
    {
      family: 'ring',
      match: /\brq11\b/i,
      product: 'TFX RQ11 Smart Ring',
      code: 'STNHGXDFAFGRMNFF',
      url: 'https://www.flipkart.com/futurex-tfx-rq11-smart-ring/p/itm71a8a8da3869e?pid=STNHGXDFAFGRMNFF',
    },
    {
      family: 'ring',
      match: /\bsrq11\b/i,
      product: 'TFX SRQ11 Smart Ring',
      code: 'STNHFUJZEMQPGBBK',
      url: 'https://www.flipkart.com/futurex-tfx-srq11-smart-ring/p/itmfd3d19e1e6110?pid=STNHFUJZEMQPGBBK',
    },
    {
      family: 'ring',
      match: /\bq11\b|tfxq11/i,
      product: 'TFX Q11 Smart Ring',
      code: 'STNHHGRGPGZFJG4J',
      url: 'https://www.flipkart.com/futurex-tfxq11-smart-ring/p/itmc14673293d022?pid=STNHHGRGPGZFJG4J',
    },
    {
      family: 'ring',
      match: /\bsr8\b/i,
      product: 'TFX SR8 Smart Ring',
      code: 'STNHEWD6C7FYEBGT',
      url: 'https://www.flipkart.com/futurex-tfx-sr8-smart-ring/p/itm325cbdf5b55fa?pid=STNHEWD6C7FYEBGT',
    },
    {
      family: 'ring',
      match: /\bq10\b|tfxq10/i,
      product: 'TFX Q10 Smart Ring',
      code: 'STNHGC9MUBNWSPXX',
      url: 'https://www.flipkart.com/futurex-tfxq10-smart-ring/p/itm51deb48effded?pid=STNHGC9MUBNWSPXX',
    },
    {
      family: 'ring',
      match: /display.*heart|heart.*display|water\s*resistant/i,
      product: 'Display Smart Ring Heart Rate Monitor',
      code: 'STNHHGJPPSZURFZP',
      url: 'https://www.flipkart.com/futurex-smart-ring-display-heart-rate-monitor-water-resistant/p/itmb6e4d35a87a86?pid=STNHHGJPPSZURFZP',
    },
    {
      family: 'ring',
      match: /display|fitness\s+tracker.*ring|ring.*fitness\s+tracker/i,
      product: 'Display Smart Ring',
      code: 'STNHE5HHE3RNR7PD',
      url: 'https://www.flipkart.com/futurex-display-smart-ring/p/itmc98b789a01bad?pid=STNHE5HHE3RNR7PD',
    },
    {
      family: 'ring',
      match: /ip68|touch\s+control|\s+fitness/i,
      product: 'IP68 Waterproof Smart Ring',
      code: 'STNHFTPCFRWVPURC',
      url: 'https://www.flipkart.com/futurex-smart-ring-ip68-waterproof-fitness-touch-control/p/itm1e23c316ef1ea?pid=STNHFTPCFRWVPURC',
    },
    {
      family: 'ring',
      match: /stainless|5atm|gesture|smart\s+ring/i,
      product: 'Smart Ring Stainless Steel Build',
      code: 'STNHE5EHC9TW3QZN',
      url: 'https://www.flipkart.com/futurex-smart-ring-stainless-steel-build-5atm-waterproof-app-gesture-control/p/itme30f0c5daa85c?pid=STNHE5EHC9TW3QZN',
    },
    {
      family: 'fan',
      match: /tp\s*-?\s*02|tp02|3\s*-?\s*in\s*-?\s*1/i,
      product: 'TFX TP02 3-in-1 Tower Fan',
      code: 'FANHGFHRP7AZWWX7',
      url: 'https://www.flipkart.com/futurex-tfx-tp02-3-1-year-warranty-bldc-motor-tower-fan/p/itm40fc888dfc521?pid=FANHGFHRP7AZWWX7',
    },
    {
      family: 'fan',
      match: /q8\s*pro|q8/i,
      product: 'Q8 Pro Tower Fan',
      code: 'FANHE6R3DGEPYU6S',
      url: 'https://www.flipkart.com/futurex-q8-pro-6-months-warranty-tower-fan/p/itm0e517add10d0c?pid=FANHE6R3DGEPYU6S',
    },
    {
      family: 'fan',
      match: /tp\s*-?\s*09|tp09/i,
      product: 'TP09 Pro Tower Fan',
      code: 'FANHE8ZUUMNZEMYS',
      url: 'https://www.flipkart.com/futurex-tp09-pro-12-months-warranty-remote-controlled-tower-fan/p/itm63090878457ac?pid=FANHE8ZUUMNZEMYS',
    },
  ];
  const matchedFallbackFlipkartListing =
    fallbackFlipkartListings.find((listing) => listing.family === productFamily && listing.match.test(product.name));
  const flipkartListing = (isTfxV5Band || isMegaPriceDropBand)
    ? tfx5FlipkartListing
    : matchedFallbackFlipkartListing || (product.flipkartUrl || productFlipkartLink?.url
    ? {
        product: product.name,
        code: '',
        url: product.flipkartUrl || productFlipkartLink?.url || '',
      }
    : undefined);
  const heroSpecProfiles = {
    band: [
      ['Battery life', product.specs?.['Battery life'] || product.specs?.Battery || product.specs?.battery || 'Up to 14 Days'],
      ['Waterproof', isPremiumSmartBand ? 'IP68' : product.specs?.Waterproof || product.specs?.WaterResistant || product.specs?.['Water Resistant'] || '5ATM'],
      ['App Support', product.specs?.['App Support'] || product.specs?.Compatibility || 'Android and iOS'],
      ['Weight', product.specs?.Weight || product.weight || 'Lightweight'],
      ['Sensors', product.specs?.Sensors || product.specs?.Hardware || 'Heart rate, SpO2, motion'],
    ],
    ring: [
      ['Battery life', product.specs?.['Battery life'] || product.specs?.Battery || product.specs?.battery || '7 Days'],
      ['Waterproof', product.specs?.Waterproof || product.specs?.WaterResistant || product.specs?.['Water Resistant'] || '5ATM'],
      ['OTA Support', product.specs?.['OTA Support'] || product.specs?.OTA || 'Support OTA via BT'],
      ['Size', product.specs?.Size || product.specs?.Width || product.weight || 'Width 8.0mm, Thickness 2.2mm (Min)'],
      ['App Support', product.specs?.['App Support'] || product.specs?.Compatibility || 'Android 5.0 or above, iOS 10.0 or above'],
    ],
    fan: [
      ['Airflow', product.specs?.Airflow || product.specs?.Speed || 'Multi-speed airflow'],
      ['Modes', product.specs?.Modes || product.specs?.Mode || 'Cool and warm'],
      ['Control', product.specs?.Control || product.specs?.Connectivity || 'Remote control'],
      ['Noise', product.specs?.Noise || 'Quiet operation'],
      ['Warranty', product.warranty || product.specs?.Warranty || 'Brand warranty'],
    ],
    glasses: [
      ['Camera', product.specs?.Camera || product.specs?.['HD Camera'] || 'Built-in HD camera'],
      ['Recording', product.specs?.Recording || product.specs?.Video || 'First-person video capture'],
      ['Connectivity', product.specs?.Connectivity || product.specs?.Bluetooth || 'Bluetooth connected'],
      ['Controls', product.specs?.Controls || product.specs?.Control || 'Hands-free calling and voice assistant'],
      ['Battery', product.specs?.Battery || product.specs?.['Battery life'] || 'Long battery life'],
    ],
    monitoring: [
      ['Accuracy', product.specs?.Accuracy || product.specs?.Sensor || 'Clinical-style insights'],
      ['Connectivity', product.specs?.Connectivity || product.specs?.Bluetooth || 'Bluetooth/WiFi'],
      ['Memory', product.specs?.Memory || product.specs?.Storage || 'Long-term reports'],
      ['App Support', product.specs?.['App Support'] || product.specs?.Compatibility || 'Android and iOS'],
 ['Use Case', product.specs?.['Use Case'] || product.category || 'Monitoring'],
    ],
    wearable: [
      ['Battery life', product.specs?.['Battery life'] || product.specs?.Battery || product.specs?.battery || 'Long battery life'],
      ['App Support', product.specs?.['App Support'] || product.specs?.Compatibility || 'Android and iOS'],
 ['Sensors', product.specs?.Sensors || product.specs?.Hardware || 'Tracking'],
      ['Weight', product.specs?.Weight || product.weight || 'Comfortable wear'],
      ['Warranty', product.warranty || product.specs?.Warranty || 'Brand warranty'],
    ],
  } as const;
  const heroSpecs = heroSpecProfiles[productFamily].filter(([, value]) => String(value || '').trim().length > 0);
  const rawFeatureList = (product.features?.length
    ? product.features.map(cleanFeatureText).filter(Boolean)
    : familyProfile.fallbackFeatures
  ).filter((feature) => isDisplayProduct || !/\bdisplay\b/i.test(feature));
  const bandDescription = isTfxV5Band
    ? TFX5_SMART_BAND_DESCRIPTION
    : isPremiumSmartBand
      ? TFX_SMART_BAND_DESCRIPTION
      : '';
  const ringDescription = productFamily === 'ring'
    ? isDisplayProduct
      ? TFX_DISPLAY_PRO_RING_DESCRIPTION
      : isTouchRingProduct
        ? TFX_TOUCH_RING_DESCRIPTION
        : TFX_RING_PRO_DESCRIPTION
    : '';
  const featureList = isTfxV5Band
    ? TFX5_BAND_FEATURES
    : isPremiumSmartBand
      ? TFX_SMART_BAND_FEATURES
      : ringDescription
        ? isDisplayProduct
          ? TFX_DISPLAY_PRO_RING_FEATURES
          : isTouchRingProduct
            ? TFX_TOUCH_RING_FEATURES
            : TFX_RING_PRO_FEATURES
      : fanProfile
        ? fanProfile.features
      : monitoringProfile
        ? monitoringProfile.features
      : rawFeatureList;
  const topFeatureText = featureList.slice(0, 6).map(cleanFeatureText).filter(Boolean).join(', ');
  const batterySpecEntries = specEntries.filter(([key, value]) => {
    const haystack = `${key} ${value}`.toLowerCase();
    return /(battery|charging|charge|recharge|power|mah|watt|voltage|standby|usage|runtime|day)/.test(haystack);
  });
  const batteryFeatureEntries = featureList.filter((feature) => /(battery|charging|charge|power|day)/i.test(feature));
  const fallbackBatteryEntry: [string, string] = [
    productFamily === 'fan' ? 'Power' : 'Battery',
    productFamily === 'fan'
      ? 'Power details are listed with the product specifications and package information.'
      : productFamily === 'ring'
        ? 'Rechargeable battery designed for everyday smart ring use.'
        : productFamily === 'band'
? 'Rechargeable battery designed for daily fitness tracking.'
          : productFamily === 'glasses'
            ? 'Rechargeable battery for Bluetooth calling, music, and smart eyewear functions.'
            : 'Rechargeable battery designed for regular everyday use.',
  ];
  const mobileBatterySpecEntries = batterySpecEntries.length > 0 ? batterySpecEntries : [fallbackBatteryEntry];
  const selectedColorName = selectedColor?.name || product.colors?.[0]?.name || '';
  const selectedSizeLabel = selectedSize || availableSizes[0]?.size || '';
  const availableColorNames = uniqueCleanValues([
    ...(product.colors || []).map((color) => color.name),
    ...(product.variants || []).map((variant) => variant.colorName || variant.color),
  ]);
  const availableRingSizeLabels = sortRingSizeLabels(
    uniqueCleanValues((product.variants || []).flatMap((variant) => (variant.sizes || []).map((sizeRow) => sizeRow.size)))
  );
  const ringColorText = ringColorSizeCatalog
    ? Object.keys(ringColorSizeCatalog).map((color) => RING_CATALOG_COLOR_LABELS[color] || formatSpecLabel(color)).join(', ')
    : availableColorNames.length > 0
      ? availableColorNames.join(', ')
      : 'Black, Silver, Rose Gold';
  const ringSizeText = ringColorSizeCatalog
    ? formatRingColorSizeCatalog(ringColorSizeCatalog)
    : availableRingSizeLabels.length > 0
      ? availableRingSizeLabels.join(', ')
      : STANDARD_RING_SIZE_OPTIONS.join(', ');
  const styleSpecEntries: Array<[string, string]> = [
    ...(productFamily === 'ring' ? [['Shape', 'Round'] as [string, string]] : []),
    ['Style Name', 'Modern'],
    ...(productFamily === 'ring' ? [['Available Colors', ringColorText] as [string, string]] : []),
    ...(productFamily === 'ring' ? [['Available Sizes', ringSizeText] as [string, string]] : []),
    ...(selectedColorName
      ? [['Colour', `${selectedColorName}${selectedSizeLabel ? ` - Size ${selectedSizeLabel}` : ''}`] as [string, string]]
      : []),
    ...(selectedColorName && productFamily === 'band'
      ? [['Band Color', selectedColorName] as [string, string]]
      : []),
    ...(selectedColorName && productFamily === 'ring'
      ? [['Ring Color', selectedColorName] as [string, string]]
      : []),
  ];
  const existingSpecKeys = new Set(specEntries.map(([key]) => key.trim().toLowerCase()));
  const productInformationSpecEntries = [
    ...styleSpecEntries.filter(([key]) => !existingSpecKeys.has(key.trim().toLowerCase())),
    ...specEntries,
  ];
  const shouldLimitSpecs = productFamily !== 'ring' && !showAllSpecs;
  const displayedSpecEntries = shouldLimitSpecs ? productInformationSpecEntries.slice(0, 12) : productInformationSpecEntries;
  const specGroups = buildSpecGroups(displayedSpecEntries);
  const whyBuyCopy = isSmartGlassesProduct
    ? `${product.name} is designed for hands-free capture, Bluetooth calling, music, voice assistant support, and everyday smart eyewear convenience in one modern frame.`
    : isTfxV5Band
      ? TFX5_SMART_BAND_DESCRIPTION
      : isPremiumSmartBand
        ? TFX_SMART_BAND_DESCRIPTION
      : ringDescription
        ? ringDescription
      : fanProfile
        ? fanProfile.description
      : monitoringProfile
        ? monitoringProfile.description
      : `${product.name} is a practical choice if you want reliable technology, useful everyday performance, and a premium TheFutureX experience in one product. It focuses on the things customers actually use most, including ${topFeatureText || 'smart performance, daily comfort, easy setup, and dependable support'}.`;
  const ringOverviewSections = [
    {
      title: 'TFX Ring Pro',
      copy:
        TFX_RING_PRO_DESCRIPTION,
      image: ringProCharging,
    },
    {
      title: 'Water Resistant Design',
      copy:
        'IP68 water-resistant construction supports daily wear, workouts, travel, and wellness tracking through active routines.',
      image: ringOverviewWaterproof,
    },
    {
      title: 'App-Connected Wellness',
      copy:
        'Connect to a compatible mobile application for viewing activity, wellness data, sleep quality patterns, heart rate trends, and daily fitness progress.',
      image: ringOverviewColors,
    },
    {
      title: 'Built for Active Lifestyles',
      copy:
        'Designed for active lifestyles, wellness monitoring, fitness enthusiasts, daily activity tracking, and sleep tracking.',
      image: ringProCharging,
    },
  ];
  const displayRingOverviewSections = [
    {
      title: 'TFX Display Pro Smart Ring',
      copy:
        TFX_DISPLAY_PRO_RING_DESCRIPTION,
      video: ringTouchProOverviewVideo,
      cleanBanner: true,
    },
    {
      title: 'Built-In Display',
      copy:
 'An integrated display gives quick access to supported and activity information directly from the ring.',
      image: displayRingOverviewHand,
    },
    {
 title: 'Activity and Tracking',
      copy:
        'Monitor daily movement, activity levels, fitness progress, supported wellness metrics, sleep duration, and sleep patterns.',
      image: tfxRingBannerLastingPower,
      cleanBanner: true,
    },
    {
      title: 'App Sync and Rechargeable Battery',
      copy:
 'Sync and activity data with compatible smartphones and use the rechargeable battery for everyday routines.',
      image: displayRingOverviewGoldBanner,
    },
    {
      title: 'Everyday Wear Comfort',
      copy:
        'A lightweight ring design supports work, exercise, travel, daily wellness monitoring, and everyday wearable technology.',
      image: tfxRingBannerStyleIntelligence,
      cleanBanner: true,
    },
  ];
  const touchRingOverviewSections = [];
  const tfxV5OverviewSections = [
    {
      title: 'TFX Vital App Experience',
      copy:
        'The TFX Vital app brings exercise tracking, recovery insights, and AI health assistance together for the TFX5 AI Smart Band.',
      image: tfxVitalAppOverviewBanner,
      overlayText: 'One App. Total Wellness.',
    },
    {
      title: 'TFX5 AI Smart Band',
      copy:
        TFX5_SMART_BAND_DESCRIPTION,
      image: tfxV5BannerOne,
    },
    {
 title: 'Fitness and App Connectivity',
      copy:
        'Track heart rate patterns, blood oxygen SpO2, sleep duration, activity, steps, and estimated calories while syncing data with compatible smartphones through the companion application.',
      image: tfxV5BannerTwo,
    },
  ];
  const premiumBandOverviewSections = [
    {
      title: 'TFX Smart Band',
      copy:
        TFX_SMART_BAND_DESCRIPTION,
      image: premiumBandModelBanner,
    },
    {
      title: 'Daily Activity and Wellness Tracking',
      copy:
        'Monitor daily movement including steps, walking activity, general fitness progress, sleep patterns, and heart rate trends in a slim band built for extended daily wear.',
      image: premiumBandFashionTravel,
    },
    {
      title: 'Bluetooth App Support',
      copy:
        'Sync data with compatible mobile devices through the companion application and review activity, wellness, and routine insights from one convenient connected flow.',
      image: premiumBandWaterproofPool,
    },
    {
      title: 'Everyday Wearability',
      copy:
        'A modern minimalist appearance makes the band suitable for work, exercise, travel, students, professionals, and everyday lifestyle monitoring.',
      image: premiumBandLifestyleHiking,
    },
  ];
  const overviewSections: Array<{ title: string; copy: string; image?: string; video?: string; cleanBanner?: boolean; overlayText?: string }> = [
    {
      title: 'Product Overview',
      copy:
        bandDescription ||
        ringDescription ||
        monitoringProfile?.description ||
        (isRingOverview
          ? `${product.name} brings smart wellness tracking into a compact ring made for daily wear.`
          : shortDescription || `${product.name} is designed for proactive wellness management with continuous biometric insights, everyday comfort, and connected app support.`),
    },
    ...(isTfxV5Band
      ? tfxV5OverviewSections
      : isPremiumSmartBand
        ? premiumBandOverviewSections
      : productFamily === 'ring'
        ? isDisplayProduct
          ? displayRingOverviewSections
          : isTouchRingProduct
            ? touchRingOverviewSections
          : ringOverviewSections
        : familyProfile.sections.map(([title, copy], index) => ({
            title,
            copy,
            image: storyImages[index + 1] || storyImages[0],
          }))),
  ];
  const overviewMediaSections = [
    ...(productVideoUrl
      ? [{ title: `${product.name} video`, copy: '', video: productVideoUrl, cleanBanner: true }]
      : []),
    ...overviewSections.slice(1),
  ];
  const mobileProductBannerSections = overviewMediaSections.filter((section) => section.image || section.video);
  const familyProductFaqs: Record<string, Array<{ q: string; a: string }>> = {
    band: [
      { q: `What does ${product.name} track?`, a: `${product.name} supports fitness and wellness tracking such as activity, sleep, heart rate and connected app insights depending on the model.` },
      { q: `Does ${product.name} support SpO2 monitoring?`, a: 'Selected TFX smart band models support blood oxygen (SpO2) monitoring. Check the product specifications for the exact model features.' },
      { q: 'Can this smart band connect to a smartphone?', a: 'Yes. Compatible TFX smart bands connect to smartphones using Bluetooth and app integration for wellness summaries and trend review.' },
      { q: 'Is this smart band suitable for daily wear?', a: 'Yes. TFX smart bands are designed with lightweight everyday wearability for work, workouts, sleep tracking and daily activities.' },
    ],
    ring: [
 { q: `What can ${product.name} track?`, a: `${product.name} is designed for compact wellness tracking such as activity, sleep, heart rate trends and app-connected insights depending on the model.` },
      { q: 'Does this smart ring connect to an app?', a: 'Yes. TFX smart rings connect with compatible smartphones through app-based sync for wellness, activity and sleep insights.' },
      { q: 'Is this smart ring suitable for daily wear?', a: 'Yes. TFX smart rings use a compact ring form factor designed for daily wellness monitoring, activity tracking and overnight sleep tracking.' },
      { q: 'How is a smart ring different from a smart band?', a: 'A smart ring offers discreet ring-style tracking, while a smart band is worn on the wrist and may suit users who prefer wrist-based fitness tracking.' },
    ],
    fan: [
      { q: 'What is a bladeless fan?', a: 'A bladeless fan uses airflow amplification technology to circulate air without exposed rotating blades.' },
      { q: 'Can this fan be used in a bedroom?', a: 'Yes. Many TFX bladeless fans are suitable for bedrooms because they offer smooth airflow, modern styling and selected quiet operating modes.' },
      { q: 'Can hot and cool fan models be used year-round?', a: 'Selected TFX hot and cool models provide cooling airflow and heating functionality for year-round indoor comfort.' },
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
      { q: 'Are smart glasses suitable for everyday use?', a: 'TFX smart glasses are designed as modern eyewear with connected features for daily convenience, travel and hands-free use.' },
    ],
    wearable: [
      { q: `What is ${product.name} used for?`, a: `${product.name} is designed for everyday connected wellness, smart convenience and practical daily use depending on its features.` },
      { q: 'Does this product support app connectivity?', a: 'Compatible TFX products support app or Bluetooth connectivity for setup, summaries or connected features depending on the model.' },
    ],
  };
  const productFaqs = [
    ...(familyProductFaqs[productFamily] || familyProductFaqs.wearable),
    { q: 'What is the delivery timeline?', a: 'Orders are typically delivered within 3 to 7 business days.' },
    { q: 'Is there a return or refund policy?', a: 'TheFutureX follows a no-return, no-refund policy. If the product has a verified manufacturing defect at delivery, you can request an exchange within 7 days.' },
    { q: 'How do I claim warranty?', a: 'Register the product from the warranty registration page, then share feedback with your order ID, product name, issue description, and photo/video proof.' },
  ];
  const fanMarketplaceDescription =
    fanProfile?.description ||
    shortDescription ||
    `${product.name} is a modern tower fan designed for year-round comfort, smooth airflow, quiet indoor use, and convenient remote operation.`;
  const offerLine = (
    <RazorpayEmiStrip price={displayedPrice || salePrice} onOpen={() => setShowEmiModal(true)} />
  );
  const paymentOfferBlock = product ? (
    <ProductPaymentOfferOptions product={product} price={displayedPrice || salePrice} />
  ) : null;
  const darkPaymentOfferBlock = product ? (
    <ProductPaymentOfferOptions product={product} price={displayedPrice || salePrice} dark />
  ) : null;
  const scrollToDetailSection = (key: ProductDetailTabKey) => {
    setActiveDetailTab(key);
    window.setTimeout(() => {
      const element = document.getElementById(key);
      if (!element) return;
      const headerHeight = Number.parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--tfx-sticky-header-height'),
        10
      ) || 80;
      const offset = headerHeight + detailTabsHeight + 12;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }, 0);
  };

  return (
    <div className="product-detail-page min-h-screen bg-white text-slate-950">
      <style>{`
        @keyframes productPanelIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes productShimmer {
          from { transform: translateX(-120%) skewX(-12deg); }
          to { transform: translateX(220%) skewX(-12deg); }
        }
        @keyframes productBadgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .product-panel-in {
          animation: productPanelIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .product-reveal {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.75s cubic-bezier(0.22, 1, 0.36, 1), transform 0.75s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity, transform;
        }
        .product-reveal-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .product-cta-shine {
          position: relative;
          overflow: hidden;
        }
        .product-cta-shine::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 40%;
          height: 100%;
          background: linear-gradient(115deg, transparent, rgba(255,255,255,0.35), transparent);
          transform: translateX(-120%) skewX(-12deg);
          pointer-events: none;
        }
        .product-cta-shine:hover::after {
          animation: productShimmer 1.1s ease;
        }
        .product-offer-badge {
          animation: productBadgePulse 2.6s ease-in-out infinite;
        }
        .product-banner-media {
          transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .product-banner-group:hover .product-banner-media {
          transform: scale(1.045);
        }
        @media (prefers-reduced-motion: reduce) {
          .product-panel-in,
          .product-reveal,
          .product-cta-shine::after,
          .product-offer-badge,
          .product-banner-media {
            animation: none !important;
            transition: none !important;
            transform: none !important;
          }
          .product-reveal { opacity: 1; }
        }
      `}</style>
      {showEmiModal && (
        <RazorpayEmiModal
          price={displayedPrice || salePrice}
          firstName={emiFirstName}
          lastName={emiLastName}
          phone={emiPhone}
          onFirstNameChange={setEmiFirstName}
          onLastNameChange={setEmiLastName}
          onPhoneChange={setEmiPhone}
          onClose={() => setShowEmiModal(false)}
          onContinue={() => {
            setShowEmiModal(false);
            handleBuyNowClick({ preferredPayment: 'emi' });
          }}
        />
      )}
      {useMarketplaceArrangement && (
        <>
          <div className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs font-bold text-slate-600 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center gap-3">
                <span>Ship to India</span>
                <span className="hidden h-4 w-px bg-slate-200 sm:block" />
                <span>Buyer protection</span>
                <span>30-day support</span>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/track-order" className="hover:text-slate-950">Track order</Link>
                <Link to="/cart" className="hover:text-slate-950">Cart</Link>
              </div>
            </div>
          </div>
        </>
      )}
      <section className="border-b border-slate-200 bg-[#f5fbfb]">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 sm:text-sm">
            <Link to="/" className="hover:text-slate-950">Home</Link>
            <span>/</span>
            <Link to={'/shop/' + product.category?.toLowerCase()} className="capitalize hover:text-slate-950">{product.category}</Link>
            <span>/</span>
            <span className="max-w-[260px] truncate text-slate-900">{product.name}</span>
          </nav>
        </div>
      </section>

      <section className="overflow-hidden bg-white px-3 py-6 sm:px-6 lg:overflow-visible lg:px-8 lg:py-14">
        <div
          className={`mx-auto grid w-full max-w-[calc(100vw-1.5rem)] min-w-0 gap-7 sm:max-w-2xl lg:max-w-7xl lg:items-start ${
            useMarketplaceArrangement
              ? 'lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] lg:gap-x-16 lg:gap-y-6'
              : 'lg:grid-cols-[minmax(0,1.14fr)_minmax(0,0.86fr)] lg:gap-14'
          }`}
        >
          <div ref={productGalleryRef} className="order-1 min-w-0 max-w-full scroll-mt-28 space-y-4 overflow-hidden sm:space-y-6 lg:order-none lg:row-span-2 lg:overflow-visible">
            <ProductImageCarousel
              images={displayedImages}
              videoUrl={productVideoUrl}
              alt={product.name}
              selectedIndex={selectedImageIndex}
              onSelectIndex={setSelectedImageIndex}
              bannerMode
              videoFit={productGalleryVideoFit}
            />
            {displayedMediaCount > 1 && (
              <div className="mx-auto flex w-full max-w-full items-center gap-2 bg-white py-2">
                <div ref={productThumbnailStripRef} className="flex min-w-0 flex-1 snap-x justify-start gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:justify-center sm:gap-3 [&::-webkit-scrollbar]:hidden">
                  {displayedImages.map((imgUrl, imgIdx) => (
                  <button
                    key={imgUrl + imgIdx}
                    type="button"
                    onClick={() => setSelectedImageIndex(imgIdx)}
                    className={`h-14 w-14 shrink-0 snap-start overflow-hidden bg-white p-1.5 transition duration-200 min-[360px]:h-16 min-[360px]:w-16 sm:h-20 sm:w-20 ${
                      selectedImageIndex === imgIdx ? 'opacity-100 ring-2 ring-slate-950/60' : 'opacity-55 hover:opacity-90'
                    }`}
                  >
                    <img src={imgUrl} alt={`${product.name} ${imgIdx + 1}`} className="h-full w-full object-contain object-center transition duration-200 hover:scale-105" loading="lazy" decoding="async" />
                  </button>
                ))}
                  {productVideoUrl && (
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex(productVideoIndex)}
                    className={`relative h-14 w-14 shrink-0 snap-start overflow-hidden bg-white p-0 transition duration-200 min-[360px]:h-16 min-[360px]:w-16 sm:h-20 sm:w-20 ${
                      selectedImageIndex === productVideoIndex ? 'opacity-100 ring-2 ring-slate-950/60' : 'opacity-75 hover:opacity-100'
                    }`}
                    aria-label={`Play ${product.name} video`}
                  >
                    <video
                      src={productVideoUrl}
                      className="h-full w-full object-cover object-bottom"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-black/20">
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-white/90 text-slate-950 shadow-lg min-[360px]:h-7 min-[360px]:w-7 sm:h-8 sm:w-8">
                        <svg className="ml-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </span>
                  </button>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Show more product thumbnails"
                  onClick={() => productThumbnailStripRef.current?.scrollBy({ left: 360, behavior: 'smooth' })}
                  className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-950 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/20 lg:flex"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            )}
          </div>

          <div className="product-panel-in order-3 min-w-0 text-center lg:order-none lg:text-left">
            <div className="hidden">
              {product.colors && product.colors.length > 0 && (
                <div className="rounded-xl bg-[#f5fbfb] p-3 text-left sm:p-4">
                  <p className="mb-3 text-xs font-black text-slate-950 sm:text-sm">Select Color{selectedColor?.name ? ` - ${selectedColor.name}` : ''}</p>
                  <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {product.colors.map((color) => {
                      const isSelected = normalizeOptionKey(selectedColor?.name) === normalizeOptionKey(color.name);
                      const colorStock = getColorAvailableStock(color);
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => handleSelectColor(color)}
                          disabled={colorStock <= 0}
                          className={`min-w-[112px] shrink-0 snap-start rounded-lg px-2.5 py-2 text-left transition sm:min-w-[132px] sm:px-3 ${
                            isSelected ? 'bg-slate-50 shadow-[0_4px_14px_rgba(15,23,42,0.08)] ring-2 ring-slate-950/25' : 'bg-white ring-1 ring-slate-100 hover:bg-slate-50 hover:ring-slate-300'
                          } ${colorStock <= 0 ? 'cursor-not-allowed opacity-40' : ''}`}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-slate-300" style={{ backgroundColor: color.hex }} />
                            <span className="min-w-0 truncate text-[11px] font-bold text-slate-950 sm:text-sm">{color.name}</span>
                          </span>
                          {colorStock <= 0 && <span className="mt-1 block text-[10px] text-red-600 sm:text-xs">Out of stock</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {requiresRingSize && (
                <div className="rounded-xl bg-[#f5fbfb] p-3 text-left sm:p-4">
                  <p className="mb-3 text-xs font-black text-slate-950 sm:text-sm">Select Ring Size{selectedSize ? ` - ${selectedSize}` : ' *'}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {availableSizes.map((sizeRow) => {
                      const sizeLabel = String(sizeRow.size).trim();
                      const outOfStock = sizeRow.stock <= 0;
                      return (
                        <button
                          key={sizeLabel}
                          type="button"
                          onClick={() => {
                            if (outOfStock) return;
                            setSelectedSize(sizeLabel);
                            setSizeError('');
                          }}
                          disabled={outOfStock}
                          className={`min-w-0 rounded-lg px-2 py-2 text-center text-[10px] font-black transition sm:px-3 sm:text-sm ${
                            selectedSize === sizeLabel ? 'bg-slate-950 text-white ring-0' : 'bg-white text-slate-800 ring-1 ring-slate-200 hover:ring-slate-400'
                          } ${outOfStock ? 'cursor-not-allowed opacity-40' : ''}`}
                        >
                          <span className="block">{sizeLabel}</span>
                          {outOfStock && <span className="mt-0.5 block text-[10px] font-bold normal-case text-red-600">Out of stock</span>}
                        </button>
                      );
                    })}
                  </div>
                  {sizeError && <p className="mt-2 text-xs font-semibold text-red-600">{sizeError}</p>}
                </div>
              )}
            </div>
            {(isFeaturedBandProduct || isMegaPriceDropBand) && (
              <div className="product-offer-badge mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#a9812f]/30 bg-[#fbf6ea] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a6a20] shadow-[0_1px_6px_rgba(169,129,47,0.18)] sm:px-4 sm:text-xs">
                <span className="h-1 w-1 rounded-full bg-[#a9812f]" />
                {isMegaPriceDropBand ? 'Mega Price Drop' : 'Limited Time Offer'}
              </div>
            )}
            <h1 className={`${isFeaturedBandProduct || isMegaPriceDropBand ? 'mt-3' : 'mt-4'} product-detail-title max-w-[560px] text-left text-[1.3rem] font-semibold leading-[1.22] tracking-[-0.01em] text-slate-950 sm:text-[1.5rem] md:text-[1.65rem] lg:text-[1.78rem] xl:text-[1.9rem] 2xl:text-[2.05rem]`}>
              {product.name}
            </h1>
            <p className="mt-2.5 max-w-none text-left text-xs font-medium leading-5 text-slate-600 sm:text-sm sm:leading-6">
              {product.features?.[0] ? cleanFeatureText(product.features[0]) : 'Premium smart technology with everyday TheFutureX support'}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-start gap-3">
              {product.rating != null && (
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(15,23,42,0.1)]">
                  <span className="text-[#a9812f] tracking-tight">{'\u2605'.repeat(Math.round(Number(product.rating || 0)))}</span>
                  <span>{Number(product.rating || 0).toFixed(1)}</span>
                  <span className="text-xs font-medium text-slate-400">({product.reviewCount || product.reviews?.length || 0} reviews)</span>
                </div>
              )}
              <a
                href="#reviews"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToDetailSection('reviews');
                }}
                className="product-detail-review-link inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold uppercase tracking-[0.06em] text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-slate-950 hover:text-slate-950 hover:shadow-[0_6px_16px_rgba(15,23,42,0.1)]"
              >
                Write Review
              </a>
            </div>

          </div>

          {useMarketplaceArrangement && (
            <aside className="product-panel-in order-2 w-full min-w-0 max-w-full overflow-hidden bg-white text-left lg:col-start-2 lg:row-start-2 lg:order-none">
              <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-[#f8fbfb] to-white p-4 shadow-[0_2px_14px_rgba(15,23,42,0.05)] transition-shadow duration-300 hover:shadow-[0_6px_22px_rgba(15,23,42,0.08)] sm:p-5">
                <div className="flex flex-wrap items-end gap-2.5">
                  {couponRate > 0 ? (
                    <>
                      <span className="text-sm font-medium text-slate-400 line-through">{formatInrAmount(salePrice)}</span>
                      <span className="rounded-full border border-[#a9812f]/25 bg-[#fbf6ea] px-2.5 py-1 text-xs font-semibold text-[#8a6a20]">{couponRateLabel} off</span>
                    </>
                  ) : mrp > salePrice && (
                    <>
                      <span className="text-sm font-medium text-slate-400 line-through">&#8377;{mrp.toLocaleString('en-IN')}</span>
                      {!hidePercentageOffer && (
                        <span className="rounded-full border border-[#a9812f]/25 bg-[#fbf6ea] px-2.5 py-1 text-xs font-semibold text-[#8a6a20]">{percent}% off</span>
                      )}
                    </>
                  )}
                  <span className={`font-display text-2xl font-semibold tracking-tight sm:text-3xl ${couponRate > 0 ? 'text-emerald-700' : 'text-slate-950'}`}>{formatInrAmount(displayedPrice)}</span>
                </div>

                {offerLine}
                {paymentOfferBlock}

                <div className="mt-4 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    {canAdd && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    )}
                    <span className={`relative inline-flex h-2 w-2 rounded-full ${canAdd ? 'bg-emerald-600' : 'bg-red-500'}`} />
                  </span>
                  <p className={`text-xs font-semibold uppercase tracking-[0.08em] ${canAdd ? 'text-emerald-700' : 'text-red-600'}`}>
                    {canAdd ? 'In stock' : 'Out of stock'}
                  </p>
                </div>
              </div>

              {product.colors && product.colors.length > 0 && (
                <div className="mt-5 min-w-0 max-w-full">
                  <p className="text-sm font-medium text-slate-500">
                    Color <span className="mx-1 text-slate-300">-</span>
                    <span className="font-semibold text-slate-950">{selectedColor?.name || product.colors[0]?.name}</span>
                  </p>
                  <div className="mt-3 flex max-w-full snap-x gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {product.colors.map((color) => {
                      const isSelected = normalizeOptionKey(selectedColor?.name) === normalizeOptionKey(color.name);
                      const colorStock = getColorAvailableStock(color);
                      const colorImage = color.images?.[0] || displayedImages[0] || '';
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => handleSelectColor(color)}
                          disabled={colorStock <= 0}
                          className={`group relative h-[4.5rem] w-[4.5rem] shrink-0 snap-start overflow-hidden rounded-2xl border-2 bg-gradient-to-b from-white to-slate-50 p-1.5 transition-all duration-300 ease-out sm:h-[5.5rem] sm:w-[5.5rem] ${
                            isSelected
                              ? 'scale-[1.04] border-[#a9812f] shadow-[0_8px_20px_rgba(169,129,47,0.28)] ring-4 ring-[#a9812f]/15'
                              : 'border-slate-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-[0_6px_16px_rgba(15,23,42,0.1)]'
                          } ${colorStock <= 0 ? 'cursor-not-allowed opacity-40' : ''}`}
                          aria-label={`Select ${color.name}`}
                        >
                          {colorImage ? (
                            <img
                              src={colorImage}
                              alt={color.name}
                              className="h-full w-full object-contain object-center transition-transform duration-300 ease-out group-hover:scale-110"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <span className="grid h-full w-full place-items-center">
                              <span className="h-8 w-8 rounded-full ring-1 ring-slate-300" style={{ backgroundColor: color.hex }} />
                            </span>
                          )}
                          {isSelected && (
                            <span className="product-detail-color-selected-check absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#a9812f] text-white shadow-[0_2px_6px_rgba(169,129,47,0.5)]">
                              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                              </svg>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {requiresRingSize && (
                <div className="mt-5 min-w-0 max-w-full rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-sm font-medium text-slate-500">
                    Ring Size
                    <span className="mx-1 text-slate-300">-</span>
                    <span className="font-semibold text-slate-950">
                      {selectedSize || `Select for ${selectedColor?.name || product.colors?.[0]?.name || 'this color'}`}
                    </span>
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 min-[420px]:grid-cols-4 sm:grid-cols-7">
                    {availableSizes.map((sizeRow) => {
                      const sizeLabel = String(sizeRow.size).trim();
                      const isSelected = selectedSize === sizeLabel;
                      const outOfStock = sizeRow.stock <= 0;
                      return (
                        <button
                          key={sizeLabel}
                          type="button"
                          onClick={() => {
                            if (outOfStock) return;
                            setSelectedSize(sizeLabel);
                            setSizeError('');
                          }}
                          disabled={outOfStock}
                          aria-label={`Select ring size ${sizeLabel}`}
                          className={`flex min-h-12 min-w-0 flex-col items-center justify-center rounded-lg border px-2 py-2 text-center text-sm font-semibold leading-tight transition-all duration-300 ease-out ${isSelected ? 'product-detail-action-button' : ''} ${
                            isSelected
                              ? 'scale-[1.03] border-slate-950 bg-slate-950 text-white shadow-[0_4px_12px_rgba(15,23,42,0.18)]'
                              : 'border-slate-200 bg-white text-slate-900 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50'
                          } ${outOfStock ? 'cursor-not-allowed opacity-40' : ''}`}
                        >
                          <span className="block">{sizeLabel}</span>
                          {outOfStock && <span className="mt-0.5 block text-[9px] font-semibold normal-case text-red-500 sm:text-[10px]">Out of stock</span>}
                        </button>
                      );
                    })}
                  </div>
                  {sizeError && <p className="mt-2 text-xs font-semibold text-red-600">{sizeError}</p>}
                </div>
              )}

              <div ref={mobileCtaAnchorRef} className="mt-5 grid min-w-0 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleAddButtonClick}
                  className={`product-detail-action-button product-cta-shine flex min-h-[3.25rem] w-full min-w-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.04em] shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_10px_24px_rgba(15,23,42,0.22)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.28)] active:translate-y-0 active:scale-[0.98] ${
                    addedToCart
                      ? 'bg-gradient-to-b from-emerald-600 to-emerald-700 text-white'
                      : 'bg-gradient-to-b from-slate-900 to-slate-950 text-white hover:from-slate-800 hover:to-slate-900'
                  }`}
                >
                  {addedToCart ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                    </svg>
                  ) : canAdd ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="19" cy="21" r="1" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 7H6" />
                    </svg>
                  ) : null}
                  {notifySubmitting ? 'Saving...' : addedToCart ? 'Added to Cart' : canAdd ? 'Add to cart' : 'Notify me'}
                </button>
                {canAdd && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsBuyNowPressed(true);
                      window.setTimeout(() => handleBuyNowClick(), 140);
                    }}
                    className={`flex min-h-[3.25rem] w-full min-w-0 items-center justify-center rounded-xl border-2 px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.04em] shadow-[0_1px_0_rgba(255,255,255,0.15)_inset] transition-all duration-300 ease-out active:translate-y-0 active:scale-[0.98] ${
                      isBuyNowPressed
                        ? 'product-detail-buy-now-active border-[#a9812f] bg-gradient-to-b from-[#c79a3d] to-[#a9812f] text-white shadow-[0_10px_24px_rgba(169,129,47,0.32)]'
                        : 'border-slate-950 bg-white text-slate-950 hover:border-[#a9812f] hover:text-[#8a6a20]'
                    }`}
                  >
                    Buy Now
                  </button>
                )}
              </div>

              {canAdd && (
                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  className="mt-2.5 flex w-full items-center justify-center text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 underline-offset-4 transition hover:text-slate-950 hover:underline"
                >
                  View Cart
                </button>
              )}

              <ProductCheckoutTrustBlock product={product} productFamily={productFamily} />

              {flipkartListing && (
                <a
                  href={flipkartListing.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#2874f0]/25 bg-[#f3f8ff] p-3 transition hover:border-[#2874f0]"
                >
                  <span className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-yellow-500">Also on Flipkart</span>
                    <span className="mt-1 block truncate text-sm font-bold text-slate-950">{flipkartListing.product}</span>
                  </span>
                  <span className="shrink-0 rounded-lg bg-[#ffe500] px-3 py-2 text-[11px] font-black text-slate-950">View</span>
                </a>
              )}
            </aside>
          )}
        </div>
      </section>

      <div ref={detailTabsAnchorRef} />
      {detailTabsFixed && <div aria-hidden="true" style={{ height: detailTabsHeight }} />}
      <nav
        ref={detailTabsBarRef as React.RefObject<HTMLElement>}
        className={`product-detail-sticky-tabs border-y border-slate-200 bg-[#faf8f4]/95 shadow-[0_4px_16px_rgba(15,23,42,0.05)] backdrop-blur ${
          detailTabsFixed ? 'fixed inset-x-0 z-[70]' : 'sticky z-[60]'
        }`}
      >
        <div className="mx-auto flex max-w-7xl snap-x items-center justify-start overflow-x-auto px-3 text-center [-ms-overflow-style:none] [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden">
          {mobileDetailTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                if (tab.key === 'comparison' || tab.key === 'reviews') {
                  scrollToDetailSection(tab.key);
                  return;
                }
                setActiveDetailTab(tab.key);
              }}
              className={`product-detail-sticky-tab snap-center whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold tracking-wide transition ${
                activeDetailTab === tab.key ? 'is-active border-[#a9812f]' : 'border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="mx-auto hidden max-w-7xl snap-x items-center justify-center overflow-x-auto px-3 text-center [-ms-overflow-style:none] [scrollbar-width:none] sm:flex sm:px-6 [&::-webkit-scrollbar]:hidden">
          {detailTabs.map((tab) => (
            <a
              key={tab.key}
              href={`#${tab.key}`}
              onClick={(event) => {
                event.preventDefault();
                scrollToDetailSection(tab.key);
              }}
              className={`product-detail-sticky-tab snap-center whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold tracking-wide transition sm:px-5 sm:text-base ${
                activeDetailTab === tab.key ? 'is-active border-[#a9812f]' : 'border-transparent'
              }`}
            >
              {getDetailTabLabel(tab)}
            </a>
          ))}
        </div>
      </nav>

      {activeDetailTab === 'description' && mobileProductBannerSections.length > 0 && (
        <section className="bg-white px-4 py-4 sm:hidden">
          <div className="space-y-3">
            {(showAllMobileOverview ? mobileProductBannerSections : mobileProductBannerSections.slice(0, 3)).map((section, index) => (
              <RevealOnScroll key={section.title} className="product-banner-group mx-auto w-full max-w-[1200px] overflow-hidden rounded-xl bg-[#f8fbfb] shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
                {section.video ? (
                  <div className="aspect-[4/3] w-full overflow-hidden bg-slate-950">
                    <ProductOverviewVideo
                      src={section.video}
                      title={section.title}
                      className="product-banner-media h-full w-full border-0 object-contain object-center"
                    />
                  </div>
                ) : section.image && (
                  <div className="relative overflow-hidden">
                    <img
                      src={section.image}
                      alt={section.title}
                      className="product-banner-media block h-auto w-full object-contain object-center"
                      loading="lazy"
                      fetchPriority="low"
                      decoding="async"
                    />
                    {section.overlayText && (
                      <div className="pointer-events-none absolute left-4 top-4 max-w-[70%] text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.72)]">
                        <h2 className="font-display text-2xl font-black leading-tight">
                          {section.overlayText}
                        </h2>
                      </div>
                    )}
                    {isRingOverview && !section.cleanBanner && (
                      <div className="pointer-events-none absolute left-4 top-4 max-w-[65%] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.72)]">
                        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/85">0{index + 1}</p>
                        <h2 className="mt-1 font-display text-base font-black leading-tight">{section.title}</h2>
                        <p className="mt-1.5 text-xs font-semibold leading-5 text-white/90">{section.copy}</p>
                      </div>
                    )}
                  </div>
                )}
                {!isRingOverview && !isTfxV5Band && !section.cleanBanner && section.copy && (
                  <div className="px-4 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a6a20]">0{index + 1}</p>
                    <h2 className="mt-1.5 font-display text-base font-black leading-tight text-slate-950">{section.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{section.copy}</p>
                  </div>
                )}
              </RevealOnScroll>
            ))}
          </div>
          {mobileProductBannerSections.length > 3 && (
            <div className="px-4 pt-3">
              <button
                type="button"
                onClick={() => setShowAllMobileOverview((prev) => !prev)}
                className="w-full rounded-xl border border-slate-200 bg-[#fbfaf7] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
              >
                {showAllMobileOverview ? 'Show Less' : 'Show More Banners'}
              </button>
            </div>
          )}
        </section>
      )}

      <section className="bg-white px-4 py-5 sm:hidden">
        {activeDetailTab === 'description' && (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a6a20]">{isFanMarketplacePage ? 'Description' : 'Overview'}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                {isFanMarketplacePage ? fanMarketplaceDescription : overviewSections[0]?.copy || whyBuyCopy}
              </p>
            </div>
            {showProductOverview && mobileProductBannerSections.length === 0 && (
              <div className="space-y-3">
                {(showAllMobileOverview ? overviewMediaSections : overviewMediaSections.slice(0, 2)).map((section, index) => (
                  <article key={section.title} className="overflow-hidden">
                    {section.image && (
                      <div className="relative overflow-hidden bg-[#f8fbfb]">
                        <img
                          src={section.image}
                          alt={section.title}
                          className="h-auto w-full"
                          loading="lazy"
                          fetchPriority="low"
                          decoding="async"
                        />
                        {!isTfxV5Band && !section.cleanBanner && (
                          <div className="pointer-events-none absolute left-4 top-4 max-w-[62%] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.72)]">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/85">0{index + 1}</p>
                            <h2 className="mt-1 font-display text-base font-black leading-tight">{section.title}</h2>
                            <p className="mt-1 text-[11px] font-semibold leading-4 text-white/90">{section.copy}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                ))}
                {overviewSections.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllMobileOverview((prev) => !prev)}
                    className="w-full rounded-xl border border-slate-200 bg-[#fbfaf7] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
                  >
                    {showAllMobileOverview ? 'Show Less' : 'Show More Banners'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeDetailTab === 'features' && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a6a20]">What Should I Buy?</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{whyBuyCopy}</p>
            {featureList.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {featureList.slice(0, 10).map((feature) => (
                  <div key={feature} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-[11px] font-semibold leading-4 text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    {cleanFeatureText(feature)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeDetailTab === 'specs' && (
          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8a6a20]">Under The Hood</p>
                <h3 className="mt-1 font-display text-lg font-black text-slate-950">Product Specifications</h3>
              </div>
              {productInformationSpecEntries.length > 0 && (
                <span className="shrink-0 rounded-full border border-[#e6d9a8] bg-[#fbf6e4] px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#8a6a20]">
                  {productInformationSpecEntries.length} details
                </span>
              )}
            </div>
            {productInformationSpecEntries.length > 0 ? (
              <div className="mt-4 space-y-3">
                {specGroups.map((group) => (
                  <details
                    key={group.title}
                    className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-all duration-300 open:border-[#d9c88a] open:shadow-[0_16px_32px_-14px_rgba(15,23,42,0.2)]"
                    {...(group.title === 'Style' ? { open: true } : {})}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-gradient-to-r from-white to-[#fbfaf5] px-4 py-3.5 transition-colors group-open:from-[#fdf9ee] group-open:to-white">
                      <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white shadow-[0_4px_10px_rgba(15,23,42,0.28)]">
                          <SpecGroupIcon title={group.title} className="h-5 w-5" size={20} />
                        </span>
                        <span>
                          <span className="block text-sm font-black leading-tight text-slate-950">{group.title}</span>
                          <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                            {group.entries.length} {group.entries.length === 1 ? 'detail' : 'details'}
                          </span>
                        </span>
                      </span>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all duration-300 group-open:rotate-180 group-open:border-[#8a6a20] group-open:text-[#8a6a20]">
                        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </summary>
                    <div className="divide-y divide-slate-100 border-t border-slate-100">
                      {group.entries.map(([key, value], rowIndex) => (
                        <div
                          key={key}
                          className={`grid grid-cols-[0.42fr_0.58fr] gap-2 px-4 py-3 ${rowIndex % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'}`}
                        >
                          <p className="pr-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8a6a20]">{formatSpecLabel(key)}</p>
                          <p className="text-xs font-bold leading-5 text-slate-900">{String(value ?? '')}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm font-semibold text-slate-500">No specifications added.</p>
            )}
            {productFamily !== 'ring' && productInformationSpecEntries.length > 12 && (
              <button
                type="button"
                onClick={() => setShowAllSpecs((prev) => !prev)}
                className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-950 transition hover:border-slate-950"
              >
                {showAllSpecs ? 'Show Less' : 'Show More Specs'}
              </button>
            )}
          </div>
        )}

        {activeDetailTab === 'battery' && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a6a20]">Battery</p>
            {(mobileBatterySpecEntries.length > 0 || batteryFeatureEntries.length > 0) ? (
              <div className="mt-4 grid grid-cols-1 gap-2">
                {mobileBatterySpecEntries.map(([key, value]) => (
                  <div key={key} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a6a20]">{formatSpecLabel(key)}</p>
                    <p className="mt-1 text-sm font-bold leading-6 text-slate-800">{value}</p>
                  </div>
                ))}
                {batteryFeatureEntries.map((feature) => (
                  <div key={feature} className="rounded-xl border border-slate-200 bg-[#fbfaf7] px-3 py-3 text-sm font-medium leading-6 text-slate-800">
                    {cleanFeatureText(feature)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">Battery and charging details are listed in the product specifications.</p>
            )}
          </div>
        )}

        {activeDetailTab === 'faq' && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a6a20]">FAQ</p>
            <div className="mt-4 space-y-3">
              {productFaqs.map((item) => (
                <details key={item.q} className="rounded-xl border border-slate-200 bg-[#f8fbfb] p-4">
                  <summary className="cursor-pointer text-sm font-black text-slate-950">{item.q}</summary>
                  <p className="mt-3 text-xs font-semibold leading-6 text-slate-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        )}
      </section>

      <section id="features" className="hidden scroll-mt-32 bg-white px-4 py-5 sm:block sm:scroll-mt-36 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex items-center justify-center">
            <h2 className="rounded-full border border-[#a9812f]/25 bg-[#fbf6ea] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a6a20] sm:text-xs">
              What Should I Buy?
            </h2>
          </div>

          <p className="mx-auto max-w-4xl text-center text-sm font-medium leading-7 text-slate-700 sm:text-base sm:leading-8">
            {whyBuyCopy}
          </p>
          {featureList.length > 0 && (
            <div className="mx-auto mt-5 grid max-w-4xl grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {featureList.slice(0, 8).map((feature) => (
                <div key={feature} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-[11px] font-semibold leading-4 text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:text-xs">
                  {cleanFeatureText(feature)}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {isFanMarketplacePage && (
        <section id="description" className="hidden scroll-mt-32 bg-white px-4 py-10 sm:block sm:scroll-mt-36 sm:px-6 lg:px-8 lg:py-14">
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.34fr_0.66fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a20]">Description</p>
              <h2 className="mt-2 font-display text-xl font-black text-slate-950 sm:text-3xl">Smart comfort for every season</h2>
            </div>
            <div>
              <p className={`text-sm leading-7 text-slate-600 sm:text-base sm:leading-8 ${!isDescriptionExpanded ? 'line-clamp-6' : ''}`}>
                {fanMarketplaceDescription}
              </p>
              {fanMarketplaceDescription.length > 260 && (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                  className="mt-4 text-sm font-semibold text-[#8a6a20] hover:text-slate-950"
                >
                  {isDescriptionExpanded ? 'Show Less' : 'Read More'}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {showProductOverview && (
        <>
          <section id="description" className="hidden scroll-mt-32 bg-white px-4 py-10 sm:block sm:scroll-mt-36 sm:px-6 lg:px-8 lg:py-14">
            <div className="mx-auto max-w-5xl">
              <article className="grid gap-6 lg:grid-cols-[0.36fr_0.64fr]">
                <h2 className="font-display text-xl font-black leading-tight text-slate-950 sm:text-3xl lg:text-4xl">Product Overview</h2>
                <div>
                  <p className={`text-sm leading-7 text-slate-600 sm:text-base sm:leading-8 ${!isDescriptionExpanded ? 'line-clamp-6' : ''}`}>
                    {overviewSections[0].copy}
                  </p>
                  {!isRingOverview && shortDescription.length > 260 && (
                    <button
                      type="button"
                      onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                      className="mt-4 text-sm font-semibold text-[#8a6a20] hover:text-slate-950"
                    >
                      {isDescriptionExpanded ? 'Show Less' : 'Read More'}
                    </button>
                  )}
                </div>
              </article>
            </div>
          </section>

          <section id="more-information" className="hidden scroll-mt-32 bg-white px-0 pb-10 sm:block sm:scroll-mt-36 lg:pb-14">
            <div className="mx-auto w-full max-w-[1200px] space-y-4 px-4 sm:px-6 lg:px-0">
              {overviewMediaSections.map((section, index) => (
                <RevealOnScroll key={section.title} className="product-banner-group overflow-hidden bg-transparent shadow-none">
                  {section.video ? (
                    <div className="aspect-[12/5] overflow-hidden bg-slate-950">
                      <ProductOverviewVideo
                        src={section.video}
                        title={section.title}
                        className="band-hero-video product-banner-media h-full w-full border-0 object-contain object-center"
                      />
                    </div>
                  ) : section.image && (
                    <div className="relative w-full overflow-hidden bg-[#f8fbfb]">
                      <img
                        src={section.image}
                        alt={section.title}
                        className="product-banner-media h-auto w-full object-contain object-center"
                        loading="lazy"
                        fetchPriority="low"
                        decoding="async"
                      />
                      {section.overlayText && (
                        <div className="pointer-events-none absolute left-5 top-5 max-w-[62%] text-white drop-shadow-[0_4px_22px_rgba(0,0,0,0.76)] sm:left-8 sm:top-8 lg:left-10 lg:top-10">
                          <h2 className="font-display text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">
                            {section.overlayText}
                          </h2>
                        </div>
                      )}
                      {isRingOverview && !section.cleanBanner && (
                        <div className="pointer-events-none absolute left-4 top-4 max-w-[58%] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.72)] sm:left-7 sm:top-7 sm:max-w-[42%] lg:left-9 lg:top-9">
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/85 sm:text-xs">0{index + 1}</p>
                          <h2 className="mt-1 font-display text-lg font-black leading-tight sm:text-2xl lg:text-3xl">{section.title}</h2>
                          <p className="mt-2 max-w-sm text-xs font-semibold leading-5 text-white/90 sm:text-sm sm:leading-6">{section.copy}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {!isRingOverview && !isTfxV5Band && !section.cleanBanner && (
                    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8a6a20] sm:text-xs">0{index + 1}</p>
                      <h2 className="mt-2 font-display text-lg font-black leading-tight text-slate-950 sm:text-2xl lg:text-3xl">{section.title}</h2>
                      <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">{section.copy}</p>
                    </div>
                  )}
                </RevealOnScroll>
              ))}
            </div>
          </section>
        </>
      )}

      {productSeoComparison && <ProductSeoComparisonChart brief={productSeoComparison} />}

      <section id="specs" className="hidden scroll-mt-32 bg-gradient-to-b from-[#f8fbfb] to-[#f2f5f4] px-4 py-12 sm:block sm:scroll-mt-36 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#8a6a20]">Under The Hood</p>
              <h2 className="mt-2 font-display text-2xl font-black text-slate-950 sm:text-3xl lg:text-4xl">Product Specifications</h2>
              <p className="mt-2 max-w-lg text-sm font-medium leading-6 text-slate-500">Every detail, verified and organized so you know exactly what you're getting.</p>
            </div>
            {productInformationSpecEntries.length > 0 && (
              <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-[#e6d9a8] bg-[#fbf6e4] px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#8a6a20]">
                {productInformationSpecEntries.length} verified details
              </span>
            )}
          </div>
          {productInformationSpecEntries.length > 0 ? (
            <div className="mt-8 grid items-start gap-5 lg:grid-cols-2">
              {specGroups.map((group) => (
                <details
                  key={group.title}
                  className="group overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 open:border-[#d9c88a] open:shadow-[0_24px_50px_-18px_rgba(15,23,42,0.2)]"
                  {...(group.title === 'Style' ? { open: true } : {})}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-gradient-to-r from-white to-[#fbfaf5] px-6 py-5 transition-colors group-open:from-[#fdf9ee] group-open:to-white">
                    <span className="flex items-center gap-4">
                      <span className="product-detail-spec-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#e6d9a8] bg-[#fbf6ea] text-[#8a6a20] shadow-[0_8px_16px_rgba(169,129,47,0.16)] transition-transform duration-300 group-open:scale-105">
                        <SpecGroupIcon title={group.title} className="h-6 w-6" size={24} />
                      </span>
                      <span>
                        <span className="block text-base font-black leading-tight text-slate-950 sm:text-lg">{group.title}</span>
                        <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          {group.entries.length} {group.entries.length === 1 ? 'detail' : 'details'}
                        </span>
                      </span>
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all duration-300 group-open:rotate-180 group-open:border-[#8a6a20] group-open:text-[#8a6a20]">
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </summary>
                  <div className="divide-y divide-slate-100 border-t border-slate-100">
                    {group.entries.map(([key, value], rowIndex) => (
                      <div
                        key={key}
                        className={`grid gap-1 px-6 py-3.5 transition-colors hover:bg-[#fdf9ee] sm:grid-cols-[0.38fr_0.62fr] sm:gap-4 ${rowIndex % 2 === 1 ? 'bg-[#fafafa]' : 'bg-white'}`}
                      >
                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8a6a20]">{formatSpecLabel(key)}</p>
                        <p className="text-sm font-bold leading-6 text-slate-900">{String(value ?? '')}</p>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-slate-500">No specifications added.</p>
          )}
          {productFamily !== 'ring' && productInformationSpecEntries.length > 12 && (
            <button
              type="button"
              onClick={() => setShowAllSpecs((prev) => !prev)}
              className="mt-6 rounded-full border border-slate-300 bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-950 transition hover:border-slate-950 hover:shadow-md sm:px-7 sm:text-sm"
            >
              {showAllSpecs ? 'See Less' : 'See More'}
            </button>
          )}
        </div>
      </section>

      <section id="faq" className="hidden scroll-mt-32 bg-white px-4 py-10 sm:block sm:scroll-mt-36 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-xl font-black text-slate-950 sm:text-3xl lg:text-4xl">FAQs</h2>
          <div className="mt-6 space-y-3">
            {productFaqs.map((item) => (
              <details key={item.q} className="rounded-[1rem] border border-slate-200 bg-[#f8fbfb] p-4 sm:p-5">
                <summary className="cursor-pointer text-sm font-black text-slate-950 sm:text-base">{item.q}</summary>
                <p className="mt-3 text-xs leading-6 text-slate-600 sm:text-sm sm:leading-7">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="reviews" className="scroll-mt-32 bg-[#f8fbfb] px-4 py-10 sm:scroll-mt-36 sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a20]">Customer Reviews</p>
              <h2 className="mt-2 font-display text-xl font-black text-slate-950 sm:text-3xl lg:text-4xl">Write a Review</h2>
            </div>
            <p className="max-w-md text-sm font-semibold leading-6 text-slate-500">
              Add your rating, review, and up to 2 product photos.
            </p>
          </div>

          <form onSubmit={handleSubmitReview} className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-black text-slate-950">Share your experience</h3>
              <div className="flex items-center gap-1 text-2xl leading-none text-amber-400">
                {Array.from({ length: 5 }).map((_, index) => {
                  const star = index + 1;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="transition hover:scale-110"
                      aria-label={`Rate ${star} star${star === 1 ? '' : 's'}`}
                    >
                      {star <= reviewRating ? '\u2605' : '\u2606'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Name</span>
                <input
                  value={reviewName}
                  onChange={(event) => setReviewName(event.target.value)}
                  placeholder="Eg: Rahul Sharma"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleReviewImageSelect}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-white"
                />
              </label>
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">You can add only 2 images.</p>

            {reviewImagePreviews.length > 0 && (
              <div className="mt-3 flex gap-2">
                {reviewImagePreviews.map(({ file, url }) => (
                  <img
                    key={`${file.name}_${file.size}`}
                    src={url}
                    alt={file.name}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                  />
                ))}
              </div>
            )}

            <label className="mt-4 block">
              <span className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Review</span>
              <textarea
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="Eg: The product quality is good, delivery was fast, and it works smoothly."
                className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-950 outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                required
              />
            </label>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-h-5 text-sm font-semibold text-[#8a6a20]">{reviewMessage}</p>
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="h-11 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>

          {product.reviews && product.reviews.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {product.reviews.slice(0, visibleReviewCount).map((review, i) => (
                <article key={i} className="rounded-[1rem] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-black text-slate-950">{review.name}</p>
                  </div>
                  <p className="mt-2 text-sm font-black text-amber-500">{'\u2605'.repeat(Math.max(1, Math.min(5, Number(review.rating || 0))))}</p>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{review.comment}</p>
                  {review.images && review.images.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {review.images.slice(0, 2).map((image) => (
                        <img key={image} src={image} alt={`${review.name} review`} className="h-16 w-16 rounded-lg object-cover" loading="lazy" decoding="async" />
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm font-semibold text-slate-500">No reviews yet. Be the first to write one.</p>
          )}

          {product.reviews && product.reviews.length > 2 && (
            <button
              type="button"
              onClick={() =>
                setVisibleReviewCount((prev) =>
                  prev < (product.reviews?.length ?? 0)
                    ? Math.min(prev + 4, product.reviews?.length ?? 0)
                    : 2
                )
              }
              className="mt-5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-950 transition hover:border-slate-950 sm:px-5 sm:py-3 sm:text-sm"
            >
              {visibleReviewCount < (product.reviews?.length ?? 0) ? 'View More Reviews' : 'Show Less'}
            </button>
          )}
        </div>
      </section>

      {showNotifyModal && product && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur">
          <div className="w-full max-w-sm rounded-[1.25rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-red-500">Stock Alert</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">Notify me</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{product.name}{selectedColor?.name ? ` - ${selectedColor.name}` : ''}</p>
              </div>
              <button type="button" onClick={() => setShowNotifyModal(false)} className="rounded-full border border-slate-200 px-3 py-1 text-sm font-black">X</button>
            </div>
            {notifyMessage && <p className={`mt-4 text-sm font-semibold ${notifyMessage.startsWith('Done') ? 'text-green-700' : 'text-red-600'}`}>{notifyMessage}</p>}
            <button type="button" onClick={() => setShowNotifyModal(false)} className="mt-5 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Close
            </button>
          </div>
        </div>
      )}

      <div className={`fixed inset-x-0 bottom-0 z-[80] border-t border-slate-200 bg-white/95 px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl backdrop-blur transition-transform duration-300 sm:hidden ${showMobileStickyCta ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a6a20]">Price</p>
            <p className={`truncate text-base font-black ${couponRate > 0 ? 'text-emerald-600' : 'text-slate-950'}`}>{formatInrAmount(displayedPrice)}</p>
            {couponRate > 0 && <p className="truncate text-[10px] font-bold text-emerald-700">Save {formatInrAmount(couponDiscount)} ({couponRateLabel} off)</p>}
          </div>
          <button type="button" onClick={handleAddButtonClick} className="product-detail-action-button product-cta-shine min-h-11 min-w-[86px] rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 px-2.5 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.03em] leading-tight text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_8px_18px_rgba(15,23,42,0.25)] transition-all duration-300 ease-out active:scale-[0.96] min-[360px]:min-w-[104px] min-[360px]:text-xs">
            {notifySubmitting ? 'Saving...' : addedToCart ? 'Added' : canAdd ? 'Add to Cart' : 'Notify me'}
          </button>
          {canAdd && (
            <button
              type="button"
              onClick={() => {
                setIsBuyNowPressed(true);
                window.setTimeout(() => handleBuyNowClick(), 140);
              }}
              className={`min-h-11 min-w-[76px] rounded-xl border-2 px-2.5 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.03em] leading-tight shadow-[0_4px_12px_rgba(15,23,42,0.08)] transition-all duration-300 ease-out active:scale-[0.96] min-[360px]:min-w-[92px] min-[360px]:text-xs ${
                isBuyNowPressed
                  ? 'product-detail-buy-now-active border-[#a9812f] bg-[#a9812f] text-white'
                  : 'border-slate-950 bg-white text-slate-950'
              }`}
            >
              Buy Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
