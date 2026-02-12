import React from 'react';
import { CategoryTemplate } from '../components/CategoryTemplate';

export const SmartBands: React.FC = () => {
  return (
    <CategoryTemplate 
      category="Smart Bands"
      title="Performance Redefined."
      subtitle="Track every beat, step, and calorie with our military-grade biometric sensors. Designed for the athletes of tomorrow."
      heroGradient="bg-gradient-to-r from-blue-900 to-cyan-800"
      accentColor="text-cyan-500"
    />
  );
};