import React from 'react';
import { CategoryTemplate } from '../components/CategoryTemplate';

export const SmartMonitoring: React.FC = () => {
  const features = [
    {
      title: "Clinical Accuracy",
      description: "FDA-cleared sensors provide medical-grade data on BP, ECG, and blood glucose trends.",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    },
    {
      title: "Instant Doctor Sync",
      description: "Automatically share vital reports with your healthcare provider in real-time.",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    },
    {
      title: "Family Connect",
      description: "Monitor the health of your loved ones remotely with peace of mind alerts.",
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    }
  ];

  return (
    <CategoryTemplate 
      category="Smart Monitoring"
      title="Proactive Health."
      subtitle="Take control of your well-being with lab-quality diagnostics in the comfort of your home. Prevention starts here."
      heroGradient="bg-gradient-to-br from-rose-900 via-red-900 to-orange-900"
      heroImage="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1000"
      accentColor="text-rose-400"
      features={features}
    />
  );
};