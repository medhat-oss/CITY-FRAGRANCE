'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './admin.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaBars, FaTimes } from 'react-icons/fa';
import AdminSidebarUser from '@/components/AdminSidebarUser';

const NAV_GROUPS = [
  {
    category: 'COMMERCE & SALES',
    links: [
      { href: '/admin', label: 'Products Management' },
      { href: '/admin/orders', label: 'Orders' },
      { href: '/admin/gift-sets', label: 'Gift Sets' },
    ],
  },
  {
    category: 'CRM & PIPELINE',
    links: [
      { href: '/admin/crm/leads', label: 'Leads' },
      { href: '/admin/crm/pipeline', label: 'Sales Pipeline' },
      { href: '/admin/crm/customers', label: 'Customers' },
    ],
  },
  {
    category: 'FINANCE & ANALYTICS',
    links: [
      { href: '/admin/analytics', label: 'Analytics & Inventory' },
    ],
  },
  {
    category: 'SYSTEM & SETTINGS',
    links: [
      { href: '/admin/settings', label: 'Site Customization' },
      { href: '/admin/staff', label: 'Manage Staff' },
      { href: '/', label: 'Back to Store' },
    ],
  },
];

function isLinkActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin';
  if (href === '/') return false;
  return pathname === href || pathname.startsWith(href + '/');
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeDrawer = () => setIsMobileSidebarOpen(false);

  return (
    <div className="flex h-screen w-screen max-w-full overflow-hidden bg-[#111B3D]">
      {/* Desktop Sidebar */}
      <aside className="w-64 shrink-0 h-full overflow-y-auto hidden md:flex flex-col bg-[#16234D] border-r border-[#1d3573] px-4 py-6">
        <div className="mb-6 flex flex-col items-center justify-center text-center">
          <Link href="/admin" className="flex flex-col items-center group no-underline">
            <Image
              src="/images/admin-logo.png"
              alt="City Fragrance Logo"
              width={180}
              height={48}
              className="w-[155px] h-auto object-contain mix-blend-screen transition-opacity group-hover:opacity-90"
              priority
            />
            <span className="font-heading text-[10px] font-semibold text-slate-400 tracking-[0.3em] uppercase mt-2">
              ENTERPRISE ERP & CRM
            </span>
          </Link>
        </div>

        <nav className="flex flex-col gap-4 flex-1">
          {NAV_GROUPS.map((group) => (
            <div key={group.category} className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 tracking-[0.18em] uppercase px-3 pb-1 select-none">
                {group.category}
              </span>
              {group.links.map((link) => {
                const active = isLinkActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeDrawer}
                    className={`flex items-center px-3.5 py-2 rounded text-xs font-medium transition-all ${
                      active
                        ? 'bg-white text-[#11224D] font-semibold shadow-sm'
                        : 'text-white/75 hover:bg-white hover:text-[#11224D]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="mt-4 pt-4 border-t border-[#1d3573]">
          <AdminSidebarUser />
        </div>
      </aside>

      {/* Mobile Top Header: visible on mobile, hidden on md+ */}
      <header className={`flex md:hidden fixed top-0 left-0 right-0 h-20 z-[100] transition-all duration-300 items-center justify-between px-4 ${isScrolled ? 'bg-[#16234D]/95 backdrop-blur-md border-b border-[#1d3573]' : 'bg-[#16234D] border-b border-[#1d3573]'}`}>
        <button
          className="flex items-center justify-center p-2 text-white bg-transparent border-none cursor-pointer"
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-label="Open menu"
        >
          <FaBars className="text-lg" />
        </button>
        <Link href="/admin" className="flex flex-col items-center justify-center no-underline bg-transparent">
          <Image
            src="/images/admin-logo.png"
            alt="City Fragrance Logo"
            width={130}
            height={35}
            className="w-[125px] h-auto object-contain mix-blend-screen bg-transparent"
            priority
          />
          <span className="text-[8.5px] font-semibold text-slate-400 uppercase tracking-[0.25em] mt-1 font-heading bg-transparent">
            ERP & CRM
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
              ERP & CRM
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

        <nav className="flex flex-col gap-4 p-4 flex-1 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.category} className="flex flex-col gap-1">
              <span className="text-[9.5px] font-bold text-slate-400 tracking-[0.18em] uppercase px-2 pb-1 select-none">
                {group.category}
              </span>
              {group.links.map((link) => {
                const active = isLinkActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeDrawer}
                    className={`flex items-center px-3.5 py-2.5 rounded text-xs font-medium transition-all ${
                      active
                        ? 'bg-white text-[#11224D] font-semibold shadow-sm'
                        : 'text-white/75 hover:bg-white hover:text-[#11224D]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.mobileDrawerFooter}>
          <AdminSidebarUser />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden p-4 md:p-8 pt-24 md:pt-8">
        {children}
      </main>
    </div>
  );
}
