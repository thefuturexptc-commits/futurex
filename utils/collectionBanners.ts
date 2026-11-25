import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const smartBandBanner = {
  titleStart: 'Your',
  titleAccent: 'Health.',
  titleEnd: 'Predicted. Optimized. Protected.',
  subtitle: 'AI-powered wellness that learns from your body',
  description: 'Our AI continuously learns from your body, helping you stay ahead with smarter insights, deeper analysis, and personalized recommendations.',
  featuredHref: '/product/tfx5-ai-smart-band',
  catalogId: 'models',
};

export const bladelessFanBanner = {
  category: 'Smart Fans',
  title: 'The Future of Bladeless Comfort.',
  featuredHref: '/product/tfx-advance',
  catalogId: 'catalog',
  overviewId: 'overview',
};

export const smartRingBanner = {
  alt: 'Meet the TFX Smart Ring. Smart Insights. Seamless Style. Fitness, sleep and heart rate tracking.',
  featuredHref: '/product/tfx-display-pro-smart-ring',
};

export const useCollectionBannerAnchor = (overviewReady = true) => {
  const { hash } = useLocation();
  const waitingForOverview = hash === `#${bladelessFanBanner.overviewId}` && !overviewReady;

  useEffect(() => {
    if (hash && !waitingForOverview) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'instant' });
    }
  }, [hash, waitingForOverview]);
};
