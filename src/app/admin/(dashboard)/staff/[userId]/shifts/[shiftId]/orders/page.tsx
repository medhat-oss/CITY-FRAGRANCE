'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaSpinner, FaListAlt } from 'react-icons/fa';
import styles from '../../../../../admin.module.css';

interface PageProps {
  params: Promise<{ userId: string; shiftId: string }>;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderId: string;
  customerName: string;
  phoneNumber: string;
  items: OrderItem[];
  createdAt: string;
  date: string;
  status: string;
  totalPrice: number;
  paymentMethod: string;
}

interface ShiftInfo {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: string;
  endTime: string | null;
  status: string;
  totalCash: number;
  totalInstaPay: number;
  totalVodafoneCash: number;
  totalVisa: number;
  expectedTotal: number;
  orderCount: number;
}

/** Format a date string as YYYY-MM-DD hh:mm AM/PM (clean English, no Arabic) */
function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    const date = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${date}  ${time}`;
  } catch {
    return '—';
  }
}

const ITEM_CANCEL_LOCKED_STATUSES = ['cancelled', 'completed'];

export default function ShiftOrdersPage({ params }: PageProps) {
  const { userId: staffId, shiftId } = use(params);

  const [shift, setShift] = useState<ShiftInfo | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [cancellingItem, setCancellingItem] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    if (!shiftId) return;
    try {
      const res = await fetch(`/api/admin/staff/shifts/${shiftId}/orders`);
      const data = await res.json();
      if (data.success) {
        setShift(data.shift);
        const ordersWithIds: Order[] = (data.orders || []).map((o: Order) => ({
          ...o,
          items: (Array.isArray(o.items) ? o.items : []).map((it: OrderItem, idx: number) => ({
            ...it,
            id: it.id || `${o.orderId}-item-${idx}`,
          })),
        }));
        setOrders(ordersWithIds);
      } else {
        setError(data.error || 'Failed to load shift orders');
      }
    } catch {
      setError('Failed to connect to server');
    }
    setLoading(false);
  }, [shiftId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  /** Cancel the entire order (sets status = CANCELLED) */
  async function handleCancelOrder(orderId: string) {
    setUpdatingOrder(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'CANCELLED' }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOrders();
      } else {
        alert(data.error || 'Failed to cancel order');
      }
    } catch {
      alert('Network error');
    }
    setUpdatingOrder(null);
  }

  /** Cancel a single product line within an order */
  async function handleCancelItem(itemId: string, orderId: string) {
    setCancellingItem(itemId);
    try {
      const res = await fetch('/api/admin/orders/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderItemId: itemId, orderId }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) =>
          prev.map((o) =>
            o.orderId === orderId
              ? {
                  ...o,
                  items: (data.order.items || []).map((it: OrderItem, idx: number) => ({
                    ...it,
                    id: it.id || `${orderId}-item-${idx}`,
                  })),
                  totalPrice: data.order.totalPrice ?? o.totalPrice,
                }
              : o
          )
        );
      } else {
        alert(data.error || 'Failed to cancel item');
      }
    } catch {
      alert('Network error while cancelling item');
    }
    setCancellingItem(null);
  }

  const employeeName = shift?.cashierName || 'Staff Member';

  // Build a flat list of rows: one row per item per order
  type ItemRow = { order: Order; item: OrderItem; isFirstItem: boolean; itemCount: number; };
  const itemRows: ItemRow[] = [];
  for (const order of orders) {
    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length === 0) {
      itemRows.push({ order, item: { id: '', name: '—', quantity: 0, price: 0 }, isFirstItem: true, itemCount: 0 });
    } else {
      items.forEach((item, i) => {
        itemRows.push({ order, item, isFirstItem: i === 0, itemCount: items.length });
      });
    }
  }

  return (
    <div dir="ltr">
      {/* ── Page Header — matches standard admin page pattern ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            href={`/admin/staff/${staffId}/shifts`}
            style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#e2e8f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
          >
            <FaArrowLeft /> Back to Shift History
          </Link>
          <span style={{ color: '#1d3573', fontSize: '1rem' }}>|</span>
          <FaListAlt style={{ color: '#60a5fa', fontSize: '1rem' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 500, color: '#f8f9fa', margin: 0 }}>
            Shift Orders — {employeeName}
          </h2>
        </div>
        {shift && (
          <div style={{ padding: '0.6rem 1.1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(9,20,46,0.6)', textAlign: 'right' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>Total Shift Sales</span>
            <span style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
              EGP {(shift.expectedTotal ?? 0).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className={styles.adminContent}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <FaSpinner className={styles.spinIcon} style={{ color: '#ffffff', fontSize: '2rem' }} />
          </div>
        ) : error && !shift ? (
          <div style={{ padding: '1.5rem', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#f87171', background: 'rgba(9,20,46,0.6)', fontSize: '0.9rem' }}>
            {error}
          </div>
        ) : (
          <>
            {/* ── Orders Table ── */}
            <div className={styles.tableContainer} style={{ overflowX: 'auto' }}>
              <table className={styles.adminTable} style={{ minWidth: '860px' }}>
                <thead>
                  <tr>
                    {['Order ID', 'Customer', 'Payment', 'Date & Time', 'Product', 'Qty', 'Unit Price', 'Subtotal', 'Status', 'Cancel'].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: h === 'Subtotal' || h === 'Unit Price' ? 'right' : 'left',
                          fontSize: '0.7rem',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {itemRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                        No orders recorded for this shift yet.
                      </td>
                    </tr>
                  ) : (
                    itemRows.map(({ order, item, isFirstItem, itemCount }, rowIdx) => {
                      const orderLocked = ITEM_CANCEL_LOCKED_STATUSES.includes((order.status || '').toLowerCase());
                      const isCancellingThisItem = cancellingItem === item.id;
                      const isUpdatingThisOrder = updatingOrder === order.orderId;
                      const canCancelItem = !orderLocked && item.id && itemCount > 1;

                      const rowBorderStyle = isFirstItem && rowIdx > 0
                        ? { borderTop: '2px solid rgba(30,58,95,0.8)' }
                        : { borderTop: '1px solid rgba(30,58,95,0.4)' };

                      const statusColor =
                        order.status.toLowerCase() === 'cancelled' ? '#ef4444'
                        : order.status.toLowerCase() === 'completed' ? '#22c55e'
                        : order.status.toLowerCase() === 'accepted' ? '#22c55e'
                        : order.status.toLowerCase() === 'pending' ? '#f59e0b'
                        : '#94a3b8';

                      return (
                        <tr
                          key={`${order.orderId}-${item.id || rowIdx}`}
                          style={{ ...rowBorderStyle, transition: 'background 0.15s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
                        >
                          {/* Order ID */}
                          <td style={{ padding: '0.6rem 1rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                            {isFirstItem ? (
                              <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#64748b' }}>
                                #{String(order.orderId || order.id).slice(-8)}
                              </span>
                            ) : null}
                          </td>

                          {/* Customer */}
                          <td style={{ padding: '0.6rem 1rem', verticalAlign: 'middle' }}>
                            {isFirstItem ? (
                              <span style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>{order.customerName || '—'}</span>
                            ) : null}
                          </td>

                          {/* Payment */}
                          <td style={{ padding: '0.6rem 1rem', verticalAlign: 'middle' }}>
                            {isFirstItem ? (
                              <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{order.paymentMethod || '—'}</span>
                            ) : null}
                          </td>

                          {/* Date & Time */}
                          <td style={{ padding: '0.6rem 1rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                            {isFirstItem ? (
                              <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                {formatDateTime(order.createdAt || order.date)}
                              </span>
                            ) : null}
                          </td>

                          {/* Product name */}
                          <td style={{ padding: '0.6rem 1rem', verticalAlign: 'middle' }}>
                            <span style={{ color: item.name === '—' ? '#475569' : '#f1f5f9', fontSize: '0.82rem' }}>
                              {item.name}
                            </span>
                          </td>

                          {/* Qty */}
                          <td style={{ padding: '0.6rem 1rem', verticalAlign: 'middle', color: '#cbd5e1', textAlign: 'center' }}>
                            {item.quantity > 0 ? `×${item.quantity}` : '—'}
                          </td>

                          {/* Unit Price */}
                          <td style={{ padding: '0.6rem 1rem', verticalAlign: 'middle', textAlign: 'right', fontFamily: 'var(--font-heading)', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            {item.price > 0 ? `EGP ${item.price.toFixed(2)}` : '—'}
                          </td>

                          {/* Subtotal */}
                          <td style={{ padding: '0.6rem 1rem', verticalAlign: 'middle', textAlign: 'right', fontFamily: 'var(--font-heading)', color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {item.price > 0 ? `EGP ${(item.price * item.quantity).toFixed(2)}` : '—'}
                          </td>

                          {/* Status badge */}
                          <td style={{ padding: '0.6rem 1rem', verticalAlign: 'middle' }}>
                            {isFirstItem ? (
                              <span style={{
                                display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '4px',
                                fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.05em',
                                textTransform: 'uppercase', color: statusColor,
                                background: `${statusColor}18`, border: `1px solid ${statusColor}40`, whiteSpace: 'nowrap',
                              }}>
                                {order.status}
                              </span>
                            ) : null}
                          </td>

                          {/* Per-item Cancel button */}
                          <td style={{ padding: '0.6rem 1rem', verticalAlign: 'middle' }}>
                            {canCancelItem ? (
                              isCancellingThisItem ? (
                                <FaSpinner className={styles.spinIcon} style={{ fontSize: '0.85rem', color: '#ef4444' }} />
                              ) : (
                                <button
                                  onClick={() => handleCancelItem(item.id, order.orderId)}
                                  disabled={isCancellingThisItem || isUpdatingThisOrder}
                                  style={{
                                    padding: '0.25rem 0.65rem', borderRadius: '5px',
                                    border: '1px solid rgba(127,29,29,0.4)', background: 'rgba(127,29,29,0.15)',
                                    color: '#f87171', fontSize: '0.72rem', fontWeight: 700,
                                    cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', letterSpacing: '0.03em',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(127,29,29,0.5)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(127,29,29,0.15)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(127,29,29,0.4)'; }}
                                  title="Cancel this item"
                                >
                                  Cancel
                                </button>
                              )
                            ) : isFirstItem && !orderLocked && itemCount <= 1 ? (
                              isUpdatingThisOrder ? (
                                <FaSpinner className={styles.spinIcon} style={{ fontSize: '0.85rem', color: '#ef4444' }} />
                              ) : (
                                <button
                                  onClick={() => handleCancelOrder(order.orderId)}
                                  disabled={isUpdatingThisOrder}
                                  style={{
                                    padding: '0.25rem 0.65rem', borderRadius: '5px',
                                    border: '1px solid rgba(127,29,29,0.4)', background: 'rgba(127,29,29,0.15)',
                                    color: '#f87171', fontSize: '0.72rem', fontWeight: 700,
                                    cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(127,29,29,0.5)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#ef4444'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(127,29,29,0.15)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(127,29,29,0.4)'; }}
                                  title="Cancel order"
                                >
                                  Cancel Order
                                </button>
                              )
                            ) : (
                              <span style={{ color: '#1e3a5f', fontSize: '0.7rem' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Shift Summary Footer ── */}
            {shift && (
              <div style={{
                marginTop: '1.5rem', padding: '1rem 1.25rem',
                background: 'rgba(9,20,46,0.6)', border: '1px solid rgba(30,58,95,0.6)',
                borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '1.5rem',
              }}>
                {[
                  { label: 'Cash', value: shift.totalCash },
                  { label: 'InstaPay', value: shift.totalInstaPay },
                  { label: 'Vodafone Cash', value: shift.totalVodafoneCash },
                  { label: 'Visa / Card', value: shift.totalVisa },
                  { label: 'Expected Total', value: shift.expectedTotal, highlight: true },
                ].map(({ label, value, highlight }) => (
                  <div key={label} style={{ minWidth: '110px' }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginBottom: '0.2rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {label}
                    </span>
                    <span style={{
                      display: 'block', fontFamily: 'var(--font-heading)',
                      fontSize: highlight ? '1rem' : '0.9rem', fontWeight: highlight ? 700 : 600,
                      color: highlight ? '#ffffff' : '#e2e8f0',
                    }}>
                      EGP {(value ?? 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {shift && (
              <p style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#3a506b', margin: '0.75rem 0 0' }}>
                Shift ID: {shift.id}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
