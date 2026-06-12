'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { Product, CartItem } from '@/types';

interface CartContextValue {
  cartItems: CartItem[];
  isCartOpen: boolean;
  cartTotal: number;
  cartCount: number;
  addToCart: (product: Product, quantity?: number) => void;
  addGiftSetToCart: (giftSet: { id: string; name: string; price: number; image: string; stock?: number }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  clearCart: () => void;
  buyNow: (product: Product, quantity?: number) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_KEY = 'city_fragrance_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [stockError, setStockError] = useState<{ limit: number } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) setCartItems(JSON.parse(stored) as CartItem[]);
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems, isLoaded]);

  useEffect(() => {
    if (stockError) {
      const timer = setTimeout(() => setStockError(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [stockError]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    const stockLimit = product.stock !== undefined ? product.stock : 999;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + quantity > stockLimit) {
        setStockError({ limit: stockLimit });
        return prev;
      }
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  }, []);

  const addGiftSetToCart = useCallback((giftSet: { id: string; name: string; price: number; image: string; stock?: number }) => {
    const cartId = 'gs_' + giftSet.id;
    const stockLimit = giftSet.stock !== undefined ? giftSet.stock : 999;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === cartId);
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + 1 > stockLimit) {
        setStockError({ limit: stockLimit });
        return prev;
      }
      if (existing) {
        return prev.map((item) =>
          item.id === cartId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      const pseudoProduct: Product = {
        id: cartId,
        name: giftSet.name,
        type: 'Gift Sets',
        category: 'Gift Set',
        topNotes: '',
        middleNotes: '',
        baseNotes: '',
        price: giftSet.price,
        salePrice: null,
        images: giftSet.image ? [giftSet.image] : [],
        badge: 'GIFT SET',
        stock: giftSet.stock,
      };
      return [...prev, { ...pseudoProduct, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity < 1) {
        removeFromCart(productId);
        return;
      }
      setCartItems((prev) => {
        const item = prev.find((i) => i.id === productId);
        if (item) {
          const stockLimit = item.stock !== undefined ? item.stock : 999;
          if (quantity > stockLimit) {
            setStockError({ limit: stockLimit });
            return prev;
          }
        }
        return prev.map((i) =>
          i.id === productId ? { ...i, quantity } : i
        );
      });
    },
    [removeFromCart]
  );

  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const clearCart = useCallback(() => setCartItems([]), []);

  const buyNow = useCallback((product: Product, quantity = 1) => {
    const stockLimit = product.stock !== undefined ? product.stock : 999;
    if (quantity > stockLimit) {
      setStockError({ limit: stockLimit });
      return;
    }
    setCartItems([{
      ...product,
      quantity,
    }]);
    setIsCartOpen(false);
  }, []);

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => {
      const price = item.salePrice ?? item.price;
      return sum + price * item.quantity;
    }, 0),
    [cartItems]
  );

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        cartTotal,
        cartCount,
        addToCart,
        addGiftSetToCart,
        removeFromCart,
        updateQuantity,
        toggleCart,
        openCart,
        closeCart,
        clearCart,
        buyNow,
      }}
    >
      {children}
      {/* Premium dark luxury global toast error overlay */}
      {stockError && (
        <div 
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            backgroundColor: '#0c1b3d',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#fef3c7',
            padding: '1rem 1.5rem',
            borderRadius: '6px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            maxWidth: '90vw',
            width: '400px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-heading, sans-serif)', fontSize: '0.9rem', fontWeight: 600 }}>
              The requested quantity exceeds available luxury stock
            </div>
            <div style={{ fontFamily: 'var(--font-body, sans-serif)', fontSize: '0.75rem', color: '#fbbf24', marginTop: '0.25rem' }}>
              Only {stockError.limit} items available
            </div>
          </div>
          <button 
            onClick={() => setStockError(null)} 
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(254, 243, 199, 0.5)',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0.25rem'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
