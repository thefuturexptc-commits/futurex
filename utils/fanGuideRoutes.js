const cities = ['Bengaluru', 'Pune', 'Varanasi', 'Unnao', 'Malappuram', 'Falakata'];

export const fanGuideRoutes = [
  {
    path: '/blog/bladeless-tower-fan-guide',
    label: 'TheFutureX Bladeless Tower Fan Guide',
    description: 'Explore airflow, air care, heating and how to choose a tower fan for your city.',
    listedInJournal: true,
  },
  ...cities.map((city) => ({
    path: `/blog/bladeless-tower-fan-in-${city.toLowerCase()}`,
    label: `Bladeless Tower Fan in ${city}`,
    description: `Compare fan features and find the right setup for your home in ${city}.`,
    listedInJournal: false,
  })),
].map((route) => ({ ...route, changefreq: 'monthly', priority: '0.7' }));
