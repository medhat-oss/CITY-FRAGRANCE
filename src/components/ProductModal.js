'use client';
import { useState, useEffect } from 'react';
import { FaTimes, FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';
import Image from 'next/image';
import styles from '../app/admin/(dashboard)/admin.module.css';

export default function ProductModal({ isOpen, onClose, onSave, productToEdit }) {
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        type: 'Perfume',
        category: 'Men',
        collection: '',
        badge: '',
        topNotes: '',
        middleNotes: '',
        baseNotes: '',
        description: '',
        price: '',
        salePrice: '',
        images: []
    });
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        if (productToEdit) {
            setFormData({
                id: productToEdit.id,
                name: productToEdit.name,
                type: productToEdit.type || 'Men',
                category: productToEdit.category,
                collection: productToEdit.collection || '',
                badge: productToEdit.badge || '',
                topNotes: productToEdit.topNotes || '',
                middleNotes: productToEdit.middleNotes || '',
                baseNotes: productToEdit.baseNotes || '',
                description: productToEdit.description || '',
                price: productToEdit.price,
                salePrice: productToEdit.salePrice || '',
                images: productToEdit.images || (productToEdit.image ? [productToEdit.image] : [])
            });
        } else {
            setFormData({
                id: '',
                name: '',
                type: 'Perfume',
                category: 'Men',
                collection: '',
                badge: '',
                topNotes: '',
                middleNotes: '',
                baseNotes: '',
                description: '',
                price: '',
                salePrice: '',
                images: []
            });
        }
        setUploadError('');
    }, [productToEdit, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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

            if (!res.ok) {
                throw new Error('Upload failed. Check your Cloudinary preset settings.');
            }

            const json = await res.json();
            setFormData(prev => ({ ...prev, images: [...prev.images, json.secure_url] }));
        } catch (err) {
            if (err.name === 'AbortError') {
                setUploadError('Upload timed out. Please try again.');
            } else {
                setUploadError(err.message || 'Image upload failed');
            }
        } finally {
            clearTimeout(timeout);
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const removeImage = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== indexToRemove)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            type: 'Perfume',
            id: formData.id || 'p' + Date.now(),
            price: parseFloat(formData.price),
            salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
            images: formData.images.length > 0 ? formData.images : ['/images/product-placeholder.png']
        });
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
                    <div className={styles.formGroup}>
                        <label>Product Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className={styles.formRow}>
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
                            <label>Collection</label>
                            <select name="collection" value={formData.collection} onChange={handleChange}>
                                <option value="">— Optional —</option>
                                <option value="new-arrivals">New Arrivals</option>
                                <option value="all-fragrances">All Fragrances</option>
                                <option value="oud-collection">Oud Collection</option>
                                <option value="mens-collection">Men's Collection</option>
                                <option value="womens-collection">Women's Collection</option>
                                <option value="gift-sets">Gift Sets</option>
                            </select>
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Badge</label>
                            <input type="text" name="badge" value={formData.badge} onChange={handleChange} placeholder="e.g. BEST SELLER, EID SALE" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Original Price ($)</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} step="0.01" required />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Sale Price ($)</label>
                            <input type="number" name="salePrice" value={formData.salePrice} onChange={handleChange} step="0.01" placeholder="Optional" />
                        </div>
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Top Notes</label>
                            <input type="text" name="topNotes" value={formData.topNotes} onChange={handleChange} placeholder="Top Notes / إفتتاحية العطر" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Middle Notes</label>
                            <input type="text" name="middleNotes" value={formData.middleNotes} onChange={handleChange} placeholder="Middle Notes / قلب العطر" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Base Notes</label>
                            <input type="text" name="baseNotes" value={formData.baseNotes} onChange={handleChange} placeholder="Base Notes / قاعدة العطر" />
                        </div>
                    </div>

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
                                transition: 'border-color 0.2s ease',
                                width: '100%',
                                boxSizing: 'border-box',
                                resize: 'vertical',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#ffffff'}
                            onBlur={(e) => e.target.style.borderColor = '#1d3573'}
                        />
                    </div>

                    {/* Cloudinary Multi-Image Upload */}
                    <div className={styles.formGroup}>
                        <label>Product Images ({formData.images.length} uploaded)</label>
                        <div className={styles.uploadArea}>
                            <label htmlFor="image-upload" className={styles.uploadLabel}>
                                {isUploading ? (
                                    <span className={styles.uploadSpinner}>
                                        <FaSpinner className={styles.spinIcon} /> Uploading...
                                    </span>
                                ) : (
                                    <span className={styles.uploadPrompt}>
                                        <FaCloudUploadAlt style={{ fontSize: '1.5rem' }} />
                                        <span>Click to upload image</span>
                                    </span>
                                )}
                            </label>
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                                disabled={isUploading}
                            />
                            {uploadError && (
                                <p className={styles.uploadError}>{uploadError}</p>
                            )}
                            {/* Thumbnail Gallery */}
                            {formData.images.length > 0 && (
                                <div className={styles.thumbnailGallery}>
                                    {formData.images.map((url, index) => (
                                        <div key={index} className={styles.thumbnailItem}>
                                            <Image src={url} alt={`Image ${index + 1}`} width={70} height={70} style={{ objectFit: 'cover', borderRadius: '6px' }} />
                                            <button
                                                type="button"
                                                className={styles.thumbnailRemove}
                                                onClick={() => removeImage(index)}
                                                aria-label="Remove image"
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.modalActions}>
                        <button type="button" className="btn btn-outline" style={{color: '#e2e8f0', borderColor: 'rgba(255,255,255,0.3)'}} onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isUploading}>Save Product</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
