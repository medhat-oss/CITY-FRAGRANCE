'use client';

import { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import type { SiteSettings, CollectionSlug, CollectionData } from '@/types';
import { FaCog, FaImage } from 'react-icons/fa';

const COLLECTION_SLUGS: { slug: CollectionSlug; label: string }[] = [
  { slug: 'new-arrivals', label: 'New Arrivals' },
  { slug: 'all-fragrances', label: 'All Fragrances' },
  { slug: 'oud-collection', label: 'Oud Collection' },
  { slug: 'womens-collection', label: "Women's Collection" },
  { slug: 'mens-collection', label: "Men's Collection" },
  { slug: 'gift-sets', label: 'Gift Sets' },
];

const inputStyle = {
  padding: '0.7rem 0.85rem',
  border: '1px solid #1d3573',
  borderRadius: '6px',
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  color: '#e2e8f0',
  background: '#09142E',
  outline: 'none',
  transition: 'border-color 0.2s',
  width: '100%' as const,
};

const removeBtnStyle = {
  background: 'rgba(220, 38, 38, 0.2)',
  color: '#ef4444',
  border: '1px solid rgba(220, 38, 38, 0.4)',
  borderRadius: '4px',
  padding: '0.25rem 0.6rem',
  cursor: 'pointer',
  fontSize: '0.7rem',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  width: 'fit-content' as const,
  transition: 'background-color 0.2s',
};

const labelStyle = {
  fontFamily: 'var(--font-heading)',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#94a3b8',
};

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '0.3rem',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
    heroTitle: '',
    heroSubtitle: '',
    heroDescription: '',
    announcementText: '',
    heroBgImage: '',
    heroBgImageDesktop: '',
    heroVideoUrl: '',
    moodTitle: '',
    moodSubtitle: '',
    moodImage: '',
    moodImageDesktop: '',
    moodVideoUrl: '',
    womenCollectionVideoUrl: '',
    menCollectionVideoUrl: '',
    giftSetsVideoUrl: '',
    newArrivalsVideoUrl: '',
    allFragrancesVideoUrl: '',
    oudCollectionVideoUrl: '',
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [heroUploadError, setHeroUploadError] = useState('');
  const [moodUploadError, setMoodUploadError] = useState('');
  const [heroVideoUploadError, setHeroVideoUploadError] = useState('');
  const [moodVideoUploadError, setMoodVideoUploadError] = useState('');
  const [womenVideoUploadError, setWomenVideoUploadError] = useState('');
  const [menVideoUploadError, setMenVideoUploadError] = useState('');
  const [giftSetsVideoUploadError, setGiftSetsVideoUploadError] = useState('');
  const [newArrivalsVideoUploadError, setNewArrivalsVideoUploadError] = useState('');
  const [allFragrancesVideoUploadError, setAllFragrancesVideoUploadError] = useState('');
  const [oudCollectionVideoUploadError, setOudCollectionVideoUploadError] = useState('');
  const [uploadingCollectionVideo, setUploadingCollectionVideo] = useState<string | null>(null);

  const [collectionData, setCollectionData] = useState<Record<string, CollectionData>>({});
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);
  const [uploadingSlug, setUploadingSlug] = useState<string | null>(null);
  const [collectionsSaving, setCollectionsSaving] = useState(false);
  const [collectionsMsg, setCollectionsMsg] = useState('');
  const [collectionsUploadError, setCollectionsUploadError] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data: SiteSettings) => {
        setSettings(data);
        setSettingsLoaded(true);
      })
      .catch(() => setSettingsLoaded(true));
  }, []);

  useEffect(() => {
    fetch('/api/admin/collections')
      .then((res) => res.json())
      .then((data: { images: Record<string, CollectionData> }) => {
        setCollectionData(data.images);
        setCollectionsLoaded(true);
      })
      .catch(() => setCollectionsLoaded(true));
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
      if (data.success && data.settings) {
        setSettings(data.settings);
        setSaveMsg('Settings saved successfully!');
      } else {
        setSaveMsg(data.error || 'Failed to save settings.');
      }
    } catch {
      setSaveMsg('Network error. Could not save.');
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 3000);
  };

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
        setCollectionData((prev) => {
          const existing = prev[slug]?.description || '';
          return { ...prev, [slug]: { image: data.path, description: existing } };
        });
      } else {
        setCollectionsUploadError(data.error || 'Upload failed');
      }
    } catch {
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
        const entry = collectionData[slug];
        if (!entry) continue;
        const res = await fetch('/api/admin/collections', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, imageUrl: entry.image, description: entry.description }),
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

  const handleHeroBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploadError('');
    const formData = new FormData();
    formData.append('file', file);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData, signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.success) handleSettingsChange('heroBgImage', data.path);
      else setHeroUploadError(data.error || 'Upload failed');
    } catch {
      clearTimeout(timeout);
      setHeroUploadError('Network error. Please try again.');
    }
  };

  const handleMoodImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    } catch {
      clearTimeout(timeout);
      setMoodUploadError('Network error. Please try again.');
    }
  };

  const handleHeroVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroVideoUploadError('');
    const formData = new FormData();
    formData.append('file', file);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData, signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.success) handleSettingsChange('heroVideoUrl', data.path);
      else setHeroVideoUploadError(data.error || 'Upload failed');
    } catch {
      clearTimeout(timeout);
      setHeroVideoUploadError('Network error. Please try again.');
    }
  };

  const handleMoodVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMoodVideoUploadError('');
    const formData = new FormData();
    formData.append('file', file);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData, signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.success) handleSettingsChange('moodVideoUrl', data.path);
      else setMoodVideoUploadError(data.error || 'Upload failed');
    } catch {
      clearTimeout(timeout);
      setMoodVideoUploadError('Network error. Please try again.');
    }
  };

  const makeCollectionVideoUploader = (
    field: 'womenCollectionVideoUrl' | 'menCollectionVideoUrl' | 'giftSetsVideoUrl' | 'newArrivalsVideoUrl' | 'allFragrancesVideoUrl' | 'oudCollectionVideoUrl',
    setError: (msg: string) => void
  ) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploadingCollectionVideo(field);
    const formData = new FormData();
    formData.append('file', file);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData, signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.success) handleSettingsChange(field as keyof SiteSettings, data.path);
      else setError(data.error || 'Upload failed');
    } catch {
      clearTimeout(timeout);
      setError('Network error. Please try again.');
    }
    setUploadingCollectionVideo(null);
  };

  const handleWomenVideoUpload = makeCollectionVideoUploader('womenCollectionVideoUrl', setWomenVideoUploadError);
  const handleMenVideoUpload = makeCollectionVideoUploader('menCollectionVideoUrl', setMenVideoUploadError);
  const handleGiftSetsVideoUpload = makeCollectionVideoUploader('giftSetsVideoUrl', setGiftSetsVideoUploadError);
  const handleNewArrivalsVideoUpload = makeCollectionVideoUploader('newArrivalsVideoUrl', setNewArrivalsVideoUploadError);
  const handleAllFragrancesVideoUpload = makeCollectionVideoUploader('allFragrancesVideoUrl', setAllFragrancesVideoUploadError);
  const handleOudCollectionVideoUpload = makeCollectionVideoUploader('oudCollectionVideoUrl', setOudCollectionVideoUploadError);

  if (!settingsLoaded || !collectionsLoaded) return null;

  return (
    <div className={styles.adminContent} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '900px', width: '100%' }}>
      {/* ─── Section 1: Site Customization ─── */}
      <div>
        <div className={styles.adminHeader} style={{ border: 'none', marginBottom: '1.5rem', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaCog style={{ color: '#ffffff', fontSize: '1.1rem' }} />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 500, color: '#f8f9fa', margin: 0 }}>
              Site Customization
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div style={fieldStyle}>
            <label style={labelStyle}>Hero Section Main Title</label>
            <input
              type="text"
              value={settings.heroTitle}
              onChange={(e) => handleSettingsChange('heroTitle', e.target.value)}
              placeholder="Celebrate in Luxury & Scent"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#ffffff')}
              onBlur={(e) => (e.target.style.borderColor = '#1d3573')}
            />
            <button type="button" onClick={() => handleSettingsChange('heroTitle', 'HIDDEN')} style={removeBtnStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(220, 38, 38, 0.4)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)')}
            >حذف النص / Remove</button>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Hero Subtitle</label>
            <input
              type="text"
              value={settings.heroSubtitle}
              onChange={(e) => handleSettingsChange('heroSubtitle', e.target.value)}
              placeholder="Eid Al Adha Special"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#ffffff')}
              onBlur={(e) => (e.target.style.borderColor = '#1d3573')}
            />
            <button type="button" onClick={() => handleSettingsChange('heroSubtitle', 'HIDDEN')} style={removeBtnStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(220, 38, 38, 0.4)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)')}
            >حذف النص / Remove</button>
          </div>
          <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Hero Description / الوصف الصغير للـ Hero</label>
            <textarea
              value={settings.heroDescription}
              onChange={(e) => handleSettingsChange('heroDescription', e.target.value)}
              placeholder="Exclusive Eid collection — enjoy 20% off on all premium fragrances."
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#ffffff')}
              onBlur={(e) => (e.target.style.borderColor = '#1d3573')}
            />
            <button type="button" onClick={() => handleSettingsChange('heroDescription', 'HIDDEN')} style={removeBtnStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(220, 38, 38, 0.4)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)')}
            >حذف النص / Remove</button>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Hero Background Image</label>
            {settings.heroBgImage && (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid #1d3573',
                  background: '#09142E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.heroBgImage}
                  alt="Hero background preview"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
                <button
                  type="button"
                  onClick={() => handleSettingsChange('heroBgImage', '')}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(220, 38, 38, 0.95)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.4rem 0.8rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    zIndex: 10,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.95)')}
                >
                  Remove / حذف
                </button>
              </div>
            )}
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.2rem',
                background: '#ffffff',
                color: '#09142E',
                borderRadius: '6px',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                border: 'none',
                width: 'fit-content',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Choose Image
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleHeroBgUpload} />
            </label>
            {heroUploadError && (
              <p style={{ color: '#dc2626', fontSize: '0.75rem', fontFamily: 'var(--font-body)', margin: 0 }}>{heroUploadError}</p>
            )}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Hero Background Video</label>
            {settings.heroVideoUrl && (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid #1d3573',
                  background: '#09142E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <video
                  src={settings.heroVideoUrl}
                  muted
                  controls
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
                <button
                  type="button"
                  onClick={() => handleSettingsChange('heroVideoUrl', '')}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(220, 38, 38, 0.95)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.4rem 0.8rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    zIndex: 10,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.95)')}
                >
                  Remove / حذف
                </button>
              </div>
            )}
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.2rem',
                background: '#ffffff',
                color: '#09142E',
                borderRadius: '6px',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                border: 'none',
                width: 'fit-content',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Choose Video
              <input type="file" accept="video/*" style={{ display: 'none' }} onChange={handleHeroVideoUpload} />
            </label>
            {heroVideoUploadError && (
              <p style={{ color: '#dc2626', fontSize: '0.75rem', fontFamily: 'var(--font-body)', margin: 0 }}>{heroVideoUploadError}</p>
            )}
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Top Announcement Bar Text</label>
            <input
              type="text"
              value={settings.announcementText}
              onChange={(e) => handleSettingsChange('announcementText', e.target.value)}
              placeholder="EID AL ADHA SALE UP TO 20% OFF ENDS SOON... SHOP NOW"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#ffffff')}
              onBlur={(e) => (e.target.style.borderColor = '#1d3573')}
            />
            <button type="button" onClick={() => handleSettingsChange('announcementText', 'HIDDEN')} style={removeBtnStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(220, 38, 38, 0.4)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)')}
            >حذف النص / Remove</button>
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

      {/* ─── Section 2: Mood Section Settings ─── */}
      <div>
        <div className={styles.adminHeader} style={{ border: 'none', marginBottom: '1.5rem', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaCog style={{ color: '#ffffff', fontSize: '1.1rem' }} />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 500, color: '#f8f9fa', margin: 0 }}>
              Mood Section Settings
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div style={fieldStyle}>
            <label style={labelStyle}>Section Title</label>
            <input
              type="text"
              value={settings.moodTitle}
              onChange={(e) => handleSettingsChange('moodTitle', e.target.value)}
              placeholder="The Essence of Luxury & Elegance"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#ffffff')}
              onBlur={(e) => (e.target.style.borderColor = '#1d3573')}
            />
            <button type="button" onClick={() => handleSettingsChange('moodTitle', 'HIDDEN')} style={removeBtnStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(220, 38, 38, 0.4)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)')}
            >حذف النص / Remove</button>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Background Image</label>
            {settings.moodImage && (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid #1d3573',
                  background: '#09142E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={settings.moodImage}
                  alt="Mood section preview"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
                <button
                  type="button"
                  onClick={() => handleSettingsChange('moodImage', '')}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(220, 38, 38, 0.95)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.4rem 0.8rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    zIndex: 10,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.95)')}
                >
                  Remove / حذف
                </button>
              </div>
            )}
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.2rem',
                background: '#ffffff',
                color: '#09142E',
                borderRadius: '6px',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                border: 'none',
                width: 'fit-content',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Choose Image
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleMoodImageUpload} />
            </label>
            {moodUploadError && (
              <p style={{ color: '#dc2626', fontSize: '0.75rem', fontFamily: 'var(--font-body)', margin: 0 }}>{moodUploadError}</p>
            )}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Background Video</label>
            {settings.moodVideoUrl && (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  border: '1px solid #1d3573',
                  background: '#09142E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <video
                  src={settings.moodVideoUrl}
                  muted
                  controls
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                />
                <button
                  type="button"
                  onClick={() => handleSettingsChange('moodVideoUrl', '')}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(220, 38, 38, 0.95)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.4rem 0.8rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    zIndex: 10,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.95)')}
                >
                  Remove / حذف
                </button>
              </div>
            )}
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.2rem',
                background: '#ffffff',
                color: '#09142E',
                borderRadius: '6px',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                border: 'none',
                width: 'fit-content',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Choose Video
              <input type="file" accept="video/*" style={{ display: 'none' }} onChange={handleMoodVideoUpload} />
            </label>
            {moodVideoUploadError && (
              <p style={{ color: '#dc2626', fontSize: '0.75rem', fontFamily: 'var(--font-body)', margin: 0 }}>{moodVideoUploadError}</p>
            )}
          </div>
          <div style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Subtitle</label>
            <textarea
              value={settings.moodSubtitle}
              onChange={(e) => handleSettingsChange('moodSubtitle', e.target.value)}
              placeholder="Discover timeless scents crafted for those who appreciate the finer things in life."
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#ffffff')}
              onBlur={(e) => (e.target.style.borderColor = '#1d3573')}
            />
            <button type="button" onClick={() => handleSettingsChange('moodSubtitle', 'HIDDEN')} style={removeBtnStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(220, 38, 38, 0.4)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)')}
            >حذف النص / Remove</button>
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

      {/* ─── Section 3: Manage Collections ─── */}
      <div>
        <div className={styles.adminHeader} style={{ border: 'none', marginBottom: '1.5rem', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaImage style={{ color: '#ffffff', fontSize: '1.1rem' }} />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 500, color: '#f8f9fa', margin: 0 }}>
              Manage Collections
            </h2>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {COLLECTION_SLUGS.map(({ slug, label }) => (
            <div
              key={slug}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                padding: '1.25rem',
                border: '1px solid #1d3573',
                borderRadius: '8px',
                background: '#11224D',
                gridColumn: slug === 'womens-collection' || slug === 'mens-collection' ? '1 / -1' : undefined,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(29, 53, 115, 0.5)', paddingBottom: '0.5rem' }}>
                <label style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                  {label}
                </label>
                {(slug === 'womens-collection' || slug === 'mens-collection') && (
                  <span style={{ fontSize: '0.75rem', color: '#D4AF37', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                    ★ Collection Header Banner Image (Horizontal / Wide Aspect Ratio)
                  </span>
                )}
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Collection Subtitle / Description</label>
                <input
                  type="text"
                  value={collectionData[slug]?.description || ''}
                  onChange={(e) =>
                    setCollectionData((prev) => ({
                      ...prev,
                      [slug]: { image: prev[slug]?.image || '', description: e.target.value },
                    }))
                  }
                  placeholder="Enter the text that appears under the collection name..."
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#ffffff')}
                  onBlur={(e) => (e.target.style.borderColor = '#1d3573')}
                />
              </div>

              {/* Image Preview + Remove */}
              {collectionData[slug]?.image && (
                <div
                  style={{
                    width: '100%',
                    height: '140px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '1px solid #1d3573',
                    background: '#09142E',
                    position: 'relative',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={collectionData[slug].image}
                    alt={label}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setCollectionData((prev) => ({
                        ...prev,
                        [slug]: { ...prev[slug], image: '' },
                      }))
                    }
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: 'rgba(220, 38, 38, 0.95)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '0.3rem 0.6rem',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 600,
                      zIndex: 10,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.95)')}
                  >
                    Remove / حذف
                  </button>
                </div>
              )}

              {/* Video Preview + Remove — all 6 collections */}
              {(() => {
                const SLUG_VIDEO_MAP: Record<string, { field: keyof SiteSettings; error: string; handler: (e: React.ChangeEvent<HTMLInputElement>) => void }> = {
                  'womens-collection': { field: 'womenCollectionVideoUrl', error: womenVideoUploadError, handler: handleWomenVideoUpload },
                  'mens-collection': { field: 'menCollectionVideoUrl', error: menVideoUploadError, handler: handleMenVideoUpload },
                  'gift-sets': { field: 'giftSetsVideoUrl', error: giftSetsVideoUploadError, handler: handleGiftSetsVideoUpload },
                  'new-arrivals': { field: 'newArrivalsVideoUrl', error: newArrivalsVideoUploadError, handler: handleNewArrivalsVideoUpload },
                  'all-fragrances': { field: 'allFragrancesVideoUrl', error: allFragrancesVideoUploadError, handler: handleAllFragrancesVideoUpload },
                  'oud-collection': { field: 'oudCollectionVideoUrl', error: oudCollectionVideoUploadError, handler: handleOudCollectionVideoUpload },
                };
                const meta = SLUG_VIDEO_MAP[slug];
                if (!meta) return null;
                const videoUrl = (settings[meta.field] as string) || '';
                const isUploading = uploadingCollectionVideo === meta.field;

                return (
                  <>
                    {videoUrl && (
                      <div
                        style={{
                          width: '100%',
                          height: '130px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: '1px solid #1d3573',
                          background: '#09142E',
                          position: 'relative',
                        }}
                      >
                        <video
                          src={videoUrl}
                          muted
                          loop
                          autoPlay
                          playsInline
                          preload="metadata"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSettingsChange(meta.field, '')}
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            background: 'rgba(220, 38, 38, 0.95)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.3rem 0.6rem',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontFamily: 'var(--font-body)',
                            fontWeight: 600,
                            zIndex: 10,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.95)')}
                        >
                          Remove Video / حذف
                        </button>
                      </div>
                    )}
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.4rem 0.9rem',
                        background: '#1d3573',
                        color: '#fff',
                        borderRadius: '6px',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        border: 'none',
                        width: 'fit-content',
                        transition: 'opacity 0.2s',
                      }}
                    >
                      {isUploading ? 'Uploading...' : 'Choose Video / رفع فيديو'}
                      <input
                        type="file"
                        accept="video/*"
                        style={{ display: 'none' }}
                        disabled={isUploading}
                        onChange={meta.handler}
                      />
                    </label>
                    {meta.error && (
                      <p style={{ color: '#dc2626', fontSize: '0.72rem', fontFamily: 'var(--font-body)', margin: 0 }}>{meta.error}</p>
                    )}
                  </>
                );
              })()}

              {/* Choose Image Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-body)' }}>
                  Collection Header Banner Image (Horizontal / Banner)
                </span>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: '#ffffff',
                    color: '#09142E',
                    borderRadius: '6px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    border: 'none',
                    width: 'fit-content',
                    transition: 'opacity 0.2s',
                  }}
                >
                  {uploadingSlug === slug ? 'Uploading Banner...' : 'Choose Banner Image (Horizontal)'}
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
              </div>
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
    </div>
  );
}
