import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import * as store from '../store';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [support, setSupport] = useState([]);
  const [users, setUsers] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [bookmarkIds, setBookmarkIds] = useState([]);
  const [recentIds, setRecentIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u1 = store.subscribeProducts(setProducts);
    const u2 = store.subscribeOrders(setOrders);
    const u3 = store.subscribeSupport(setSupport);
    const u4 = store.subscribeUsers(setUsers);
    const t = setTimeout(() => setLoading(false), 400);
    return () => { u1(); u2(); u3(); u4(); clearTimeout(t); };
  }, []);

  useEffect(() => {
    const uid = user?.uid || null;
    const u1 = store.subscribeCart(uid, setCartItems);
    const u2 = store.subscribeBookmarks(uid, setBookmarkIds);
    const u3 = store.subscribeRecent(uid, setRecentIds);
    return () => { u1(); u2(); u3(); };
  }, [user?.uid]);

  const addToCart = async (productId, size, color, qty) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    const next = store.addToCartItems(cartItems, p, size, color, qty);
    setCartItems(next);
    await store.writeCart(user?.uid, next);
  };
  const setQty = async (i, q) => {
    const next = store.setCartQtyItems(cartItems, i, q);
    setCartItems(next);
    await store.writeCart(user?.uid, next);
  };
  const remove = async (i) => {
    const next = store.removeCartItemItems(cartItems, i);
    setCartItems(next);
    await store.writeCart(user?.uid, next);
  };
  const clear = async () => {
    setCartItems([]);
    await store.writeCart(user?.uid, []);
  };
  const toggleBookmark = async (pid) => {
    await store.toggleBookmark(user?.uid, pid);
  };
  const pushRecent = async (pid) => {
    await store.pushRecent(user?.uid, pid);
  };

  const value = {
    products, orders, users, support,
    cartItems, bookmarkIds, recentIds, loading,
    addToCart, setQty, remove, clear, toggleBookmark, pushRecent
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
