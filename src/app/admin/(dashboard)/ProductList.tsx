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
    <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-[#16234D]/50 backdrop-blur-md">
      <table className="w-full min-w-[1000px] table-auto text-left border-collapse text-white bg-[#111B3D]">
          <colgroup>
            <col className="w-[8%]" />
            <col className="w-[22%]" />
            <col className="w-[12%]" />
            <col className="w-[15%]" />
            <col className="w-[8%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[7%]" />
            <col className="w-[6%]" />
          </colgroup>
          <thead className="bg-[#16234D] text-white tracking-wide text-sm font-semibold uppercase">
            <tr>
              <th className="p-4">Image</th>
              <th className="p-4">Product Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Collections</th>
              <th className="p-4">Price</th>
              <th className="p-4">Sale</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Actions</th>
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
                <td className="p-4 whitespace-nowrap align-middle">
                  <div className="relative h-12 w-12 rounded bg-[#16234D]/30 overflow-hidden border border-white/10">
                    <Image
                      src={product.images?.[0] || '/images/product-placeholder.png'}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </td>

                {/* Product Name */}
                <td className="p-4 align-middle">
                  <span className="font-medium text-white truncate block text-sm max-w-[200px]" title={product.name}>
                    {product.name}
                  </span>
                </td>

                {/* Category */}
                <td className="p-4 whitespace-nowrap truncate text-sm text-gray-300 align-middle">
                  {product.category || 'Unisex'}
                </td>

                {/* Collections */}
                <td className="p-4 align-middle">
                  {cols.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {cols.map((slug) => (
                        <span
                          key={slug}
                          className="px-2 py-0.5 text-xs rounded-full bg-[#16234D] text-blue-300 border border-blue-500/20 whitespace-nowrap"
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
                <td className="p-4 whitespace-nowrap text-sm font-mono text-gray-200 align-middle">
                  {formatEGP(product.price)}
                </td>

                {/* Sale */}
                <td className="p-4 whitespace-nowrap text-sm font-mono text-emerald-400 align-middle">
                  {product.salePrice ? formatEGP(product.salePrice) : '—'}
                </td>

                {/* Stock */}
                <td className="p-4 whitespace-nowrap text-sm font-mono align-middle">
                  <span className={product.stock === 0 ? 'text-red-400 font-bold' : 'text-gray-300'}>
                    {product.stock ?? '—'}
                  </span>
                </td>

                {/* Status */}
                <td className="p-4 align-middle">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    product.isDraft
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {product.isDraft ? 'Draft' : 'Live'}
                  </span>
                </td>

                {/* Actions */}
                <td className="p-4 text-center align-middle">
                  <div className="flex items-center justify-center gap-2">
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
                      {deletingId === product.id ? <FaSpinner className="animate-spin" /> : <FaTrashAlt />}
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
