import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Store, CartItem } from '../types';

interface CartConflict {
  isOpen: boolean;
  incomingProduct: Product | null;
  incomingStore: { id: string; name: string } | null;
  existingStoreName: string;
}

interface CartContextType {
  items: CartItem[];
  storeId: string | null;
  storeName: string | null;
  totalCount: number;
  totalAmount: number;
  conflictState: CartConflict;
  addToCart: (product: Product, store: { id: string; name: string }, quantity?: number) => void;
  resolveConflict: (proceedWithNewStore: boolean) => void;
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('aswaq_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [storeId, setStoreId] = useState<string | null>(() => {
    return localStorage.getItem('aswaq_cart_store_id') || null;
  });

  const [storeName, setStoreName] = useState<string | null>(() => {
    return localStorage.getItem('aswaq_cart_store_name') || null;
  });

  const [conflictState, setConflictState] = useState<CartConflict>({
    isOpen: false,
    incomingProduct: null,
    incomingStore: null,
    existingStoreName: '',
  });

  useEffect(() => {
    localStorage.setItem('aswaq_cart_items', JSON.stringify(items));
    if (storeId) {
      localStorage.setItem('aswaq_cart_store_id', storeId);
    } else {
      localStorage.removeItem('aswaq_cart_store_id');
    }
    if (storeName) {
      localStorage.setItem('aswaq_cart_store_name', storeName);
    } else {
      localStorage.removeItem('aswaq_cart_store_name');
    }
  }, [items, storeId, storeName]);

  const addToCart = (product: Product, store: { id: string; name: string }, quantity = 1) => {
    // Check if cart is non-empty and belongs to a different store
    if (items.length > 0 && storeId && storeId !== store.id) {
      setConflictState({
        isOpen: true,
        incomingProduct: product,
        incomingStore: store,
        existingStoreName: storeName || 'المتجر السابق',
      });
      return;
    }

    // Add item to existing cart or start new cart with this store
    setStoreId(store.id);
    setStoreName(store.name);

    setItems((prevItems) => {
      const existingIdx = prevItems.findIndex((it) => it.product.id === product.id);
      if (existingIdx !== -1) {
        const newItems = [...prevItems];
        const newQty = Math.min(product.stockQuantity, newItems[existingIdx].quantity + quantity);
        newItems[existingIdx] = {
          ...newItems[existingIdx],
          quantity: newQty,
        };
        return newItems;
      } else {
        return [...prevItems, { product, quantity: Math.min(product.stockQuantity, quantity) }];
      }
    });
  };

  const resolveConflict = (proceedWithNewStore: boolean) => {
    if (proceedWithNewStore && conflictState.incomingProduct && conflictState.incomingStore) {
      // Clear previous store items and start with new store
      setStoreId(conflictState.incomingStore.id);
      setStoreName(conflictState.incomingStore.name);
      setItems([
        {
          product: conflictState.incomingProduct,
          quantity: 1,
        },
      ]);
    }
    setConflictState({
      isOpen: false,
      incomingProduct: null,
      incomingStore: null,
      existingStoreName: '',
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((it) => {
          if (it.product.id === productId) {
            const newQty = it.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > it.product.stockQuantity) return it;
            return { ...it, quantity: newQty };
          }
          return it;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => {
      const filtered = prev.filter((it) => it.product.id !== productId);
      if (filtered.length === 0) {
        setStoreId(null);
        setStoreName(null);
      }
      return filtered;
    });
  };

  const clearCart = () => {
    setItems([]);
    setStoreId(null);
    setStoreName(null);
  };

  const totalCount = items.reduce((acc, it) => acc + it.quantity, 0);

  const totalAmount = items.reduce((acc, it) => {
    const price = it.product.isOffer && it.product.discountPrice ? it.product.discountPrice : it.product.price;
    return acc + price * it.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        storeId,
        storeName,
        totalCount,
        totalAmount,
        conflictState,
        addToCart,
        resolveConflict,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
