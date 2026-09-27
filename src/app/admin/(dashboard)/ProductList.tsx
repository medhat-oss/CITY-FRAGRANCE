'use client';

import React from 'react';
import Image from 'next/image';
import { formatEGP } from '@/utils/currency';
import type { Product } from '@/types';
import { FaSpinner } from 'react-icons/fa';

const COLLECTION_LABELS: Record<string, string> = {
  'new-arrivals': 'New Arrivals',
  'all-fragrances': 'All Fragrances',
  'oud-collection': 'Oud',
  'mens-collection': "Men's",
  'womens-collection': "Women's",
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

export const ProductList = React.memo(function ProductListInner({ rows, deletingId, onEdit, onDelete }: Props) {
  if (!rows || rows.length === 0) {
    return (
      <div className="w-full rounded-xl border border-white/10 bg-[#16234D]/50 backdrop-blur-md p-8 text-center text-white">
        No products found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {rows.map(({ product, cols }) => (
        <div
          key={product.id}
          className="flex flex-col rounded-xl border border-white/10 bg-[#16234D]/50 backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-white/20 hover:bg-[#1a2d5a]/50"
          style={{ opacity: deletingId === product.id ? 0.4 : 1 }}
        >
          {/* Image */}
          <div className="relative h-40 sm:h-44 w-full bg-[#111B3D] overflow-hidden">
            <Image
              src={product.images?.[0] || '/images/product-placeholder.png'}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-2 p-4 flex-1">
            {/* Name + Category row */}
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-semibold text-white truncate" title={product.name}>
                {product.name}
              </h3>
              <span className="text-xs text-gray-400 truncate">
                {product.category || 'Unisex'}
              </span>
            </div>

            {/* Collections */}
            <div className="flex flex-wrap gap-1 min-h-[20px]">
              {cols.length > 0 ? (
                cols.map((slug) => (
                  <span
                    key={slug}
                    className="px-1.5 py-0.5 text-[10px] rounded-full bg-[#16234D] text-blue-300 border border-blue-500/20 whitespace-nowrap"
                  >
                    {COLLECTION_LABELS[slug] || slug}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-gray-500">—</span>
              )}
            </div>

            {/* Price row */}
            <div className="flex items-center gap-2 mt-auto">
              <span className="text-sm font-mono text-gray-200">{formatEGP(product.price)}</span>
              {product.salePrice && (
                <span className="text-xs font-mono text-emerald-400 line-through opacity-60">
                  {formatEGP(product.salePrice)}
                </span>
              )}
            </div>

            {/* Stock + Status row */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span className={`text-xs font-mono ${product.stock === 0 ? 'text-red-400 font-bold' : 'text-gray-300'}`}>
                Stock: {product.stock ?? 0}
              </span>
              <span className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                product.isDraft
                  ? 'bg-yellow-500/10 text-yellow-400'
                  : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                {product.isDraft ? 'Draft' : 'Live'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => onEdit(product)}
                disabled={deletingId === product.id}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-[#1a3a7a]/50 text-white border border-white/10 hover:bg-[#1a3a7a] hover:border-white/20 transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(product.id)}
                disabled={deletingId === product.id}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                {deletingId === product.id ? <FaSpinner className="animate-spin text-xs" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
