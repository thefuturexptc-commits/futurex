const listingsBySlug = {
  'tfx-advance': [
    { url: 'https://www.flipkart.com/futurex-q8-pro-6-months-warranty-tower-fan/p/itm0e517add10d0c?pid=FANHE6R3DGEPYU6S' },
  ],
  'tfx-breeze-pro': [
    { url: 'https://www.flipkart.com/futurex-tp02-plus-12-months-warranty-bldc-motor-remote-energy-saving-remote-controlled-tower-fan/p/itm2bb0575ea42a7?pid=FANHE8Q9NJHX6EGV' },
  ],
  'tfx-luxair-pro': [
    { url: 'https://www.flipkart.com/futurex-tfx-tp-12-3-1-year-warranty-bldc-motor-remote-anti-dust-energy-saving-silent-operation-remote-controlled-tower-fan/p/itm055b18e8b2972?pid=FANHGYB3EKFWZERJ' },
  ],
  'tfx-smart-10x-air': [
    { url: 'https://www.flipkart.com/futurex-qg830-12-months-warranty-tower-fan/p/itmc5c0a1e658635?pid=FANHE8Q8MQWUSXCM' },
  ],
  'tfxhot-and-coolair-pro': [
    { url: 'https://www.flipkart.com/futurex-tp09-pro-12-months-warranty-bldc-motor-remote-silent-operation-ultra-high-speed-led-indicators-tower-fan/p/itm63090878457ac?pid=FANHE8ZUUMNZEMYS' },
  ],
  'tfx-pureair-3-in-1': [
    { url: 'https://www.flipkart.com/future-x-tfx-tp02-3-1-bladeless-fan-portable-room-air-purifier/p/itm2a67a7b13c140?pid=APFHRGMSSG7M6H6D' },
  ],
  'tfx-airwall-pro': [
    {
      label: 'TFX 4319A Wall-Mount Fan',
      url: 'https://www.flipkart.com/futurex-tfx-4319a-1-year-warranty-bldc-motor-remote-wall-fan/p/itmdcfb7c2e13475?pid=FANHFFFFYUW5SGH7',
    },
  ],
  'tfx-display-pro-smart-ring': [
    {
      color: 'Black',
      size: '13',
      url: 'https://www.flipkart.com/futurex-tfxq11-smart-ring/p/itm439a79e02f7e4?pid=STNHHJHD98QFGKSJ',
    },
    {
      color: 'Rose Gold',
      size: '12',
      url: 'https://www.flipkart.com/futurex-tfxq11-smart-ring/p/itmc14673293d022?pid=STNHHGRGPGZFJG4J',
    },
  ],
  'tfx-touch-smart-ring': [
    {
      color: 'Silver',
      size: '12',
      url: 'https://www.flipkart.com/futurex-smart-ring-touch-ip68-waterproof-fitness-control/p/itm1e23c316ef1ea?pid=STNHFTPCFRWVPURC',
    },
    {
      color: 'Black',
      size: '12',
      url: 'https://www.flipkart.com/futurex-smart-ring-touch-ip68-waterproof-fitness-control/p/itm5f90cd9c54147?pid=STNHGYD8JCFFGG3F',
    },
  ],
};

export const getStorefrontFlipkartListings = (slug, color, size) => {
  const listings = Object.hasOwn(listingsBySlug, slug) ? listingsBySlug[slug] : [];
  const selectedColor = color?.trim().toLowerCase();
  const score = (listing) => {
    if (!listing.color) return 0;
    const matchesColor = listing.color.toLowerCase() === selectedColor;
    return Number(matchesColor) * 2 + Number(listing.size === size);
  };
  return [...listings].sort((first, second) => score(second) - score(first));
};
