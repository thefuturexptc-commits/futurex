import React from 'react';
import { CategoryTemplate } from '../components/CategoryTemplate';

export const SmartRings: React.FC = () => {
  const features = [
    {
      title: "Invisible Tech",
      description: "All the power of a smartwatch packed into a discreet, aerospace-grade titanium ring.",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12a8 8 0 11-16 0 8 8 0 0116 0z" /></svg>
    },
    {
      title: "Sleep Mastery",
      description: "Advanced sleep staging and recovery analysis to help you wake up refreshed every day.",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
    },
    {
      title: "NFC Payments",
      description: "Leave your wallet at home. Tap to pay securely anywhere contactless is accepted.",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
    }
  ];

  return (
    <CategoryTemplate 
      category="Smart Rings"
      title="Wellness, Simplified."
      subtitle="Elegance meets intelligence. Monitor your vital signs 24/7 without screens, vibrations, or distractions."
      heroGradient="bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900"
      heroImage="https://images.unsplash.com/photo-1622434641406-a15810545064?auto=format&fit=crop&q=80&w=1000"
      accentColor="text-purple-400"
      features={features}
    />
  );
};