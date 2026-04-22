import React from 'react';
import { CategoryTemplate } from '../components/CategoryTemplate';
import heroImage from '../assets/images/smart-ring-rotating.gif';
import heroBackgroundImage from '../assets/images/smartrings-neon-bg.webp';

export const SmartRings: React.FC = () => {
  const features = [
    {
      title: 'Invisible Tech',
      description:
        'All the power of a smartwatch packed into a discreet, aerospace-grade titanium ring.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M20 12a8 8 0 11-16 0 8 8 0 0116 0z"
          />
        </svg>
      ),
    },
    {
      title: 'Sleep Mastery',
      description:
        'Advanced sleep staging and recovery analysis to help you wake up refreshed every day.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      ),
    },
    {
      title: 'Extended Battery Life',
      description:
        'Optimized low-power architecture delivers 3-5 days of continuous usage on a single charge.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M17 16V8a4 4 0 10-8 0v8m-2 4h12a2 2 0 002-2v-2H5v2a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <CategoryTemplate
      category="Smart Rings"
      title="Wellness, Simplified."
      subtitle="Elegance meets intelligence. Monitor your vital signs 24/7 without screens, vibrations, or distractions."
      heroGradient="bg-gradient-to-br from-gray-950 via-emerald-950 to-slate-900"
      heroImage={heroImage}
      heroBackgroundImage={heroBackgroundImage}
      accentColor="text-emerald-400"
      features={features}
      autoSlideModels={false}
      modelCardSkeletonClassName="h-72"
      modelCardImageAspectClassName="aspect-[4/3]"
    />
  );
};
