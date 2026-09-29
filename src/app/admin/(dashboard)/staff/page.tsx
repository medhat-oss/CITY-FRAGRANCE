'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaTimes, FaSpinner, FaKey } from 'react-icons/fa';
import styles from '../admin.module.css';
import ConfirmModal from '@/components/ConfirmModal';
import AlertModal from '@/components/AlertModal';

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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ title?: string; message: string; type?: 'error' | 'warning' | 'info' } | null>(null);

  // Form State for creating staff
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'CASHIER',
  });

  // Global Unified Shift PIN Modal
  const [globalPinModalOpen, setGlobalPinModalOpen] = useState(false);
  const [newGlobalPin, setNewGlobalPin] = useState('');
  const [globalPinError, setGlobalPinError] = useState('');
  const [globalPinSuccess, setGlobalPinSuccess] = useState('');
  const [globalPinSubmitting, setGlobalPinSubmitting] = useState(false);

  function openGlobalPinModal() {
    setNewGlobalPin('');
    setGlobalPinError('');
    setGlobalPinSuccess('');
    setGlobalPinModalOpen(true);
  }

  // User Account Login Password Modal
  const [passwordModal, setPasswordModal] = useState<{ open: boolean; staff: StaffUser | null }>({ open: false, staff: null });
  const [newLoginPassword, setNewLoginPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  function openPasswordModal(staff: StaffUser) {
    setPasswordModal({ open: true, staff });
    setNewLoginPassword('');
    setPasswordError('');
    setPasswordSuccess('');
  }

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

  function promptDelete(id: string, email: string) {
    const target = staffList.find((s) => s.id === id);
    const adminCount = staffList.filter((s) => s.role === 'ADMIN').length;
    if (target?.role === 'ADMIN' && adminCount <= 1) {
      setAlertMessage({ title: 'Protected Account', message: 'Cannot delete the last remaining administrator account.', type: 'warning' });
      return;
    }
    setDeleteTarget({ id, email });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();

      if (data.success) {
        setStaffList((prev) => prev.filter((u) => u.id !== id));
        setDeleteTarget(null);
      } else {
        setAlertMessage({ title: 'Deletion Failed', message: data.error || 'Failed to delete staff account', type: 'error' });
      }
    } catch {
      setAlertMessage({ title: 'Network Error', message: 'An error occurred while deleting staff account.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleUpdateGlobalPin() {
    const pin = newGlobalPin.trim();
    if (!pin || pin.length < 3) {
      setGlobalPinError('Shift PIN must be at least 3 characters.');
      return;
    }

    setGlobalPinError('');
    setGlobalPinSuccess('');
    setGlobalPinSubmitting(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ globalShiftPin: pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGlobalPinError(data.error || 'Failed to update global shift PIN');
      } else {
        setGlobalPinSuccess(data.message || 'Global Shift PIN updated successfully!');
        setNewGlobalPin('');
        setTimeout(() => setGlobalPinModalOpen(false), 1200);
      }
    } catch {
      setGlobalPinError('An error occurred. Please try again.');
    } finally {
      setGlobalPinSubmitting(false);
    }
  }

  async function handleChangePassword() {
    if (!passwordModal.staff) return;
    const loginPass = newLoginPassword.trim();

    if (!loginPass) {
      setPasswordError('Please enter a new login password.');
      return;
    }

    if (loginPass.length < 6) {
      setPasswordError('Login password must be at least 6 characters.');
      return;
    }

    setPasswordError('');
    setPasswordSuccess('');
    setPasswordSubmitting(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: passwordModal.staff.id,
          password: loginPass,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || 'Failed to update password');
      } else {
        setPasswordSuccess(data.message || 'Account login password updated successfully');
        setNewLoginPassword('');
        setTimeout(() => setPasswordModal({ open: false, staff: null }), 1200);
      }
    } catch {
      setPasswordError('An error occurred. Please try again.');
    } finally {
      setPasswordSubmitting(false);
    }
  }


  return (
    <div dir="ltr" className="w-full max-w-full min-w-0 overflow-hidden">
      <div className="flex flex-col items-start gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between mt-2 md:mt-0">
        <div className="flex items-center gap-3">
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 500, color: '#f8f9fa', margin: 0 }}>
            Manage Staff
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={openGlobalPinModal}
            className="px-4 py-2 text-xs font-semibold rounded border border-[#f59e0b] text-[#f59e0b] hover:bg-[rgba(245,158,11,0.12)] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            style={{ letterSpacing: '0.04em' }}
            title="Update Global Shift PIN for Cash Drawer Shifts"
          >
            <FaKey />
            <span>CHANGE SHIFT PIN</span>
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
          >
            Create Staff Account
          </button>
        </div>
      </div>

      <div className="w-full max-w-full min-w-0">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <FaSpinner className={styles.spinIcon} style={{ color: '#ffffff', fontSize: '2rem' }} />
          </div>
        ) : (<>
          <div className="hidden md:block w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#16234D]">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[700px] text-left border-collapse">
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
                        {staff.role}
                      </span>
                    </td>
                    <td className="p-4 text-[#94a3b8] text-sm align-middle">
                      {new Date(staff.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4 align-middle text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/staff/${staff.id}/shifts`}
                          className="text-xs text-[#60a5fa] hover:bg-[rgba(96,165,250,0.12)] px-2.5 py-1 rounded transition-colors inline-flex items-center"
                          title="View Shifts"
                        >
                          Shifts
                        </Link>
                        <button
                          className="text-xs text-[#fbbf24] hover:bg-[rgba(251,191,36,0.12)] px-2.5 py-1 rounded transition-colors"
                          onClick={() => openPasswordModal(staff)}
                          title="Change Login Password"
                        >
                          Password
                        </button>
                        {(() => {
                          const isOnlyAdmin = staff.role === 'ADMIN' && staffList.filter((s) => s.role === 'ADMIN').length <= 1;
                          return (
                            <button
                              className="text-xs text-red-500 hover:bg-[rgba(239,68,68,0.12)] px-2.5 py-1 rounded transition-colors"
                              onClick={() => promptDelete(staff.id, staff.email)}
                              disabled={isOnlyAdmin}
                              title={isOnlyAdmin ? 'Cannot delete the only admin' : 'Delete Staff'}
                              style={{
                                opacity: isOnlyAdmin ? 0.3 : 1,
                                cursor: isOnlyAdmin ? 'not-allowed' : 'pointer',
                              }}
                            >
                              Delete
                            </button>
                          );
                        })()}
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
                    className="text-xs text-[#60a5fa] hover:bg-[rgba(96,165,250,0.12)] px-2.5 py-1.5 rounded transition-colors inline-flex items-center"
                  >
                    Shifts
                  </Link>
                  <button
                    className="text-xs text-[#fbbf24] hover:bg-[rgba(251,191,36,0.12)] px-2.5 py-1.5 rounded transition-colors inline-flex items-center"
                    onClick={() => openPasswordModal(staff)}
                    title="Change Login Password"
                  >
                    Password
                  </button>
                  {(() => {
                    const isOnlyAdmin = staff.role === 'ADMIN' && staffList.filter((s) => s.role === 'ADMIN').length <= 1;
                    return (
                      <button
                        className="text-xs text-red-500 hover:bg-[rgba(239,68,68,0.12)] px-2.5 py-1.5 rounded transition-colors"
                        onClick={() => promptDelete(staff.id, staff.email)}
                        disabled={isOnlyAdmin}
                        title={isOnlyAdmin ? 'Cannot delete the only admin' : 'Delete Staff'}
                        style={{
                          opacity: isOnlyAdmin ? 0.3 : 1,
                          cursor: isOnlyAdmin ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    );
                  })()}
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

      {/* Global Shift PIN Modal */}
      {globalPinModalOpen && (
        <div className={`${styles.modalOverlay} ${styles.active}`} onClick={() => setGlobalPinModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className={styles.modalHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaKey style={{ color: '#f59e0b', fontSize: '0.95rem' }} />
                <span>Update Global Shift PIN</span>
              </h3>
              <button type="button" className={styles.btnClose} onClick={() => setGlobalPinModalOpen(false)}><FaTimes /></button>
            </div>
            <div className={styles.modalForm}>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                This PIN is unified across all cashiers and staff to unlock, verify, and close cash drawer shifts at POS checkout.
              </p>

              <div className={styles.formGroup}>
                <label>New Unified Shift PIN <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>(min 3 characters)</span></label>
                <input
                  type="text"
                  value={newGlobalPin}
                  onChange={(e) => { setNewGlobalPin(e.target.value); setGlobalPinError(''); setGlobalPinSuccess(''); }}
                  placeholder="e.g. 123456"
                  minLength={3}
                  required
                />
              </div>

              {globalPinError && (
                <p style={{ color: '#f87171', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {globalPinError}
                </p>
              )}
              {globalPinSuccess && (
                <p style={{ color: '#22c55e', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(34,197,94,0.1)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(34,197,94,0.2)' }}>
                  {globalPinSuccess}
                </p>
              )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ color: '#e2e8f0', borderColor: 'rgba(255,255,255,0.3)' }}
                  onClick={() => setGlobalPinModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={globalPinSubmitting || !newGlobalPin.trim()}
                  onClick={handleUpdateGlobalPin}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#d97706', borderColor: '#d97706' }}
                >
                  {globalPinSubmitting && <FaSpinner className={styles.spinIcon} />}
                  <span>Save Global PIN</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Login Password Modal */}
      {passwordModal.open && passwordModal.staff && (
        <div className={`${styles.modalOverlay} ${styles.active}`} onClick={() => setPasswordModal({ open: false, staff: null })}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className={styles.modalHeader}>
              <h3>Change Login Password</h3>
              <button type="button" className={styles.btnClose} onClick={() => setPasswordModal({ open: false, staff: null })}><FaTimes /></button>
            </div>
            <div className={styles.modalForm}>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                Updating login password for: <strong style={{ color: '#e2e8f0' }}>{passwordModal.staff.username}</strong> ({passwordModal.staff.email})
                <div style={{ marginTop: '0.25rem' }}>
                  <span className={`badge ${passwordModal.staff.role === 'ADMIN' ? 'badge-primary' : 'badge-secondary'}`}>
                    {passwordModal.staff.role}
                  </span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>New Account Login Password <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>(min 6 characters)</span></label>
                <input
                  type="password"
                  value={newLoginPassword}
                  onChange={(e) => { setNewLoginPassword(e.target.value); setPasswordError(''); setPasswordSuccess(''); }}
                  placeholder="Enter new account login password"
                  autoComplete="new-password"
                  minLength={6}
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
                  disabled={passwordSubmitting || !newLoginPassword.trim()}
                  onClick={handleChangePassword}
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

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Staff Account"
        message={`Are you sure you want to delete staff account: ${deleteTarget?.email}?\n\nThis account will immediately lose access to the system.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <AlertModal
        isOpen={!!alertMessage}
        title={alertMessage?.title}
        message={alertMessage?.message || ''}
        type={alertMessage?.type || 'info'}
        onClose={() => setAlertMessage(null)}
      />
    </div>
  );
}