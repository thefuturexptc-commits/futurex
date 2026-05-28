import React from 'react';
import { CategoryTemplate } from '../components/CategoryTemplate';
import fanHero from '../assets/images/fan-family-hero.webp';
import fanMobileHero from '../assets/images/fan-mobile-hero.webp';
import fanMain from '../assets/images/mainfan.webp';
import fanSlide1 from '../assets/images/fan-slide-1.webp';
import fanSlide2 from '../assets/images/fan-slide-2.webp';
import fanSlide3 from '../assets/images/fan-slide-3.webp';
import fanSlide4 from '../assets/images/fan-slide-4.webp';

const FanIcon = ({ path }: { path: React.ReactNode }) => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {path}
  </svg>
);

export const SmartFans: React.FC = () => (
  <CategoryTemplate
    category="Smart Fans"
    title="Cleaner Airflow for Everyday Comfort"
    subtitle="TFX smart fans bring premium air movement into bedrooms, offices, and family spaces with quiet control, compact tower forms, and purifier-led comfort."
    heroGradient="from-slate-950 via-slate-900 to-cyan-950"
    heroImage={fanHero}
    mobileHeroImage={fanMobileHero}
    heroAsFullBanner
    overviewImage={fanMain}
    accentColor="#22b8b4"
    showcaseImages={[
      { src: fanSlide1, alt: 'Smart fan control features' },
      { src: fanSlide2, alt: 'Smart fan heating and cooling function' },
      { src: fanSlide3, alt: 'Smart fan bladeless design' },
      { src: fanSlide4, alt: 'Smart fan all-season comfort' },
    ]}
    features={[
      {
        title: 'Clean Airflow',
        description: 'Purification-focused models support cooler, cleaner room comfort for daily home use.',
        icon: <FanIcon path={<><path d="M4 12h11" /><path d="M8 7h8a4 4 0 0 1 0 8h-2" /><path d="M5 17h9" /></>} />,
      },
      {
        title: 'Bladeless Safety',
        description: 'A smooth tower form keeps airflow powerful while staying easier around family spaces.',
        icon: <FanIcon path={<><path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-5" /></>} />,
      },
      {
        title: 'Quiet Sleep Mode',
        description: 'Gentle airflow settings are tuned for bedrooms, study rooms, and focused work sessions.',
        icon: <FanIcon path={<><path d="M4 10v4h4l5 4V6l-5 4H4Z" /><path d="M17 9.5a4 4 0 0 1 0 5" /><path d="M19.5 7a7.5 7.5 0 0 1 0 10" /></>} />,
      },
    ]}
  />
);
