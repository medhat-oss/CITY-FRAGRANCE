export interface Product {
  id: string;
  name: string;
  type: string;
  category: string;
  topNotes: string;
  middleNotes: string;
  baseNotes: string;
  price: number;
  salePrice: number | null;
  images: string[];
  badge: string;
  collection?: string;
  description?: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface LocaleConfig {
  locale: string;
  dir: 'ltr' | 'rtl';
}

export type CartItem = Product & { quantity: number };

export interface Order {
  orderId: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  address: string;
  apartment: string;
  city: string;
  governorate: string;
  items: { name: string; quantity: number; price: number }[];
  totalPrice: number;
  status: string;
  date: string;
  paymentMethod?: string;
}

export type CollectionSlug = 'new-arrivals' | 'all-fragrances' | 'oud-collection' | 'mens-collection' | 'womens-collection' | 'gift-sets';

export interface CollectionData {
  image: string;
  description: string;
}

export type CollectionImages = Record<CollectionSlug, CollectionData>;

export interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  announcementText: string;
  heroBgImage: string;
  moodTitle: string;
  moodSubtitle: string;
  moodImage: string;
}
