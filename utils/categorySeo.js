export const categoryPages = {
  'shop/all': {
    name: 'Shop All Products',
    title: 'Shop All Products | TheFutureX',
    description: 'Browse all TheFutureX smart wearables, smart rings, smart bands, smart fans, monitoring products, and connected lifestyle devices.',
    category: '',
  },
  'smart-bands': {
    name: 'Smart Bands',
    title: 'Smart Bands | TheFutureX',
    description: 'Explore TheFutureX smart bands for fitness tracking, sleep monitoring, SpO2, heart rate insights, app sync, and comfortable daily wear.',
    category: 'Smart Bands',
  },
  'smart-rings': {
    name: 'Smart Rings',
    title: 'The FutureX Smart Rings',
    description: 'Explore TheFutureX smart rings for compact activity tracking, sleep insights, heart rate trends, app connectivity, and everyday ring comfort.',
    category: 'Smart Rings',
  },
  'bladeless-fan': {
    name: 'Bladeless Fan',
    title: 'The FutureX Bladeless Fans',
    description: 'Shop TheFutureX bladeless fans built for smooth airflow, modern homes, quiet room comfort, remote control, and all-season living.',
    category: 'Smart Fans',
  },
  'smart-monitoring': {
    name: 'Smart Monitoring',
    title: 'Smart Monitoring | TheFutureX',
    description: 'Discover TheFutureX smart monitoring devices for fitness performance, sleep tracking, heart rate monitoring, recovery trends, and app-based reports.',
    category: 'Smart Monitoring',
  },
};

export const getCatalogCategoryPages = (categories = []) => {
  const pages = { ...categoryPages };
  const configured = new Set(Object.values(categoryPages).map(({ category }) => category.toLowerCase()));
  for (const row of categories) {
    const name = String(row.name || '').trim();
    const key = name.toLowerCase();
    const existing = Object.keys(pages).find((route) => pages[route].category.toLowerCase() === key);
    if (existing) {
      pages[existing] = {
        ...pages[existing],
        title: row.seoTitle?.trim() || pages[existing].title,
        description: row.seoDescription?.trim() || pages[existing].description,
      };
    } else if (name && !['.', '..', 'all'].includes(key) && !configured.has(key) && !/\b(?:glass|glasses)\b/i.test(name)) {
      pages['shop/' + encodeURIComponent(name)] = {
        name, category: name,
        title: row.seoTitle?.trim() || name + ' | TheFutureX',
        description: row.seoDescription?.trim() || 'Browse ' + name.toLowerCase() + ' from TheFutureX.',
      };
      configured.add(key);
    }
  }
  return pages;
};
