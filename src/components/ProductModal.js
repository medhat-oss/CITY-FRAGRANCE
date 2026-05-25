'use client';
import { useState, useEffect } from 'react';
import { FaTimes, FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';
import Image from 'next/image';
import styles from '../app/admin/(dashboard)/admin.module.css';

export default function ProductModal({ isOpen, onClose, onSave, productToEdit }) {
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        type: 'Men',
        category: 'Men',
        collection: '',
        badge: '',
        notes: '',
        description: '',
        orientation: '',
        concentration: 'Eau De Parfum',
        volume: '100 ML',
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
                notes: productToEdit.notes,
                description: productToEdit.description || '',
                orientation: productToEdit.orientation || '',
                concentration: productToEdit.concentration || 'Eau De Parfum',
                volume: productToEdit.volume || '100 ML',
                price: productToEdit.price,
                salePrice: productToEdit.salePrice || '',
                images: productToEdit.images || (productToEdit.image ? [productToEdit.image] : [])
            });
        } else {
            setFormData({
                id: '',
                name: '',
                type: 'Men',
                category: 'Men',
                collection: '',
                badge: '',
                notes: '',
                description: '',
                orientation: '',
                concentration: 'Eau De Parfum',
                volume: '100 ML',
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

        try {
            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                { method: 'POST', body: data }
            );

            if (!res.ok) {
                throw new Error('Upload failed. Check your Cloudinary preset settings.');
            }

            const json = await res.json();
            // Append the new URL to the images array instead of replacing
            setFormData(prev => ({ ...prev, images: [...prev.images, json.secure_url] }));
        } catch (err) {
            setUploadError(err.message || 'Image upload failed');
        } finally {
            setIsUploading(false);
            // Reset the file input so the same file can be re-selected
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
                            <label>Product Type &mdash; نوع المنتج</label>
                            <select name="type" value={formData.type} onChange={handleChange} required>
                                <option value="Men">Men &mdash; رجالي</option>
                                <option value="Women">Women &mdash; نسائي</option>
                                <option value="Unisex">Unisex &mdash; جنسين</option>
                                <option value="Gift Sets">Gift Sets &mdash; مجموعات هدايا</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Category</label>
                            <select name="category" value={formData.category} onChange={handleChange} required>
                                <option value="Men">Men</option>
                                <option value="Women">Women</option>
                                <option value="Oud">Oud</option>
                                <option value="Sets">Sets</option>
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
                            <label>Fragrance Notes</label>
                            <input type="text" name="notes" value={formData.notes} onChange={handleChange} placeholder="e.g. Oud • Rose • Amber" required />
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
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontFamily: 'var(--font-body, Jost, sans-serif)',
                                fontSize: '0.95rem',
                                color: '#334155',
                                backgroundColor: '#ffffff',
                                transition: 'border-color 0.2s ease',
                                width: '100%',
                                boxSizing: 'border-box',
                                resize: 'vertical',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#c5a059'}
                            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Volumes (comma separated)</label>
                        <input type="text" name="volume" value={formData.volume} onChange={handleChange} placeholder="e.g. 50 ML, 100 ML" required />
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Fragrance Concentration &mdash; تركيز العطر</label>
                            <select name="concentration" value={formData.concentration} onChange={handleChange} required>
                                <option value="Eau De Parfum">Eau De Parfum</option>
                                <option value="Eau De Toilette">Eau De Toilette</option>
                                <option value="Parfum">Parfum</option>
                                <option value="Extrait De Parfum">Extrait De Parfum</option>
                                <option value="Cologne">Cologne</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Orientation</label>
                            <input type="text" name="orientation" value={formData.orientation} onChange={handleChange} placeholder="e.g. Pour Homme, Unisex, حريمي" />
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
                        <button type="button" className="btn btn-outline" style={{color: '#666', borderColor: '#ccc'}} onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isUploading}>Save Product</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
