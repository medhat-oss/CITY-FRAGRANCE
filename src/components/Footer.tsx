'use client';

import Link from 'next/link';
import {
  HiOutlineEnvelope,
} from 'react-icons/hi2';
import {
  FaInstagram,
  FaTiktok,
  FaCcVisa,
  FaCcMastercard,
  FaCcAmex,
  FaCcPaypal,
  FaCcApplePay,
} from 'react-icons/fa';
import { useLocale } from '@/context/LocaleContext';

interface FooterLink {
  label: string;
  href: string;
}

const QUICK_LINKS: FooterLink[] = [
  { label: 'Our Story', href: '/about' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Store Locator', href: '/stores' },
];

const COLLECTION_LINKS: FooterLink[] = [
  { label: 'New Arrivals', href: '/collections/new-arrivals' },
  { label: 'All Fragrances', href: '/collections/all-fragrances' },
  { label: 'Oud Collection', href: '/collections/oud-collection' },
  { label: "Men's Collection", href: '/collections/mens-collection' },
  { label: "Women's Collection", href: '/collections/womens-collection' },
  { label: 'Gift Sets', href: '/collections/gift-sets' },
];

export default function Footer() {
  const { dir } = useLocale();

  return (
    <footer className="bg-navy dark:bg-[#09142E] text-white" dir={dir}>
      <div className="max-w-container mx-auto px-4 sm:px-8 py-16">
        {/* Top Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1.5fr_1fr_1fr] gap-8 lg:gap-16 mb-12 pb-8 border-b border-white/10">
          {/* Brand */}
          <div>
            <h3 className="font-heading text-2xl sm:text-3xl font-light tracking-[0.1em] mb-1">
              CITY FRAGRANCE
            </h3>
            <p className="font-heading text-xs tracking-[0.25em] text-gold uppercase mb-4">
              Luxury Perfumes
            </p>
            <p className="font-body text-sm text-white/70 leading-relaxed">
              Experience the true essence of Middle Eastern luxury with our
              exclusive collection of expertly crafted, long-lasting fragrances.
            </p>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-heading text-lg font-normal tracking-[0.05em] mb-4">
              Join the World of City Fragrance
            </h4>
            <p className="font-body text-sm text-white/70 mb-6">
              Subscribe for exclusive access to new collections and special offers.
            </p>
            <form
              className="flex"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Email Address"
                required
                className="flex-1 px-4 py-3 bg-white/5 border border-white/20 text-white font-body text-base rounded-l-sm placeholder:text-white/40 focus:outline-none focus:border-gold transition-colors"
              />
              <button
                type="submit"
                className="px-6 bg-gold text-navy border border-gold font-heading font-semibold uppercase tracking-[0.1em] cursor-pointer transition-colors hover:bg-gold-hover rounded-r-sm flex items-center"
              >
                <HiOutlineEnvelope className="text-lg" />
              </button>
            </form>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-lg font-normal tracking-[0.05em] mb-4">
              Quick Links
            </h4>
            <ul className="flex flex-col gap-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch="auto"
                    className="font-body text-sm text-white/70 transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Social icons within Quick Links column */}
            <div className="flex items-center gap-5 mt-6 pt-6 border-t border-white/10">
              <a
                href="https://www.instagram.com/city_fragrance_?igsh=eGJzMnBxejB0NnY5&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 text-xl transition-colors duration-300 hover:text-amber-500"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
              <a
                href="https://www.tiktok.com/@city_fragrance?_r=1&_t=ZS-96bneau2lj2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 text-xl transition-colors duration-300 hover:text-amber-500"
                aria-label="TikTok"
              >
                <FaTiktok />
              </a>
            </div>
          </div>

          {/* Collections */}
          <div>
            <h4 className="font-heading text-lg font-normal tracking-[0.05em] mb-4">
              Collections
            </h4>
            <ul className="flex flex-col gap-3">
              {COLLECTION_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch="auto"
                    className="font-body text-sm text-white/70 transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 text-white/50 text-sm">
          <p className="font-body text-xs">
            &copy; {new Date().getFullYear()} City Fragrance. All rights reserved.
          </p>

          <div className="flex items-center gap-4 text-xl text-white/30">
            <FaCcVisa />
            <FaCcMastercard />
            <FaCcAmex />
            <FaCcPaypal />
            <FaCcApplePay />
          </div>


        </div>
      </div>
    </footer>
  );
}
