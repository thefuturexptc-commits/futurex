import React from 'react';
import { CategoryTemplate } from '../components/CategoryTemplate';

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