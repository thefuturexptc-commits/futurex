import { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Aura Band X1',
    price: 149,
    description: 'The ultimate fitness companion with ECG, SpO2, and 14-day battery life.',
    category: 'Smart Bands',
    images: ['https://picsum.photos/id/1/800/800', 'https://picsum.photos/id/2/800/800'],
    features: ['Always-on Retina Display', 'Water resistant 50m', 'Sleep Tracking'],
    specs: { Battery: '14 Days', Display: '1.4" AMOLED', Weight: '24g' },
    stock: 50,
    isFeatured: true,
    isBestSeller: true,
    rating: 4.8,
    reviewCount: 1240
  },
  {
    id: 'p2',
    name: 'Aura Ring Halo',
    price: 299,
    description: 'Discreet health tracking wrapped in titanium. Monitor sleep and readiness scores.',
    category: 'Smart Rings',
    images: ['https://picsum.photos/id/3/800/800', 'https://picsum.photos/id/4/800/800'],
    features: ['Titanium Body', '7 Days Battery', 'Heart Rate Variability'],
    specs: { Material: 'Titanium', Width: '8mm', WaterResistant: '100m' },
    stock: 20,
    isFeatured: true,
    rating: 4.9,
    reviewCount: 850
  },
  {
    id: 'p3',
    name: 'Aura Breeze Pro',
    price: 199,
    description: 'Smart bladeless fan with HEPA purification and app control.',
    category: 'Smart Fans',
    images: ['https://picsum.photos/id/5/800/800'],
    features: ['HEPA H13 Filter', 'Quiet Mode', 'Voice Control'],
    specs: { Height: '1m', Noise: '20dB', Airflow: '300L/s' },
    stock: 15,
    rating: 4.7,
    reviewCount: 320
  },
  {
    id: 'p4',
    name: 'Aura Vitals Monitor',
    price: 89,
    description: 'Clinical grade blood pressure and heart rate monitor for home use.',
    category: 'Smart Monitoring',
    images: ['https://picsum.photos/id/6/800/800'],
    features: ['Wi-Fi Sync', 'Multi-user Support', 'Irregular Heartbeat Detection'],
    specs: { Accuracy: '+-3mmHg', Memory: '200 Readings', Connectivity: 'Bluetooth/WiFi' },
    stock: 100,
    rating: 4.6,
    reviewCount: 410
  },
  {
    id: 'p5',
    name: 'Aura Band Lite',
    price: 49,
    description: 'Essential tracking for everyday fitness enthusiasts.',
    category: 'Smart Bands',
    images: ['https://picsum.photos/id/7/800/800'],
    features: ['Step Counting', 'Notifications', '5 Days Battery'],
    specs: { Battery: '5 Days', Display: '0.9" OLED', Weight: '18g' },
    stock: 200,
    isBestSeller: true,
    rating: 4.5,
    reviewCount: 2200
  }
];
