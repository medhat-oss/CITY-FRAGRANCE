'use client';

import { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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

async function fetchProducts(isAdmin: boolean): Promise<Product[]> {
  try {
    const url = isAdmin ? '/api/admin/products' : '/api/products';
    const res = await fetch(`${url}?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return defaultProducts;
    }
    const data = (await res.json()) as { products?: Product[] };
    if (Array.isArray(data?.products) && data.products.length > 0) {
      return data.products;
    }
    return defaultProducts;
  } catch {
    return defaultProducts;
  }
}

/** Returns true when the current route is an admin/cashier-only page */
function useIsAdminRoute(): boolean {
  const pathname = usePathname();
  return (pathname?.startsWith('/admin') || pathname?.startsWith('/cashier')) ?? false;
}

/** Filter out drafts for storefront visitors; admins see everything */
function useVisibleProducts(allProducts: Product[]): Product[] {
  const isAdmin = useIsAdminRoute();
  return useMemo(
    () => (isAdmin ? allProducts : allProducts.filter((p) => p.isDraft !== true)),
    [allProducts, isAdmin]
  );
}

/** Multi-collection aware membership check */
function inCollection(p: Product, collection: string): boolean {
  if (Array.isArray(p.collections) && p.collections.length > 0) {
    return p.collections.includes(collection);
  }
  return p.collection === collection;
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────
export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const isAdmin = useIsAdminRoute();
  const router = useRouter();
  const products = useVisibleProducts(allProducts);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchProducts(isAdmin).then((p) => {
      if (!cancelled) {
        setAllProducts(p);
        setIsLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fetchKey, isAdmin]);

  const addProduct = useCallback(async (product: Product) => {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(product),
    });
    const data = await res.json() as { success: boolean; product?: Product; error?: string };
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to add product');
    }
    setAllProducts((prev) => [...prev, data.product!]);
    setFetchKey((k) => k + 1);
    router.refresh();
  }, [router]);

  const updateProduct = useCallback(async (updated: Product) => {
    const res = await fetch('/api/admin/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(updated),
    });
    const data = await res.json() as { success: boolean; product?: Product; error?: string };
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update product');
    }
    setAllProducts((prev) =>
      prev.map((p) => (p.id === data.product!.id ? data.product! : p))
    );
    setFetchKey((k) => k + 1);
    router.refresh();
  }, [router]);

  const deleteProduct = useCallback(async (id: string) => {
    const res = await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ id }),
    });
    const data = await res.json() as { success: boolean; error?: string };
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to delete product');
    }
    setAllProducts((prev) => prev.filter((p) => p.id !== id));
    setFetchKey((k) => k + 1);
    router.refresh();
  }, [router]);

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
    (collection: string): Product[] => products.filter((p) => inCollection(p, collection)),
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

// ─────────────────────────────────────────────────────────────────────────────
// Hook (standalone fallback – runs when used outside the Provider tree)
// ─────────────────────────────────────────────────────────────────────────────
export function useProducts(): ProductsContextValue {
  const ctx = useContext(ProductsContext);
  if (ctx) return ctx;

  // Fallback (rare – only when used outside ProductsProvider)
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const router = useRouter();
  const isAdmin = useIsAdminRoute();

  const products = useVisibleProducts(allProducts);

  useEffect(() => {
    let cancelled = false;
    fetchProducts(isAdmin).then((p) => {
      if (!cancelled) {
        setAllProducts(p);
        setIsLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [fetchKey, isAdmin]);

  const addProduct = useCallback(async (product: Product) => {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(product),
    });
    const data = await res.json() as { success: boolean; product?: Product; error?: string };
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add product');
    setAllProducts((prev) => [...prev, data.product!]);
    setFetchKey((k) => k + 1);
    router.refresh();
  }, [router]);

  const updateProduct = useCallback(async (updated: Product) => {
    const res = await fetch('/api/admin/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(updated),
    });
    const data = await res.json() as { success: boolean; product?: Product; error?: string };
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update product');
    setAllProducts((prev) => prev.map((p) => (p.id === data.product!.id ? data.product! : p)));
    setFetchKey((k) => k + 1);
    router.refresh();
  }, [router]);

  const deleteProduct = useCallback(async (id: string) => {
    const res = await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ id }),
    });
    const data = await res.json() as { success: boolean; error?: string };
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete product');
    setAllProducts((prev) => prev.filter((p) => p.id !== id));
    setFetchKey((k) => k + 1);
    router.refresh();
  }, [router]);

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
    (collection: string): Product[] => products.filter((p) => inCollection(p, collection)),
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
