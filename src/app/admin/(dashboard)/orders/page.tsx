'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatEGP } from '@/utils/currency';
import type { Order } from '@/types';
import { FaClipboardList, FaTimes, FaEye, FaSpinner } from 'react-icons/fa';
import styles from '../admin.module.css';

const STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_COLORS: Record<string, string> = {
  'Pending': 'bg-gray-100 text-black',
  'Confirmed': 'bg-blue-100 text-blue-800',
  'Processing': 'bg-indigo-100 text-indigo-800',
  'Shipped': 'bg-purple-100 text-purple-800',
  'Delivered': 'bg-green-100 text-green-800',
  'Cancelled': 'bg-red-100 text-red-800',
};

function playWebAudioChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const playTone = (freq: number, startTime: number, duration: number, vol = 0.25) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = ctx.currentTime;
    playTone(1046.50, now, 0.4, 0.3); // C6
    playTone(1567.98, now + 0.08, 0.4, 0.25); // G6
    playTone(2093.00, now + 0.16, 0.6, 0.2); // C7
  } catch (e) {
    console.error('Web Audio chime error:', e);
  }
}

function playChime() {
  try {
    // Try to play using standard Audio element first (e.g. clean royalty-free chime)
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
    audio.volume = 0.4;
    audio.play().catch(() => {
      // Fallback to Web Audio API if browser blocks external source or it fails
      playWebAudioChime();
    });
  } catch {
    playWebAudioChime();
  }
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  // Tracks the orderId at position [0] from the PREVIOUS successful fetch.
  // Using orderId (string) is deterministic — no timezone or date-parse ambiguity.
  const lastTopOrderIdRef = useRef<string | null>(null);

  const fetchOrders = useCallback((isPolling = false) => {
    fetch('/api/admin/orders')
      .then((res) => res.json())
      .then((data) => {
        const ordersData = data?.orders;
        const fetchedOrders: Order[] = Array.isArray(ordersData) ? ordersData : [];
        setOrders(fetchedOrders);
        setLoading(false);

        if (!fetchedOrders.length) return;

        const topOrder = fetchedOrders[0];
        if (!topOrder?.orderId) return;

        const topId = topOrder.orderId;
        const prevTopId = lastTopOrderIdRef.current;

        // Only fire the alert after the initial load AND when the top order truly changed
        if (isPolling && prevTopId !== null && topId !== prevTopId) {
          setLatestOrder(topOrder);
          setShowAlert(true);
          playChime();
        }

        // Always advance the cursor to the current top
        lastTopOrderIdRef.current = topId;
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 15000);
    return () => clearInterval(interval);
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
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  if (loading) return null;

  return (
    <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <FaClipboardList style={{ color: '#ffffff', fontSize: '1.25rem' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 500, color: '#f8f9fa', margin: 0 }}>
            Orders Management
          </h2>
        </div>

      {/* Revenue Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: '#09142E',
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: '6px',
          marginBottom: '1.5rem',
          fontFamily: 'var(--font-heading)',
          fontSize: '0.95rem',
          fontWeight: 500,
        }}
      >
                <span style={{ opacity: 0.8, fontWeight: 400 }}>Total Revenue</span>
        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatEGP(totalRevenue)}</span>
      </div>

      {/* Orders Table */}
      <div style={{ background: '#11224D', borderRadius: '8px', border: '1px solid #1d3573', overflow: 'hidden' }}>
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
              <tr style={{ background: '#09142E', color: '#f8f9fa' }}>
                <Th>Order ID</Th>
                <Th>Customer</Th>
                <Th>Phone</Th>
                <Th>Governorate</Th>
                <Th>Items</Th>
                <Th>Total</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th>{'\u00A0'}</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const isNew = order.status && order.status.toLowerCase() === 'pending';
                return (
                  <tr
                    key={order.orderId}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <Td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {isNew && (
                          <span
                            className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse mr-2 inline-block"
                            style={{
                              width: '10px',
                              height: '10px',
                              backgroundColor: '#ef4444',
                              borderRadius: '50%',
                              marginRight: '8px',
                              display: 'inline-block',
                              boxShadow: '0 0 8px #ef4444',
                              flexShrink: 0,
                            }}
                            title="New Order"
                          />
                        )}
                        <span>{order.orderId}</span>
                      </div>
                    </Td>
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
                  <Td style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: '#ffffff' }}>
                    {formatEGP(order.totalPrice)}
                  </Td>
                  <Td>{order.paymentMethod || '\u2014'}</Td>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                        className={`text-xs font-semibold rounded-sm px-2 py-1 border-none ${order.status.toLowerCase() === 'cancelled' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}
                        disabled={updatingId === order.orderId || order.status.toLowerCase() === 'cancelled'}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {updatingId === order.orderId && (
                        <FaSpinner className="animate-spin" style={{ fontSize: '0.75rem', color: '#ffffff' }} />
                      )}
                    </div>
                  </Td>
                  <Td style={{ color: '#94a3b8' }}>{order.date}</Td>
                  <Td>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      style={{
                        background: 'none',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '4px',
                        padding: '0.4rem 0.6rem',
                        cursor: 'pointer',
                        color: '#e2e8f0',
                        fontSize: '0.8rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.color = '#09142E';
                        e.currentTarget.style.borderColor = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '';
                        e.currentTarget.style.color = '#e2e8f0';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                      }}
                    >
                      <FaEye /> View
                    </button>
                  </Td>
                </tr>
              ); })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
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
              <h3>Order Details</h3>
              <button type="button" className={styles.btnClose} onClick={() => setSelectedOrder(null)}>
                <FaTimes />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Order ID & Date */}
              <DetailRow label="Order ID" value={selectedOrder.orderId} />
              <DetailRow label="Date" value={selectedOrder.date} />
              <DetailRow label="Status" value={selectedOrder.status} />

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.25rem 0' }} />

              {/* Customer Info */}
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 600, color: '#f8f9fa', margin: 0 }}>
                Customer Information
              </h4>
              <DetailRow label="Name" value={selectedOrder.customerName} />
              <DetailRow label="Email" value={selectedOrder.email || '\u2014'} dir="ltr" />
              <DetailRow label="Phone" value={selectedOrder.phoneNumber} dir="ltr" />

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.25rem 0' }} />

              {/* Shipping Info */}
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 600, color: '#f8f9fa', margin: 0 }}>
                Shipping Details
              </h4>
              <DetailRow label="City" value={selectedOrder.city} />
              <DetailRow label="Governorate" value={selectedOrder.governorate || '\u2014'} />
              <DetailRow label="Address" value={selectedOrder.address} />
              {selectedOrder.apartment && (
                <DetailRow label="Apartment" value={selectedOrder.apartment} />
              )}

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.25rem 0' }} />

              {/* Payment & Items */}
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', fontWeight: 600, color: '#f8f9fa', margin: 0 }}>
                Payment & Items
              </h4>
              <DetailRow label="Payment Method" value={selectedOrder.paymentMethod || '\u2014'} />
              <DetailRow label="Total" value={formatEGP(selectedOrder.totalPrice)} />
              <div>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8rem', fontWeight: 600, color: '#f8f9fa', display: 'block', marginBottom: '0.3rem' }}>
                  Items
                </span>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#e2e8f0', padding: '0.2rem 0', borderBottom: i < selectedOrder.items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    {item.name} &times; {item.quantity} &mdash; {formatEGP(item.price * item.quantity)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── New Order Alert — fires only when latestOrder is fully defined ── */}
      {showAlert && latestOrder != null && latestOrder.orderId != null && (
        <>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes slideInRight {
              from { transform: translateX(120%); opacity: 0; }
              to   { transform: translateX(0);    opacity: 1; }
            }
          ` }} />
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              zIndex: 99999,
              backgroundColor: '#000000',
              border: '2px solid #c5a880',
              color: '#ffffff',
              padding: '1.25rem 1.5rem',
              borderRadius: '0px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.85)',
              width: '380px',
              maxWidth: '90vw',
              animation: 'slideInRight 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
              fontFamily: 'var(--font-body)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#c5a880', fontSize: '1rem', letterSpacing: '0.05em' }}>
                🔔 New Order Received!<br />
                <span style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.85 }}>تم استلام طلب جديد</span>
              </div>
            </div>

            {/* Details */}
            <div style={{ fontSize: '0.85rem', borderTop: '1px solid rgba(197,168,128,0.25)', paddingTop: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ marginBottom: '0.35rem' }}>
                <span style={{ opacity: 0.7 }}>Customer / العميل:&nbsp;</span>
                <strong style={{ color: '#ffffff' }}>{latestOrder?.customerName || '—'}</strong>
              </div>
              <div style={{ marginBottom: '0.35rem' }}>
                <span style={{ opacity: 0.7 }}>Order ID:&nbsp;</span>
                <strong style={{ color: '#ffffff' }}>{latestOrder?.orderId || '—'}</strong>
              </div>
              <div>
                <span style={{ opacity: 0.7 }}>Total / الإجمالي:&nbsp;</span>
                <strong style={{ color: '#c5a880', fontFamily: 'var(--font-heading)' }}>
                  {typeof latestOrder?.totalPrice === 'number' ? formatEGP(latestOrder.totalPrice) : '—'}
                </strong>
              </div>
            </div>

            {/* Dismiss */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowAlert(false); setLatestOrder(null); }}
                style={{
                  background: 'transparent',
                  border: '1px solid #c5a880',
                  color: '#c5a880',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  padding: '0.4rem 1rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#c5a880'; e.currentTarget.style.color = '#000'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c5a880'; }}
              >
                Dismiss / إغلاق
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DetailRow({ label, value, dir }: { label: string; value: string; dir?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#e2e8f0', textAlign: 'end', maxWidth: '60%', wordBreak: 'break-word' }} dir={dir}>
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
    <td style={{ padding: '0.85rem 1rem', color: '#e2e8f0', verticalAlign: 'top', ...extraStyle }}>
      {children}
    </td>
  );
}
