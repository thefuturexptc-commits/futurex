import { Product } from './types';

export const MOCK_PRODUCTS: Product[] = [
  // Smart Bands
  {
    id: 'b1',
    name: 'FutureBand X1',
    description: 'The ultimate fitness tracker with holographic display. Experience the future on your wrist with our patented projection technology.',
    price: 7499,
    category: 'bands',
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1551817958-c1e8c728362b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1510017803434-a899398421b3?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.8,
    reviews: 124,
    features: ['Holographic Display', '7-day Battery', 'Waterproof 5ATM', 'AI Coach'],
    specs: { 'Battery': '14 days', 'Screen': 'AMOLED', 'Water Resistance': '5 ATM', 'Strap': 'Silicone' },
    isBestSeller: true
  },
  {
    id: 'b2',
    name: 'FutureBand Pulse',
    description: 'Advanced heart rate monitoring for pros. Keeps track of your vitals with medical-grade accuracy.',
    price: 10999,
    category: 'bands',
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=800',
    images: [
       'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=800',
       'https://images.unsplash.com/photo-1576243345690-8e4b78e69eef?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.6,
    reviews: 89,
    features: ['ECG', 'SpO2', 'GPS', 'Stress Monitoring'],
    specs: { 'Battery': '10 days', 'Sensors': 'Optical Heart Rate, SpO2', 'Connectivity': 'Bluetooth 5.2' },
    isNew: true
  },
  
  // Smart Rings
  {
    id: 'r1',
    name: 'Halo Ring One',
    description: 'Discreet health tracking on your finger. The most stylish way to track sleep and readiness.',
    price: 24999,
    category: 'rings',
    image: 'https://images.unsplash.com/photo-1605304604810-096773738096?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1605304604810-096773738096?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1599643478518-17488fbbcd75?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.9,
    reviews: 210,
    features: ['Sleep Tracking', 'Recovery Score', 'Titanium Body', 'Wireless Charging'],
    specs: { 'Weight': '4g', 'Material': 'Titanium', 'Width': '7.9mm' },
    isBestSeller: true
  },
  {
    id: 'r2',
    name: 'Halo Ring Air',
    description: 'The lightest smart ring ever made. You won\'t even feel it.',
    price: 19999,
    category: 'rings',
    image: 'https://images.unsplash.com/photo-1628194411651-7001d252bb88?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1628194411651-7001d252bb88?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.5,
    reviews: 56,
    features: ['Ultra-light', 'Temperature Sensing', 'Water Resistant'],
    specs: { 'Weight': '2.5g', 'Battery': '5 days', 'Thickness': '2.5mm' }
  },

  // Smart Fans
  {
    id: 'f1',
    name: 'AeroFlow Pro',
    description: 'App-controlled bladeless cooling fan. Silent, safe, and powerful air circulation.',
    price: 16999,
    category: 'fans',
    image: 'https://images.unsplash.com/photo-1565538421045-810a95a88c00?auto=format&fit=crop&q=80&w=800',
    images: [
       'https://images.unsplash.com/photo-1565538421045-810a95a88c00?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.7,
    reviews: 150,
    features: ['Bladeless', 'App Control', 'Voice Assistant', 'HEPA Filter'],
    specs: { 'Noise': '20dB', 'Height': '1m', 'Airflow': '500L/s' }
  },
  {
    id: 'f2',
    name: 'AeroFlow Mini',
    description: 'Portable smart fan for your desk. Keep cool while you work.',
    price: 4999,
    category: 'fans',
    image: 'https://images.unsplash.com/photo-1535581652167-3d6b98c0b59c?auto=format&fit=crop&q=80&w=800',
    images: [
        'https://images.unsplash.com/photo-1535581652167-3d6b98c0b59c?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.4,
    reviews: 45,
    features: ['USB-C', 'Portable', 'Quiet Mode'],
    specs: { 'Battery': '8 hours', 'Size': 'Compact', 'Weight': '300g' }
  },

  // Smart Monitoring
  {
    id: 'm1',
    name: 'MediGuard Hub',
    description: 'Central hub for home health monitoring. Keeps your family safe.',
    price: 12499,
    category: 'monitoring',
    image: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.8,
    reviews: 78,
    features: ['Fall Detection', 'SOS Alert', 'Vitals Sync', '2-way Audio'],
    specs: { 'Connectivity': 'Wi-Fi/LTE', 'Backup': '24h', 'Range': '100m' }
  },
  {
    id: 'm2',
    name: 'VitalSense Patch',
    description: 'Continuous glucose and vitals monitoring patch. Painless and accurate.',
    price: 7999,
    category: 'monitoring',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800',
    images: [
       'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800'
    ],
    rating: 4.9,
    reviews: 312,
    features: ['14-day wear', 'Waterproof', 'Real-time Alerts'],
    specs: { 'Type': 'CGM', 'App': 'Included', 'Waterproof': 'IP68' },
    isBestSeller: true
  }
];

export const CATEGORIES = [
  { id: 'bands', name: 'Smart Bands', path: '/products/bands' },
  { id: 'rings', name: 'Smart Rings', path: '/products/rings' },
  { id: 'fans', name: 'Smart Fans', path: '/products/fans' },
  { id: 'monitoring', name: 'Smart Monitoring', path: '/products/monitoring' },
];