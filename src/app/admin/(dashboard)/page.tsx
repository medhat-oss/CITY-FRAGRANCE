'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useProducts } from '@/hooks/useProducts';
import { formatEGP } from '@/utils/currency';
import type { Product } from '@/types';
import styles from './admin.module.css';
import { FaPlus, FaEdit, FaTrashAlt, FaSpinner } from 'react-icons/fa';
import ProductModal from '@/components/ProductModal';

const COLLECTION_LABELS: Record<string, string> = {
  'new-arrivals': 'New Arrivals',
  'all-fragrances': 'All Fragrances',
  'oud-collection': 'Oud',
  'mens-collection': "Men's",
  'womens-collection': "Women's",
  'gift-sets': 'Gift Sets',
};

export default function AdminPage() {
  const { products, isLoaded, addProduct, updateProduct, deleteProduct } = useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = useCallback(() => {
    setProductToEdit(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((p: Product) => {
    setProductToEdit(p);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setDeletingId(id);
    try {
      await deleteProduct(id);
    } finally {
      setDeletingId(null);
    }
  }, [deleteProduct]);

  const handleSave = useCallback(async (data: Product) => {
    setIsSaving(true);
    // Close modal immediately for snappy UX — state updates optimistically
    setIsModalOpen(false);
    try {
      if (productToEdit) {
        await updateProduct(data);
      } else {
        await addProduct(data);
      }
    } finally {
      setIsSaving(false);
    }
  }, [productToEdit, addProduct, updateProduct]);

  // Memoised row data to avoid re-computing cols on every render
  const rows = useMemo(() => products.map((product) => {
    const cols: string[] = Array.isArray(product.collections) && product.collections.length > 0
      ? product.collections
      : product.collection
        ? [product.collection]
        : [];
    return { product, cols };
  }), [products]);

  if (!isLoaded) return null;

  return (
    <>
      <header className={styles.adminHeader}>
        <h1>Products Management</h1>
        <button className="btn btn-primary" onClick={handleAdd} disabled={isSaving}>
          <FaPlus style={{ marginRight: '8px' }} /> Add New Product
        </button>
      </header>

      <div className={styles.adminContent}>
        <div className={styles.tableContainer}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Collections</th>
                <th>Price</th>
                <th>Sale</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ product, cols }) => (
                <tr
                  key={product.id}
                  style={{
                    opacity: deletingId === product.id ? 0.4 : 1,
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  <td className={styles.productImgCell}>
                    <Image
                      src={product.images?.[0] || '/images/product-placeholder.png'}
                      alt={product.name}
                      width={50}
                      height={50}
                      style={{ objectFit: 'cover', borderRadius: '4px' }}
                    />
                  </td>
                  <td>
                    <strong>{product.name}</strong>
                    <br />
                    <small style={{ color: '#64748b' }}>
                      {[product.topNotes, product.middleNotes, product.baseNotes].filter(Boolean).join(' • ')}
                    </small>
                  </td>
                  <td>{product.category}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {cols.length > 0
                        ? cols.map((slug) => (
                            <span
                              key={slug}
                              style={{
                                fontSize: '0.68rem',
                                padding: '2px 7px',
                                borderRadius: '20px',
                                background: 'rgba(201,169,110,0.15)',
                                border: '1px solid rgba(201,169,110,0.35)',
                                color: '#c9a96e',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {COLLECTION_LABELS[slug] || slug}
                            </span>
                          ))
                        : <span style={{ color: '#475569', fontSize: '0.75rem' }}>—</span>}
                    </div>
                  </td>
                  <td>{formatEGP(product.price)}</td>
                  <td>{product.salePrice ? formatEGP(product.salePrice) : '—'}</td>
                  <td>{product.stock ?? '—'}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '3px 9px',
                      borderRadius: '20px',
                      background: product.isDraft ? 'rgba(234,179,8,0.12)' : 'rgba(34,197,94,0.12)',
                      border: `1px solid ${product.isDraft ? 'rgba(234,179,8,0.4)' : 'rgba(34,197,94,0.4)'}`,
                      color: product.isDraft ? '#facc15' : '#4ade80',
                      whiteSpace: 'nowrap',
                    }}>
                      {product.isDraft ? '📝 Draft' : '✅ Live'}
                    </span>
                  </td>
                  <td className={styles.actionBtns}>
                    <button
                      className={`${styles.btnIcon} ${styles.edit}`}
                      onClick={() => handleEdit(product)}
                      disabled={deletingId === product.id}
                      aria-label={`Edit ${product.name}`}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className={`${styles.btnIcon} ${styles.delete}`}
                      onClick={() => handleDelete(product.id)}
                      disabled={deletingId === product.id}
                      aria-label={`Delete ${product.name}`}
                    >
                      {deletingId === product.id
                        ? <FaSpinner style={{ animation: 'spin 0.8s linear infinite' }} />
                        : <FaTrashAlt />}
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
