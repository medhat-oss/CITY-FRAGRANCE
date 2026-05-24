'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatEGP } from '@/utils/currency';
import type { Order } from '@/types';
import { FaClipboardList, FaTimes, FaEye, FaSpinner } from 'react-icons/fa';
import styles from '../admin.module.css';

const STATUSES = ['قيد الانتظار', 'مؤكد', 'قيد التجهيز', 'تم الشحن', 'تم التسليم', 'ملغي'];

const STATUS_COLORS: Record<string, string> = {
  'قيد الانتظار': 'bg-yellow-100 text-yellow-800',
  'مؤكد': 'bg-blue-100 text-blue-800',
  'قيد التجهيز': 'bg-indigo-100 text-indigo-800',
  'تم الشحن': 'bg-purple-100 text-purple-800',
  'تم التسليم': 'bg-green-100 text-green-800',
  'ملغي': 'bg-red-100 text-red-800',
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(() => {
    fetch('/api/admin/orders')
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o))
        );
        router.refresh();
      }
    } catch {
      /* ignore */
    } finally {
      setUpdatingId(null);
    }
  };

  const totalRevenue = orders
    .filter((o) => o.status !== 'ملغي')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  if (loading) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <FaClipboardList style={{ color: '#16234D', fontSize: '1.25rem' }} />
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 500, color: '#16234D', margin: 0 }}>
          Orders Management &mdash; إدارة الطلبات
        </h2>
      </div>

      {/* Revenue Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: '#09142E',
          color: '#D4AF37',
          padding: '0.75rem 1.25rem',
          borderRadius: '6px',
          marginBottom: '1.5rem',
          fontFamily: 'var(--font-heading)',
          fontSize: '0.95rem',
          fontWeight: 500,
        }}
      >
        <span style={{ opacity: 0.8, fontWeight: 400 }}>إجمالي الإيرادات</span>
        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatEGP(totalRevenue)}</span>
      </div>

      {/* Orders Table */}
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              minWidth: '1100px',
            }}
          >
            <thead>
              <tr style={{ background: '#16234D', color: '#fff' }}>
                <Th>رقم الطلب</Th>
                <Th>العميل</Th>
                <Th>الهاتف</Th>
                <Th>المحافظة</Th>
                <Th>المنتجات</Th>
                <Th>الإجمالي</Th>
                <Th>طريقة الدفع</Th>
                <Th>الحالة</Th>
                <Th>التاريخ</Th>
                <Th>{'\u00A0'}</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.orderId}
                  style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <Td>{order.orderId}</Td>
                  <Td>{order.customerName}</Td>
                  <Td><span dir="ltr">{order.phoneNumber}</span></Td>
                  <Td>{order.governorate || '\u2014'}</Td>
                  <Td>
                    {order.items.map((item, i) => (
                      <div key={i} style={{ lineHeight: 1.6 }}>
                        {item.name} x{item.quantity}
                      </div>
                    ))}
                  </Td>
                  <Td style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: '#16234D' }}>
                    {formatEGP(order.totalPrice)}
                  </Td>
                  <Td>{order.paymentMethod || '\u2014'}</Td>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                        className={`text-xs font-semibold rounded-sm px-2 py-1 border-none cursor-pointer ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}
                        disabled={updatingId === order.orderId}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {updatingId === order.orderId && (
                        <FaSpinner className="animate-spin" style={{ fontSize: '0.75rem', color: '#16234D' }} />
                      )}
                    </div>
                  </Td>
                  <Td style={{ color: '#64748b' }}>{order.date}</Td>
                  <Td>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      style={{
                        background: 'none',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '0.4rem 0.6rem',
                        cursor: 'pointer',
                        color: '#16234D',
                        fontSize: '0.8rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#16234D';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.borderColor = '#16234D';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '';
                        e.currentTarget.style.color = '#16234D';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                    >
                      <FaEye /> View
                    </button>
                  </Td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className={`${styles.modalOverlay} ${styles.active}`} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className={styles.modalHeader}>
              <h3>Order Details &mdash; تفاصيل الطلب</h3>
              <button type="button" className={styles.btnClose} onClick={() => setSelectedOrder(null)}>
                <FaTimes />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Order ID & Date */}
              <DetailRow label="رقم الطلب" value={selectedOrder.orderId} />
              <DetailRow label="التاريخ" value={selectedOrder.date} />
              <DetailRow label="الحالة" value={selectedOrder.status} />

              <div style={{ height: '1px', background: '#e2e8f0', margin: '0.25rem 0' }} />

              {/* Customer Info */}
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 600, color: '#16234D', margin: 0 }}>
                Customer Information &mdash; معلومات العميل
              </h4>
              <DetailRow label="الاسم" value={selectedOrder.customerName} />
              <DetailRow label="البريد الإلكتروني" value={selectedOrder.email || '\u2014'} dir="ltr" />
              <DetailRow label="الهاتف" value={selectedOrder.phoneNumber} dir="ltr" />

              <div style={{ height: '1px', background: '#e2e8f0', margin: '0.25rem 0' }} />

              {/* Shipping Info */}
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 600, color: '#16234D', margin: 0 }}>
                Shipping Details &mdash; معلومات الشحن
              </h4>
              <DetailRow label="المدينة" value={selectedOrder.city} />
              <DetailRow label="المحافظة" value={selectedOrder.governorate || '\u2014'} />
              <DetailRow label="العنوان" value={selectedOrder.address} />
              {selectedOrder.apartment && (
                <DetailRow label="شقة / دور" value={selectedOrder.apartment} />
              )}

              <div style={{ height: '1px', background: '#e2e8f0', margin: '0.25rem 0' }} />

              {/* Payment & Items */}
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 600, color: '#16234D', margin: 0 }}>
                Payment & Items &mdash; الدفع والمنتجات
              </h4>
              <DetailRow label="طريقة الدفع" value={selectedOrder.paymentMethod || '\u2014'} />
              <DetailRow label="الإجمالي" value={formatEGP(selectedOrder.totalPrice)} />
              <div>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8rem', fontWeight: 600, color: '#16234D', display: 'block', marginBottom: '0.3rem' }}>
                  المنتجات
                </span>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#334155', padding: '0.2rem 0', borderBottom: i < selectedOrder.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    {item.name} &times; {item.quantity} &mdash; {formatEGP(item.price * item.quantity)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, dir }: { label: string; value: string; dir?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#334155', textAlign: 'end', maxWidth: '60%', wordBreak: 'break-word' }} dir={dir}>
        {value}
      </span>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        padding: '0.85rem 1rem',
        textAlign: 'start',
        fontFamily: 'var(--font-heading)',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, style: extraStyle }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td style={{ padding: '0.85rem 1rem', color: '#334155', verticalAlign: 'top', ...extraStyle }}>
      {children}
    </td>
  );
}
