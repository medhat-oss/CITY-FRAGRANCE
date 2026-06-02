import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatEGP } from '@/utils/currency';
import { FaArrowLeft, FaShoppingBag, FaReceipt } from 'react-icons/fa';

interface PageProps {
  params: Promise<{ id: string; shiftId: string }>;
}

function formatTime(iso: Date) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDate(iso: Date) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  let bg = 'rgba(100,116,139,0.15)';
  let color = '#94a3b8';
  if (s === 'completed' || s === 'delivered') {
    bg = 'rgba(34,197,94,0.15)'; color = '#22c55e';
  } else if (s === 'pending') {
    bg = 'rgba(245,158,11,0.15)'; color = '#f59e0b';
  } else if (s === 'cancelled') {
    bg = 'rgba(239,68,68,0.15)'; color = '#ef4444';
  } else if (s === 'processing') {
    bg = 'rgba(96,165,250,0.15)'; color = '#60a5fa';
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      padding: '0.25rem 0.6rem', borderRadius: '999px',
      fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em',
      background: bg, color,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {status.toUpperCase()}
    </span>
  );
}

export default async function ShiftOrdersPage({ params }: PageProps) {
  const { id: staffId, shiftId } = await params;

  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderId: true,
          totalPrice: true,
          status: true,
          paymentMethod: true,
          createdAt: true,
          items: true,
        },
      },
    },
  });

  if (!shift) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" style={{ background: '#0a0a0b', color: '#94a3b8' }}>
        <div className="text-center">
          <FaReceipt style={{ fontSize: '2.5rem', color: '#64748b', marginBottom: '1rem' }} />
          <p style={{ fontSize: '1rem' }}>Shift not found.</p>
          <Link
            href={`/admin/staff/${staffId}/shifts`}
            style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.85rem', marginTop: '0.75rem', display: 'inline-block' }}
          >
            ← Back to Shift History
          </Link>
        </div>
      </div>
    );
  }

  const orders = shift.orders;
  const totalSales = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const orderCount = orders.length;

  return (
    <div>
      {/* ── Top nav ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Link
          href={`/admin/staff/${staffId}/shifts`}
          style={{
            color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem',
            textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e2e8f0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
        >
          <FaArrowLeft /> العودة لتاريخ الشفتات
        </Link>
        <span style={{ color: '#1d3573', fontSize: '1rem' }}>|</span>
        <FaShoppingBag style={{ color: '#60a5fa', fontSize: '1rem' }} />
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 500, color: '#f8f9fa', margin: 0 }}>
          إدارة طلبات الشيفت — {shift.cashierName}
        </h2>
      </div>

      {/* ── Shift info + Summary card ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', alignItems: 'stretch' }}>

        {/* Shift details */}
        <div style={{
          flex: 1, minWidth: 260,
          background: '#09142E', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '1.25rem',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shift ID</span>
              <p style={{ margin: '0.15rem 0 0', fontFamily: 'monospace', fontSize: '0.85rem', color: '#94a3b8' }}>{shift.id}</p>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Started</span>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.85rem', color: '#e2e8f0' }}>
                  {formatDate(shift.startTime)} — {formatTime(shift.startTime)}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</span>
                <p style={{ margin: '0.15rem 0 0' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                    padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                    background: shift.status === 'OPEN' ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)',
                    color: shift.status === 'OPEN' ? '#22c55e' : '#94a3b8',
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: shift.status === 'OPEN' ? '#22c55e' : '#94a3b8', display: 'inline-block' }} />
                    {shift.status === 'OPEN' ? 'ACTIVE' : 'CLOSED'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary card */}
        <div style={{
          minWidth: 220,
          background: 'linear-gradient(135deg, rgba(197,168,128,0.12), rgba(197,168,128,0.04))',
          border: '1px solid rgba(197,168,128,0.25)', borderRadius: 12, padding: '1.25rem',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '0.7rem', color: '#c5a880', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            Total Sales — إجمالي المبيعات
          </span>
          <p style={{ margin: '0.35rem 0', fontFamily: 'var(--font-heading)', fontSize: '1.65rem', fontWeight: 700, color: '#f8f9fa' }}>
            {formatEGP(totalSales)}
          </p>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
            <span>{orderCount} orders</span>
            <span>Expected: {formatEGP(shift.expectedTotal ?? 0)}</span>
          </div>
        </div>
      </div>

      {/* ── Orders table ── */}
      <div style={{
        background: '#09142E', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <FaReceipt style={{ color: '#64748b', fontSize: '2rem', marginBottom: '0.75rem' }} />
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>
              No orders were placed during this shift.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={thStyle}>Order ID</th>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Items</th>
                <th style={thStyle}>Payment</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => (
                <tr
                  key={order.id}
                  style={{
                    borderBottom: idx < orders.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={tdStyle}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>
                      {order.orderId.slice(0, 10)}…
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#475569', display: 'block' }}>
                      {order.id.slice(0, 8)}…
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '0.82rem', color: '#e2e8f0' }}>
                      {formatDate(order.createdAt)}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>
                      {formatTime(order.createdAt)}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                      {(order.items as any[]).length} items
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {order.paymentMethod || '—'}
                    </span>
                  </td>
                  <td style={tdStyle}>{statusBadge(order.status)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-heading)', color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem' }}>
                    {formatEGP(order.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem', fontSize: '0.7rem', fontWeight: 700,
  color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em',
  textAlign: 'left', whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '0.7rem 1rem', fontSize: '0.82rem', whiteSpace: 'nowrap',
};
