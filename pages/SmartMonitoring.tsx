import React from 'react';
import { CategoryTemplate } from '../components/CategoryTemplate';
import heroImage from '../assets/images/monitoring-proactive-wellness-hero.webp';
import mobileHeroImage from '../assets/images/monitoring-mobile-hero.webp';
import overviewImage from '../assets/images/monitoring-phone-cutout.webp';

const monitoringCategoryFeatures = [
  'Heart Rate Monitoring',
  'Bluetooth Connectivity',
  'Sleep Tracking Technology',
  'Fitness Performance Monitoring',
  'Recovery & Wellness Insights',
  'Mobile App Compatibility',
  'Long-Term Data Tracking',
  'Lightweight & User-Friendly Design',
];

const monitoringPopularSearches = [
  'Bluetooth Heart Rate Monitor',
  'Heart Rate Monitor Chest Strap',
  'Fitness Heart Rate Sensor',
  'Running Heart Rate Monitor',
  'Smart Sleep Tracker',
  'Sleep Monitoring Device',
  'Recovery Monitoring System',
  'Wellness Tracking Technology',
  'Fitness Monitoring Device',
  'The Future X Smart Monitoring',
];

const monitoringFaqs = [
  {
    question: 'What is a smart monitoring device?',
 answer: 'Smart monitoring devices are connected technologies designed to help users track fitness, sleep, activity and performance metrics through sensors and companion applications.',
  },
  {
    question: 'What does the Future X Bluetooth Heart Rate Monitor track?',
    answer: 'The Future X Bluetooth Heart Rate Monitor Chest Belt tracks heart rate data during workouts, fitness training, running, cycling, and sports activities through compatible devices and apps.',
  },
  {
    question: 'What does a smart sleep tracking system monitor?',
    answer: 'A smart sleep tracking system helps monitor sleep patterns, rest trends, recovery signals, and connected wellness insights through supported sensors and applications.',
  },
  {
    question: 'Can smart monitoring devices connect to a phone?',
 answer: 'Yes, compatible smart monitoring devices connect to smartphones or supported apps to display fitness and wellness data.',
  },
  {
    question: 'Who should use a Bluetooth heart rate chest belt?',
    answer: 'A Bluetooth heart rate chest belt is useful for runners, cyclists, gym users, cardio training, and sports activities where real-time heart rate tracking is important.',
  },
  {
    question: 'How can sleep tracking help daily wellness?',
    answer: 'Sleep tracking can help users understand sleep duration, routine consistency, rest patterns, and recovery trends over time.',
  },
];

export const SmartMonitoring: React.FC = () => {
  const features = [
    {
      title: "Clinical Accuracy",
      description: "FDA-cleared sensors provide medical-grade data on BP, ECG, and blood glucose trends.",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    },
    {
      title: "Instant Doctor Sync",
      description: "Automatically share vital reports with your care provider in real-time.",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    },
    {
      title: "Family Connect",
      description: "Monitor your loved ones remotely with peace of mind alerts.",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    }
  ];

  return (
    <>
      <CategoryTemplate 
        category="Smart Monitoring"
 title="Proactive."
        subtitle="Take control of your well-being with lab-quality diagnostics in the comfort of your home. Prevention starts here."
        heroGradient="bg-gradient-to-br from-slate-950 via-black to-slate-900"
        heroImage={heroImage}
        mobileHeroImage={mobileHeroImage}
        heroAsFullBanner
        heroHref="/product/thefuturex-smart-sleep-tracking-monitoring-system"
        overviewImage={overviewImage}
        heroOverlayClassName="bg-gradient-to-b from-black/20 via-black/34 to-black/50"
        heroTintClassName="bg-black/8"
        heroSideOverlayClassName="bg-gradient-to-l from-black/22 to-transparent"
        showHeroGridPattern={false}
        accentColor="text-white"
        features={features}
        autoSlideModels={false}
      />

      <section className="bg-white px-5 py-12 text-slate-950 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.46fr_0.54fr] lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-slate-500">Smart Monitoring Devices</p>
            <h2 className="mt-3 font-display text-3xl font-black leading-tight sm:text-5xl">
              Fitness, recovery and wellness tracking
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
 The Future X Smart Monitoring collection includes advanced wearable and connected devices designed to help users track important wellness and fitness metrics. From Bluetooth heart rate monitoring solutions for training and sports performance to smart sleep tracking systems for recovery and sleep awareness, these devices provide useful insights into daily and activity patterns.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600">
 The Future X develops technology products that combine fitness tracking, wellness monitoring and user-friendly connectivity. Whether you're monitoring workout performance with a Bluetooth heart rate chest belt or tracking sleep patterns with a dedicated sleep monitoring system, TFX products are designed to help users access meaningful and activity data through modern connected technology.
            </p>
          </div>
          <div className="grid gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">Category Features</h3>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {monitoringCategoryFeatures.map((feature) => (
                  <div key={feature} className="rounded-lg bg-white px-3 py-3 text-xs font-black leading-5 text-slate-800 shadow-sm sm:text-sm">
                    {feature}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">Popular Searches</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {monitoringPopularSearches.map((search) => (
                  <span key={search} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800">
                    {search}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-5 py-12 text-white sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-3xl font-black leading-tight sm:text-5xl">Smart Monitoring FAQs</h2>
          <div className="mt-8 space-y-4">
            {monitoringFaqs.map((faq) => (
              <details key={faq.question} className="rounded-[1rem] border border-white/10 bg-white p-5">
                <summary className="cursor-pointer text-base font-black text-slate-950">{faq.question}</summary>
                <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
