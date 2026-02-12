import React from 'react';
import { CategoryTemplate } from '../components/CategoryTemplate';

export const SmartMonitoring: React.FC = () => {
  return (
    <CategoryTemplate 
      category="Smart Monitoring"
      title="Precision Health."
      subtitle="Clinical-grade accuracy at home. Monitor blood pressure, heart rhythm, and vital signs with real-time doctor connectivity."
      heroGradient="bg-gradient-to-r from-rose-900 to-red-800"
      accentColor="text-rose-500"
    />
  );
};