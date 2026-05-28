import React from 'react';
import { CategoryTemplate } from '../components/CategoryTemplate';
<<<<<<< HEAD
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
=======

export const SmartFans: React.FC = () => {
  const features = [
    {
      title: "HEPA H13 Filtration",
      description: "Captures 99.97% of dust, allergens, and viruses. Breathe pure, mountain-fresh air at home.",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
    },
    {
      title: "AI Climate Control",
      description: "Sensors detect temperature and air quality changes, adjusting airflow automatically.",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
    },
    {
      title: "Whisper Quiet",
      description: "Acoustically engineered to operate at less than 20dB, perfect for uninterrupted sleep.",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeDasharray="1 1" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
    }
  ];

  return (
    <CategoryTemplate 
      category="Smart Fans"
      title="Atmosphere Redefined."
      subtitle="Transform your home into a sanctuary. Intelligent airflow that purifies, cools, and adapts to your life seamlessly."
      heroGradient="bg-gradient-to-br from-teal-900 via-emerald-900 to-green-900"
      heroImage="https://images.unsplash.com/photo-1542385151-efd90007e2a7?auto=format&fit=crop&q=80&w=1000"
      accentColor="text-emerald-400"
      features={features}
    />
  );
};
>>>>>>> a168ac528e04a1ed3dcc8407965889538ae3e04b
