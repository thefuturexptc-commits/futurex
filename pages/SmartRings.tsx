import React from 'react';
import { CategoryTemplate } from '../components/CategoryTemplate';

export const SmartRings: React.FC = () => {
  return (
    <CategoryTemplate 
      category="Smart Rings"
      title="Subtle Intelligence."
      subtitle="The power of a lab on your finger. Titanium crafted, aerospace-grade sensors for sleep, recovery, and readiness tracking."
      heroGradient="bg-gradient-to-r from-purple-900 via-gray-900 to-purple-900"
      accentColor="text-purple-500"
    />
  );
};