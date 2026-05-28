'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import styles from './admin.module.css';
import Link from 'next/link';
import { FaBoxOpen, FaStore, FaClipboardList, FaGift, FaCog, FaBars, FaTimes } from 'react-icons/fa';
import AdminSidebarUser from '@/components/AdminSidebarUser';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
            <Link href="/" className={styles.sidebarLink} onClick={closeDrawer}>
              <FaStore /> Back to Store
            </Link>
          </nav>
        </div>
        <AdminSidebarUser />
      </aside>

      {/* Mobile Top Header: visible on mobile, hidden on md+ */}
      <header className={styles.mobileHeader}>
        <button
          className={styles.mobileHamburger}
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-label="Open menu"
        >
          <FaBars />
        </button>
        <span className={styles.mobileHeaderTitle}>Admin Panel</span>
        <div style={{ width: '2rem' }} />
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div className={styles.mobileDrawerOverlay} onClick={closeDrawer} />
      )}

      {/* Mobile Drawer Panel */}
      <aside className={`${styles.mobileDrawer} ${isMobileSidebarOpen ? styles.mobileDrawerOpen : ''}`}>
        <div className={styles.mobileDrawerHeader}>
          <div className={styles.mobileDrawerBrand}>
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
          <Link href="/" className={styles.mobileDrawerLink} onClick={closeDrawer}>
            <FaStore /> Back to Store
          </Link>
        </nav>
        <div className={styles.mobileDrawerFooter}>
          <AdminSidebarUser />
        </div>
      </aside>

      <main className={styles.adminMain}>{children}</main>
    </div>
  );
}
