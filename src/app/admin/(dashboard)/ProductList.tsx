'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { formatEGP } from '@/utils/currency';
import type { Product } from '@/types';
import { FaEdit, FaTrashAlt, FaSpinner } from 'react-icons/fa';

const COLLECTION_LABELS: Record<string, string> = {
  'new-arrivals': 'New Arrivals',
  'all-fragrances': 'All Fragrances',
  'oud-collection': 'Oud',
  'mens-collection': "Men's",
  'womens-collection': "Women's",
  'gift-sets': 'Gift Sets',
};

interface RowData {
  product: Product;
  cols: string[];
}

interface Props {
  rows: RowData[];
  deletingId: string | null;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}

function ProductListInner({ rows, deletingId, onEdit, onDelete }: Props) {
  return (
    <div className="w-full">
      {/* Desktop table */}
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
                    {product.isDraft ? 'Draft' : 'Live'}
                  </span>
                </td>
                <td className="p-4 border-b border-white/10 align-middle text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => onEdit(product)}
                      disabled={deletingId === product.id}
                      className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      aria-label={`Edit ${product.name}`}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      disabled={deletingId === product.id}
                      className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      aria-label={`Delete ${product.name}`}
                    >
                      {deletingId === product.id
                        ? <FaSpinner className="animate-spin" />
                        : <FaTrashAlt />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
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
                <button onClick={() => onEdit(product)} disabled={deletingId === product.id}
                  className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded transition-colors disabled:opacity-40"
                  aria-label={`Edit ${product.name}`}
                ><FaEdit /></button>
                <button onClick={() => onDelete(product.id)} disabled={deletingId === product.id}
                  className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-2 rounded transition-colors disabled:opacity-40"
                  aria-label={`Delete ${product.name}`}
                >{deletingId === product.id ? <FaSpinner className="animate-spin" /> : <FaTrashAlt />}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const ProductList = React.memo(ProductListInner);
