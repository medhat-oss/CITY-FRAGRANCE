'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatEGP } from '@/utils/currency';
import styles from '../admin.module.css';
import {
  FaChartLine, FaShoppingCart, FaCashRegister, FaGlobe,
  FaBoxes, FaTrophy, FaExclamationTriangle, FaSpinner,
  FaMoneyBillWave, FaReceipt, FaLayerGroup,
  FaTrashAlt, FaTimes,
} from 'react-icons/fa';

interface Metrics {
  totalRevenue: number; netProfit: number; totalOrders: number;
  posRevenue: number; onlineRevenue: number;
  posOrderCount: number; onlineOrderCount: number;
  avgOrderValue: number; totalProducts: number; totalGiftSets: number;
}
interface RecentOrder {
  orderId: string; date: string; customerName: string;
  paymentMethod: string; totalPrice: number; status: string; isPos: boolean;
}
interface TopProduct { name: string; totalQty: number; totalRevenue: number; }
interface CollPerf { name: string; productCount: number; estimatedSales: number; }
interface LowStock { id: string; name: string; image: string; stock: number; kind: string; }

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topSelling, setTopSelling] = useState<TopProduct[]>([]);
  const [collPerf, setCollPerf] = useState<CollPerf[]>([]);
  const [lowStock, setLowStock] = useState<LowStock[]>([]);
  const [payBreakdown, setPayBreakdown] = useState<Record<string, { count: number; revenue: number }>>({});
  const [monthlyRev, setMonthlyRev] = useState<Record<string, number>>({});
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setMetrics(d.metrics);
          setRecentOrders(d.recentOrders || []);
          setTopSelling(d.topSelling || []);
          setCollPerf(d.collectionPerformance || []);
          setLowStock(d.lowStockItems || []);
          setPayBreakdown(d.paymentBreakdown || {});
          setMonthlyRev(d.monthlyRevenue || {});
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleResetSales() {
    if (resetConfirmText !== 'RESET') return;
    setResetSubmitting(true);
    try {
      const res = await fetch('/api/admin/reset-sales', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResetModalOpen(false);
        setResetConfirmText('');
        router.refresh();
      } else {
        alert(data.error || 'Reset failed.');
      }
    } catch {
      alert('Network error. Please try again.');
    }
    setResetSubmitting(false);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <FaSpinner className={styles.spinIcon} style={{ color: '#fff', fontSize: '2rem' }} />
      </div>
    );
  }

  if (!metrics) {
    return <p style={{ color: '#ef4444', textAlign: 'center', padding: '3rem' }}>Failed to load analytics data.</p>;
  }

  const maxMonthly = Math.max(...Object.values(monthlyRev), 1);
  const maxTopQty = topSelling.length > 0 ? topSelling[0].totalQty : 1;
  const maxCollSales = collPerf.length > 0 ? collPerf[0].estimatedSales : 1;

  return (
    <div dir="ltr">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FaChartLine style={{ color: '#a78bfa', fontSize: '1.3rem' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 500, color: '#f8f9fa', margin: 0 }}>
            Analytics & Inventory
          </h2>
        </div>
        <button
          onClick={() => { setResetModalOpen(true); setResetConfirmText(''); }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
            padding: '0.45rem 0.9rem', borderRadius: 8,
            background: 'transparent', border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171', fontSize: '0.78rem', fontWeight: 600,
            fontFamily: 'var(--font-heading)', letterSpacing: '0.04em',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.6)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
        >
          <FaTrashAlt style={{ fontSize: '0.7rem' }} />
          Reset Data
        </button>
      </div>

      {/* ═══ METRIC CARDS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <MetricCard icon={<FaMoneyBillWave />} label="Total Revenue" value={formatEGP(metrics.totalRevenue)} accent="#22c55e" />
        <MetricCard icon={<FaMoneyBillWave />} label="Net Profit" value={formatEGP(metrics.netProfit)} accent="#10b981" />
        <MetricCard icon={<FaReceipt />} label="Total Orders" value={String(metrics.totalOrders)} accent="#60a5fa" />
        <MetricCard icon={<FaCashRegister />} label="POS Revenue" value={formatEGP(metrics.posRevenue)} accent="#a78bfa" sub={`${metrics.posOrderCount} orders`} />
        <MetricCard icon={<FaGlobe />} label="Online Revenue" value={formatEGP(metrics.onlineRevenue)} accent="#f59e0b" sub={`${metrics.onlineOrderCount} orders`} />
        <MetricCard icon={<FaShoppingCart />} label="Avg Order Value" value={formatEGP(metrics.avgOrderValue)} accent="#06b6d4" />
        <MetricCard icon={<FaBoxes />} label="Catalog Size" value={`${metrics.totalProducts} Products`} accent="#ec4899" sub={`${metrics.totalGiftSets} Gift Sets`} />
      </div>

      {/* ═══ MONTHLY REVENUE CHART ═══ */}
      <div className={styles.adminContent} style={{ marginBottom: '2rem' }}>
        <h3 style={sectionTitle}><FaChartLine style={{ color: '#a78bfa' }} /> Monthly Revenue</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.6rem', height: 180, padding: '1rem 0 0' }}>
          {Object.entries(monthlyRev).map(([month, rev]) => (
            <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>{rev > 0 ? formatEGP(rev) : '—'}</span>
              <div style={{
                width: '100%', maxWidth: 60, borderRadius: '6px 6px 0 0',
                background: rev > 0 ? 'linear-gradient(to top, #7c3aed, #a78bfa)' : 'rgba(255,255,255,0.06)',
                height: `${Math.max((rev / maxMonthly) * 140, 6)}px`,
                transition: 'height 0.5s ease',
              }} />
              <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 500 }}>{month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ TWO-COLUMN: TOP SELLING + PAYMENT BREAKDOWN ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        {/* Top Selling */}
        <div className={styles.adminContent}>
          <h3 style={sectionTitle}><FaTrophy style={{ color: '#f59e0b' }} /> Top Selling Products</h3>
          {topSelling.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>No sales data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {topSelling.map((item, i) => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                    background: i < 3 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.08)',
                    color: i < 3 ? '#0a0a0b' : '#94a3b8',
                  }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                    <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', marginTop: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(to right, #a78bfa, #7c3aed)', width: `${(item.totalQty / maxTopQty) * 100}%`, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa' }}>{item.totalQty} sold</span>
                    <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>{formatEGP(item.totalRevenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Breakdown */}
        <div className={styles.adminContent}>
          <h3 style={sectionTitle}><FaMoneyBillWave style={{ color: '#22c55e' }} /> Payment Methods</h3>
          {Object.keys(payBreakdown).length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>No payment data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(payBreakdown).map(([method, data]) => {
                const pct = metrics.totalOrders > 0 ? ((data.count / metrics.totalOrders) * 100).toFixed(1) : '0';
                return (
                  <div key={method} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', minWidth: 90, textTransform: 'capitalize' }}>{method}</span>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(to right, #22c55e, #16a34a)', width: `${pct}%`, transition: 'width 0.5s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', minWidth: 40, textAlign: 'right' }}>{pct}%</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', minWidth: 55, textAlign: 'right' }}>{data.count} orders</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ COLLECTION PERFORMANCE ═══ */}
      <div className={styles.adminContent} style={{ marginBottom: '2rem' }}>
        <h3 style={sectionTitle}><FaLayerGroup style={{ color: '#ec4899' }} /> Collection Performance</h3>
        {collPerf.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>No collection data.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {collPerf.map((c) => (
              <div key={c.name} style={{
                background: '#09142E', borderRadius: 8, padding: '1rem',
                border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '0.5rem',
              }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', textTransform: 'capitalize' }}>{c.name}</span>
                <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(to right, #ec4899, #db2777)', width: `${(c.estimatedSales / maxCollSales) * 100}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8' }}>
                  <span>{c.productCount} products</span>
                  <span style={{ color: '#ec4899', fontWeight: 600 }}>{formatEGP(c.estimatedSales)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ LOW STOCK ALERT ═══ */}
      <div className={styles.adminContent} style={{ marginBottom: '2rem' }}>
        <h3 style={sectionTitle}><FaExclamationTriangle style={{ color: '#ef4444' }} /> Low Stock Alert</h3>
        {lowStock.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p style={{ color: '#22c55e', fontSize: '0.9rem', fontWeight: 600 }}>✓ All products are sufficiently stocked</p>
            <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '0.25rem 0 0' }}>
              Add a &quot;stock&quot; field to your products JSON to enable real-time inventory tracking.
            </p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.adminTable}>
              <thead><tr><th>Image</th><th>Product Name</th><th>Stock Level</th><th>Status</th></tr></thead>
              <tbody>
                {lowStock.map((item) => (
                  <tr key={item.id}>
                    <td style={{ width: 50 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', position: 'relative', background: '#1e293b' }}>
                        <Image src={item.image} alt="" fill sizes="40px" style={{ objectFit: 'cover' }} />
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{item.name}</td>
                    <td style={{ fontWeight: 700, color: item.stock <= 3 ? '#ef4444' : '#f59e0b' }}>{item.stock} units</td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700,
                        background: item.stock <= 3 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                        color: item.stock <= 3 ? '#ef4444' : '#f59e0b',
                      }}>
                        {item.stock <= 3 ? 'CRITICAL' : 'LOW STOCK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ RECENT TRANSACTIONS TABLE ═══ */}
      <div className={styles.adminContent}>
        <h3 style={sectionTitle}><FaReceipt style={{ color: '#60a5fa' }} /> Recent Transactions</h3>
        <div className={styles.tableContainer}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Order ID</th><th>Date</th><th>Customer</th><th>Channel</th><th>Payment</th><th>Total</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No orders yet.</td></tr>
              ) : (
                recentOrders.map((o) => (
                  <tr key={o.orderId}>
                    <td style={{ fontWeight: 600, color: '#a78bfa', fontFamily: 'var(--font-heading)', fontSize: '0.82rem' }}>{o.orderId}</td>
                    <td style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{o.date}</td>
                    <td style={{ color: '#e2e8f0' }}>{o.customerName}</td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700,
                        background: o.isPos ? 'rgba(167,139,250,0.12)' : 'rgba(59,130,246,0.12)',
                        color: o.isPos ? '#a78bfa' : '#60a5fa',
                      }}>
                        {o.isPos ? 'POS' : 'ONLINE'}
                      </span>
                    </td>
                    <td style={{ color: '#cbd5e1', textTransform: 'capitalize', fontSize: '0.82rem' }}>{o.paymentMethod}</td>
                    <td style={{ fontWeight: 700, color: '#22c55e', fontFamily: 'var(--font-heading)', fontSize: '0.85rem' }}>{formatEGP(o.totalPrice)}</td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700,
                        background: o.status === 'Pending' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)',
                        color: o.status === 'Pending' ? '#f59e0b' : '#22c55e',
                      }}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ Reset Confirmation Modal ═══ */}
      {resetModalOpen && (
        <div
          onClick={() => { if (!resetSubmitting) { setResetModalOpen(false); setResetConfirmText(''); } }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0a0a0b', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14,
              width: '90%', maxWidth: 420, padding: '2rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)', textAlign: 'center',
            }}
          >
            <FaExclamationTriangle style={{ color: '#ef4444', fontSize: '2rem', marginBottom: '0.75rem' }} />
            <h3 style={{
              fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 600,
              color: '#f8f9fa', margin: '0 0 0.5rem',
            }}>
             Are you sure you want to reset all sales data?
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 0.25rem', lineHeight: 1.5 }}>
              This will permanently clear all POS and Online revenue, order records, and shift summaries.
            </p>
            <p style={{ color: '#f87171', fontSize: '0.78rem', margin: '0 0 1.25rem' }}>
              This action cannot be undone.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.4rem', fontWeight: 600 }}>
                Type <span style={{ color: '#ef4444', fontFamily: 'monospace', fontWeight: 700 }}>RESET</span> to confirm
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESET"
                disabled={resetSubmitting}
                autoFocus
                style={{
                  width: '100%', padding: '0.7rem 0.9rem', borderRadius: 6, boxSizing: 'border-box',
                  border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.04)',
                  color: '#e2e8f0', fontSize: '0.95rem', outline: 'none', textAlign: 'center',
                  fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.15em',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                onClick={() => { setResetModalOpen(false); setResetConfirmText(''); }}
                disabled={resetSubmitting}
                style={{
                  flex: 1, padding: '0.65rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent', color: '#94a3b8', fontWeight: 600, fontSize: '0.82rem',
                  cursor: 'pointer', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleResetSales}
                disabled={resetConfirmText !== 'RESET' || resetSubmitting}
                style={{
                  flex: 1, padding: '0.65rem', borderRadius: 8, border: 'none',
                  background: resetConfirmText === 'RESET' && !resetSubmitting
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : '#1e293b',
                  color: resetConfirmText === 'RESET' && !resetSubmitting ? '#fff' : '#475569',
                  fontWeight: 700, fontSize: '0.82rem',
                  cursor: resetConfirmText === 'RESET' && !resetSubmitting ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--font-heading)', letterSpacing: '0.06em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                }}
              >
                {resetSubmitting ? <FaSpinner className={styles.spinIcon} style={{ fontSize: '0.9rem' }} />
                  : <FaTrashAlt style={{ fontSize: '0.75rem' }} />}
                <span>Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ Metric Card Component ═══ */
function MetricCard({ icon, label, value, accent, sub }: {
  icon: React.ReactNode; label: string; value: string; accent: string; sub?: string;
}) {
  return (
    <div style={{
      background: '#11224D', border: '1px solid #1d3573', borderRadius: 10,
      padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -12, right: -12, width: 60, height: 60, borderRadius: '50%', background: accent, opacity: 0.06 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: accent, fontSize: '1rem' }}>{icon}</span>
        <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 600 }}>{label}</span>
      </div>
      <span style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>{value}</span>
      {sub && <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{sub}</span>}
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '0.6rem',
  fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600,
  color: '#f8f9fa', margin: '0 0 1.25rem', letterSpacing: '0.04em',
};
