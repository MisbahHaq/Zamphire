// ═══════════════════════════════════════════════
//  ZAMPHIRE — Firebase backend (Firestore + Auth)
//  Async data layer. Live collections are surfaced
//  to React via the DataProvider (onSnapshot) and
//  mutations are awaited writes to Firestore.
// ═══════════════════════════════════════════════

import {
  collection, doc, getDoc, setDoc, addDoc, updateDoc,
  deleteDoc, onSnapshot, query, where, orderBy, runTransaction, serverTimestamp
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, signOut, onAuthStateChanged
} from 'firebase/auth';
import { auth, db, googleProvider, ADMIN_EMAILS } from './firebase';

/* ---------- helpers ---------- */

export function money(n) {
  const value = Math.round(n || 0);
  return '₨' + value.toLocaleString('en-US');
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = (iso && iso.toDate) ? iso.toDate() : new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export const storeConfig = {
  name: import.meta.env.VITE_STORE_NAME || 'Zamphire',
  iban: import.meta.env.VITE_STORE_IBAN || ''
};

export function generateBankQr(orderId, amount) {
  if (!storeConfig.iban) return '';
  const reference = `ORDER-${orderId}`;
  return [
    `Pay: ${storeConfig.name}`,
    `IBAN: ${storeConfig.iban}`,
    `Amount: ${money(amount)}`,
    `Reference: ${reference}`
  ].join('\n');
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export { esc };

export function getImages(p) {
  const list = [];
  if (p.imageUrl) list.push(p.imageUrl);
  if (p.imageUrls) String(p.imageUrls).split(',').forEach((u) => { u = u.trim(); if (u && list.indexOf(u) === -1) list.push(u); });
  return list;
}
export function getTags(p) {
  return String(p.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
}

export function bestSellers(products, n) {
  const all = products || [];
  const ranked = all.filter((p) => getTags(p).indexOf('bestseller') !== -1);
  const rest = all.filter((p) => getTags(p).indexOf('bestseller') === -1);
  return ranked.concat(rest).slice(0, n || 8);
}
export function searchProducts(products, q) {
  q = (q || '').trim().toLowerCase();
  if (!q) return [];
  return (products || []).filter((p) => {
    const hay = (p.name + ' ' + (p.tags || '') + ' ' + (p.description || '')).toLowerCase();
    return hay.indexOf(q) !== -1;
  });
}

/* ---------- sequence counters (numeric ids) ---------- */

async function nextSeq(name) {
  const ref = doc(db, 'counters', 'seq');
  return runTransaction(db, async (t) => {
    const snap = await t.get(ref);
    const cur = snap.exists() ? (snap.data()[name] || 0) : 0;
    const next = cur + 1;
    t.set(ref, { [name]: next }, { merge: true });
    return next;
  });
}

/* ---------- auth ---------- */

export function onUserChange(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function signup({ name, email, dateOfBirth, address, password }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  const isAdmin = ADMIN_EMAILS.indexOf((email || '').trim().toLowerCase()) !== -1;
  const u = { uid, name: name || email, email: email.toLowerCase(), address: address || '', isAdmin };
  await setDoc(doc(db, 'users', uid), {
    uid, name: u.name, email: email.toLowerCase(), dateOfBirth: dateOfBirth || '', address: address || '', role: isAdmin ? 'admin' : 'user', createdAt: serverTimestamp()
  });
  return { ok: true, user: u };
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const u = await ensureUserDoc(cred.user);
  return { ok: true, admin: u.isAdmin, user: u };
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  const u = await ensureUserDoc(cred.user);
  return { ok: true, admin: u.isAdmin, user: u };
}

export async function logout() {
  await signOut(auth);
}

export async function isAdminUser(fbUser) {
  if (!fbUser) return false;
  const snap = await getDoc(doc(db, 'users', fbUser.uid));
  const data = snap.data();
  return !!(data && (data.role === 'admin' || ADMIN_EMAILS.indexOf((data.email || '').toLowerCase()) !== -1));
}

export async function ensureUserDoc(fbUser) {
  if (!fbUser) return null;
  const isAdmin = ADMIN_EMAILS.indexOf((fbUser.email || '').toLowerCase()) !== -1;
  // Fallback user derived purely from the auth token (used if Firestore
  // is unavailable or the users doc can't be read/written). This prevents
  // a Firestore error from ever logging the user out of the app.
  const fallback = { uid: fbUser.uid, name: fbUser.displayName || fbUser.email, email: fbUser.email, address: '', isAdmin };
  try {
    const ref = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { uid: fbUser.uid, name: fbUser.displayName || fbUser.email, email: (fbUser.email || '').toLowerCase(), dateOfBirth: '', address: '', role: isAdmin ? 'admin' : 'user', createdAt: serverTimestamp() });
      return fallback;
    }
    const d = snap.data();
    const role = (d.role === 'admin' || isAdmin) ? 'admin' : 'user';
    if (role === 'admin' && d.role !== 'admin') await updateDoc(ref, { role: 'admin' });
    return { uid: fbUser.uid, name: d.name, email: d.email, address: d.address || '', isAdmin: role === 'admin' };
  } catch (e) {
    return fallback;
  }
}

export async function updateProfile(uid, { name, address, dateOfBirth }) {
  await updateDoc(doc(db, 'users', uid), { name, address: address || '', dateOfBirth: dateOfBirth || '' });
}

/* ---------- products ---------- */

export function subscribeProducts(cb) {
  return onSnapshot(collection(db, 'products'), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
export async function addProduct(data) {
  const id = await nextSeq('productSeq');
  const created = { id, ...data };
  await setDoc(doc(db, 'products', String(id)), created);
  return created;
}
export async function updateProduct(id, data) {
  await updateDoc(doc(db, 'products', String(id)), data);
}
export async function deleteProduct(id) {
  await deleteDoc(doc(db, 'products', String(id)));
}

/* ---------- orders ---------- */

export function subscribeOrders(cb) {
  return onSnapshot(query(collection(db, 'orders'), orderBy('orderDate', 'desc')), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
export async function createOrder(payload) {
  const id = await nextSeq('orderSeq');
  const order = {
    id,
    userEmail: payload.userEmail,
    userId: payload.userId || '',
    address: payload.address,
    country: payload.country,
    city: payload.city,
    phoneNumber: payload.phoneNumber,
    orderDate: serverTimestamp(),
    status: 'Pending',
    deliveryMethod: payload.deliveryMethod,
    paymentMethod: payload.paymentMethod,
    totalAmount: payload.totalAmount,
    items: payload.items
  };
  await setDoc(doc(db, 'orders', String(id)), order);
  return order;
}
export async function updateOrderStatus(id, status) {
  await updateDoc(doc(db, 'orders', String(id)), { status });
}
export async function cancelOrder(recId, orderId) {
  const oRef = doc(db, 'orders', String(orderId));
  const oSnap = await getDoc(oRef);
  if (oSnap.exists()) await updateDoc(oRef, { status: 'Cancelled' });
  if (recId) {
    const rRef = doc(db, 'support', String(recId));
    const rSnap = await getDoc(rRef);
    if (rSnap.exists()) await updateDoc(rRef, { status: 'Resolved', updatedAt: serverTimestamp(), adminResponse: 'Your cancellation request has been accepted and the order has been cancelled.' });
  }
}

/* ---------- support ---------- */

export function subscribeSupport(cb) {
  return onSnapshot(query(collection(db, 'support'), orderBy('createdAt', 'desc')), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
export async function createSupport(req) {
  const id = await nextSeq('supportSeq');
  const rec = {
    id, orderId: req.orderId || null, requestType: req.requestType || 'AdminChat',
    customerName: req.customerName, customerEmail: req.customerEmail, message: req.message,
    reason: req.reason || '', status: 'New', isRead: false, createdAt: serverTimestamp(), updatedAt: null, adminResponse: ''
  };
  await setDoc(doc(db, 'support', String(id)), rec);
  return rec;
}
export async function replySupport(id, response) {
  await updateDoc(doc(db, 'support', String(id)), { adminResponse: response, status: 'Resolved', updatedAt: serverTimestamp() });
}
export async function markRead(id) {
  const ref = doc(db, 'support', String(id));
  const snap = await getDoc(ref);
  if (snap.exists() && !snap.data().isRead) await updateDoc(ref, { isRead: true });
}
export function repliesFor(supportList, email) {
  return (supportList || []).filter((s) => s.customerEmail === email && s.adminResponse && s.status === 'Resolved');
}
export function unreadSupportCount(supportList) {
  return (supportList || []).filter((s) => !s.isRead).length;
}

/* ---------- users ---------- */

export function subscribeUsers(cb) {
  return onSnapshot(collection(db, 'users'), (snap) => {
    cb(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
  });
}

/* ---------- per-user cart / bookmarks / recent ---------- */

function guestId() {
  let id = localStorage.getItem('zamphire_guest');
  if (!id) { id = 'guest_' + Math.random().toString(36).slice(2); localStorage.setItem('zamphire_guest', id); }
  return id;
}

/* cart */
export function subscribeCart(uid, cb) {
  const id = uid || guestId();
  return onSnapshot(doc(db, 'carts', id), (snap) => {
    cb(snap.exists() ? (snap.data().items || []) : []);
  });
}
export async function writeCart(uid, items) {
  const id = uid || guestId();
  await setDoc(doc(db, 'carts', id), { items }, { merge: true });
}
export function cartLineItems(items, allProducts) {
  return (items || []).map((it, index) => {
    const p = (allProducts || []).find((x) => x.id === it.productId) || {};
    return {
      index, productId: it.productId, productName: it.productName, price: it.price,
      quantity: it.quantity, size: it.size, color: it.color, imageUrl: it.imageUrl,
      total: +(it.price * it.quantity).toFixed(2), stock: p.stock
    };
  });
}
export function cartCount(items) {
  return (items || []).reduce((n, it) => n + it.quantity, 0);
}
export function cartSubtotal(items) {
  return (items || []).reduce((s, it) => s + it.price * it.quantity, 0);
}
export function addToCartItems(items, p, size, color, qty) {
  const list = items ? items.slice() : [];
  const found = list.find((it) => it.productId === p.id && it.size === (size || '') && it.color === (color || ''));
  if (found) found.quantity += qty || 1;
  else list.push({ productId: p.id, productName: p.name, price: p.price, imageUrl: p.imageUrl, size: size || '', color: color || '', quantity: qty || 1 });
  return list;
}
export function setCartQtyItems(items, index, qty) {
  const list = items.slice();
  if (qty <= 0) list.splice(index, 1);
  else list[index].quantity = qty;
  return list;
}
export function removeCartItemItems(items, index) {
  const list = items.slice();
  list.splice(index, 1);
  return list;
}

/* bookmarks */
export function subscribeBookmarks(uid, cb) {
  const id = uid || guestId();
  return onSnapshot(doc(db, 'bookmarks', id), (snap) => {
    cb(snap.exists() ? (snap.data().productIds || []) : []);
  });
}
export async function writeBookmarks(uid, ids) {
  const id = uid || guestId();
  await setDoc(doc(db, 'bookmarks', id), { productIds: ids }, { merge: true });
}
export async function toggleBookmark(uid, pid) {
  const id = uid || guestId();
  const ref = doc(db, 'bookmarks', id);
  const snap = await getDoc(ref);
  const cur = snap.exists() ? (snap.data().productIds || []) : [];
  const next = cur.indexOf(Number(pid)) !== -1 ? cur.filter((x) => x !== Number(pid)) : cur.concat([Number(pid)]);
  await setDoc(ref, { productIds: next }, { merge: true });
  return next.indexOf(Number(pid)) !== -1;
}
export function hasBookmark(ids, pid) {
  return (ids || []).indexOf(Number(pid)) !== -1;
}
export function bookmarkProducts(ids, allProducts) {
  return (ids || []).map((id) => (allProducts || []).find((p) => p.id === id)).filter(Boolean);
}

/* recent */
export function subscribeRecent(uid, cb) {
  const id = uid || guestId();
  return onSnapshot(doc(db, 'recent', id), (snap) => {
    cb(snap.exists() ? (snap.data().productIds || []) : []);
  });
}
export async function pushRecent(uid, pid) {
  const id = uid || guestId();
  const ref = doc(db, 'recent', id);
  const snap = await getDoc(ref);
  let cur = snap.exists() ? (snap.data().productIds || []) : [];
  cur = cur.filter((x) => x !== Number(pid));
  cur.unshift(Number(pid));
  await setDoc(ref, { productIds: cur.slice(0, 8) }, { merge: true });
}
