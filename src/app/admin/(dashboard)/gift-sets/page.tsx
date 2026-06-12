'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useProducts } from '@/hooks/useProducts';
import { formatEGP } from '@/utils/currency';
import {
  FaGift, FaPlus, FaEdit, FaTrashAlt, FaTimes,
  FaCloudUploadAlt, FaSpinner,
} from 'react-icons/fa';
import styles from '../admin.module.css';

interface GiftSet {
  id: string;
  name: string;
  description: string;
  price: number;
  costPrice?: number;
  isDraft: boolean;
  image: string;
  productIds: string[];
  createdAt: string;
  stock?: number;
}

interface FormState {
  name: string;
  description: string;
  price: string;
  costPrice: string;
  isDraft: boolean;
  image: string;
  productIds: string[];
  stock: string;
}

const EMPTY_FORM: FormState = {
  name: '', description: '', price: '', costPrice: '', isDraft: true,
  image: '', productIds: [], stock: '',
};

export default function AdminGiftSetsPage() {
  const { products } = useProducts();
  const [giftSets, setGiftSets]   = useState<GiftSet[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<GiftSet | null>(null);
  const [form, setForm]           = useState<FormState>(EMPTY_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // ── loading states ──────────────────────────────────────────────────────
  const [isSaving, setIsSaving]   = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/gift-sets')
      .then((r) => r.json())
      .then((d) => { setGiftSets(d.giftSets || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openAdd = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImagePreview(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((gs: GiftSet) => {
    setEditing(gs);
    setForm({
      name: gs.name, description: gs.description,
      price: String(gs.price), costPrice: String(gs.costPrice ?? ''),
      isDraft: gs.isDraft ?? false,
      image: gs.image, productIds: [...gs.productIds],
      stock: gs.stock !== undefined ? String(gs.stock) : '',
    });
    setImagePreview(null);
    setModalOpen(true);
  }, []);

  const toggleProduct = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(id)
        ? prev.productIds.filter((pid) => pid !== id)
        : [...prev.productIds, id],
    }));
  }, []);

  const toggleDraft = useCallback(() => {
    setForm((prev) => ({ ...prev, isDraft: !prev.isDraft }));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    // Optimistic close — modal disappears instantly
    const editingSnapshot = editing;
    setModalOpen(false);

    const url    = '/api/admin/gift-sets';
    const method = editingSnapshot ? 'PUT' : 'POST';
    const body   = editingSnapshot
      ? { ...form, id: editingSnapshot.id, price: parseFloat(form.price) || 0, costPrice: parseFloat(form.costPrice) || 0, stock: form.stock !== '' ? parseInt(form.stock, 10) : 0 }
      : { ...form, price: parseFloat(form.price) || 0, costPrice: parseFloat(form.costPrice) || 0, stock: form.stock !== '' ? parseInt(form.stock, 10) : 0 };

    try {
      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        setGiftSets((prev) =>
          editingSnapshot
            ? prev.map((g) => (g.id === editingSnapshot.id ? data.giftSet : g))
            : [data.giftSet, ...prev]
        );
      }
    } finally {
      setIsSaving(false);
    }
  }, [editing, form]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this gift set?')) return;
    setDeletingId(id);
    try {
      const res  = await fetch('/api/admin/gift-sets', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const data = await res.json();
      if (data.success) setGiftSets((prev) => prev.filter((g) => g.id !== id));
    } finally {
      setDeletingId(null);
    }
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const res  = await fetch('/api/upload', { method: 'POST', body: formData, signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.path) setForm((prev) => ({ ...prev, image: data.path }));
    } catch { clearTimeout(timeout); }
    setIsUploading(false);
  }, []);

  // Memoised gift-set rows so the table doesn't re-render unnecessarily
  const rows = useMemo(() => giftSets, [giftSets]);

  if (loading) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FaGift style={{ color: '#ffffff', fontSize: '1.25rem' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 500, color: '#f8f9fa', margin: 0 }}>
            Gift Sets Management
          </h2>
        </div>
        <button onClick={openAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} disabled={isSaving}>
          <FaPlus /> Add Gift Set
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>Image</th><th>Name</th><th>Price</th>
              <th>Products</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((gs) => (
              <tr key={gs.id} style={{ opacity: deletingId === gs.id ? 0.4 : 1, transition: 'opacity 0.2s ease' }}>
                <td className={styles.productImgCell}>
                  {gs.image
                    ? <Image src={gs.image} alt={gs.name} width={50} height={50} style={{ objectFit: 'cover', borderRadius: '4px' }} />
                    : <div style={{ width: 50, height: 50, background: '#1d3573', borderRadius: '4px' }} />}
                </td>
                <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{gs.name}</td>
                <td style={{ fontFamily: 'var(--font-heading)', color: '#ffffff', fontWeight: 600 }}>{formatEGP(gs.price)}</td>
                <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{gs.productIds.length} products</td>
                <td>
                  <span style={{
                    display: 'inline-block', fontSize: '0.68rem', fontWeight: 600,
                    padding: '3px 9px', borderRadius: '20px',
                    background: gs.isDraft ? 'rgba(234,179,8,0.12)' : 'rgba(34,197,94,0.12)',
                    border: `1px solid ${gs.isDraft ? 'rgba(234,179,8,0.4)' : 'rgba(34,197,94,0.4)'}`,
                    color: gs.isDraft ? '#facc15' : '#4ade80', whiteSpace: 'nowrap',
                  }}>
                    {gs.isDraft ? '📝 Draft' : '✅ Live'}
                  </span>
                </td>
                <td>
                  <div className={styles.actionBtns}>
                    <button className={`${styles.btnIcon} ${styles.edit}`} onClick={() => openEdit(gs)} disabled={deletingId === gs.id} aria-label={`Edit ${gs.name}`}>
                      <FaEdit />
                    </button>
                    <button className={`${styles.btnIcon} ${styles.delete}`} onClick={() => handleDelete(gs.id)} disabled={deletingId === gs.id} aria-label={`Delete ${gs.name}`}>
                      {deletingId === gs.id
                        ? <FaSpinner style={{ animation: 'spin 0.8s linear infinite' }} />
                        : <FaTrashAlt />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                  No gift sets yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className={`${styles.modalOverlay} ${styles.active}`} onClick={() => setModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className={styles.modalHeader}>
              <h3>{editing ? 'Edit Gift Set' : 'Add Gift Set'}</h3>
              <button type="button" className={styles.btnClose} onClick={() => setModalOpen(false)}><FaTimes /></button>
            </div>
            <div className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  style={{ padding: '0.75rem', border: '1px solid #1d3573', borderRadius: '4px', fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: '#e2e8f0', backgroundColor: '#09142E', width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                <label>Price (EGP)</label>
                <input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} step="0.01" required />
              </div>
              <div className={styles.formGroup}>
                <label>Cost Price (EGP)</label>
                <input type="number" value={form.costPrice} onChange={(e) => setForm((p) => ({ ...p, costPrice: e.target.value }))} step="0.01" placeholder="Optional" />
              </div>
              <div className={styles.formGroup}>
                <label>Stock Quantity</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} min="0" placeholder="e.g. 50" />
                </div>
                <div className={styles.formGroup}>
                  <label>Image</label>
                  <div className={styles.uploadArea}>
                    {(imagePreview || form.image) ? (
                      <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #1d3573', background: '#09142E' }}>
                        <Image src={imagePreview || form.image} alt="Preview" fill className="object-cover" sizes="300px" onLoad={() => imagePreview && URL.revokeObjectURL(imagePreview)} />
                        {isUploading && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaSpinner className={styles.spinIcon} style={{ color: '#ffffff', fontSize: '2rem' }} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <label htmlFor="gs-image-upload" className={styles.uploadLabel}>
                        <span className={styles.uploadPrompt}><FaCloudUploadAlt style={{ fontSize: '1.5rem' }} /><span>Upload Image</span></span>
                      </label>
                    )}
                    <input id="gs-image-upload" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={isUploading} />
                    {(imagePreview || form.image) && (
                      <label htmlFor="gs-image-upload" className={styles.uploadLabel} style={{ padding: '0.5rem', borderStyle: 'solid', cursor: 'pointer' }}>
                        <span style={{ fontSize: '0.8rem', color: '#ffffff' }}>Change Image</span>
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Select Products</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', border: '1px solid #1d3573', borderRadius: '4px', background: '#09142E' }}>
                  {products.map((p) => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: form.productIds.includes(p.id) ? '#ffffff' : 'transparent', color: form.productIds.includes(p.id) ? '#09142E' : '#e2e8f0', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', border: '1px solid', borderColor: form.productIds.includes(p.id) ? '#ffffff' : 'rgba(255,255,255,0.2)', transition: 'all 0.2s' }}>
                      <input type="checkbox" checked={form.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} style={{ accentColor: '#ffffff' }} />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>

              {/* Draft / Publish Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: '8px', background: form.isDraft ? 'rgba(234,179,8,0.08)' : 'rgba(34,197,94,0.08)', border: `1px solid ${form.isDraft ? 'rgba(234,179,8,0.3)' : 'rgba(34,197,94,0.3)'}`, marginBottom: '1.5rem', transition: 'all 0.2s ease' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: form.isDraft ? '#facc15' : '#4ade80' }}>
                    {form.isDraft ? '📝 Draft Mode — Hidden from customers' : '✅ Published — Visible on storefront'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                    {form.isDraft ? 'Save as draft to work on it later without showing it publicly.' : 'Gift set is live and visible to all customers.'}
                  </p>
                </div>
                <button type="button" onClick={toggleDraft} aria-label="Toggle draft mode" style={{ position: 'relative', width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer', background: form.isDraft ? '#4b5563' : '#22c55e', transition: 'background 0.25s ease', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: '3px', left: form.isDraft ? '3px' : '23px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.25s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                </button>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className="btn btn-outline" style={{ color: '#e2e8f0', borderColor: 'rgba(255,255,255,0.3)' }} onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving || isUploading}>
                  {isSaving
                    ? <><FaSpinner style={{ animation: 'spin 0.8s linear infinite', marginRight: '6px' }} /> Saving…</>
                    : form.isDraft ? 'Save as Draft' : 'Publish Gift Set'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
