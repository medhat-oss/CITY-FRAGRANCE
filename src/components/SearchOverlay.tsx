'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useProducts } from '@/hooks/useProducts';
import { formatEGP } from '@/utils/currency';
import type { Product } from '@/types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { products, isLoaded } = useProducts();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const results = useMemo(() => {
    if (!isLoaded || !query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter(
      (p: Product) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.topNotes?.toLowerCase().includes(q) ||
        p.middleNotes?.toLowerCase().includes(q) ||
        p.baseNotes?.toLowerCase().includes(q)
    );
  }, [query, products, isLoaded]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#09142E]/95 backdrop-blur-sm">
      {/* Top bar with search input */}
      <div className="flex items-center gap-4 px-6 py-6 border-b border-white/10">
        <div className="flex-1 relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-14 pr-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 text-lg focus:outline-none focus:border-white focus:ring-1 focus:ring-white/50 transition-all duration-300 ease-in-out"
          />
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white p-2 bg-transparent border-none cursor-pointer transition-all duration-300 ease-in-out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {query.trim() && results.length === 0 && (
          <p className="text-center text-white/50 text-lg mt-20">No products found.</p>
        )}

        {!query.trim() && (
          <p className="text-center text-white/30 text-lg mt-20">
            Type something to start searching...
          </p>
        )}

        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {results.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                onClick={onClose}
                className="group block"
              >
                <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300 ease-in-out">
                  <div className="aspect-square relative">
                    <Image
                      src={product.images[0] || '/images/product-placeholder.png'}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 20vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-widest text-white mb-1">
                      {product.category}
                    </p>
                    <h3 className="text-white font-heading text-lg">{product.name}</h3>
                    <p className="text-white/60 text-sm mt-1 line-clamp-1">{[product.topNotes, product.middleNotes, product.baseNotes].filter(Boolean).join(' • ')}</p>
                    <div className="mt-2">
                      {product.salePrice ? (
                        <div className="flex items-center gap-2">
                          <span className="text-white font-heading">
                            {formatEGP(product.salePrice)}
                          </span>
                          <span className="text-white/40 line-through text-sm">
                            {formatEGP(product.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-white font-heading">
                          {formatEGP(product.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
