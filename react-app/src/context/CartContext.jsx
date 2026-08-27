import { createContext, useContext } from 'react';
import { useData } from './DataContext';
import * as store from '../store';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { cartItems, products, addToCart, setQty, remove, clear } = useData();
  const items = store.cartLineItems(cartItems, products);
  const value = {
    count: store.cartCount(cartItems),
    items,
    subtotal: store.cartSubtotal(cartItems),
    addToCart,
    setQty,
    remove,
    clear
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
