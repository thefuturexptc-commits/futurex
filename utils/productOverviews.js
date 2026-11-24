const overviewHtmlBySlug = new Map([
  [
    'tfx-touch-smart-ring',
    '<strong>Track Your Health. Elevate Your Lifestyle.</strong> Discover <strong>The FutureX TFX Touch Smart Ring</strong>, an advanced <strong>fitness tracking smart ring</strong> with touch control, heart rate monitoring, blood oxygen (SpO2) tracking, sleep monitoring and HRV insights. Featuring Bluetooth connectivity, daily activity tracking and a premium stainless steel design, this lightweight <strong>Smart Health Ring</strong> offers a stylish alternative to traditional smartwatches. Designed for everyday fitness, wellness and sleep tracking, it brings smart wearable technology to your fingertips.',
  ],
  [
    'tfx-ring-pro-smart-ring-with-app-control-and-gesture-features',
    '<strong>Your Health. Your Insights. Your Everyday Companion.</strong> Discover <strong>The FutureX TFX Smart Ring with App Control</strong>, a premium <strong>fitness tracking smart ring</strong> featuring 24/7 heart rate monitoring, blood oxygen (SpO2) tracking, sleep monitoring, body temperature tracking and HRV insights. With Bluetooth connectivity, Qring app support for Android and iOS, and an elegant stainless steel design, this <strong>Smart Health Ring</strong> offers a comfortable alternative to traditional smartwatches. Track your activity, understand your recovery and stay connected to your wellness goals, day and night.',
  ],
  [
    'tfx-display-pro-smart-ring',
    '<strong>Big on Technology. Small in Design.</strong> Upgrade your everyday wellness with <strong>The FutureX TFX Smart Ring with App Control</strong>, a premium <strong>Smart Fitness Ring</strong> featuring 24/7 heart rate monitoring, SpO2 tracking, sleep analysis, body temperature monitoring and HRV insights. With Bluetooth connectivity, Qring app support for Android and iPhone, and a lightweight stainless steel body, this <strong>Fitness Tracking Smart Ring</strong> delivers personalised wellness insights without the bulk of a smartwatch. Monitor your activity, sleep and recovery effortlessly, all from your finger.',
  ],
  [
    'tfx-smart-10x-air',
    'Experience year-round comfort with <strong>The FutureX QG830 Bladeless Tower Fan</strong>, a premium <strong>Hot & Cool Fan for Home</strong> featuring 10 cooling speeds, PTC ceramic heating and remote control. Enjoy smooth, quiet airflow with a modern bladeless design, ideal for bedrooms, living rooms and offices.',
  ],
  [
    'tfx-advance',
    '<strong>One Premium Fan. Comfort for Every Season.</strong> Upgrade your home with <strong>The FutureX Q8 PRO Bladeless Tower Fan</strong>, combining refreshing cooling airflow and powerful PTC ceramic heating in one stylish <strong>Hot & Cool Fan</strong>. Enjoy effortless remote control, 71° oscillation and 180° adjustable head positioning for personalised comfort. A smart, space-saving alternative to separate fans and heaters, perfect for modern bedrooms, living rooms and offices.',
  ],
  [
    'tfx-airwall-pro',
    "<strong>Save Space. Enjoy Comfort in Every Season.</strong> Upgrade your home with <strong>The FutureX 4319B Bladeless Wall Mount Fan</strong>, a premium <strong>Hot & Cool Wall Mount Fan</strong> that combines refreshing airflow and PTC ceramic heating in one sleek design. Featuring remote control, a 9-hour timer and an anti-fire ABS body, this <strong>Wall Mount Fan with Remote</strong> offers convenient year-round comfort without occupying floor space. Ideal for bedrooms, living rooms and offices, it's a smart alternative to separate fans and room heaters.",
  ],
  [
    'tfx-pureair-3-in-1',
    '<strong>Cooler Comfort. Fresher Air. Smarter Living.</strong> Upgrade your home with <strong>The FutureX TFX-TP02 3-in-1 Bladeless Tower Fan with Air Purifier</strong>, combining refreshing airflow, air filtration and a smart LED display in one premium design. Featuring adjustable cooling speeds, remote control and oscillation, this <strong>Bladeless Air Purifier Fan</strong> delivers convenient everyday comfort. A stylish, space-saving alternative to separate fans and air purifiers, perfect for bedrooms, living rooms and offices.',
  ],
  [
    'tfx-luxair-pro',
    '<strong>Powerful Airflow. Cleaner Air. Smarter Living.</strong> Upgrade your home with <strong>The FutureX TP12 3-in-1 Bladeless Tower Fan with HEPA Air Purifier</strong>, combining smooth cooling airflow, HEPA filtration and advanced plasma purification in one premium appliance. Featuring convenient remote and touch controls, this <strong>Bladeless Fan with HEPA Filter</strong> helps reduce airborne particles while delivering comfortable airflow. A smart, space-saving alternative to separate fans and air purifiers, ideal for bedrooms, living rooms and offices.',
  ],
  [
    'tfx-breeze-pro',
    '<strong>Powerful Airflow. Whisper-Quiet Comfort. Smarter Cooling.</strong> Upgrade your everyday comfort with <strong>The FutureX TP02 PLUS Bladeless Tower Fan</strong>, featuring an advanced <strong>BLDC Motor</strong> for energy-efficient, low-noise airflow. With adjustable cooling speeds, convenient remote control and oscillation, this <strong>Bladeless Cooling Fan</strong> offers effortless comfort in a sleek, space-saving design. A premium <strong>Tower Fan for Home and Office</strong>, perfect for bedrooms, living rooms and modern workspaces.',
  ],
]);

