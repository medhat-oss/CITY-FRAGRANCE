'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaSpinner, FaBan, FaCalendarAlt, FaListAlt } from 'react-icons/fa';
import styles from '../../../admin.module.css';

interface ShiftRecord {
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
  actualCash: number | null;
  expectedTotal: number | null;
  discrepancy: number | null;
  orderCount: number;
}

export default function StaffShiftsPage() {
  const params = useParams<{ id: string }>();
  const staffId = params.id;

  const [staffName, setStaffName] = useState('');
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!staffId) return;

    async function fetchData() {
      setLoading(true);
      try {
        const staffRes = await fetch('/api/admin/staff');
        const staffData = await staffRes.json();
        if (staffData.success) {
          const found = staffData.staff.find((u: { id: string }) => u.id === staffId);
          if (found) setStaffName(found.username || found.email);
        }

        const shiftsRes = await fetch(`/api/admin/staff/shifts?userId=${staffId}`);
        const shiftsData = await shiftsRes.json();
        if (shiftsData.success) {
          setShifts(shiftsData.shifts || []);
        } else {
          setError(shiftsData.error || 'Failed to load shifts');
        }
      } catch {
        setError('An error occurred while loading data.');
      }
      setLoading(false);
    }

    fetchData();
  }, [staffId]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            href="/admin/staff"
            style={{
              color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem',
              textDecoration: 'none', fontSize: '0.85rem', transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#e2e8f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
          >
            <FaArrowLeft /> Back to Staff
          </Link>
          <span style={{ color: '#1d3573', fontSize: '1rem' }}>|</span>
          <FaCalendarAlt style={{ color: '#60a5fa', fontSize: '1rem' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 500, color: '#f8f9fa', margin: 0 }}>
            Shift History — {staffName || 'Staff Member'}
          </h2>
        </div>
      </div>

      <div className={styles.adminContent}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <FaSpinner className={styles.spinIcon} style={{ color: '#ffffff', fontSize: '2rem' }} />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <FaBan style={{ color: '#ef4444', fontSize: '2rem', marginBottom: '0.75rem' }} />
            <p style={{ color: '#f87171', fontSize: '0.95rem', margin: 0 }}>{error}</p>
          </div>
        ) : shifts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <FaCalendarAlt style={{ color: '#64748b', fontSize: '2rem', marginBottom: '0.75rem' }} />
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0 }}>
              No shift logs found for this employee.
            </p>
            <Link
              href="/admin/staff"
              style={{
                display: 'inline-block', marginTop: '1rem', color: '#60a5fa',
                textDecoration: 'none', fontSize: '0.85rem',
              }}
            >
              ← Back to Staff
            </Link>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Shift ID / Date</th>
                  <th>Status</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th style={{ textAlign: 'right' }}>Expected Total</th>
                  <th style={{ textAlign: 'right' }}>Actual Amount</th>
                  <th style={{ textAlign: 'right' }}>Discrepancy</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => {
                  const expected = shift.expectedTotal ?? 0;
                  const actual = shift.actualCash ?? 0;
                  const discrepancy = shift.discrepancy ?? (actual - expected);
                  const isOpen = shift.status === 'OPEN';

                  return (
                    <tr key={shift.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                          {shift.id.slice(0, 8)}…
                        </span>
                        <br />
                        <span style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>
                          {formatDate(shift.startTime)}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.25rem 0.6rem', borderRadius: '4px',
                          fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em',
                          background: isOpen ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                          color: isOpen ? '#22c55e' : '#94a3b8',
                        }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: isOpen ? '#22c55e' : '#94a3b8',
                            display: 'inline-block',
                          }} />
                          {isOpen ? 'ACTIVE' : 'CLOSED'}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', color: '#cbd5e1', fontSize: '0.85rem' }}>
                        {formatDate(shift.startTime)}
                        <br />
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                          {formatTime(shift.startTime)}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', color: '#cbd5e1', fontSize: '0.85rem' }}>
                        {shift.endTime ? (
                          <>
                            {formatDate(shift.endTime)}
                            <br />
                            <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                              {formatTime(shift.endTime)}
                            </span>
                          </>
                        ) : (
                          <span style={{ color: '#64748b', fontStyle: 'italic' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-heading)', color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                        EGP {expected.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-heading)', color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                        EGP {actual.toFixed(2)}
                      </td>
                      <td style={{
                        textAlign: 'right', fontFamily: 'var(--font-heading)', fontWeight: 600,
                        color: Math.abs(discrepancy) < 0.01 ? '#94a3b8' : discrepancy > 0 ? '#22c55e' : '#ef4444',
                        whiteSpace: 'nowrap',
                      }}>
                        {discrepancy >= 0 ? '+' : ''}{discrepancy.toFixed(2)}
                      </td>
                      <td>
                        <Link
                          href={`/admin/staff/${staffId}/shifts/${shift.id}/orders`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.35rem 0.7rem', borderRadius: '6px',
                            background: 'transparent',
                            border: '1px solid rgba(197,168,128,0.4)',
                            color: '#c5a880', fontSize: '0.75rem', fontWeight: 600,
                            textDecoration: 'none', transition: 'all 0.2s',
                            fontFamily: 'var(--font-heading)',
                            letterSpacing: '0.04em', whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(197,168,128,0.1)';
                            e.currentTarget.style.borderColor = '#c5a880';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = 'rgba(197,168,128,0.4)';
                          }}
                        >
                          <FaListAlt style={{ fontSize: '0.7rem' }} />
                          عرض الطلبات
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
