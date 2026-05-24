'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Product, CartItem } from '@/types';

interface CartContextValue {
  cartItems: CartItem[];
  isCartOpen: boolean;
  cartTotal: number;
  cartCount: number;
  addToCart: (product: Product, quantity?: number) => void;
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
    document.body.style.overflow = isCartOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
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

  const removeFromCart = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity < 1) {
        removeFromCart(productId);
        return;
      }
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    },
    [removeFromCart]
  );

  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const clearCart = useCallback(() => setCartItems([]), []);

  const buyNow = useCallback((product: Product, quantity = 1) => {
    setCartItems([{ ...product, quantity }]);
    setIsCartOpen(false);
  }, []);

  const cartTotal = cartItems.reduce((sum, item) => {
    const price = item.salePrice ?? item.price;
    return sum + price * item.quantity;
  }, 0);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        cartTotal,
        cartCount,
        addToCart,
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
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
