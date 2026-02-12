import React from 'react';
import { CategoryTemplate } from '../components/CategoryTemplate';

export const SmartFans: React.FC = () => {
  return (
    <CategoryTemplate 
      category="Smart Fans"
      title="Pure Air. Pure Silence."
      subtitle="Bladeless technology meets HEPA H13 purification. Control your environment's climate with voice commands or AI automation."
      heroGradient="bg-gradient-to-r from-teal-800 to-emerald-900"
      accentColor="text-emerald-500"
    />
  );
};