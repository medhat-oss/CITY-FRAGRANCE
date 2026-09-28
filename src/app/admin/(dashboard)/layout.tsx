'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './admin.module.css';
import Link from 'next/link';
import { FaBars, FaTimes } from 'react-icons/fa';
import AdminSidebarUser from '@/components/AdminSidebarUser';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeDrawer = () => setIsMobileSidebarOpen(false);

  return (
    <div className="flex min-h-screen w-full max-w-full bg-[#111B3D] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-[260px] shrink-0 hidden md:flex flex-col bg-[#16234D] border-r border-[#1d3573] px-5 py-6">
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <Link href="/admin" className="flex flex-col items-center group no-underline">
            <Image
              src="/images/admin-logo.png"
              alt="City Fragrance Logo"
              width={180}
              height={48}
              className="w-[160px] h-auto object-contain mix-blend-screen transition-opacity group-hover:opacity-90"
              priority
            />
            <span className="font-heading text-[10px] font-semibold text-slate-400 tracking-[0.3em] uppercase mt-2">
              ADMIN PANEL
            </span>
          </Link>
        </div>
        <nav className="flex flex-col gap-1.5 flex-1">
          <Link href="/admin" className="flex items-center px-4 py-3 text-white/75 rounded hover:bg-white hover:text-[#11224D] transition-all text-sm font-medium" onClick={closeDrawer}>
            Products Management
          </Link>
          <Link href="/admin/settings" className="flex items-center px-4 py-3 text-white/75 rounded hover:bg-white hover:text-[#11224D] transition-all text-sm font-medium" onClick={closeDrawer}>
            Site Customization
          </Link>
          <Link href="/admin/orders" className="flex items-center px-4 py-3 text-white/75 rounded hover:bg-white hover:text-[#11224D] transition-all text-sm font-medium" onClick={closeDrawer}>
            Orders
          </Link>
          <Link href="/admin/gift-sets" className="flex items-center px-4 py-3 text-white/75 rounded hover:bg-white hover:text-[#11224D] transition-all text-sm font-medium" onClick={closeDrawer}>
            Gift Sets
          </Link>
          <Link href="/admin/analytics" className="flex items-center px-4 py-3 text-white/75 rounded hover:bg-white hover:text-[#11224D] transition-all text-sm font-medium" onClick={closeDrawer}>
            Analytics & Inventory
          </Link>
          <Link href="/admin/staff" className="flex items-center px-4 py-3 text-white/75 rounded hover:bg-white hover:text-[#11224D] transition-all text-sm font-medium" onClick={closeDrawer}>
            Manage Staff
          </Link>
          <Link href="/" className="flex items-center px-4 py-3 text-white/75 rounded hover:bg-white hover:text-[#11224D] transition-all text-sm font-medium" onClick={closeDrawer}>
            Back to Store
          </Link>
        </nav>
        <AdminSidebarUser />
      </aside>

      {/* Mobile Top Header: visible on mobile, hidden on md+ */}
      <header className={`flex md:hidden fixed top-0 left-0 right-0 h-20 z-[100] transition-all duration-300 items-center justify-between px-4 ${isScrolled ? 'bg-[#11224D]/80 backdrop-blur-md border-b border-white/10' : 'bg-[#11224D]'}`}>
        <button
          className="flex items-center justify-center p-2 text-white"
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-label="Open menu"
        >
          <FaBars className="text-lg" />
        </button>
        <Link href="/admin" className="flex flex-col items-center justify-center no-underline">
          <Image
            src="/images/admin-logo.png"
            alt="City Fragrance Logo"
            width={130}
            height={35}
            className="w-[125px] h-auto object-contain mix-blend-screen"
            priority
          />
          <span className="text-[8.5px] font-semibold text-white/70 uppercase tracking-[0.25em] mt-1 font-heading">
            Admin Panel
          </span>
        </Link>
        <div className="w-8" />
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div className={styles.mobileDrawerOverlay} onClick={closeDrawer} />
      )}

      {/* Mobile Drawer Panel */}
      <aside className={`${styles.mobileDrawer} ${isMobileSidebarOpen ? styles.mobileDrawerOpen : ''}`}>
        <div className={styles.mobileDrawerHeader}>
          <div className="flex flex-col items-center">
            <Image
              src="/images/admin-logo.png"
              alt="City Fragrance Logo"
              width={140}
              height={37}
              className="w-[130px] h-auto object-contain mix-blend-screen"
              priority
            />
            <span className="font-heading text-[9.5px] font-semibold text-slate-400 tracking-[0.28em] uppercase mt-1">
              Admin Panel
            </span>
          </div>
          <button
            className={styles.mobileDrawerClose}
            onClick={closeDrawer}
            aria-label="Close menu"
          >
            <FaTimes />
          </button>
        </div>
        <nav className={styles.mobileDrawerNav}>
          <Link href="/admin" className={styles.mobileDrawerLink} onClick={closeDrawer}>
            Products Management
          </Link>
          <Link href="/admin/settings" className={styles.mobileDrawerLink} onClick={closeDrawer}>
            Site Customization
          </Link>
          <Link href="/admin/orders" className={styles.mobileDrawerLink} onClick={closeDrawer}>
            Orders
          </Link>
          <Link href="/admin/gift-sets" className={styles.mobileDrawerLink} onClick={closeDrawer}>
            Gift Sets
          </Link>
          <Link href="/admin/analytics" className={styles.mobileDrawerLink} onClick={closeDrawer}>
            Analytics & Inventory
          </Link>
          <Link href="/admin/staff" className={styles.mobileDrawerLink} onClick={closeDrawer}>
            Manage Staff
          </Link>
          <Link href="/" className={styles.mobileDrawerLink} onClick={closeDrawer}>
            Back to Store
          </Link>
        </nav>
        <div className={styles.mobileDrawerFooter}>
          <AdminSidebarUser />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 max-w-full w-full overflow-x-hidden overflow-y-auto px-4 md:px-8 pt-20 md:pt-8 pb-4 md:pb-8">
        {children}
      </main>
    </div>
  );
}
