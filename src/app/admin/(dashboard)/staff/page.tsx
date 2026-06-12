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


  const actionBtnBase: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '0.4rem', borderRadius: 4, transition: 'all 0.2s',
    fontSize: '0.85rem',
  };

  return (
    <div dir="ltr">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FaUsers style={{ color: '#ffffff', fontSize: '1.25rem' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 500, color: '#f8f9fa', margin: 0 }}>
            Manage Staff
          </h2>
        </div>
        <button onClick={openAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaPlus /> Create Staff Account
        </button>
      </div>

      <div className={styles.adminContent}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <FaSpinner className={styles.spinIcon} style={{ color: '#ffffff', fontSize: '2rem' }} />
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Creation Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => (
                  <tr key={staff.id}>
                    <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{staff.username}</td>
                    <td style={{ color: '#cbd5e1' }}>{staff.email}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        background: staff.role === 'ADMIN' ? 'rgba(167, 139, 250, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        color: staff.role === 'ADMIN' ? '#a78bfa' : '#60a5fa',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}>
                        {staff.role === 'ADMIN' && <FaUserShield style={{ fontSize: '0.7rem' }} />}
                        {staff.role}
                      </span>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      {new Date(staff.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        {/* View Shifts */}
                        <Link
                          href={`/admin/staff/${staff.id}/shifts`}
                          style={{ ...actionBtnBase, color: '#60a5fa', display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
                          title="View Shifts"
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(96, 165, 250, 0.12)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                        >
                          <FaEye />
                        </Link>
                        {/* Change Shift Password (Cashier only) */}
                        {staff.role === 'CASHIER' && (
                          <button
                            style={{ ...actionBtnBase, color: '#fbbf24' }}
                            onClick={() => { setPasswordModal({ open: true, staff }); setNewShiftPassword(''); setPasswordError(''); setPasswordSuccess(''); }}
                            title="Change Shift Password"
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251, 191, 36, 0.12)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                          >
                            <FaKey />
                          </button>
                        )}
                        {/* Delete */}
                        <button
                          style={{
                            ...actionBtnBase,
                            color: '#ef4444',
                            opacity: staff.email.toLowerCase() === 'admin@cityfragrance.com' ? 0.3 : 1,
                            cursor: staff.email.toLowerCase() === 'admin@cityfragrance.com' ? 'not-allowed' : 'pointer',
                          }}
                          onClick={() => handleDelete(staff.id, staff.email)}
                          disabled={staff.email.toLowerCase() === 'admin@cityfragrance.com'}
                          title="Delete Staff"
                          onMouseEnter={(e) => { if (staff.email.toLowerCase() !== 'admin@cityfragrance.com') e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {staffList.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                      No staff accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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