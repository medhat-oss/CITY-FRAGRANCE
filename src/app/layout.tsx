import type { ReactNode } from 'react';
import { Instrument_Sans, Jost } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { LocaleProvider } from '@/context/LocaleContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProductsProvider } from '@/hooks/useProducts';
import WhatsAppButton from '@/components/WhatsAppButton';

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

export const metadata = {
  title: 'City Fragrance - Luxury Perfumes',
  description:
    'Discover luxurious fragrances that capture the essence of elegance and sophistication. Shop City Fragrance for premium Middle Eastern inspired perfumes.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`dark ${instrumentSans.variable} ${jost.variable}`}>
      <body>
        <ThemeProvider>
          <LocaleProvider>
            <CartProvider>
              <ProductsProvider>
                {children}
                <WhatsAppButton />
              </ProductsProvider>
            </CartProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
