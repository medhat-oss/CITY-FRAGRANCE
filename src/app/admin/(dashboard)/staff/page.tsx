'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaUsers, FaPlus, FaTrashAlt, FaTimes, FaSpinner, FaUserShield, FaKey, FaEye } from 'react-icons/fa';
import styles from '../admin.module.css';

interface StaffUser {
  id: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
}


export default function ManageStaffPage() {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'CASHIER',
  });

  // Change Shift Password
  const [passwordModal, setPasswordModal] = useState<{ open: boolean; staff: StaffUser | null }>({ open: false, staff: null });
  const [newShiftPassword, setNewShiftPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

// View Shifts — state kept for backward compat, now navigates to dedicated page

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/staff');
      const data = await res.json();
      if (data.success) {
        setStaffList(data.staff || []);
      } else {
        setStaffList([]);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      setStaffList([]);
    }
    setLoading(false);
  }

  function openAdd() {
    setForm({ username: '', email: '', password: '', role: 'CASHIER' });
    setError('');
    setModalOpen(true);
  }

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create staff account');
        setSubmitting(false);
        return;
      }

      if (data.success && data.user) {
        setStaffList((prev) => [...prev, data.user]);
        setModalOpen(false);
      }
    } catch {
      setError('An error occurred. Please try again.');
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string, email: string) {
    if (email.toLowerCase() === 'admin@cityfragrance.com') {
      alert('The primary Admin account cannot be deleted.');
      return;
    }

    if (!confirm(`Are you sure you want to delete staff account: ${email}?`)) return;

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();

      if (data.success) {
        setStaffList((prev) => prev.filter((u) => u.id !== id));
      } else {
        alert(data.error || 'Failed to delete staff account');
      }
    } catch {
      alert('An error occurred while deleting.');
    }
  }

  async function handleChangeShiftPassword() {
    if (!passwordModal.staff || !newShiftPassword.trim()) return;
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordSubmitting(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: passwordModal.staff.id, shiftPassword: newShiftPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || 'Failed to update shift password');
      } else {
        setPasswordSuccess('Shift password updated successfully');
        setNewShiftPassword('');
        setTimeout(() => setPasswordModal({ open: false, staff: null }), 1200);
      }
    } catch {
      setPasswordError('An error occurred. Please try again.');
    }
    setPasswordSubmitting(false);
  }


  return (
    <div dir="ltr">
      <div className="flex flex-col items-start gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <FaUsers style={{ color: '#ffffff', fontSize: '1.25rem' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 500, color: '#f8f9fa', margin: 0 }}>
            Manage Staff
          </h2>
        </div>
        <button onClick={openAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
          <FaPlus /> Create Staff Account
        </button>
      </div>

      <div className={styles.adminContent}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <FaSpinner className={styles.spinIcon} style={{ color: '#ffffff', fontSize: '2rem' }} />
          </div>
        ) : (<>
          <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-white/10 bg-[#111B3D]/50 backdrop-blur-md">
            <table className="w-full min-w-[650px] table-auto text-left border-collapse">
              <thead>
                <tr className="bg-[#09142E]">
                  <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider">Username</th>
                  <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider">Email</th>
                  <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider">Role</th>
                  <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider">Creation Date</th>
                  <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-white/5 transition-colors border-b border-white/10">
                    <td className="p-4 font-semibold text-[#e2e8f0] align-middle">{staff.username}</td>
                    <td className="p-4 text-[#cbd5e1] align-middle">{staff.email}</td>
                    <td className="p-4 align-middle">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider px-2.5 py-1 rounded-sm"
                        style={{
                          background: staff.role === 'ADMIN' ? 'rgba(167,139,250,0.15)' : 'rgba(59,130,246,0.15)',
                          color: staff.role === 'ADMIN' ? '#a78bfa' : '#60a5fa',
                        }}
                      >
                        {staff.role === 'ADMIN' && <FaUserShield className="text-[10px]" />}
                        {staff.role}
                      </span>
                    </td>
                    <td className="p-4 text-[#94a3b8] text-sm align-middle">
                      {new Date(staff.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4 align-middle text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/admin/staff/${staff.id}/shifts`}
                          className="text-[#60a5fa] hover:bg-[rgba(96,165,250,0.12)] p-2 rounded transition-colors inline-flex items-center"
                          title="View Shifts"
                        >
                          <FaEye />
                        </Link>
                        {staff.role === 'CASHIER' && (
                          <button
                            className="text-[#fbbf24] hover:bg-[rgba(251,191,36,0.12)] p-2 rounded transition-colors"
                            onClick={() => { setPasswordModal({ open: true, staff }); setNewShiftPassword(''); setPasswordError(''); setPasswordSuccess(''); }}
                            title="Change Shift Password"
                          >
                            <FaKey />
                          </button>
                        )}
                        <button
                          className="text-red-500 hover:bg-[rgba(239,68,68,0.12)] p-2 rounded transition-colors"
                          onClick={() => handleDelete(staff.id, staff.email)}
                          disabled={staff.email.toLowerCase() === 'admin@cityfragrance.com'}
                          title="Delete Staff"
                          style={{
                            opacity: staff.email.toLowerCase() === 'admin@cityfragrance.com' ? 0.3 : 1,
                            cursor: staff.email.toLowerCase() === 'admin@cityfragrance.com' ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {staffList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-12 text-[#94a3b8]">No staff accounts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {staffList.map((staff) => (
              <div key={staff.id} className="rounded-xl border border-white/10 bg-[#111B3D]/50 backdrop-blur-md p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <strong className="text-sm text-white block truncate">{staff.username}</strong>
                    <span className="text-xs text-slate-400 block truncate">{staff.email}</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider px-2 py-0.5 rounded-sm mt-1"
                      style={{
                        background: staff.role === 'ADMIN' ? 'rgba(167,139,250,0.15)' : 'rgba(59,130,246,0.15)',
                        color: staff.role === 'ADMIN' ? '#a78bfa' : '#60a5fa',
                      }}
                    >
                      {staff.role === 'ADMIN' && <FaUserShield className="text-[10px]" />}
                      {staff.role}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Created: {new Date(staff.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
                <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-white/10">
                  <Link
                    href={`/admin/staff/${staff.id}/shifts`}
                    className="text-xs text-[#60a5fa] hover:bg-[rgba(96,165,250,0.12)] px-2.5 py-1.5 rounded transition-colors inline-flex items-center gap-1"
                  >
                    <FaEye className="text-[10px]" /> Shifts
                  </Link>
                  {staff.role === 'CASHIER' && (
                    <button
                      className="text-xs text-[#fbbf24] hover:bg-[rgba(251,191,36,0.12)] px-2.5 py-1.5 rounded transition-colors inline-flex items-center gap-1"
                      onClick={() => { setPasswordModal({ open: true, staff }); setNewShiftPassword(''); setPasswordError(''); setPasswordSuccess(''); }}
                    >
                      <FaKey className="text-[10px]" /> Password
                    </button>
                  )}
                  <button
                    className="text-xs text-red-500 hover:bg-[rgba(239,68,68,0.12)] px-2.5 py-1.5 rounded transition-colors"
                    onClick={() => handleDelete(staff.id, staff.email)}
                    disabled={staff.email.toLowerCase() === 'admin@cityfragrance.com'}
                    style={{
                      opacity: staff.email.toLowerCase() === 'admin@cityfragrance.com' ? 0.3 : 1,
                      cursor: staff.email.toLowerCase() === 'admin@cityfragrance.com' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <FaTrashAlt /> Delete
                  </button>
                </div>
              </div>
            ))}
            {staffList.length === 0 && (
              <p className="text-center py-12 text-[#94a3b8] text-sm">No staff accounts found.</p>
            )}
          </div>
        </>)}
      </div>

      {/* Create Staff Modal */}
      {modalOpen && (
        <div className={`${styles.modalOverlay} ${styles.active}`} onClick={() => setModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h3>Create Staff Account</h3>
              <button type="button" className={styles.btnClose} onClick={() => setModalOpen(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleCreateStaff} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  placeholder="e.g. cashier1"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="e.g. cashier1@cityfragrance.com"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Access Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  required
                >
                  <option value="CASHIER">Cashier (POS Only)</option>
                  <option value="ADMIN">Admin (Full Control)</option>
                </select>
              </div>

              {error && (
                <p style={{
                  color: '#f87171',
                  fontSize: '0.85rem',
                  margin: '0.5rem 0 0',
                  textAlign: 'center',
                  background: 'rgba(239, 68, 68, 0.1)',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}>
                  {error}
                </p>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ color: '#e2e8f0', borderColor: 'rgba(255,255,255,0.3)' }}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {submitting && <FaSpinner className={styles.spinIcon} />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Shift Password Modal */}
      {passwordModal.open && passwordModal.staff && (
        <div className={`${styles.modalOverlay} ${styles.active}`} onClick={() => setPasswordModal({ open: false, staff: null })}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className={styles.modalHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaKey style={{ color: '#fbbf24' }} /> Change Shift Password
              </h3>
              <button type="button" className={styles.btnClose} onClick={() => setPasswordModal({ open: false, staff: null })}><FaTimes /></button>
            </div>
            <div className={styles.modalForm}>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Updating shift password for: <strong style={{ color: '#e2e8f0' }}>{passwordModal.staff.username}</strong> ({passwordModal.staff.email})
              </p>
              <div className={styles.formGroup}>
                <label>New Shift Password</label>
                <input
                  type="text"
                  value={newShiftPassword}
                  onChange={(e) => { setNewShiftPassword(e.target.value); setPasswordError(''); setPasswordSuccess(''); }}
                  placeholder="Enter new shift password"
                  minLength={3}
                  required
                />
              </div>

              {passwordError && (
                <p style={{ color: '#f87171', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {passwordError}
                </p>
              )}
              {passwordSuccess && (
                <p style={{ color: '#22c55e', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(34,197,94,0.1)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(34,197,94,0.2)' }}>
                  {passwordSuccess}
                </p>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ color: '#e2e8f0', borderColor: 'rgba(255,255,255,0.3)' }}
                  onClick={() => setPasswordModal({ open: false, staff: null })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={passwordSubmitting || !newShiftPassword.trim()}
                  onClick={handleChangeShiftPassword}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {passwordSubmitting && <FaSpinner className={styles.spinIcon} />}
                  <span>Update Password</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
}