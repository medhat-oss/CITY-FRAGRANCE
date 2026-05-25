import type { ReactNode } from 'react';
import styles from './admin.module.css';
import Link from 'next/link';
import { FaBoxOpen, FaStore, FaClipboardList, FaGift } from 'react-icons/fa';
import AdminSidebarUser from '@/components/AdminSidebarUser';

export const metadata = {
  title: 'Admin Dashboard - City Fragrance',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.adminLayout}>
      <aside className={styles.adminSidebar} style={{ display: 'flex', flexDirection: 'column' }}>
        <div>
          <div className={styles.sidebarBrand}>
            <h2>CITY FRAGRANCE</h2>
            <span>ADMIN PANEL</span>
          </div>
          <nav className={styles.sidebarNav}>
            <Link href="/admin" className={styles.sidebarLink}>
              <FaBoxOpen /> Products Management
            </Link>
            <Link href="/admin/orders" className={styles.sidebarLink}>
              <FaClipboardList /> إدارة الطلبات
            </Link>
            <Link href="/admin/gift-sets" className={styles.sidebarLink}>
              <FaGift /> Gift Sets
            </Link>
            <Link href="/" className={styles.sidebarLink}>
              <FaStore /> Back to Store
            </Link>
          </nav>
        </div>
        <AdminSidebarUser />
      </aside>
      <main className={styles.adminMain}>{children}</main>
    </div>
  );
}
