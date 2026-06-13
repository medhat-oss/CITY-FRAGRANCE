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
    <>
      <header className={styles.adminHeader}>
        <h1>Products Management</h1>
        <button className="btn btn-primary" onClick={handleAdd} disabled={isSaving}>
          <FaPlus style={{ marginRight: '8px' }} /> Add New Product
        </button>
      </header>

      {/* Desktop table — hidden on small screens */}
      <div className="hidden md:block w-full overflow-x-auto rounded-xl border border-white/10 bg-[#111B3D]/50 backdrop-blur-md">
        <table className="w-full min-w-[1000px] table-auto text-left border-collapse">
          <thead>
            <tr className="bg-[#09142E]">
              <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider whitespace-nowrap">Image</th>
              <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider whitespace-nowrap">Product Name</th>
              <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider whitespace-nowrap">Category</th>
              <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider whitespace-nowrap">Collections</th>
              <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider whitespace-nowrap">Price</th>
              <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider whitespace-nowrap">Sale</th>
              <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider whitespace-nowrap">Stock</th>
              <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider whitespace-nowrap text-center">Status</th>
              <th className="p-4 border-b border-white/20 text-white font-heading text-xs font-bold uppercase tracking-wider whitespace-nowrap text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product, cols }) => (
              <tr
                key={product.id}
                className="hover:bg-white/5 transition-opacity"
                style={{ opacity: deletingId === product.id ? 0.4 : 1 }}
              >
                <td className="p-4 border-b border-white/10 text-white whitespace-nowrap align-middle">
                  <Image
                    src={product.images?.[0] || '/images/product-placeholder.png'}
                    alt={product.name}
                    width={50}
                    height={50}
                    style={{ objectFit: 'cover', borderRadius: '4px' }}
                  />
                </td>
                <td className="p-4 border-b border-white/10 text-white whitespace-nowrap align-middle">
                  <strong className="text-sm">{product.name}</strong>
                  <br />
                  <span className="text-xs text-slate-400">
                    {[product.topNotes, product.middleNotes, product.baseNotes].filter(Boolean).join(' • ')}
                  </span>
                </td>
                <td className="p-4 border-b border-white/10 text-white whitespace-nowrap align-middle text-sm">{product.category}</td>
                <td className="p-4 border-b border-white/10 text-white whitespace-nowrap align-middle">
                  <div className="flex flex-wrap gap-1">
                    {cols.length > 0
                      ? cols.map((slug) => (
                          <span
                            key={slug}
                            className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                            style={{
                              background: 'rgba(201,169,110,0.15)',
                              border: '1px solid rgba(201,169,110,0.35)',
                              color: '#c9a96e',
                            }}
                          >
                            {COLLECTION_LABELS[slug] || slug}
                          </span>
                        ))
                      : <span className="text-xs text-slate-500">—</span>}
                  </div>
                </td>
                <td className="p-4 border-b border-white/10 text-white whitespace-nowrap align-middle text-sm">{formatEGP(product.price)}</td>
                <td className="p-4 border-b border-white/10 text-white whitespace-nowrap align-middle text-sm">{product.salePrice ? formatEGP(product.salePrice) : '—'}</td>
                <td className="p-4 border-b border-white/10 text-white whitespace-nowrap align-middle text-sm">{product.stock ?? '—'}</td>
                <td className="p-4 border-b border-white/10 align-middle text-center whitespace-nowrap">
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
                <td className="p-4 border-b border-white/10 align-middle text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleEdit(product)}
                      disabled={deletingId === product.id}
                      className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      aria-label={`Edit ${product.name}`}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={deletingId === product.id}
                      className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      aria-label={`Delete ${product.name}`}
                    >
                      {deletingId === product.id
                        ? <FaSpinner style={{ animation: 'spin 0.8s linear infinite' }} />
                        : <FaTrashAlt />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards — visible only on small screens */}
      <div className="md:hidden space-y-3">
        {rows.map(({ product, cols }) => (
          <div
            key={product.id}
            className="rounded-xl border border-white/10 bg-[#111B3D]/50 backdrop-blur-md p-3"
            style={{ opacity: deletingId === product.id ? 0.4 : 1 }}
          >
            <div className="flex gap-3">
              <Image
                src={product.images?.[0] || '/images/product-placeholder.png'}
                alt={product.name}
                width={60}
                height={60}
                className="rounded-lg flex-shrink-0"
                style={{ objectFit: 'cover' }}
              />
              <div className="flex-1 min-w-0">
                <strong className="text-sm text-white block truncate">{product.name}</strong>
                <span className="text-xs text-slate-400 block truncate">
                  {[product.topNotes, product.middleNotes, product.baseNotes].filter(Boolean).join(' • ')}
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {cols.length > 0
                    ? cols.map((slug) => (
                        <span key={slug} className="text-[0.6rem] px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.35)', color: '#c9a96e' }}
                        >{COLLECTION_LABELS[slug] || slug}</span>
                      ))
                    : null}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
              <div><span className="text-slate-400 block">Price</span><span className="text-white font-semibold block">{formatEGP(product.price)}</span></div>
              <div><span className="text-slate-400 block">Sale</span><span className="text-white font-semibold block">{product.salePrice ? formatEGP(product.salePrice) : '—'}</span></div>
              <div><span className="text-slate-400 block">Stock</span><span className="text-white font-semibold block">{product.stock ?? '—'}</span></div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: product.isDraft ? 'rgba(234,179,8,0.12)' : 'rgba(34,197,94,0.12)',
                  border: `1px solid ${product.isDraft ? 'rgba(234,179,8,0.4)' : 'rgba(34,197,94,0.4)'}`,
                  color: product.isDraft ? '#facc15' : '#4ade80',
                }}
              >{product.isDraft ? 'Draft' : 'Live'}</span>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(product)} disabled={deletingId === product.id}
                  className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded transition-colors disabled:opacity-40"
                  aria-label={`Edit ${product.name}`}
                ><FaEdit /></button>
                <button onClick={() => handleDelete(product.id)} disabled={deletingId === product.id}
                  className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded transition-colors disabled:opacity-40"
                  aria-label={`Delete ${product.name}`}
                >{deletingId === product.id ? <FaSpinner className="animate-spin" /> : <FaTrashAlt />}</button>
              </div>
            </div>
          </div>
        ))}
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
