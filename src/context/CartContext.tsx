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
  addGiftSetToCart: (giftSet: { id: string; name: string; price: number; image: string }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  clearCart: () => void;
  buyNow: (product: Product, quantity?: number, selectedVolume?: string) => void;
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

  const addGiftSetToCart = useCallback((giftSet: { id: string; name: string; price: number; image: string }) => {
    const cartId = 'gs_' + giftSet.id;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === cartId);
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
        notes: '',
        volume: '',
        price: giftSet.price,
        salePrice: null,
        images: giftSet.image ? [giftSet.image] : [],
        badge: 'GIFT SET',
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

  const buyNow = useCallback((product: Product, quantity = 1, selectedVolume?: string) => {
    setCartItems([{
      ...product,
      quantity,
      volume: selectedVolume || product.volume,
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
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
