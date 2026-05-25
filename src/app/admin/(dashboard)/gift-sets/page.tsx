'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useProducts } from '@/hooks/useProducts';
import { formatEGP } from '@/utils/currency';
import { FaGift, FaPlus, FaEdit, FaTrashAlt, FaTimes, FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';
import styles from '../admin.module.css';

interface GiftSet {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  productIds: string[];
  createdAt: string;
}

export default function AdminGiftSetsPage() {
  const { products } = useProducts();
  const [giftSets, setGiftSets] = useState<GiftSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GiftSet | null>(null);
  const [form, setForm] = useState<{ name: string; description: string; price: string; image: string; productIds: string[] }>({ name: '', description: '', price: '', image: '', productIds: [] });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/gift-sets')
      .then((r) => r.json())
      .then((d) => { setGiftSets(d.giftSets || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function openAdd() {
    setEditing(null);
    setForm({ name: '', description: '', price: '', image: '', productIds: [] });
    setModalOpen(true);
  }

  function openEdit(gs: GiftSet) {
    setEditing(gs);
    setForm({ name: gs.name, description: gs.description, price: String(gs.price), image: gs.image, productIds: [...gs.productIds] });
    setModalOpen(true);
  }

  function toggleProduct(id: string) {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(id)
        ? prev.productIds.filter((pid) => pid !== id)
        : [...prev.productIds, id],
    }));
  }

  async function handleSave() {
    const url = '/api/admin/gift-sets';
    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { ...form, id: editing.id, price: form.price } : form;
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success) {
      if (editing) {
        setGiftSets((prev) => prev.map((g) => (g.id === editing.id ? data.giftSet : g)));
      } else {
        setGiftSets((prev) => [data.giftSet, ...prev]);
      }
      setModalOpen(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this gift set?')) return;
    const res = await fetch('/api/admin/gift-sets', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    const data = await res.json();
    if (data.success) setGiftSets((prev) => prev.filter((g) => g.id !== id));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setForm((prev) => ({ ...prev, image: data.url }));
    } catch { /* ignore */ }
    setIsUploading(false);
  }

  if (loading) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FaGift style={{ color: '#16234D', fontSize: '1.25rem' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 500, color: '#16234D', margin: 0 }}>
            Gift Sets Management
          </h2>
        </div>
        <button onClick={openAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaPlus /> Add Gift Set
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Price</th>
              <th>Products</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {giftSets.map((gs) => (
              <tr key={gs.id}>
                <td className={styles.productImgCell}>
                  {gs.image ? (
                    <Image src={gs.image} alt={gs.name} width={50} height={50} style={{ objectFit: 'cover', borderRadius: '4px' }} />
                  ) : (
                    <div style={{ width: 50, height: 50, background: '#f1f5f9', borderRadius: '4px' }} />
                  )}
                </td>
                <td style={{ fontWeight: 600, color: '#16234D' }}>{gs.name}</td>
                <td style={{ fontFamily: 'var(--font-heading)', color: '#C5A059', fontWeight: 600 }}>{formatEGP(gs.price)}</td>
                <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{gs.productIds.length} products</td>
                <td>
                  <div className={styles.actionBtns}>
                    <button className={`${styles.btnIcon} ${styles.edit}`} onClick={() => openEdit(gs)}><FaEdit /></button>
                    <button className={`${styles.btnIcon} ${styles.delete}`} onClick={() => handleDelete(gs.id)}><FaTrashAlt /></button>
                  </div>
                </td>
              </tr>
            ))}
            {giftSets.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>No gift sets yet.</td>
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
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} style={{ padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: '#334155', backgroundColor: '#ffffff', width: '100%', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Price (EGP)</label>
                  <input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} step="0.01" required />
                </div>
                <div className={styles.formGroup}>
                  <label>Image</label>
                  <div className={styles.uploadArea}>
                    <label htmlFor="gs-image-upload" className={styles.uploadLabel}>
                      {isUploading ? (
                        <span className={styles.uploadSpinner}><FaSpinner className={styles.spinIcon} /> Uploading...</span>
                      ) : (
                        <span className={styles.uploadPrompt}><FaCloudUploadAlt style={{ fontSize: '1.5rem' }} /><span>Upload Image</span></span>
                      )}
                    </label>
                    <input id="gs-image-upload" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={isUploading} />
                    {form.image && (
                      <div className={styles.uploadPreview}>
                        <Image src={form.image} alt="Preview" width={50} height={50} style={{ objectFit: 'cover', borderRadius: '4px' }} />
                        <span className={styles.previewLabel}>Uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Select Products</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '4px', background: '#fafafa' }}>
                  {products.map((p) => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.6rem', background: form.productIds.includes(p.id) ? '#16234D' : '#fff', color: form.productIds.includes(p.id) ? '#fff' : '#334155', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', border: '1px solid', borderColor: form.productIds.includes(p.id) ? '#16234D' : '#e2e8f0', transition: 'all 0.2s' }}>
                      <input type="checkbox" checked={form.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} style={{ accentColor: '#C5A059' }} />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className="btn btn-outline" style={{ color: '#666', borderColor: '#ccc' }} onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
