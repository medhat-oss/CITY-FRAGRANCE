'use client';

import { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
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
    const res = await fetch('/api/products');
    const data = await res.json() as { products: Product[] };
    return data.products;
  } catch {
    return defaultProducts;
  }
}

/** Returns true when the current route is an admin/cashier-only page */
function useIsAdminRoute(): boolean {
  const pathname = usePathname();
  return (pathname?.startsWith('/admin') || pathname?.startsWith('/cashier')) ?? false;
}

/**
 * Routes that actually need product data fetched eagerly.
 * Pages like /stores, /about, /privacy-policy, /order-payment do NOT render
 * product cards, so we skip the DB round-trip there entirely.
 */
const PRODUCT_ROUTES = [
  '/', '/collections', '/product', '/search',
  '/admin', '/cashier',
];

function useNeedsProducts(): boolean {
  const pathname = usePathname() ?? '';
  return PRODUCT_ROUTES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith(prefix + '?'));
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
  const needsProducts = useNeedsProducts();
  // ── Fetch-lock ref: prevents the infinite loop caused by needsProducts
  // changing on every client-side navigation (pathname changes → needsProducts
  // recomputes → useEffect re-fires → /api/products hammered 4-5×/second).
  // We capture the initial value once and never fetch again after first load.
  const hasFetchedRef = useRef(false);

  const products = useVisibleProducts(allProducts);

  useEffect(() => {
    // Already fetched (or explicitly skipped) — never re-run on navigation.
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    // Skip the expensive /api/products call on routes that don't render product
    // cards (e.g. /stores, /about, /privacy-policy, /order-payment).
    if (!needsProducts) {
      setIsLoaded(true);
      return;
    }
    fetchProducts().then((p) => {
      setAllProducts(p);
      setIsLoaded(true);
    });
  // Intentionally omit needsProducts from deps — it must NOT re-trigger this
  // effect on navigation. The initial value is captured via closure on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setAllProducts((prev) => [...prev, data.product!]);
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
        setAllProducts((prev) =>
          prev.map((p) => (p.id === data.product!.id ? data.product! : p))
        );
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
        setAllProducts((prev) => prev.filter((p) => p.id !== id));
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

  const products = useVisibleProducts(allProducts);

  useEffect(() => {
    fetchProducts().then((p) => {
      setAllProducts(p);
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
        setAllProducts((prev) => [...prev, data.product!]);
      }
    } catch { /* ignore */ }
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
        setAllProducts((prev) =>
          prev.map((p) => (p.id === data.product!.id ? data.product! : p))
        );
      }
    } catch { /* ignore */ }
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
        setAllProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch { /* ignore */ }
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
