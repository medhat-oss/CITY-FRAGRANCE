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
  const params = useParams<{ userId: string }>();
  const staffId = params.userId;

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
          const found = staffData.staff?.find((u: { id: string }) => u.id === staffId);
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
    <div dir="ltr">
      <div className="flex flex-col items-start gap-3 mb-6 sm:flex-row sm:items-center sm:gap-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href="/admin/staff"
            className="text-[#94a3b8] hover:text-[#e2e8f0] flex items-center gap-1.5 no-underline text-sm transition-colors"
          >
            <FaArrowLeft /> Back to Staff
          </Link>
          <span className="text-[#1d3573] text-base">|</span>
          <FaCalendarAlt className="text-[#60a5fa] text-base" />
          <h2 className="font-heading text-xl font-medium text-[#f8f9fa] m-0 whitespace-nowrap">
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
        ) : (<>
          <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-white/10 bg-[#111B3D]/50 backdrop-blur-md">
            <table className="w-full min-w-[800px] table-auto text-left border-collapse">
              <thead>
                <tr className="bg-[#09142E]">
                  <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider">Shift ID / Date</th>
                  <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider">Status</th>
                  <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider">Start Time</th>
                  <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider">End Time</th>
                  <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider text-right">Expected Total</th>
                  <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider text-right">Actual Amount</th>
                  <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider text-right">Discrepancy</th>
                  <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => {
                  const expected = shift.expectedTotal ?? 0;
                  const actual = shift.actualCash ?? 0;
                  const discrepancy = shift.discrepancy ?? (actual - expected);
                  const isOpen = shift.status === 'OPEN';

                  return (
                    <tr key={shift.id} className="hover:bg-white/5 transition-colors border-b border-white/10">
                      <td className="p-4 align-middle whitespace-nowrap">
                        <span className="text-xs text-[#64748b] font-mono">{shift.id.slice(0, 8)}…</span>
                        <br />
                        <span className="text-sm text-[#e2e8f0]">{formatDate(shift.startTime)}</span>
                      </td>
                      <td className="p-4 align-middle">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider px-2.5 py-1 rounded-sm"
                          style={{
                            background: isOpen ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)',
                            color: isOpen ? '#22c55e' : '#94a3b8',
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: isOpen ? '#22c55e' : '#94a3b8' }} />
                          {isOpen ? 'ACTIVE' : 'CLOSED'}
                        </span>
                      </td>
                      <td className="p-4 align-middle whitespace-nowrap text-[#cbd5e1] text-sm">
                        {formatDate(shift.startTime)}
                        <br />
                        <span className="text-[#64748b] text-xs">{formatTime(shift.startTime)}</span>
                      </td>
                      <td className="p-4 align-middle whitespace-nowrap text-[#cbd5e1] text-sm">
                        {shift.endTime ? (
                          <>
                            {formatDate(shift.endTime)}
                            <br />
                            <span className="text-[#64748b] text-xs">{formatTime(shift.endTime)}</span>
                          </>
                        ) : (
                          <span className="text-[#64748b] italic">—</span>
                        )}
                      </td>
                      <td className="p-4 align-middle text-right font-heading text-[#e2e8f0] whitespace-nowrap">
                        EGP {expected.toFixed(2)}
                      </td>
                      <td className="p-4 align-middle text-right font-heading text-[#e2e8f0] whitespace-nowrap">
                        EGP {actual.toFixed(2)}
                      </td>
                      <td className="p-4 align-middle text-right font-heading font-semibold whitespace-nowrap"
                        style={{
                          color: Math.abs(discrepancy) < 0.01 ? '#94a3b8' : discrepancy > 0 ? '#22c55e' : '#ef4444',
                        }}
                      >
                        {discrepancy >= 0 ? '+' : ''}{discrepancy.toFixed(2)}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <Link
                          href={`/admin/staff/${staffId}/shifts/${shift.id}/orders`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[rgba(197,168,128,0.4)] text-[#c5a880] text-xs font-semibold font-heading tracking-wide whitespace-nowrap no-underline transition-all hover:bg-[rgba(197,168,128,0.1)] hover:border-[#c5a880]"
                        >
                          <FaListAlt className="text-[10px]" />
                          View Orders
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {shifts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center p-12 text-[#94a3b8]">No shift logs found for this employee.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {shifts.map((shift) => {
              const expected = shift.expectedTotal ?? 0;
              const actual = shift.actualCash ?? 0;
              const discrepancy = shift.discrepancy ?? (actual - expected);
              const isOpen = shift.status === 'OPEN';

              return (
                <div key={shift.id} className="rounded-xl border border-white/10 bg-[#111B3D]/50 backdrop-blur-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs text-[#64748b] font-mono">{shift.id.slice(0, 8)}…</span>
                      <p className="text-sm text-[#e2e8f0] m-0">{formatDate(shift.startTime)}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider px-2.5 py-1 rounded-sm"
                      style={{
                        background: isOpen ? 'rgba(34,197,94,0.15)' : 'rgba(100,116,139,0.15)',
                        color: isOpen ? '#22c55e' : '#94a3b8',
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: isOpen ? '#22c55e' : '#94a3b8' }} />
                      {isOpen ? 'ACTIVE' : 'CLOSED'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs mb-2">
                    <div>
                      <span className="text-slate-500">Start</span>
                      <p className="text-slate-200 m-0">{formatDate(shift.startTime)}</p>
                      <p className="text-slate-500 m-0 text-[10px]">{formatTime(shift.startTime)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">End</span>
                      {shift.endTime ? (
                        <>
                          <p className="text-slate-200 m-0">{formatDate(shift.endTime)}</p>
                          <p className="text-slate-500 m-0 text-[10px]">{formatTime(shift.endTime)}</p>
                        </>
                      ) : (
                        <p className="text-slate-500 m-0 italic">—</p>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500">Expected</span>
                      <p className="text-slate-200 m-0 font-heading">EGP {expected.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Actual</span>
                      <p className="text-slate-200 m-0 font-heading">EGP {actual.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="font-heading font-semibold text-xs"
                      style={{
                        color: Math.abs(discrepancy) < 0.01 ? '#94a3b8' : discrepancy > 0 ? '#22c55e' : '#ef4444',
                      }}
                    >
                      {discrepancy >= 0 ? '+' : ''}{discrepancy.toFixed(2)}
                    </span>
                    <Link
                      href={`/admin/staff/${staffId}/shifts/${shift.id}/orders`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[rgba(197,168,128,0.4)] text-[#c5a880] text-xs font-semibold font-heading tracking-wide whitespace-nowrap no-underline transition-all hover:bg-[rgba(197,168,128,0.1)] hover:border-[#c5a880]"
                    >
                      <FaListAlt className="text-[10px]" />
                      View Orders
                    </Link>
                  </div>
                </div>
              );
            })}
            {shifts.length === 0 && (
              <p className="text-center py-12 text-[#94a3b8] text-sm">No shift logs found for this employee.</p>
            )}
          </div>
        </>)}
      </div>
    </div>
  );
}
