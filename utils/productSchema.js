// Keep initial HTML and client-side Product offers aligned with store policies.
export const productOfferPolicies = {
  shippingDetails: {
    '@type': 'OfferShippingDetails',
    shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'INR' },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
      transitTime: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 7, unitCode: 'DAY' },
    },
  },
  hasMerchantReturnPolicy: {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'IN',
    returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
    merchantReturnLink: 'https://thefuturex.in/info/returns-refund',
  },
};

export const getSchemaReviews = (reviews = []) => {
  const valid = (Array.isArray(reviews) ? reviews : []).filter((review) =>
    review && !/(?:_seed_review_|_default_review$)/.test(String(review.id || '')) &&
    review.status !== 'rejected' && review.status !== 'pending' && review.approved !== false &&
    String(review.comment || '').trim() && String(review.name || '').trim() &&
    Number.isFinite(Number(review.rating)) && Number(review.rating) >= 1 && Number(review.rating) <= 5
  );
  const seen = new Set();
  return valid.filter(review => {
    const key = review.id || `${String(review.name).trim().toLowerCase()}|${String(review.comment).trim().toLowerCase()}|${review.date || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => (Date.parse(b.date || '') || 0) - (Date.parse(a.date || '') || 0));
};

export const mergeProductReviews = (embedded = [], publicReviews = []) => {
  const reviews = new Map((Array.isArray(embedded) ? embedded : []).map((review, index) => [review.id || `embedded-${index}`, review]));
  publicReviews.forEach((review, index) => reviews.set(review.id || `public-${index}`, review));
  return getSchemaReviews([...reviews.values()]);
};

export const withProductReviewSummary = (product, publicReviews = []) => {
  const reviews = mergeProductReviews(product.reviews, publicReviews);
  return { ...product, reviews, reviewCount: reviews.length, rating: reviews.length ? Number((reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length).toFixed(1)) : 0 };
};

export const buildSalePriceSpecification = (regularPrice, currentPrice) =>
  Number.isFinite(regularPrice) && regularPrice > currentPrice && currentPrice > 0
    ? { priceSpecification: { '@type': 'UnitPriceSpecification', price: regularPrice, priceCurrency: 'INR', priceType: 'https://schema.org/StrikethroughPrice' } }
    : {};

export const buildReviewSchema = (reviews = []) => {
  const eligible = getSchemaReviews(reviews);
  if (!eligible.length) return {};
  return {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Number((eligible.reduce((sum, review) => sum + Number(review.rating), 0) / eligible.length).toFixed(1)),
      reviewCount: eligible.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: eligible.slice(0, 2).map((review) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: String(review.name).trim() },
      reviewRating: { '@type': 'Rating', ratingValue: Number(review.rating), bestRating: 5, worstRating: 1 },
      reviewBody: String(review.comment).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
      ...(Number.isFinite(Date.parse(review.date || '')) ? { datePublished: new Date(review.date).toISOString().slice(0, 10) } : {}),
    })),
  };
};
