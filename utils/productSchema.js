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

export const getSchemaReviews = (reviews = []) =>
  (Array.isArray(reviews) ? reviews : []).filter((review) =>
    review && !String(review.id || '').includes('_seed_review_') &&
    String(review.comment || '').trim() && String(review.name || '').trim() &&
    Number.isFinite(Number(review.rating)) && Number(review.rating) >= 1 && Number(review.rating) <= 5
  );

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
    review: eligible.slice(0, 3).map((review) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: String(review.name).trim() },
      reviewRating: { '@type': 'Rating', ratingValue: Number(review.rating), bestRating: 5, worstRating: 1 },
      reviewBody: String(review.comment).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    })),
  };
};
