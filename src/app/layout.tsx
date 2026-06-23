import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Instrument_Sans, Jost } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { LocaleProvider } from '@/context/LocaleContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProductsProvider } from '@/hooks/useProducts';
import WhatsAppButton from '@/components/WhatsAppButton';
import ScrollToTop from '@/components/ScrollToTop';

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'],
});

const jost = Jost({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
});


export const metadata: Metadata = {
  metadataBase: new URL('https://city-fragrance-medhat-oss-projects.vercel.app'),

  title: {
    default: 'City Fragrance | Luxury Perfumes & Gift Sets in Egypt',
    template: '%s | City Fragrance',
  },

  description:
    'اكتشف أرقى العطور الفاخرة في مصر مع City Fragrance. تشكيلة واسعة من العطور الشرقية والغربية، تركيبات عطور حصرية، وهدايا عطور فاخرة مع توصيل سريع لجميع محافظات مصر. Discover luxury perfumes & exclusive gift sets with fast delivery across Egypt.',

  keywords: [
    'City Fragrance',
    'perfumes Egypt',
    'عطور فاخرة',
    'عطور مصر',
    'تركيبات عطور',
    'هدايا عطور',
    'عطور شرقية',
    'عطور غربية',
    'بخور فاخر',
    'luxury perfumes Egypt',
    'Egyptian perfume store',
    'gift sets Egypt',
    'oud perfume Egypt',
    'عطر عود',
    'محلات عطور مصر',
    'سيتي فراجرانس',
  ],

  authors: [{ name: 'City Fragrance', url: 'https://city-fragrance-medhat-oss-projects.vercel.app' }],
  creator: 'City Fragrance',
  publisher: 'City Fragrance',

  icons: {
    icon: '/images/CF.jpeg',
    shortcut: '/images/CF.jpeg',
    apple: '/images/CF.jpeg',
  },

  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    alternateLocale: 'en_US',
    siteName: 'City Fragrance',
    title: 'City Fragrance | Luxury Perfumes & Gift Sets in Egypt',
    description:
      'اكتشف أرقى العطور الفاخرة في مصر. تشكيلة من العطور الشرقية والغربية وهدايا عطور فاخرة مع توصيل سريع. Discover luxury fragrances & premium gift sets with fast delivery across Egypt.',
    url: 'https://city-fragrance-medhat-oss-projects.vercel.app',
    images: [
      {
        url: '/images/hero-banner.png',
        width: 1200,
        height: 630,
        alt: 'City Fragrance – Luxury Perfumes & Gift Sets in Egypt',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'City Fragrance | Luxury Perfumes & Gift Sets in Egypt',
    description:
      'اكتشف أرقى العطور الفاخرة في مصر. توصيل سريع لجميع محافظات مصر. Discover luxury fragrances with fast delivery across Egypt.',
    images: ['/images/hero-banner.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: 'https://city-fragrance-medhat-oss-projects.vercel.app',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning data-scroll-behavior="smooth" className={`dark ${instrumentSans.variable} ${jost.variable}`}>
      <body>
        <ThemeProvider>
          <LocaleProvider>
            <CartProvider>
              <ProductsProvider>
                {children}
                <WhatsAppButton />
                <ScrollToTop />
              </ProductsProvider>
            </CartProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
