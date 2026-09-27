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
import DisclaimerModal from '@/components/DisclaimerModal';

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


const SITE_URL = 'https://city-fragrance.malk35t-754.workers.dev';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: 'City Fragrance | سيتي فراجرانس — أرقى العطور الفاخرة في مصر',
    template: '%s | City Fragrance | سيتي فراجرانس',
  },

  description:
    'City Fragrance — سيتي فراجرانس: متجر سيتي فراجرانس لأرقى العطور الفاخرة في مصر. تشكيلة واسعة من العطور الشرقية والغربية، تركيبات عطور حصرية، وهدايا عطور فاخرة مع توصيل سريع لجميع محافظات مصر. Discover luxury perfumes & exclusive gift sets with fast delivery across Egypt.',

  keywords: [
    'City Fragrance',
    'cityfragrance',
    'سيتي فراجرانس',
    'سيتي فرجرانس',
    'سيتي فريجرنس',
    'عطور سيتي فراجرانس',
    'متجر سيتي فراجرانس',
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
    'perfumes Egypt',
  ],

  authors: [{ name: 'City Fragrance', url: SITE_URL }],
  creator: 'City Fragrance',
  publisher: 'City Fragrance',

  applicationName: 'City Fragrance',

  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png', sizes: '192x192' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
    other: [
      { rel: 'icon', url: '/icon-96x96.png', sizes: '96x96' },
      { rel: 'icon', url: '/icon-144x144.png', sizes: '144x144' },
    ],
  },

  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    alternateLocale: 'en_US',
    siteName: 'City Fragrance',
    title: 'City Fragrance | سيتي فراجرانس — أرقى العطور الفاخرة في مصر',
    description:
      'City Fragrance — سيتي فراجرانس: اكتشف أرقى العطور الفاخرة في مصر. تشكيلة من العطور الشرقية والغربية وهدايا عطور فاخرة مع توصيل سريع. Discover luxury fragrances & premium gift sets with fast delivery across Egypt.',
    url: SITE_URL,
    images: [
      {
        url: '/images/hero-banner.png',
        width: 1200,
        height: 630,
        alt: 'City Fragrance – سيتي فراجرانس | Luxury Perfumes & Gift Sets in Egypt',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'City Fragrance | سيتي فراجرانس — أرقى العطور الفاخرة في مصر',
    description:
      'City Fragrance — سيتي فراجرانس: اكتشف أرقى العطور الفاخرة في مصر. توصيل سريع لجميع محافظات مصر. Discover luxury fragrances with fast delivery across Egypt.',
    images: ['/images/hero-banner.png'],
  },

  other: {
    'apple-mobile-web-app-title': 'City Fragrance',
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
    canonical: SITE_URL,
  },

  verification: {
    google: 'wiAB8QoAirgX6oto6W55SU5KGX9ZhXT3JEV1Td5On5A',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="ltr" suppressHydrationWarning data-scroll-behavior="smooth" className={`dark ${instrumentSans.variable} ${jost.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${SITE_URL}/#organization`,
                  name: "City Fragrance",
                  alternateName: "سيتي فراجرانس",
                  url: SITE_URL,
                  logo: `${SITE_URL}/images/CF.jpeg`,
                  description: "متجر عطور فاخرة في مصر — Luxury Perfumes & Gift Sets in Egypt",
                  foundingLocation: "Egypt",
                  areaServed: "EG",
                },
                {
                  "@type": "WebSite",
                  "@id": `${SITE_URL}/#website`,
                  url: SITE_URL,
                  name: "City Fragrance",
                  publisher: { "@id": `${SITE_URL}/#organization` },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
        <ThemeProvider>
          <LocaleProvider>
            <CartProvider>
              <ProductsProvider>
                {children}
                <WhatsAppButton />
                <ScrollToTop />
                <DisclaimerModal />
              </ProductsProvider>
            </CartProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
