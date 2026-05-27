'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useProducts } from '@/hooks/useProducts';
import { formatEGP } from '@/utils/currency';
import type { Product, SiteSettings, CollectionSlug } from '@/types';
import styles from './admin.module.css';
import { FaPlus, FaEdit, FaTrashAlt, FaCog, FaImage } from 'react-icons/fa';
import ProductModal from '@/components/ProductModal';

export default function AdminPage() {
  const { products, isLoaded, addProduct, updateProduct, deleteProduct } =
    useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // ── Collection Images state ──
  const COLLECTION_SLUGS: { slug: CollectionSlug; label: string }[] = [
    { slug: 'new-arrivals', label: 'New Arrivals' },
    { slug: 'all-fragrances', label: 'All Fragrances' },
    { slug: 'oud-collection', label: 'Oud Collection' },
    { slug: 'womens-collection', label: "Women's Collection" },
    { slug: 'mens-collection', label: "Men's Collection" },
    { slug: 'gift-sets', label: 'Gift Sets' },
  ];

  const [collectionImages, setCollectionImages] = useState<Record<string, string>>({});
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);
  const [uploadingSlug, setUploadingSlug] = useState<string | null>(null);
  const [collectionsSaving, setCollectionsSaving] = useState(false);
  const [collectionsMsg, setCollectionsMsg] = useState('');
  const [collectionsUploadError, setCollectionsUploadError] = useState('');

  useEffect(() => {
    fetch('/api/admin/collections')
      .then((res) => res.json())
      .then((data: { images: Record<string, string> }) => {
        setCollectionImages(data.images);
        setCollectionsLoaded(true);
      })
      .catch(() => setCollectionsLoaded(true));
  }, []);

  const handleCollectionImageUpload = async (slug: string, file: File) => {
    setUploadingSlug(slug);
    setCollectionsUploadError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('slug', slug);
    try {
      const res = await fetch('/api/admin/collections', {
        method: 'PUT',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setCollectionImages((prev) => ({ ...prev, [slug]: data.path }));
      } else {
        setCollectionsUploadError(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('COLLECTION UPLOAD FAILED:', err);
      setCollectionsUploadError('Network error. Please try again.');
    }
    setUploadingSlug(null);
  };

  const handleSaveCollectionImages = async () => {
    setCollectionsSaving(true);
    setCollectionsMsg('');
    try {
      let success = true;
      for (const { slug } of COLLECTION_SLUGS) {
        const url = collectionImages[slug];
        if (!url) continue;
        const res = await fetch('/api/admin/collections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, imageUrl: url }),
        });
        const data = await res.json();
        if (!data.success) success = false;
      }
      setCollectionsMsg(success ? 'Collection images saved!' : 'Some images failed to save.');
    } catch {
      setCollectionsMsg('Network error.');
    }
    setCollectionsSaving(false);
    setTimeout(() => setCollectionsMsg(''), 3000);
  };

  // ── Settings state ──
  const [settings, setSettings] = useState<SiteSettings>({
    heroTitle: '',
    heroSubtitle: '',
    announcementText: '',
    heroBgImage: '',
    moodTitle: '',
    moodSubtitle: '',
    moodImage: '',
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [heroUploadError, setHeroUploadError] = useState('');
  const [moodUploadError, setMoodUploadError] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data: SiteSettings) => {
        setSettings(data);
        setSettingsLoaded(true);
      })
      .catch(() => setSettingsLoaded(true));
  }, []);

  const handleSettingsChange = (field: keyof SiteSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMsg('Settings saved successfully!');
      } else {
        setSaveMsg('Failed to save settings.');
      }
    } catch {
      setSaveMsg('Network error. Could not save.');
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const handleAdd = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
    }
  };

  const handleSave = (productData: Product) => {
    if (productToEdit) {
      updateProduct(productData);
    } else {
      addProduct(productData);
    }
    setIsModalOpen(false);
  };

  const fmt = (price: number) => formatEGP(price);

  if (!isLoaded || !settingsLoaded) return null;

  return (
    <>
      <header className={styles.adminHeader}>
        <h1>Products Management</h1>
        <button className="btn btn-primary" onClick={handleAdd}>
          <FaPlus style={{ marginRight: '8px' }} /> Add New Product
        </button>
      </header>

      {/* ── Site Customization ── */}
      <div className={styles.adminContent} style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <FaCog style={{ color: '#16234D', fontSize: '1.1rem' }} />
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              fontWeight: 500,
              color: '#16234D',
              margin: 0,
            }}
          >
            Site Customization
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem',
            maxWidth: '700px',
          }}
        >
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
          >
            <label
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#16234D',
              }}
            >
              Hero Section Main Title
            </label>
            <input
              type="text"
              value={settings.heroTitle}
              onChange={(e) =>
                handleSettingsChange('heroTitle', e.target.value)
              }
              placeholder="Celebrate in Luxury & Scent"
              style={{
                padding: '0.7rem 0.85rem',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                color: '#334155',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#C5A059')}
              onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
            />
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
          >
            <label
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#16234D',
              }}
            >
              Hero Subtitle
            </label>
            <input
              type="text"
              value={settings.heroSubtitle}
              onChange={(e) =>
                handleSettingsChange('heroSubtitle', e.target.value)
              }
              placeholder="Eid Al Adha Special"
              style={{
                padding: '0.7rem 0.85rem',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                color: '#334155',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#C5A059')}
              onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
            />
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
          >
            <label
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#16234D',
              }}
            >
              Hero Background Image
            </label>
            {settings.heroBgImage && (
              <div
                style={{
                  width: '100%',
                  height: '160px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  position: 'relative',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.heroBgImage}
                  alt="Hero background preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            )}
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.2rem',
                background: '#16234D',
                color: '#fff',
                borderRadius: '4px',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                border: 'none',
                width: 'fit-content',
              }}
            >
              Choose Image
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setHeroUploadError('');
                  const formData = new FormData();
                  formData.append('file', file);
                  const controller = new AbortController();
                  const timeout = setTimeout(() => controller.abort(), 30000);
                  try {
                    const res = await fetch('/api/upload', {
                      method: 'POST',
                      body: formData,
                      signal: controller.signal,
                    });
                    clearTimeout(timeout);
                    const data = await res.json();
                    if (data.success) {
                      handleSettingsChange('heroBgImage', data.path);
                    } else {
                      setHeroUploadError(data.error || 'Upload failed');
                    }
                  } catch {
                    clearTimeout(timeout);
                    setHeroUploadError('Network error. Please try again.');
                  }
                }}
              />
              </label>
              {heroUploadError && (
                <p style={{ color: '#dc2626', fontSize: '0.75rem', fontFamily: 'var(--font-body)', margin: 0 }}>{heroUploadError}</p>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                gridColumn: '1 / -1',
              }}
            >
              <label
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#16234D',
                }}
              >
                Top Announcement Bar Text
            </label>
            <input
              type="text"
              value={settings.announcementText}
              onChange={(e) =>
                handleSettingsChange('announcementText', e.target.value)
              }
              placeholder="EID AL ADHA SALE UP TO 20% OFF ENDS SOON... SHOP NOW"
              style={{
                padding: '0.7rem 0.85rem',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                color: '#334155',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#C5A059')}
              onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem', fontSize: '0.85rem' }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saveMsg && (
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                color: saveMsg.includes('success') ? '#16a34a' : '#dc2626',
              }}
            >
              {saveMsg}
            </span>
          )}
        </div>
      </div>

      {/* ── Mood Section Settings ── */}
      <div className={styles.adminContent} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <FaCog style={{ color: '#16234D', fontSize: '1.1rem' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 500, color: '#16234D', margin: 0 }}>
            Mood Section Settings
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '700px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8rem', fontWeight: 600, color: '#16234D' }}>
              Section Title
            </label>
            <input
              type="text"
              value={settings.moodTitle}
              onChange={(e) => handleSettingsChange('moodTitle', e.target.value)}
              placeholder="The Essence of Luxury & Elegance"
              style={{
                padding: '0.7rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '4px',
                fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: '#334155',
                outline: 'none', transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#C5A059')}
              onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8rem', fontWeight: 600, color: '#16234D' }}>
              Background Image
            </label>
            {settings.moodImage && (
              <div style={{ width: '100%', height: '160px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.moodImage}
                  alt="Mood section preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            )}
            <label style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.2rem', background: '#16234D', color: '#fff',
              borderRadius: '4px', fontFamily: 'var(--font-body)', fontSize: '0.85rem',
              cursor: 'pointer', border: 'none', width: 'fit-content',
            }}>
              Choose Image
              <input
                type="file" accept="image/*" style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setMoodUploadError('');
                  const formData = new FormData();
                  formData.append('file', file);
                  const controller = new AbortController();
                  const timeout = setTimeout(() => controller.abort(), 30000);
                  try {
                    const res = await fetch('/api/upload', { method: 'POST', body: formData, signal: controller.signal });
                    clearTimeout(timeout);
                    const data = await res.json();
                    if (data.success) handleSettingsChange('moodImage', data.path);
                    else setMoodUploadError(data.error || 'Upload failed');
                  } catch { clearTimeout(timeout); setMoodUploadError('Network error. Please try again.'); }
                }}
              />
            </label>
            {moodUploadError && (
              <p style={{ color: '#dc2626', fontSize: '0.75rem', fontFamily: 'var(--font-body)', margin: 0 }}>{moodUploadError}</p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', gridColumn: '1 / -1' }}>
            <label style={{ fontFamily: 'var(--font-heading)', fontSize: '0.8rem', fontWeight: 600, color: '#16234D' }}>
              Subtitle
            </label>
            <textarea
              value={settings.moodSubtitle}
              onChange={(e) => handleSettingsChange('moodSubtitle', e.target.value)}
              placeholder="Discover timeless scents crafted for those who appreciate the finer things in life."
              rows={3}
              style={{
                padding: '0.7rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '4px',
                fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: '#334155',
                outline: 'none', transition: 'border-color 0.2s', resize: 'vertical',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#C5A059')}
              onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem', fontSize: '0.85rem' }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saveMsg && (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: saveMsg.includes('success') ? '#16a34a' : '#dc2626' }}>
              {saveMsg}
            </span>
          )}
        </div>
      </div>

      {/* ── Manage Collections ── */}
      <div className={styles.adminContent} style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <FaImage style={{ color: '#16234D', fontSize: '1.1rem' }} />
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              fontWeight: 500,
              color: '#16234D',
              margin: 0,
            }}
          >
            Manage Collections
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {COLLECTION_SLUGS.map(({ slug, label }) => (
            <div
              key={slug}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                padding: '1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                background: '#fafafa',
              }}
            >
              <label
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#16234D',
                }}
              >
                {label}
              </label>

              {collectionImages[slug] && (
                <div
                  style={{
                    width: '100%',
                    height: '140px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    position: 'relative',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={collectionImages[slug]}
                    alt={label}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
              )}

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: '#16234D',
                  color: '#fff',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  border: 'none',
                  width: 'fit-content',
                }}
              >
                {uploadingSlug === slug ? 'Uploading...' : 'Choose Image'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  disabled={uploadingSlug !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCollectionImageUpload(slug, file);
                    e.target.value = '';
                  }}
                />
              </label>
              {collectionsUploadError && (
                <p style={{ color: '#dc2626', fontSize: '0.75rem', fontFamily: 'var(--font-body)', margin: 0 }}>
                  {collectionsUploadError}
                </p>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            onClick={handleSaveCollectionImages}
            disabled={collectionsSaving}
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem', fontSize: '0.85rem' }}
          >
            {collectionsSaving ? 'Saving...' : 'Save Collection Images'}
          </button>
          {collectionsMsg && (
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                color: collectionsMsg.includes('saved') ? '#16a34a' : '#dc2626',
              }}
            >
              {collectionsMsg}
            </span>
          )}
        </div>
      </div>

      {/* ── Products Table ── */}
      <div className={styles.adminContent}>
        <div className={styles.tableContainer}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Sale Price</th>
                <th>Badge</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className={styles.productImgCell}>
                    <Image
                      src={
                        product.images?.[0] || '/images/product-placeholder.png'
                      }
                      alt={product.name}
                      width={50}
                      height={50}
                      style={{ objectFit: 'cover', borderRadius: '4px' }}
                    />
                  </td>
                          <td>
                            <strong>{product.name}</strong>
                            <br />
                            <small style={{ color: '#64748b' }}>{product.notes}</small>
                          </td>
                          <td>{product.category}</td>
                  <td>{fmt(product.price)}</td>
                  <td>
                    {product.salePrice ? fmt(product.salePrice) : '-'}
                  </td>
                  <td>{product.badge || '-'}</td>
                  <td className={styles.actionBtns}>
                    <button
                      className={`${styles.btnIcon} ${styles.edit}`}
                      onClick={() => handleEdit(product)}
                      aria-label={`Edit ${product.name}`}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className={`${styles.btnIcon} ${styles.delete}`}
                      onClick={() => handleDelete(product.id)}
                      aria-label={`Delete ${product.name}`}
                    >
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        productToEdit={productToEdit}
      />
    </>
  );
}
