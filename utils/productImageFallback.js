const FALLBACK_IMAGES = {
  band: '/images/tfx-smart-band-merchant.webp',
  ring: '/images/tfx-smart-ring-merchant.png',
  fan: '/images/tfx-smart-fan-merchant.webp',
  monitoring: '/images/tfx-monitoring-merchant.webp',
};

export const getFallbackProductImageUrl = (product = {}) => {
  const identity = `${product.category || ''} ${product.name || ''}`.toLowerCase();
  if (/fan|bladeless|tower|air purifier|cooling/.test(identity)) return FALLBACK_IMAGES.fan;
  if (/ring/.test(identity)) return FALLBACK_IMAGES.ring;
  if (/band|bracelet/.test(identity)) return FALLBACK_IMAGES.band;
  return FALLBACK_IMAGES.monitoring;
};
