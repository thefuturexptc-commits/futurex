import React from 'react';
import { CategoryTemplate } from '../components/CategoryTemplate';
import fanHero from '../assets/images/fan-family-hero.webp';
import fanMobileHero from '../assets/images/fan-mobile-hero.webp';
import fanHeroVideo from '../assets/images/bladeless-fan-hero-video.mp4';
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

const fanCategoryFeatures = [
  'Bladeless Airflow Technology',
  'Smooth & Consistent Air Circulation',
  'Selected Models with Heating & Cooling Functions',
  'HEPA Filtration Options Available',
  'Smart Control Features',
  'Oscillation for Wider Air Distribution',
  'Modern Space-Saving Designs',
  'Easy Cleaning & Maintenance',
];

const fanIdealApplications = [
  'Bedroom Cooling',
  'Living Room Air Circulation',
  'Home Office Comfort',
  'Workspace Ventilation',
  'Year-Round Indoor Comfort',
  'Modern Smart Homes',
];

const fanPopularSearches = [
  'Bladeless Fan India',
  'HEPA Bladeless Fan',
  'Smart Tower Fan',
  'Hot and Cool Fan',
  'Air Purifier Fan',
  'Bladeless Cooling Fan',
  'Modern Home Fan',
  'Smart Air Circulation Fan',
  'TFX Bladeless Fan',
  'The Future X Fan',
];

const fanFaqs = [
  {
    question: 'What is a bladeless fan?',
    answer: 'A bladeless fan uses airflow amplification technology to circulate air without exposed rotating blades.',
  },
  {
    question: 'How does a bladeless fan work?',
    answer: 'A bladeless fan draws air into its base and pushes smooth airflow through a ring or tower outlet to circulate air around a room.',
  },
  {
    question: 'Are bladeless fans energy efficient?',
    answer: 'Many bladeless fans are designed for efficient airflow and adjustable speed settings, helping users manage comfort and power use.',
  },
  {
    question: 'What is the difference between a bladeless fan and a traditional fan?',
    answer: 'A bladeless fan has no exposed rotating blades and usually offers a modern tower design, smoother airflow, and easier cleaning than many traditional fans.',
  },
  {
    question: 'Can a bladeless fan be used year-round?',
    answer: 'Selected hot and cool bladeless fans can support both cooling airflow and heating functionality for year-round indoor comfort.',
  },
  {
    question: 'What is a hot and cool fan?',
    answer: 'A hot and cool fan is designed to provide cooling airflow in warmer conditions and heated airflow when extra warmth is needed.',
  },
  {
    question: 'What are the benefits of a HEPA bladeless fan?',
    answer: 'A HEPA bladeless fan combines air circulation with filtration support, helping manage indoor airflow while supporting cleaner air movement.',
  },
  {
    question: 'Are bladeless fans suitable for bedrooms?',
    answer: 'Many users prefer bladeless fans in bedrooms due to their modern design and smooth airflow delivery.',
  },
  {
    question: 'Do bladeless fans require less maintenance?',
    answer: 'Bladeless fans can be easier to clean because they do not have exposed blades, though filters and vents should still be maintained as recommended.',
  },
  {
    question: 'Which TFX bladeless fan is best for home use?',
    answer: 'The best TFX bladeless fan depends on the room and use case. Cooling models suit everyday airflow, hot and cool models support year-round comfort, and HEPA models add filtration support.',
  },
];

export const SmartFans: React.FC = () => {
  return (
  <>
    <CategoryTemplate
      category="Smart Fans"
      title="The Future of Bladeless Comfort."
      subtitle=""
      heroGradient="from-slate-950 via-slate-900 to-cyan-950"
      heroImage={fanHero}
      mobileHeroImage={fanMobileHero}
      heroVideo={fanHeroVideo}
      heroAsFullBanner
      heroHref="/product/tfx-advance"
      overviewImage={fanMain}
      accentColor="#0ea5e9"
      showcaseImages={[
        { src: fanSlide1, alt: 'Smart fan control features' },
        { src: fanSlide2, alt: 'Smart fan heating and cooling function' },
        { src: fanSlide3, alt: 'Smart fan bladeless design' },
        { src: fanSlide4, alt: 'Smart fan all-season comfort' },
      ]}
      catalogLayout="horizontal"
      showComparisonSection={false}
      modelCardSkeletonClassName="h-[354px] sm:h-[374px]"
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

    <section className="bg-white px-5 py-12 text-slate-950 sm:px-8 lg:px-10 lg:py-16">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.46fr_0.54fr] lg:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#1ca9a4]">TFX Bladeless Fans</p>
          <h2 className="mt-3 font-display text-3xl font-black leading-tight sm:text-5xl">
            Smart airflow solutions for modern living
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            Experience advanced indoor comfort with TFX Bladeless Fans, designed to combine efficient airflow, modern aesthetics, and user-friendly operation. From cooling solutions and hot-and-cool models to HEPA-enabled air circulation systems, the TFX range offers products suitable for bedrooms, living rooms, offices, and professional environments.
          </p>
          <p className="mt-4 text-base leading-8 text-slate-600">
            The collection includes cooling fans, hot and cool models, wall-mounted systems, and multi-function tower fans designed to support various room sizes and indoor requirements.
          </p>
        </div>
        <div className="grid gap-5">
          <div className="rounded-2xl border border-slate-200 bg-[#f7fbfb] p-5">
            <h3 className="text-lg font-black text-slate-950">Category Features</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {fanCategoryFeatures.map((feature) => (
                <div key={feature} className="rounded-lg bg-white px-3 py-3 text-xs font-black leading-5 text-slate-800 shadow-sm sm:text-sm">
                  {feature}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-black text-slate-950">Ideal Applications</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {fanIdealApplications.map((application) => (
                <div key={application} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-black leading-5 text-slate-800 shadow-sm sm:text-sm">
                  {application}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-black text-slate-950">Popular Searches</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {fanPopularSearches.map((search) => (
                <span key={search} className="rounded-full border border-[#bdebea] bg-[#f0f9ff] px-3 py-1.5 text-xs font-bold text-[#117c78]">
                  {search}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl rounded-2xl border border-slate-200 bg-[#f7fbfb] p-5 sm:p-6">
        <h3 className="text-xl font-black text-slate-950">Bladeless Fan FAQs</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {fanFaqs.map((faq) => (
            <div key={faq.question} className="rounded-xl bg-white p-4 shadow-sm">
              <h4 className="text-sm font-black text-slate-950">{faq.question}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </>
  );
};