export const TP09_PRO_DESCRIPTION = 'Enjoy everyday comfort across seasons with the FutureX TP09 PRO. Combining cooling airflow with PTC ceramic heating, this bladeless tower fan brings convenient control and a modern, space-saving design to your home. Choose from 10 airflow speeds, activate 180° automatic oscillation, and set the 9-hour timer to suit your routine. Adjust settings using the touch panel or included remote control, from your sofa, desk or bedside.';

export const matchesQ8Pro = (product) => {
  if (!product) return false;
  if (product.id === 'p-1772265903701' || product.slug === 'tfx-advance') return true;
  const identifiers = [product.name, product.specs?.Model, product.specs?.['Model Number'], product.slug?.replace(/-/g, ' ')].filter(Boolean).join(' ');
  return /\bq\s*-?\s*8\s*(?:pro\b|$)/i.test(identifiers);
};

export const getTp09Model = (product, slug = product?.slug || '') => {
  if (!product) return undefined;
  const modelText = [product.name, product.specs?.Model, product.specs?.['Model Number']].filter(Boolean).join(' ');
  const identifiers = `${modelText} ${slug.replace(/-/g, ' ')}`;
  if (slug !== 'tfxhot-and-coolair-pro' && !/\btp\s*-?\s*09(?=\b|pro\b|plus\b)|\bcoolair\s*pro\b/i.test(identifiers)) return undefined;
  if (/\btp\s*-?\s*09\s*-?\s*pro\s*-?\s*plus\b/i.test(modelText)) return 'TP09 PRO PLUS';
  return /\btp\s*-?\s*09\s*-?\s*plus\b/i.test(identifiers) ? 'TP09 PLUS' : 'TP09 PRO';
};

const toPlainText = (value) => String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const getProductOverview = (product, slug) => {
  if (!product) return undefined;
  const html = overviewHtmlBySlug.get(matchesQ8Pro(product) ? 'tfx-advance' : slug);
  if (html) return { html, description: html.replace(/<\/?strong>/g, '') };

  const tp09Model = getTp09Model(product, slug);
  if (tp09Model) return { description: TP09_PRO_DESCRIPTION.replaceAll('TP09 PRO', tp09Model) };

  if (!/\bfans?\b/i.test(`${product.category || ''} ${product.name || ''}`)) return undefined;
  const description = [product.seoDescription, product.shortDescription, product.description].map(toPlainText).find(Boolean) ||
    `${product.name} is designed for smooth airflow and everyday indoor comfort.`;
  return { description };
};
