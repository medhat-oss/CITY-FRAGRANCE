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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href={`/admin/staff/${staffId}/shifts`}
            className="text-[#94a3b8] hover:text-[#e2e8f0] flex items-center gap-1.5 no-underline text-sm transition-colors"
          >
            <FaArrowLeft /> Back to Shift History
          </Link>
          <span className="text-[#1d3573] text-base">|</span>
          <FaListAlt className="text-[#60a5fa] text-base" />
          <h2 className="font-heading text-xl font-medium text-[#f8f9fa] m-0 whitespace-nowrap">
            Shift Orders — {employeeName}
          </h2>
        </div>
        {shift && (
          <div className="rounded-lg border border-white/10 bg-[rgba(9,20,46,0.6)] px-4 py-2.5 text-right sm:text-right w-full sm:w-auto">
            <span className="block text-xs text-[#94a3b8] tracking-wide uppercase font-heading">Total Shift Sales</span>
            <span className="block font-heading text-lg font-bold text-white">EGP {(shift.expectedTotal ?? 0).toFixed(2)}</span>
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
            {/* ── Desktop orders table ── */}
            <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-white/10 bg-[#111B3D]/50 backdrop-blur-md">
              <table className="w-full min-w-[860px] table-auto text-left border-collapse">
                <thead>
                  <tr className="bg-[#09142E]">
                    {['Order ID', 'Customer', 'Payment', 'Date & Time', 'Product', 'Qty', 'Unit Price', 'Subtotal', 'Status', 'Cancel'].map((h) => (
                      <th key={h} className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                        style={{ textAlign: h === 'Subtotal' || h === 'Unit Price' ? 'right' : 'left' }}
                      >{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {itemRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center p-12 text-[#64748b]">No orders recorded for this shift yet.</td>
                    </tr>
                  ) : (
                    itemRows.map(({ order, item, isFirstItem, itemCount }, rowIdx) => {
                      const orderLocked = ITEM_CANCEL_LOCKED_STATUSES.includes((order.status || '').toLowerCase());
                      const isCancellingThisItem = cancellingItem === item.id;
                      const isUpdatingThisOrder = updatingOrder === order.orderId;
                      const canCancelItem = !orderLocked && item.id && itemCount > 1;

                      const statusColor =
                        order.status.toLowerCase() === 'cancelled' ? '#ef4444'
                        : order.status.toLowerCase() === 'completed' ? '#22c55e'
                        : order.status.toLowerCase() === 'accepted' ? '#22c55e'
                        : order.status.toLowerCase() === 'pending' ? '#f59e0b'
                        : '#94a3b8';

                      const rowStyle = isFirstItem && rowIdx > 0
                        ? { borderTop: '2px solid rgba(30,58,95,0.8)' }
                        : {};

                      return (
                        <tr key={`${order.orderId}-${item.id || rowIdx}`} className="border-b border-white/10 hover:bg-white/[0.03] transition-colors" style={rowStyle}>
                          <td className="p-3 align-middle whitespace-nowrap">
                            {isFirstItem ? <span className="font-mono text-xs text-[#64748b]">#{String(order.orderId || order.id).slice(-8)}</span> : null}
                          </td>
                          <td className="p-3 align-middle">
                            {isFirstItem ? <span className="text-sm text-[#e2e8f0]">{order.customerName || '—'}</span> : null}
                          </td>
                          <td className="p-3 align-middle">
                            {isFirstItem ? <span className="text-sm text-[#94a3b8]">{order.paymentMethod || '—'}</span> : null}
                          </td>
                          <td className="p-3 align-middle whitespace-nowrap">
                            {isFirstItem ? <span className="font-mono text-xs text-[#94a3b8]">{formatDateTime(order.createdAt || order.date)}</span> : null}
                          </td>
                          <td className="p-3 align-middle">
                            <span className="text-sm" style={{ color: item.name === '—' ? '#475569' : '#f1f5f9' }}>{item.name}</span>
                          </td>
                          <td className="p-3 align-middle text-center text-[#cbd5e1] text-sm">{item.quantity > 0 ? `×${item.quantity}` : '—'}</td>
                          <td className="p-3 align-middle text-right font-heading text-[#94a3b8] whitespace-nowrap text-sm">{item.price > 0 ? `EGP ${item.price.toFixed(2)}` : '—'}</td>
                          <td className="p-3 align-middle text-right font-heading text-[#e2e8f0] font-semibold whitespace-nowrap text-sm">{item.price > 0 ? `EGP ${(item.price * item.quantity).toFixed(2)}` : '—'}</td>
                          <td className="p-3 align-middle">
                            {isFirstItem ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[0.68rem] font-bold tracking-wide uppercase whitespace-nowrap"
                                style={{ color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}40` }}
                              >{order.status}</span>
                            ) : null}
                          </td>
                          <td className="p-3 align-middle">
                            {canCancelItem ? (
                              isCancellingThisItem ? (
                                <FaSpinner className={styles.spinIcon} style={{ fontSize: '0.85rem', color: '#ef4444' }} />
                              ) : (
                                <button onClick={() => handleCancelItem(item.id, order.orderId)}
                                  disabled={isCancellingThisItem || isUpdatingThisOrder}
                                  className="px-2.5 py-1 rounded-md border border-[rgba(127,29,29,0.4)] bg-[rgba(127,29,29,0.15)] text-[#f87171] text-xs font-bold cursor-pointer transition-all whitespace-nowrap tracking-wide hover:bg-[rgba(127,29,29,0.5)] hover:text-white hover:border-red-500"
                                  title="Cancel this item"
                                >Cancel</button>
                              )
                            ) : isFirstItem && !orderLocked && itemCount <= 1 ? (
                              isUpdatingThisOrder ? (
                                <FaSpinner className={styles.spinIcon} style={{ fontSize: '0.85rem', color: '#ef4444' }} />
                              ) : (
                                <button onClick={() => handleCancelOrder(order.orderId)}
                                  disabled={isUpdatingThisOrder}
                                  className="px-2.5 py-1 rounded-md border border-[rgba(127,29,29,0.4)] bg-[rgba(127,29,29,0.15)] text-[#f87171] text-xs font-bold cursor-pointer transition-all whitespace-nowrap hover:bg-[rgba(127,29,29,0.5)] hover:text-white hover:border-red-500"
                                  title="Cancel order"
                                >Cancel Order</button>
                              )
                            ) : (
                              <span className="text-[#1e3a5f] text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Mobile order cards ── */}
            <div className="md:hidden space-y-3">
              {orders.length === 0 ? (
                <p className="text-center py-12 text-[#64748b] text-sm">No orders recorded for this shift yet.</p>
              ) : (
                orders.map((order) => {
                  const orderLocked = ITEM_CANCEL_LOCKED_STATUSES.includes((order.status || '').toLowerCase());
                  const isUpdatingThisOrder = updatingOrder === order.orderId;
                  const items = Array.isArray(order.items) ? order.items : [];

                  const statusColor =
                    order.status.toLowerCase() === 'cancelled' ? '#ef4444'
                    : order.status.toLowerCase() === 'completed' ? '#22c55e'
                    : order.status.toLowerCase() === 'accepted' ? '#22c55e'
                    : order.status.toLowerCase() === 'pending' ? '#f59e0b'
                    : '#94a3b8';

                  return (
                    <div key={order.orderId} className="rounded-xl border border-white/10 bg-[#111B3D]/50 backdrop-blur-md p-3">
                      {/* Card header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-xs text-[#64748b] shrink-0">#{String(order.orderId || order.id).slice(-8)}</span>
                          <span className="text-xs px-2 py-0.5 rounded font-bold tracking-wide uppercase"
                            style={{ color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}40` }}
                          >{order.status}</span>
                        </div>
                        <span className="text-xs font-heading text-white font-semibold whitespace-nowrap ml-2">EGP {(order.totalPrice || 0).toFixed(2)}</span>
                      </div>
                      {/* Customer + Payment + Date */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mb-2">
                        <div><span className="text-slate-500">Customer</span><p className="text-slate-200 m-0 truncate">{order.customerName || '—'}</p></div>
                        <div><span className="text-slate-500">Payment</span><p className="text-slate-200 m-0 truncate">{order.paymentMethod || '—'}</p></div>
                        <div className="col-span-2"><span className="text-slate-500">Date & Time</span><p className="text-slate-200 m-0 font-mono text-[10px]">{formatDateTime(order.createdAt || order.date)}</p></div>
                      </div>
                      {/* Items */}
                      <div className="mb-2">
                        <span className="text-xs text-slate-500 block mb-1">Products</span>
                        {items.length === 0 ? (
                          <span className="text-xs text-slate-500 italic">—</span>
                        ) : items.map((item) => {
                          const isCancellingThisItem = cancellingItem === item.id;
                          const canCancelItem = !orderLocked && item.id && items.length > 1;
                          return (
                            <div key={item.id || `${order.orderId}-${item.name}`} className="flex items-center justify-between bg-[rgba(24,24,27,0.5)] px-2 py-1.5 rounded-lg border border-[rgba(63,63,70,0.4)] mb-1 last:mb-0 text-xs">
                              <div className="flex-1 min-w-0">
                                <span className="text-[#e4e4e7] block truncate">{item.name}</span>
                                <span className="text-slate-500 text-[10px]">×{item.quantity} @ EGP {item.price.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <span className="text-[#e2e8f0] font-semibold font-heading">EGP {(item.price * item.quantity).toFixed(2)}</span>
                                {canCancelItem && (
                                  isCancellingThisItem ? (
                                    <FaSpinner className="animate-spin text-red-500 text-[10px]" />
                                  ) : (
                                    <button
                                      onClick={() => handleCancelItem(item.id, order.orderId)}
                                      disabled={isCancellingThisItem || isUpdatingThisOrder}
                                      className="w-5 h-5 inline-flex items-center justify-center text-red-500 bg-[rgba(127,29,29,0.2)] border border-[rgba(127,29,29,0.3)] rounded cursor-pointer hover:bg-[rgba(127,29,29,0.5)] hover:text-white text-[10px]"
                                      title="Cancel this item"
                                    >✕</button>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Full order cancel */}
                      {!orderLocked && items.length <= 1 && (
                        <div className="flex justify-end pt-2 border-t border-white/10">
                          {isUpdatingThisOrder ? (
                            <FaSpinner className="animate-spin text-red-500 text-xs" />
                          ) : (
                            <button onClick={() => handleCancelOrder(order.orderId)}
                              disabled={isUpdatingThisOrder}
                              className="px-3 py-1.5 rounded-md border border-[rgba(127,29,29,0.4)] bg-[rgba(127,29,29,0.15)] text-[#f87171] text-xs font-bold cursor-pointer transition-all hover:bg-[rgba(127,29,29,0.5)] hover:text-white"
                            >Cancel Order</button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Shift Summary Footer ── */}
            {shift && (
              <div className="mt-6 p-4 rounded-xl border border-[rgba(30,58,95,0.6)] bg-[rgba(9,20,46,0.6)] flex flex-wrap gap-4">
                {[
                  { label: 'Cash', value: shift.totalCash },
                  { label: 'InstaPay', value: shift.totalInstaPay },
                  { label: 'Vodafone Cash', value: shift.totalVodafoneCash },
                  { label: 'Visa / Card', value: shift.totalVisa },
                  { label: 'Expected Total', value: shift.expectedTotal, highlight: true },
                ].map(({ label, value, highlight }) => (
                  <div key={label} style={{ minWidth: '100px' }}>
                    <span className="block text-xs text-[#64748b] mb-0.5 font-heading uppercase tracking-wide">{label}</span>
                    <span className="block font-heading text-sm font-semibold" style={{ color: highlight ? '#ffffff' : '#e2e8f0', fontWeight: highlight ? 700 : 600 }}>
                      EGP {(value ?? 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {shift && (
              <p className="font-mono text-[0.68rem] text-[#3a506b] mt-3 mb-0">Shift ID: {shift.id}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
