'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import styles from './admin.module.css';
import Link from 'next/link';
import { FaBoxOpen, FaStore, FaClipboardList, FaGift, FaCog, FaBars, FaTimes, FaUsers, FaChartLine } from 'react-icons/fa';
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
    <div className={styles.adminLayout}>
      {/* Desktop Sidebar: hidden on mobile, visible on md+ */}
      <aside className={`${styles.adminSidebar} hidden md:flex`}>
        <div>
          <div className={styles.sidebarBrand}>
            <h2>CITY FRAGRANCE</h2>
            <span>ADMIN PANEL</span>
          </div>
          <nav className={styles.sidebarNav}>
            <Link href="/admin" className={styles.sidebarLink} onClick={closeDrawer}>
              <FaBoxOpen /> Products Management
            </Link>
            <Link href="/admin/settings" className={styles.sidebarLink} onClick={closeDrawer}>
              <FaCog /> Site Customization
            </Link>
            <Link href="/admin/orders" className={styles.sidebarLink} onClick={closeDrawer}>
               <FaClipboardList /> Orders
            </Link>
            <Link href="/admin/gift-sets" className={styles.sidebarLink} onClick={closeDrawer}>
              <FaGift /> Gift Sets
            </Link>
            <Link href="/admin/analytics" className={styles.sidebarLink} onClick={closeDrawer}>
              <FaChartLine /> Analytics & Inventory
            </Link>
            <Link href="/admin/staff" className={styles.sidebarLink} onClick={closeDrawer}>
              <FaUsers /> Manage Staff
            </Link>
            <Link href="/" className={styles.sidebarLink} onClick={closeDrawer}>
              <FaStore /> Back to Store
            </Link>
          </nav>
        </div>
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
        <Link href="/admin" className="flex flex-col items-center justify-center">
          <span className="text-xl font-bold tracking-widest text-white uppercase font-serif">City Fragrance</span>
          <span className="text-[9px] font-medium text-white/60 uppercase tracking-[0.2em] mt-0.5">Admin Panel</span>
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
          <div className={`${styles.mobileDrawerBrand} hidden`}>
            <h2>CITY FRAGRANCE</h2>
            <span>ADMIN PANEL</span>
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
            <FaBoxOpen /> Products Management
          </Link>
          <Link href="/admin/settings" className={styles.mobileDrawerLink} onClick={closeDrawer}>
            <FaCog /> Site Customization
          </Link>
          <Link href="/admin/orders" className={styles.mobileDrawerLink} onClick={closeDrawer}>
            <FaClipboardList /> Orders
          </Link>
          <Link href="/admin/gift-sets" className={styles.mobileDrawerLink} onClick={closeDrawer}>
            <FaGift /> Gift Sets
          </Link>
          <Link href="/admin/analytics" className={styles.mobileDrawerLink} onClick={closeDrawer}>
            <FaChartLine /> Analytics & Inventory
          </Link>
          <Link href="/admin/staff" className={styles.mobileDrawerLink} onClick={closeDrawer}>
            <FaUsers /> Manage Staff
          </Link>
          <Link href="/" className={styles.mobileDrawerLink} onClick={closeDrawer}>
            <FaStore /> Back to Store
          </Link>
        </nav>
        <div className={styles.mobileDrawerFooter}>
          <AdminSidebarUser />
        </div>
      </aside>

      <main className={styles.adminMain}>
        <div className="w-full max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
