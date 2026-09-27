import type { SiteSettings } from '@/types';

export const SITE_DEFAULTS: SiteSettings = {
  heroTitle: 'Celebrate in Luxury & Scent',
  heroSubtitle: 'Eid Al Adha Special',
  heroDescription: 'Exclusive Eid collection — enjoy 20% off on all premium fragrances.',
  announcementText: 'EID AL ADHA SALE UP TO 20% OFF ENDS SOON... SHOP NOW',
  heroBgImage: '/images/hero-banner.png',
  heroBgImageDesktop: '',
  heroVideoUrl: '',
  heroVideoMobile: '',
  moodTitle: 'The Essence of Luxury & Elegance',
  moodSubtitle: 'Discover timeless scents crafted for those who appreciate the finer things in life.',
  moodImage: '/images/hero-banner.png',
  moodImageDesktop: '',
  moodVideoUrl: '',
  moodVideoMobile: '',
  womenCollectionVideoUrl: '',
  menCollectionVideoUrl: '',
  giftSetsVideoUrl: '',
  newArrivalsVideoUrl: '',
  allFragrancesVideoUrl: '',
  oudCollectionVideoUrl: '',
};

export const ALL_SITE_SETTINGS_KEYS: Array<keyof SiteSettings> = [
  'heroTitle', 'heroSubtitle', 'heroDescription', 'announcementText',
  'heroBgImage', 'heroBgImageDesktop', 'heroVideoUrl', 'heroVideoMobile',
  'moodTitle', 'moodSubtitle', 'moodImage', 'moodImageDesktop', 'moodVideoUrl', 'moodVideoMobile',
  'womenCollectionVideoUrl', 'menCollectionVideoUrl',
  'giftSetsVideoUrl', 'newArrivalsVideoUrl', 'allFragrancesVideoUrl', 'oudCollectionVideoUrl',
];

export const SLUG_TO_VIDEO_FIELD: Record<string, string> = {
  'womens-collection': 'womenCollectionVideoUrl',
  'mens-collection': 'menCollectionVideoUrl',
  'gift-sets': 'giftSetsVideoUrl',
  'new-arrivals': 'newArrivalsVideoUrl',
  'all-fragrances': 'allFragrancesVideoUrl',
  'oud-collection': 'oudCollectionVideoUrl',
};
