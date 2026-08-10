export interface ProductVariation {
  id: string;
  size?: string;
  weight?: string;
  color?: string;
  price: number;
  stock: number;
}

export interface ProductColor {
  name: string;
  hex: string;
  images: string[];
  stock: number;
  reservedStock: number;
  sold: number;
}

export interface ProductVariantOption {
  colorName: string;
  colorHex: string;
  price: number;
  images: string[];
  sizes: Array<{ size: string; stock: number }>;
  // Backward-compatible aliases for old data
  color?: string;
  hex?: string;
  size?: string;
  stock?: number;
  videoUrl?: string;
}

export interface ProductPublicReview {
  id?: string;
  productId?: string;
  name: string;
  rating: number;
  date?: string;
  comment: string;
  images?: string[];
  userId?: string;
  userEmail?: string;
  verifiedBuyer?: boolean;
}

export interface ProductNotifyRequest {
  id: string;
  productId: string;
  productName: string;
  contact: string;
  contactType: 'email' | 'phone';
  userId?: string;
  userEmail?: string;
  userName?: string;
  selectedColorName?: string;
  createdAt: string;
}

export interface OfferLead {
  id: string;
  name?: string;
  phone: string;
  source: 'home_popup' | 'product_offer';
  couponCodes: string[];
  message?: string;
  productId?: string;
  productName?: string;
  createdAt: string;
}

export interface SupportChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'admin';
  text: string;
  timestamp: string;
  type?: 'text' | 'products' | 'loading_products' | 'compare';
  products?: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
    isNew?: boolean;
    image?: string;
    warranty?: string;
    battery?: string;
  }>;
  compareProducts?: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
    warranty?: string;
    battery?: string;
  }>;
}

export interface SupportChatSession {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  status: 'open' | 'resolved';
  satisfied: boolean;
  lastMessageAt: string;
  createdAt: string;
  messages: SupportChatMessage[];
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  category: string;
  description: string;
  mrp: number;
  salePrice: number;
  price: number;
  stock: number;
  reservedStock: number;
  sold: number;
  weight?: string;
  bandType?: string;
  modelNumber?: string;
  modelNumbers?: string[];
  searchKeywords?: string[];
  colors?: ProductColor[];
  inStock: boolean;
  images: string[];
  imagesByColor?: Record<string, string[]>;
  videoByColor?: Record<string, string>;
  prices?: Record<string, number>;
  variants?: ProductVariantOption[];
  defaultVariant?: string;
  reviews?: ProductPublicReview[];
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  variations?: ProductVariation[];
  rating?: number;
  reviewCount?: number;

  // Compatibility fields currently used in non-admin pages.
  videoUrl?: string;
  features: string[];
  specs: Record<string, string>;
  warranty?: string;
  quantity?: number;
  selectedColorName?: string;
  selectedColorHex?: string;
  selectedSize?: string;
  flipkartUrl?: string;
  marketplaceLinks?: Array<{ label: string; url: string }>;
}

export const AVAILABLE_COLORS = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#FFFFFF" },
  { name: "Silver", value: "#C0C0C0" },
  { name: "Gold", value: "#D4AF37" },
  { name: "Blue", value: "#2563EB" },
  { name: "Pink", value: "#EC4899" },
  { name: "Green", value: "#10B981" }
];

export interface CartItem extends Product {
  quantity: number;
}

export type UserRole = "superadmin" | "admin" | "user";

export interface UserPermissions {
  analytics?: boolean;
  products?: boolean;
  orders?: boolean;
  inventory?: boolean;
  categories?: boolean;
  admins?: boolean;
  settings?: boolean;
  support?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  addresses?: Address[];
  phone?: string;
  permissions?: UserPermissions;
}

export interface Address {
  id: string;
  street: string;
  city: string;
  zip: string;
  country: string;
}

export interface CheckoutShippingDetails {
  name: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface CheckoutFlowState {
  shippingDetails: CheckoutShippingDetails;
  phone: string;
  phoneVerified?: boolean;
  preferredPayment?: 'emi';
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
  date: string;
  shippingAddress: Address;
  phoneNumber?: string;
  paymentStatus?: 'Pending' | 'Paid' | 'Failed';
  paymentMethod?: 'online' | 'cod';
  shippingDetails?: CheckoutShippingDetails;
  createdAt?: string;
  orderSource?: string;
  couponCode?: string;
  couponDiscount?: number;
  originalSubtotal?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  trackingId?: string;
  trackingUrl?: string;
  trackingCarrier?: string;
  trackingUpdatedAt?: string;
}

export type SiteAnalyticsEventName =
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'add_shipping_info'
  | 'add_payment_info'
  | 'purchase'
  | 'login'
  | 'location_update';

export interface SiteAnalyticsEvent {
  id: string;
  event: SiteAnalyticsEventName;
  timestamp: string;
  sessionId: string;
  userId?: string;
  pagePath?: string;
  pageTitle?: string;
  pageLocation?: string;
  productId?: string;
  productName?: string;
  productCategory?: string;
  value?: number;
  quantity?: number;
  orderId?: string;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
  isLoggedIn?: boolean;
  userEmail?: string;
  userPhone?: string;
  referrer?: string;
  city?: string;
  region?: string;
  country?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  locationSource?: 'detected' | 'lookup' | 'checkout' | 'precise';
}

export interface WebsiteSettings {
  primaryColor: string; // Hex code
  logoUrl?: string; // URL for the custom brand logo
  socialLinks?: {
    email?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
  };
  footerSections?: Array<{
    title: string;
    items: string[];
  }>;
  pageContent?: Record<string, string>;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published';
  updatedAt: string;
}

export type Theme = 'light' | 'dark';
