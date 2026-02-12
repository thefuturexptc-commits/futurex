import React from 'react';
import { CategoryTemplate } from '../components/CategoryTemplate';

export const SmartBands: React.FC = () => {
  const features = [
    {
      title: "Biometric Precision",
      description: "Military-grade sensors track heart rate, SpO2, and stress levels with 99.8% clinical accuracy.",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
    },
    {
      title: "Infinite Battery",
      description: "Proprietary solar-glass technology extends battery life up to 14 days on a single charge.",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    },
    {
      title: "Hyper-Durable",
      description: "Forged carbon fiber casing ensures resistance against impact, water (50m), and dust.",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
    }
  ];

  return (
    <CategoryTemplate 
      category="Smart Bands"
      title="Unleash Your Potential."
      subtitle="The next evolution of fitness tracking. Lightweight, powerful, and designed to push your limits beyond the horizon."
      heroGradient="bg-gradient-to-br from-slate-900 via-cyan-900 to-blue-900"
      heroImage="https://images.unsplash.com/photo-1557935728-e6d1eaed5539?auto=format&fit=crop&q=80&w=1000"
      accentColor="text-cyan-500"
      features={features}
    />
  );
};