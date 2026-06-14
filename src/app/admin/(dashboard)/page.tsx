'use client';

import { useState, useCallback, useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types';
import styles from './admin.module.css';
import { FaPlus } from 'react-icons/fa';
import ProductModal from '@/components/ProductModal';
import { ProductList } from './ProductList';

export default function AdminPage() {
  const { products, isLoaded, addProduct, updateProduct, deleteProduct } = useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
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
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete product. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }, [deleteProduct]);

  const handleSave = useCallback(async (data: Product) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      if (productToEdit) {
        await updateProduct(data);
      } else {
        await addProduct(data);
      }
      setIsModalOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed. Please try again.');
      // Keep modal open so user can retry
    } finally {
      setIsSaving(false);
    }
  }, [productToEdit, addProduct, updateProduct]);

  // Memoised row data to avoid re-computing cols on every render
  const rows = useMemo(() => products.map((product) => {
    const cols: string[] = Array.isArray(product.collections) && product.collections.length > 0
      ? product.collections.map((c: any) => (typeof c === 'string' ? c : c.slug || c.name || ''))
      : product.collection
        ? [typeof product.collection === 'string' ? product.collection : '']
        : [];
    return { product, cols };
  }), [products]);

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#94a3b8', fontFamily: 'var(--font-body)', fontSize: '0.9rem', gap: '0.75rem' }}>
        <div style={{ width: 20, height: 20, border: '2px solid #1d3573', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Loading products...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
        <h1 className="text-[#f8f9fa] text-2xl font-heading font-normal m-0">Products Management</h1>
        <button onClick={handleAdd} disabled={isSaving}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border-none cursor-pointer transition-all duration-200 font-heading tracking-wide disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #1a3a7a, #2a4a9a)',
            color: '#ffffff',
            boxShadow: '0 2px 8px rgba(26,58,122,0.3)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #2a4a9a, #3a5aaa)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(135deg, #1a3a7a, #2a4a9a)'; }}
        >
          <FaPlus /> Add New Product
        </button>
      </div>

      <ProductList
        rows={rows}
        deletingId={deletingId}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSaveError(null); }}
        onSave={handleSave}
        productToEdit={productToEdit}
        isSaving={isSaving}
        saveError={saveError}
      />
    </div>
  );
}
