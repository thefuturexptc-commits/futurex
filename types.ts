export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  images: string[];
  videoUrl?: string;
  features: string[];
  specs: Record<string, string>;
  stock: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  rating: number;
  reviewCount: number;
  warranty?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  addresses: Address[];
}

export interface Address {
  id: string;
  street: string;
  city: string;
  zip: string;
  country: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: string;
  shippingAddress: Address;
}

export interface WebsiteSettings {
  primaryColor: string; // Hex code
  logoUrl?: string; // URL for the custom brand logo
}

export type Theme = 'light' | 'dark';
