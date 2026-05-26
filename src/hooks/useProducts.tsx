'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { defaultProducts } from '@/data/defaultProducts';
import type { Product } from '@/types';

interface ProductsContextValue {
  products: Product[];
  isLoaded: boolean;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (updated: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getBestSellers: () => Product[];
  getProductsByCategory: (category: string) => Product[];
  getProductsByCollection: (collection: string) => Product[];
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch('/api/products', { cache: 'no-store' });
    const data = await res.json() as { products: Product[] };
    return data.products;
  } catch {
    return defaultProducts;
  }
}

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetchProducts().then((p) => {
      setProducts(p);
      setIsLoaded(true);
    });
  }, []);

  const addProduct = useCallback(async (product: Product) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      const data = await res.json() as { success: boolean; product?: Product };
      if (data.success && data.product) {
        setProducts((prev) => [...prev, data.product!]);
      }
    } catch {
      // ignore
    }
  }, []);

  const updateProduct = useCallback(async (updated: Product) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json() as { success: boolean; product?: Product };
      if (data.success && data.product) {
        setProducts((prev) => prev.map((p) => (p.id === data.product!.id ? data.product! : p)));
      }
    } catch {
      // ignore
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json() as { success: boolean };
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      // ignore
    }
  }, []);

  const getBestSellers = useCallback((): Product[] => {
    return products
      .filter(
        (p) =>
          p.badge &&
          (p.badge.toUpperCase().includes('BEST SELLER') ||
            p.badge.toUpperCase().includes('SALE'))
      )
      .slice(0, 4);
  }, [products]);

  const getProductsByCategory = useCallback(
    (category: string): Product[] => products.filter((p) => p.category === category),
    [products]
  );

  const getProductsByCollection = useCallback(
    (collection: string): Product[] => products.filter((p) => p.collection === collection),
    [products]
  );

  return (
    <ProductsContext.Provider
      value={{
        products,
        isLoaded,
        addProduct,
        updateProduct,
        deleteProduct,
        getBestSellers,
        getProductsByCategory,
        getProductsByCollection,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts(): ProductsContextValue {
  const ctx = useContext(ProductsContext);
  if (ctx) {
    return ctx;
  }
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetchProducts().then((p) => {
      setProducts(p);
      setIsLoaded(true);
    });
  }, []);

  const addProduct = useCallback(async (product: Product) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      const data = await res.json() as { success: boolean; product?: Product };
      if (data.success && data.product) {
        setProducts((prev) => [...prev, data.product!]);
      }
    } catch {
      // ignore
    }
  }, []);

  const updateProduct = useCallback(async (updated: Product) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json() as { success: boolean; product?: Product };
      if (data.success && data.product) {
        setProducts((prev) => prev.map((p) => (p.id === data.product!.id ? data.product! : p)));
      }
    } catch {
      // ignore
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json() as { success: boolean };
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      // ignore
    }
  }, []);

  const getBestSellers = useCallback(
    (): Product[] =>
      products
        .filter(
          (p) =>
            p.badge &&
            (p.badge.toUpperCase().includes('BEST SELLER') ||
              p.badge.toUpperCase().includes('SALE'))
        )
        .slice(0, 4),
    [products]
  );
  const getProductsByCategory = useCallback(
    (category: string): Product[] => products.filter((p) => p.category === category),
    [products]
  );
  const getProductsByCollection = useCallback(
    (collection: string): Product[] => products.filter((p) => p.collection === collection),
    [products]
  );

  return {
    products,
    isLoaded,
    addProduct,
    updateProduct,
    deleteProduct,
    getBestSellers,
    getProductsByCategory,
    getProductsByCollection,
  };
}
