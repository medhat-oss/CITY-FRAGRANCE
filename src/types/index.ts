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
  videoUrl?: string;
  badge: string;
  collection?: string;
  collections?: string[];
  isDraft?: boolean;
  description?: string;
  stock?: number;
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
  source?: string;
  cashierId?: string;
  createdAt?: string;
}

export interface Shift {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime?: string | null;
  status: string;
  totalCash: number;
  totalInstaPay: number;
  totalVodafoneCash: number;
  totalVisa: number;
  actualCash?: number | null;
  expectedTotal?: number | null;
  discrepancy?: number | null;
  orderCount: number;
  createdAt?: string;
}

export type CollectionSlug = 'new-arrivals' | 'all-fragrances' | 'oud-collection' | 'mens-collection' | 'womens-collection' | 'gift-sets';

export interface CollectionData {
  image: string;
  description: string;
  videoUrl?: string;
}

export type CollectionImages = Record<CollectionSlug, CollectionData>;

export interface SiteSettings {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  announcementText: string;
  heroBgImage: string;
  heroBgImageDesktop: string;
  heroVideoUrl: string;
  moodTitle: string;
  moodSubtitle: string;
  moodImage: string;
  moodImageDesktop: string;
  moodVideoUrl: string;
  womenCollectionVideoUrl?: string;
  menCollectionVideoUrl?: string;
  giftSetsVideoUrl?: string;
  newArrivalsVideoUrl?: string;
  allFragrancesVideoUrl?: string;
  oudCollectionVideoUrl?: string;
}
