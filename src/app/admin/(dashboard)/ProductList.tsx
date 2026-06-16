'use client';

import React from 'react';
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
      <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-[#16234D]/50 backdrop-blur-md p-8 text-center text-white">
        No products found.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-[#16234D]/50 backdrop-blur-md"
      style={{ scrollbarWidth: 'thin', scrollbarColor: '#16234D #111B3D' }}
    >
      <table className="w-full table-auto text-left border-collapse text-white bg-[#111B3D]">
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[20%]" />
            <col className="w-[12%]" />
            <col className="w-[15%]" />
            <col className="w-[8%]" />
            <col className="w-[10%]" />
            <col className="w-[8%]" />
            <col className="w-[8%]" />
            <col className="w-[9%]" />
          </colgroup>
          <thead className="bg-[#16234D] text-white tracking-wide text-sm font-semibold uppercase">
            <tr>
              <th className="px-3 py-3">Image</th>
              <th className="px-3 py-3">Product Name</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Collections</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">Sale</th>
              <th className="px-3 py-3">Stock</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-[#111B3D]">
            {rows.map(({ product, cols }) => (
              <tr
                key={product.id}
                className="hover:bg-[#16234D]/10 transition-colors duration-150"
                style={{ opacity: deletingId === product.id ? 0.4 : 1 }}
              >
                {/* Image */}
                <td className="px-3 py-3 whitespace-nowrap align-middle">
                  <div className="relative h-10 w-10 rounded bg-[#16234D]/30 overflow-hidden border border-white/10">
                    <Image
                      src={product.images?.[0] || '/images/product-placeholder.png'}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </td>

                {/* Product Name */}
                <td className="px-3 py-3 align-middle">
                  <span className="font-medium text-white truncate block text-sm max-w-[180px]" title={product.name}>
                    {product.name}
                  </span>
                </td>

                {/* Category */}
                <td className="px-3 py-3 whitespace-nowrap truncate text-sm text-gray-300 align-middle">
                  {product.category || 'Unisex'}
                </td>

                {/* Collections */}
                <td className="px-3 py-3 align-middle">
                  {cols.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {cols.map((slug) => (
                        <span
                          key={slug}
                          className="px-1.5 py-0.5 text-xs rounded-full bg-[#16234D] text-blue-300 border border-blue-500/20 whitespace-nowrap"
                        >
                          {COLLECTION_LABELS[slug] || slug}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>

                {/* Price */}
                <td className="px-3 py-3 whitespace-nowrap text-sm font-mono text-gray-200 align-middle">
                  {formatEGP(product.price)}
                </td>

                {/* Sale */}
                <td className="px-3 py-3 whitespace-nowrap text-sm font-mono text-emerald-400 align-middle">
                  {product.salePrice ? formatEGP(product.salePrice) : '—'}
                </td>

                {/* Stock */}
                <td className="px-3 py-3 whitespace-nowrap text-sm font-mono align-middle">
                  <span className={product.stock === 0 ? 'text-red-400 font-bold' : 'text-gray-300'}>
                    {product.stock ?? '—'}
                  </span>
                </td>

                {/* Status */}
                <td className="px-3 py-3 align-middle">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    product.isDraft
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {product.isDraft ? 'Draft' : 'Live'}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-3 py-3 text-center align-middle">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEdit(product)}
                      disabled={deletingId === product.id}
                      className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      aria-label={`Edit ${product.name}`}
                    >
                      <FaEdit className="text-sm" />
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      disabled={deletingId === product.id}
                      className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      aria-label={`Delete ${product.name}`}
                    >
                      {deletingId === product.id ? <FaSpinner className="animate-spin text-sm" /> : <FaTrashAlt className="text-sm" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  );
});
