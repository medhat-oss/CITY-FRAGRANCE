'use client';
import { useState, useEffect } from 'react';
import { FaTimes, FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';
import Image from 'next/image';
import styles from '../app/admin/(dashboard)/admin.module.css';
import { getOptimizedVideoUrl } from '../lib/videoUtils';

const ALL_COLLECTIONS = [
  { slug: 'new-arrivals',      label: 'New Arrivals' },
  { slug: 'all-fragrances',    label: 'All Fragrances' },
  { slug: 'oud-collection',    label: 'Oud Collection' },
  { slug: 'mens-collection',   label: "Men's Collection" },
  { slug: 'womens-collection', label: "Women's Collection" },
  { slug: 'gift-sets',         label: 'Gift Sets' },
];

const EMPTY_FORM = {
  id: '',
  name: '',
  type: 'Perfume',
  category: 'Men',
  collection: '',
  collections: [],
  isDraft: true,
  badge: '',
  topNotes: '',
  middleNotes: '',
  baseNotes: '',
  description: '',
  price: '',
  costPrice: '',
  salePrice: '',
  images: [],
  videoUrl: '',
  stock: '',
};

export default function ProductModal({ isOpen, onClose, onSave, productToEdit }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [videoUploadError, setVideoUploadError] = useState('');

  /* ── lock body scroll ── */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* ── populate form when editing ── */
  useEffect(() => {
    if (productToEdit) {
      // Derive collections array: prefer explicit array, fall back to single string
      let cols = Array.isArray(productToEdit.collections) && productToEdit.collections.length > 0
        ? productToEdit.collections
        : productToEdit.collection
          ? [productToEdit.collection]
          : [];

      setFormData({
        id: productToEdit.id,
        name: productToEdit.name,
        type: productToEdit.type || 'Perfume',
        category: productToEdit.category,
        collection: productToEdit.collection || '',
        collections: cols,
        isDraft: productToEdit.isDraft ?? false,
        badge: productToEdit.badge || '',
        topNotes: productToEdit.topNotes || '',
        middleNotes: productToEdit.middleNotes || '',
        baseNotes: productToEdit.baseNotes || '',
        description: productToEdit.description || '',
        price: productToEdit.price ?? '',
        costPrice: productToEdit.costPrice ?? '',
        salePrice: productToEdit.salePrice ?? '',
        images: productToEdit.images || (productToEdit.image ? [productToEdit.image] : []),
        videoUrl: productToEdit.videoUrl || '',
        stock: productToEdit.stock !== undefined ? productToEdit.stock : '',
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setUploadError('');
    setVideoUploadError('');
  }, [productToEdit, isOpen]);

  /* ── generic field handler ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /* ── multi-collection checkbox toggle ── */
  const toggleCollection = (slug) => {
    setFormData(prev => {
      const already = prev.collections.includes(slug);
      const next = already
        ? prev.collections.filter(s => s !== slug)
        : [...prev.collections, slug];
      // keep legacy `collection` in sync with the first selected slug
      return { ...prev, collections: next, collection: next[0] || '' };
    });
  };

  /* ── draft toggle ── */
  const toggleDraft = () => setFormData(prev => ({ ...prev, isDraft: !prev.isDraft }));

  /* ── image upload ── */
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError('');

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || cloudName === 'your_cloud_name_here') {
      setUploadError('Cloudinary cloud name not configured. Check .env.local');
      setIsUploading(false);
      return;
    }

    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', uploadPreset);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: data, signal: controller.signal }
      );
      clearTimeout(timeout);
      if (!res.ok) throw new Error('Upload failed. Check your Cloudinary preset settings.');
      const json = await res.json();
      setFormData(prev => ({ ...prev, images: [...prev.images, json.secure_url] }));
    } catch (err) {
      setUploadError(err.name === 'AbortError' ? 'Upload timed out. Please try again.' : (err.message || 'Image upload failed'));
    } finally {
      clearTimeout(timeout);
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (idx) =>
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));

  /* ── video upload ── */
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsVideoUploading(true);
    setVideoUploadError('');

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || cloudName === 'your_cloud_name_here') {
      setVideoUploadError('Cloudinary cloud name not configured. Check .env.local');
      setIsVideoUploading(false);
      return;
    }

    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', uploadPreset);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        { method: 'POST', body: data, signal: controller.signal }
      );
      clearTimeout(timeout);
      if (!res.ok) throw new Error('Upload failed. Check your Cloudinary preset settings.');
      const json = await res.json();
      let url = json.secure_url;
      if (url && url.includes('/upload/')) url = url.replace('/upload/', '/upload/f_auto,q_auto/');
      setFormData(prev => ({ ...prev, videoUrl: url }));
    } catch (err) {
      setVideoUploadError(err.name === 'AbortError' ? 'Upload timed out. Please try again.' : (err.message || 'Video upload failed'));
    } finally {
      clearTimeout(timeout);
      setIsVideoUploading(false);
      e.target.value = '';
    }
  };

  const removeVideo = () => setFormData(prev => ({ ...prev, videoUrl: '' }));

  /* ── submit ── */
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      type: 'Perfume',
      id: formData.id || 'p' + Date.now(),
      price: parseFloat(formData.price),
      costPrice: parseFloat(formData.costPrice) || 0,
      salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
      images: formData.images.length > 0 ? formData.images : ['/images/product-placeholder.png'],
      videoUrl: formData.videoUrl || '',
      stock: formData.stock !== '' ? parseInt(formData.stock, 10) : 0,
      isDraft: formData.isDraft,
      collections: formData.collections,
      collection: formData.collections[0] || formData.collection || '',
    });
    // Reset form to prevent old images/data from persisting for the next add
    setFormData(EMPTY_FORM);
    setUploadError('');
    setVideoUploadError('');
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.modalOverlay} ${styles.active}`}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>{productToEdit ? 'Edit Product' : 'Add New Product'}</h3>
          <button type="button" className={styles.btnClose} onClick={onClose}><FaTimes /></button>
        </div>

        <form className={styles.modalForm} onSubmit={handleSubmit}>

          {/* ── Product Name ── */}
          <div className={styles.formGroup}>
            <label>Product Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          {/* ── Category + Badge ── */}
          <div className={`${styles.formRow} grid-cols-2`}>
            <div className={styles.formGroup}>
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleChange} required>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Oud">Oud</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Badge</label>
              <input type="text" name="badge" value={formData.badge} onChange={handleChange} placeholder="e.g. BEST SELLER, EID SALE" />
            </div>
          </div>

          {/* ── Multi-Collection Checkboxes ── */}
          <div className={styles.formGroup}>
            <label style={{ marginBottom: '0.5rem', display: 'block' }}>
              Collections <span style={{ fontWeight: 400, fontSize: '0.78rem', color: '#94a3b8', marginLeft: '6px' }}>Select one or more</span>
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '6px',
              padding: '10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid #1d3573',
              borderRadius: '6px',
            }}>
              {ALL_COLLECTIONS.map(({ slug, label }) => {
                const checked = formData.collections.includes(slug);
                return (
                  <label
                    key={slug}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      background: checked ? 'rgba(255,255,255,0.1)' : 'transparent',
                      border: checked ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent',
                      transition: 'all 0.15s ease',
                      fontSize: '0.82rem',
                      color: checked ? '#fff' : '#94a3b8',
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCollection(slug)}
                      style={{ accentColor: '#c9a96e', width: '14px', height: '14px' }}
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </div>

          {/* ── Price + Sale + Stock ── */}
          <div className={`${styles.formRow} grid-cols-2 md:grid-cols-4`}>
            <div className={styles.formGroup}>
              <label>Original Price (EGP)</label>
              <input type="number" name="price" value={formData.price ?? ''} onChange={handleChange} step="0.01" required />
            </div>
            <div className={styles.formGroup}>
              <label>Cost Price (EGP)</label>
              <input type="number" name="costPrice" value={formData.costPrice ?? ''} onChange={handleChange} step="0.01" placeholder="Optional" />
            </div>
            <div className={styles.formGroup}>
              <label>Sale Price (EGP)</label>
              <input type="number" name="salePrice" value={formData.salePrice ?? ''} onChange={handleChange} step="0.01" placeholder="Optional" />
            </div>
            <div className={styles.formGroup}>
              <label>Stock Quantity</label>
              <input type="number" name="stock" value={formData.stock ?? ''} onChange={handleChange} min="0" placeholder="e.g. 50" required />
            </div>
          </div>

          {/* ── Perfume Notes ── */}
          <div className={`${styles.formRow} grid-cols-1 md:grid-cols-3`}>
            <div className={styles.formGroup}>
              <label>Top Notes</label>
              <input type="text" name="topNotes" value={formData.topNotes} onChange={handleChange} placeholder="Top notes" />
            </div>
            <div className={styles.formGroup}>
              <label>Middle Notes</label>
              <input type="text" name="middleNotes" value={formData.middleNotes} onChange={handleChange} placeholder="Middle notes" />
            </div>
            <div className={styles.formGroup}>
              <label>Base Notes</label>
              <input type="text" name="baseNotes" value={formData.baseNotes} onChange={handleChange} placeholder="Base notes" />
            </div>
          </div>

          {/* ── Description ── */}
          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the fragrance, mood, inspiration..."
              rows={3}
              style={{
                padding: '0.75rem',
                border: '1px solid #1d3573',
                borderRadius: '4px',
                fontFamily: 'var(--font-body, Jost, sans-serif)',
                fontSize: '0.95rem',
                color: '#e2e8f0',
                backgroundColor: '#09142E',
                width: '100%',
                boxSizing: 'border-box',
                resize: 'vertical',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={e => e.target.style.borderColor = '#ffffff'}
              onBlur={e => e.target.style.borderColor = '#1d3573'}
            />
          </div>

          {/* ── Images ── */}
          <div className={styles.formGroup}>
            <label>Product Images ({formData.images.length} uploaded)</label>
            <div className={styles.uploadArea}>
              <label htmlFor="image-upload" className={styles.uploadLabel}>
                {isUploading
                  ? <span className={styles.uploadSpinner}><FaSpinner className={styles.spinIcon} /> Uploading...</span>
                  : <span className={styles.uploadPrompt}><FaCloudUploadAlt style={{ fontSize: '1.5rem' }} /><span>Click to upload image</span></span>}
              </label>
              <input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={isUploading} />
              {uploadError && <p className={styles.uploadError}>{uploadError}</p>}
              {formData.images.length > 0 && (
                <div className={styles.thumbnailGallery}>
                  {formData.images.map((url, i) => (
                    <div key={i} className={styles.thumbnailItem}>
                      <Image src={url} alt={`Image ${i + 1}`} width={70} height={70} style={{ objectFit: 'cover', borderRadius: '6px' }} />
                      <button type="button" className={styles.thumbnailRemove} onClick={() => removeImage(i)} aria-label="Remove image"><FaTimes /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Video ── */}
          <div className={styles.formGroup}>
            <label>Product Video</label>
            <div className={styles.uploadArea}>
              <label htmlFor="video-upload" className={styles.uploadLabel}>
                {isVideoUploading
                  ? <span className={styles.uploadSpinner}><FaSpinner className={styles.spinIcon} /> Uploading...</span>
                  : <span className={styles.uploadPrompt}><FaCloudUploadAlt style={{ fontSize: '1.5rem' }} /><span>Click to upload product video</span></span>}
              </label>
              <input id="video-upload" type="file" accept="video/*" onChange={handleVideoUpload} style={{ display: 'none' }} disabled={isVideoUploading} />
              {videoUploadError && <p className={styles.uploadError}>{videoUploadError}</p>}
              {formData.videoUrl && (
                <div className={styles.thumbnailGallery}>
                  <div className={styles.thumbnailItem} style={{ width: '120px', height: '90px', position: 'relative' }}>
                    <video src={getOptimizedVideoUrl(formData.videoUrl)} muted controls style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '6px' }} />
                    <button type="button" className={styles.thumbnailRemove} onClick={removeVideo} aria-label="Remove video"><FaTimes /></button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Draft / Publish Toggle ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderRadius: '8px',
            background: formData.isDraft ? 'rgba(234,179,8,0.08)' : 'rgba(34,197,94,0.08)',
            border: `1px solid ${formData.isDraft ? 'rgba(234,179,8,0.3)' : 'rgba(34,197,94,0.3)'}`,
            marginBottom: '4px',
            transition: 'all 0.2s ease',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: formData.isDraft ? '#facc15' : '#4ade80' }}>
                {formData.isDraft ? '📝 Draft Mode — Hidden from customers' : '✅ Published — Visible on storefront'}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                {formData.isDraft ? 'Save as draft to work on it later without showing it publicly.' : 'Product is live and visible to all customers.'}
              </p>
            </div>
            {/* Toggle Switch */}
            <button
              type="button"
              onClick={toggleDraft}
              aria-label="Toggle draft mode"
              style={{
                position: 'relative',
                width: '48px',
                height: '26px',
                borderRadius: '13px',
                border: 'none',
                cursor: 'pointer',
                background: formData.isDraft ? '#4b5563' : '#22c55e',
                transition: 'background 0.25s ease',
                flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute',
                top: '3px',
                left: formData.isDraft ? '3px' : '23px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.25s ease',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>

          {/* ── Actions ── */}
          <div className={styles.modalActions} style={{ flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ flex: '1 1 120px', color: '#e2e8f0', borderColor: 'rgba(255,255,255,0.3)' }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isUploading || isVideoUploading}
              style={{ flex: '1 1 140px' }}>
              {formData.isDraft ? 'Save as Draft' : 'Publish Product'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
