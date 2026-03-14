export const PRODUCT_ASSET_TOKENS = {
  AURA_BAND_X1: "/images/aura-band-x1.jpg",
  AURA_BAND_LITE: "/images/aura-band-lite.jpg",
  AURA_RING_HALO: "/images/aura-ring-halo.png",
  AURA_BREEZE_PRO: "/images/aura-breeze-pro.jpg",
  AURA_VITALS_MONITOR: "/images/aura-vitals-monitor.jpg",
};

export const PRODUCT_CATALOG = [
  {
    id: "p1",
    name: "Aura Band X1",
    mrp: 199,
    salePrice: 149,
    price: 149,
    description: "The ultimate fitness companion with ECG, SpO2, and 14-day battery life.",
    category: "Smart Bands",
    images: [PRODUCT_ASSET_TOKENS.AURA_BAND_X1, PRODUCT_ASSET_TOKENS.AURA_BAND_X1],
    features: ["Always-on Retina Display", "Water resistant 50m", "Sleep Tracking"],
    specs: { Battery: "14 Days", Display: '1.4" AMOLED', Weight: "24g" },
    stock: 50,
    reservedStock: 0,
    sold: 0,
    inStock: true,
    colors: [
      { name: "Black", hex: "#111827", images: [PRODUCT_ASSET_TOKENS.AURA_BAND_X1], stock: 30, reservedStock: 0, sold: 0 },
      { name: "Blue", hex: "#2563eb", images: [PRODUCT_ASSET_TOKENS.AURA_BAND_X1], stock: 20, reservedStock: 0, sold: 0 }
    ],
    weight: "24g",
    isFeatured: true,
    isBestSeller: true,
    rating: 4.8,
    reviewCount: 1240
  },
  {
    id: "p2",
    name: "Aura Ring Halo",
    mrp: 349,
    salePrice: 299,
    price: 299,
    description: "Discreet health tracking wrapped in titanium. Monitor sleep and readiness scores.",
    category: "Smart Rings",
    images: [PRODUCT_ASSET_TOKENS.AURA_RING_HALO, PRODUCT_ASSET_TOKENS.AURA_RING_HALO],
    features: ["Titanium Body", "7 Days Battery", "Heart Rate Variability"],
    specs: { Material: "Titanium", Width: "8mm", WaterResistant: "100m" },
    stock: 20,
    reservedStock: 0,
    sold: 0,
    inStock: true,
    colors: [
      { name: "Black", hex: "#111827", images: [PRODUCT_ASSET_TOKENS.AURA_RING_HALO], stock: 8, reservedStock: 0, sold: 0 },
      { name: "Silver", hex: "#9ca3af", images: [PRODUCT_ASSET_TOKENS.AURA_RING_HALO], stock: 7, reservedStock: 0, sold: 0 },
      { name: "Gold", hex: "#d4af37", images: [PRODUCT_ASSET_TOKENS.AURA_RING_HALO], stock: 5, reservedStock: 0, sold: 0 }
    ],
    weight: "8g",
    isFeatured: true,
    rating: 4.9,
    reviewCount: 850
  },
  {
    id: "p3",
    name: "Aura Breeze Pro",
    mrp: 249,
    salePrice: 199,
    price: 199,
    description: "Smart bladeless fan with HEPA purification and app control.",
    category: "Smart Fans",
    images: [PRODUCT_ASSET_TOKENS.AURA_BREEZE_PRO],
    features: ["HEPA H13 Filter", "Quiet Mode", "Voice Control"],
    specs: { Height: "1m", Noise: "20dB", Airflow: "300L/s" },
    stock: 15,
    reservedStock: 0,
    sold: 0,
    inStock: true,
    colors: [
      { name: "White", hex: "#f3f4f6", images: [PRODUCT_ASSET_TOKENS.AURA_BREEZE_PRO], stock: 15, reservedStock: 0, sold: 0 }
    ],
    rating: 4.7,
    reviewCount: 320
  },
  {
    id: "p4",
    name: "Aura Vitals Monitor",
    mrp: 119,
    salePrice: 89,
    price: 89,
    description: "Clinical grade blood pressure and heart rate monitor for home use.",
    category: "Smart Monitoring",
    images: [PRODUCT_ASSET_TOKENS.AURA_VITALS_MONITOR],
    features: ["Wi-Fi Sync", "Multi-user Support", "Irregular Heartbeat Detection"],
    specs: { Accuracy: "+-3mmHg", Memory: "200 Readings", Connectivity: "Bluetooth/WiFi" },
    stock: 100,
    reservedStock: 0,
    sold: 0,
    inStock: true,
    colors: [
      { name: "White", hex: "#f3f4f6", images: [PRODUCT_ASSET_TOKENS.AURA_VITALS_MONITOR], stock: 100, reservedStock: 0, sold: 0 }
    ],
    rating: 4.6,
    reviewCount: 410
  },
  {
    id: "p5",
    name: "Aura Band Lite",
    mrp: 79,
    salePrice: 49,
    price: 49,
    description: "Essential tracking for everyday fitness enthusiasts.",
    category: "Smart Bands",
    images: [PRODUCT_ASSET_TOKENS.AURA_BAND_LITE],
    features: ["Step Counting", "Notifications", "5 Days Battery"],
    specs: { Battery: "5 Days", Display: '0.9" OLED', Weight: "18g" },
    stock: 200,
    reservedStock: 0,
    sold: 0,
    inStock: true,
    colors: [
      { name: "Black", hex: "#111827", images: [PRODUCT_ASSET_TOKENS.AURA_BAND_LITE], stock: 120, reservedStock: 0, sold: 0 },
      { name: "Pink", hex: "#ec4899", images: [PRODUCT_ASSET_TOKENS.AURA_BAND_LITE], stock: 45, reservedStock: 0, sold: 0 },
      { name: "Green", hex: "#10b981", images: [PRODUCT_ASSET_TOKENS.AURA_BAND_LITE], stock: 35, reservedStock: 0, sold: 0 }
    ],
    weight: "18g",
    isBestSeller: true,
    rating: 4.5,
    reviewCount: 2200
  }
];
