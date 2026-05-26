'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  HiOutlineShoppingBag,
  HiOutlineXMark,
  HiMinus,
  HiPlus,
  HiTrash,
} from 'react-icons/hi2';
import { FaInstagram, FaTiktok } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { useLocale } from '@/context/LocaleContext';

import { formatEGP } from '@/utils/currency';
import type { NavLink, SiteSettings } from '@/types';
import AnnouncementBar from '@/components/AnnouncementBar';
import SearchOverlay from '@/components/SearchOverlay';

const NAV_LINKS: NavLink[] = [
  { label: 'All Fragrances', href: '/collections/all-fragrances' },
  { label: 'Collections', href: '/collections' },
  { label: 'Gift Sets', href: '/collections/gift-sets' },
  { label: 'Our Story', href: '/about' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();
  const { dir } = useLocale();
  const {
    cartItems,
    cartCount,
    cartTotal,
    isCartOpen,
    toggleCart,
    closeCart,
    removeFromCart,
    updateQuantity,
  } = useCart();
  const [announcementText, setAnnouncementText] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings', { next: { revalidate: 60 } })
      .then((res) => res.json())
      .then((data: SiteSettings) => setAnnouncementText(data.announcementText))
      .catch(() => setAnnouncementText(''));
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen || isCartOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen, isCartOpen]);

  const handleMobileToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  return (
    <>
      <AnnouncementBar announcementText={announcementText} />

      {/* Main Header */}
      <header
        className={`sticky top-0 z-50 w-full bg-[#09142E] transition-all duration-300 ${
          isScrolled
            ? 'shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
            : 'border-b border-slate-800/50'
        }`}
        dir={dir}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: Hamburger */}
          <div className="flex flex-1 items-center">
            <button
              onClick={handleMobileToggle}
              className="text-white bg-transparent border-none cursor-pointer p-2"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white hover:text-white transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>

          {/* Center: Logo */}
          <Link href="/" className="bg-transparent flex items-center">
            <Image
              src="/images/logo.png"
              alt="City Fragrance"
              width={150}
              height={70}
              className="h-14 w-auto object-contain bg-transparent mix-blend-screen transition-all duration-300"
              priority
            />
          </Link>

          {/* Right: Search + Cart */}
          <div className="flex flex-1 justify-end items-center gap-1">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-white transition-colors hover:text-white bg-transparent border-none cursor-pointer"
              aria-label="Search products"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>
            <button
              onClick={toggleCart}
              className="relative p-2 text-white transition-colors hover:text-white bg-transparent border-none cursor-pointer"
              aria-label={`Cart (${cartCount} items)`}
            >
              <HiOutlineShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-gold text-navy text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-[0_2px_5px_rgba(197,160,89,0.4)]">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Drawer — slides in from left */}
        <div
          className={`fixed top-0 left-0 w-80 h-full bg-[#09142E] z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          dir={dir}
        >
          <div className="flex justify-between items-center px-4 pt-1.5 pb-0 shrink-0">
            <Link href="/" className="bg-transparent leading-none" onClick={() => setMobileOpen(false)}>
              <Image
                src="/images/checkout-logo.png"
                alt="City Fragrance"
                width={140}
                height={60}
                className="w-[120px] sm:w-[140px] h-auto object-contain bg-transparent mix-blend-screen -my-1.5"
              />
            </Link>
            <button
              onClick={handleMobileToggle}
              className="text-white/70 hover:text-white bg-transparent border-none cursor-pointer p-1 transition-colors"
              aria-label="Close menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="flex-1 px-8 overflow-y-auto">
            <ul className="flex flex-col gap-1">
              <li>
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="block font-heading text-base text-white/80 hover:text-amber-400 transition-colors py-2.5 border-b border-white/5"
                >
                  Home
                </Link>
              </li>
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block font-heading text-base text-white/80 hover:text-amber-400 transition-colors py-2.5 border-b border-white/5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Social links at bottom of drawer */}
          <div className="shrink-0 border-t border-white/10 px-8 py-6">
            <p className="text-xs tracking-[0.2em] text-white/30 font-heading uppercase mb-4 text-center">
              Follow Us
            </p>
            <div className="flex justify-center gap-6">
              <a
                href="https://www.instagram.com/city_fragrance_?igsh=eGJzMnBxejB0NnY5&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 text-xl transition-all duration-300 hover:text-white hover:scale-110"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
              <a
                href="https://www.tiktok.com/@city_fragrance?_r=1&_t=ZS-96bneau2lj2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 text-xl transition-all duration-300 hover:text-white hover:scale-110"
                aria-label="TikTok"
              >
                <FaTiktok />
              </a>
            </div>
          </div>
        </div>

        {/* Drawer Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </header>

      {/* Cart Drawer Backdrop */}
      {isCartOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[2999] animate-[fadeIn_0.2s_ease] cursor-pointer"
          onClick={closeCart}
          aria-hidden="true"
        />
      )}

        {/* Cart Drawer */}
      <div
        className={`fixed top-0 right-0 w-[420px] max-w-full h-full bg-[#09142E] z-[3000] flex flex-col shadow-[-4px_0_40px_rgba(0,0,0,0.5)] transition-transform duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        dir={dir}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-white/10 shrink-0">
          <h2 className="font-heading text-sm font-semibold tracking-[0.1em] uppercase text-white">
            Your Cart{' '}
            <span className="text-gray-400 font-normal">({cartCount})</span>
          </h2>
          <button
            onClick={closeCart}
            className="bg-transparent border-none cursor-pointer text-gray-400 p-2 transition-colors hover:text-gold leading-none"
            aria-label="Close cart"
          >
            <HiOutlineXMark className="text-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <HiOutlineShoppingBag className="text-5xl text-gray-600 mb-4" />
              <p className="font-body text-base text-gray-400">Your cart is empty.</p>
              <button
                onClick={closeCart}
                className="mt-6 font-heading text-xs font-semibold tracking-[0.2em] uppercase text-white border border-white/50 px-8 py-3 rounded-sm bg-transparent cursor-pointer transition-all duration-300 hover:bg-white hover:text-black"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-5">
              {cartItems.map((item) => {
                const price = item.salePrice ?? item.price;
                const mainImage = item.images?.[0] || '/images/product-placeholder.png';
                return (
                  <li key={item.id} className="flex gap-4 pb-5 border-b border-gray-700/50">
                    <div className="shrink-0">
                      <Image
                        src={mainImage}
                        alt={item.name}
                        width={72}
                        height={90}
                        className="rounded-sm object-cover bg-gray-800"
                      />
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <span className="font-heading text-sm font-semibold text-gray-100 tracking-[0.03em] truncate">
                        {item.name}
                      </span>
                      {item.notes && (
                        <span className="font-body text-xs text-gray-400 italic">{item.notes}</span>
                      )}
                      <span className="font-heading text-sm font-bold text-white mt-0.5">
                        {formatEGP(price)}
                      </span>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center border border-gray-600 rounded-sm bg-transparent cursor-pointer text-gray-300 text-xs transition-all duration-200 hover:border-white hover:text-white hover:bg-white/10"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <HiMinus />
                        </button>
                        <span className="min-w-[28px] text-center font-heading text-sm font-semibold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center border border-gray-600 rounded-sm bg-transparent cursor-pointer text-gray-300 text-xs transition-all duration-200 hover:border-white hover:text-white hover:bg-white/10"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <HiPlus />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="ml-auto bg-transparent border-none cursor-pointer text-gray-500 text-xs p-1 transition-colors hover:text-red-400"
                          aria-label={`Remove ${item.name}`}
                        >
                          <HiTrash />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer with totals */}
        {cartItems.length > 0 && (
          <div className="px-6 py-5 border-t border-white/10 shrink-0 bg-[#0c1b3d]">
            <div className="flex justify-between items-center mb-2 font-heading text-xs uppercase tracking-[0.08em] text-gray-400">
              <span>Subtotal</span>
              <span className="text-base font-bold text-white">
                {formatEGP(cartTotal)}
              </span>
            </div>
            <p className="font-body text-[0.65rem] text-gray-500 mb-4 text-center tracking-wider">
              Shipping &amp; taxes calculated at checkout
            </p>
            <Link
              href="/order-payment"
              onClick={closeCart}
              className="w-full flex items-center justify-center py-4 bg-gold text-navy font-heading text-xs font-semibold tracking-[0.15em] uppercase cursor-pointer rounded-sm transition-all duration-300 hover:bg-amber-500 no-underline mb-2"
            >
              Proceed to Checkout
            </Link>
            <button
              onClick={closeCart}
              className="w-full py-3 bg-transparent text-gray-400 border border-gray-600 font-heading text-xs tracking-[0.1em] uppercase cursor-pointer rounded-sm transition-all duration-300 hover:bg-gold hover:text-navy hover:border-gold"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
