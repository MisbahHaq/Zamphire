// ═══════════════════════════════════════════════
//  REPRESENT — Firebase backend (Firestore + Auth)
//  Async data layer. Live collections are surfaced
//  to React via the DataProvider (onSnapshot) and
//  mutations are awaited writes to Firestore.
// ═══════════════════════════════════════════════

import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc,
  deleteDoc, onSnapshot, query, where, orderBy, runTransaction, serverTimestamp
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, signOut, onAuthStateChanged
} from 'firebase/auth';
import { auth, db, googleProvider, ADMIN_EMAILS } from './firebase';

/* ---------- helpers ---------- */

export function money(n) {
  return '$' + Number(n || 0).toFixed(2);
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = (iso && iso.toDate) ? iso.toDate() : new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export const storeConfig = {
  name: import.meta.env.VITE_STORE_NAME || 'Represent B',
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
export function getColors(p) {
  return String(p.colors || '').split(',').map((c) => c.trim()).filter(Boolean);
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
  let id = localStorage.getItem('represent_guest');
  if (!id) { id = 'guest_' + Math.random().toString(36).slice(2); localStorage.setItem('represent_guest', id); }
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

/* ---------- seed (dev/demo data) ---------- */

const SEED_PRODUCTS = [
  { id: 1, name: 'Signature Crew T-Shirt', price: 49, stock: 120, gender: 'Men', description: 'An essential heavyweight cotton tee with a boxy, structured fit and tonal embroidered logo.', imageUrl: '/assets/acc.webp', imageUrls: '/assets/acc.webp, /assets/man.png, /assets/first-pic.png', tags: 'bestseller,essentials', colors: 'Black, White, Grey', rating: 4.5, reviews: 12, dateAdded: new Date().toISOString(), category: 'Tees', sizes: ['S', 'M', 'L', 'XL'] },
  { id: 2, name: 'Oversized Box Logo Hoodie', price: 129, stock: 80, gender: 'Men', description: 'Heavyweight brushed-back fleece hoodie with dropped shoulders and a clean box logo chest print.', imageUrl: '/assets/man.png', imageUrls: '/assets/man.png, /assets/second-pic-main.png, /assets/acc.webp', tags: 'new,bestseller', colors: 'Black, Navy', rating: 4.7, reviews: 9, dateAdded: new Date().toISOString(), category: 'Hoodies', sizes: ['S', 'M', 'L', 'XL'] },
  { id: 3, name: 'Tailored Track Jacket', price: 189, stock: 45, gender: 'Men', description: 'A sharp everyday jacket cut from a structured cotton blend, finished with concealed zip pockets.', imageUrl: '/assets/first-pic.png', imageUrls: '/assets/first-pic.png, /assets/woman.png, /assets/acc.webp', tags: 'new,outerwear', colors: 'Black, Olive', rating: 4.6, reviews: 5, dateAdded: new Date().toISOString(), category: 'Jackets', sizes: ['S', 'M', 'L', 'XL'] },
  { id: 4, name: 'Straight Leg Denim Jean', price: 149, stock: 60, gender: 'Men', description: 'Classic straight leg silhouette in a rigid 12oz Japanese selvedge denim with contrast stitching.', imageUrl: '/assets/second-pic-main.png', imageUrls: '/assets/second-pic-main.png, /assets/man.png', tags: 'bestseller,denim', colors: 'Indigo, Black', rating: 4.4, reviews: 7, dateAdded: new Date().toISOString(), category: 'Denim', sizes: ['S', 'M', 'L', 'XL'] },
  { id: 5, name: 'Minimal Structured Cap', price: 39, stock: 200, gender: 'Men', description: 'Six-panel cap with a curved brim, embroidered eyelets and an adjustable leather strap.', imageUrl: '/assets/vault.png', imageUrls: '/assets/vault.png, /assets/acc.webp', tags: 'accessories', colors: 'Black, White', rating: 4.8, reviews: 20, dateAdded: new Date().toISOString(), category: 'Accessories', sizes: ['One Size'] },
  { id: 6, name: 'Ribbed Knit Fitted Top', price: 79, stock: 90, gender: 'Women', description: 'Body-hugging ribbed knit top with a square neckline and subtle tonal stitch detailing.', imageUrl: '/assets/woman.png', imageUrls: '/assets/woman.png, /assets/acc.webp, /assets/vault.png', tags: 'new', colors: 'Beige, Black', rating: 4.5, reviews: 6, dateAdded: new Date().toISOString(), category: 'Tops', sizes: ['XS', 'S', 'M', 'L'] },
  { id: 7, name: 'Fluid Wide-Leg Trouser', price: 139, stock: 55, gender: 'Women', description: 'High-rise trousers in a fluid drape fabric with a wide leg and concealed side zip.', imageUrl: '/assets/woman.jpg', imageUrls: '/assets/woman.jpg, /assets/woman_main.webp, /assets/acc.webp', tags: 'bestseller', colors: 'Black, Sand', rating: 4.6, reviews: 8, dateAdded: new Date().toISOString(), category: 'Trousers', sizes: ['XS', 'S', 'M', 'L'] },
  { id: 8, name: 'Tailored Single-Breasted Blazer', price: 219, stock: 40, gender: 'Women', description: 'A sharp single-breasted blazer with structured shoulders, notch lapels and a soft-wool hand feel.', imageUrl: '/assets/woman_main.webp', imageUrls: '/assets/woman_main.webp, /assets/woman.png', tags: 'new,outerwear', colors: 'Black, Camel', rating: 4.7, reviews: 4, dateAdded: new Date().toISOString(), category: 'Blazers', sizes: ['XS', 'S', 'M', 'L'] },
  { id: 9, name: 'Bias-Cut Slip Dress', price: 119, stock: 70, gender: 'Women', description: 'Elegant bias-cut slip dress with adjustable straps and a fluid, column-like drape.', imageUrl: '/assets/acc.webp', imageUrls: '/assets/acc.webp, /assets/woman_main.webp, /assets/man.png', tags: 'bestseller', colors: 'Black, Ivory', rating: 4.5, reviews: 10, dateAdded: new Date().toISOString(), category: 'Dresses', sizes: ['XS', 'S', 'M', 'L'] },
  { id: 10, name: 'Structured Shoulder Bag', price: 189, stock: 30, gender: 'Women', description: 'Sculpted leather shoulder bag with a rigid base, magnetic flap and gold-tone hardware.', imageUrl: '/assets/vault.png', imageUrls: '/assets/vault.png, /assets/acc.webp, /assets/woman.png', tags: 'accessories', colors: 'Black, Tan', rating: 4.9, reviews: 15, dateAdded: new Date().toISOString(), category: 'Bags', sizes: ['One Size'] },
  { id: 11, name: 'Vault Archive Logo Tee', price: 95, stock: 15, gender: 'Men', description: 'A vault-exclusive reissue of the first logo tee from the archive collection. Limited run.', imageUrl: '/assets/vault.png', imageUrls: '/assets/vault.png, /assets/first-pic.png', tags: 'vault,limited', colors: 'Black', rating: 5.0, reviews: 3, dateAdded: new Date().toISOString(), category: 'Tees', sizes: ['S', 'M', 'L', 'XL'] },
  { id: 12, name: 'Limited Coach Jacket', price: 249, stock: 12, gender: 'Men', description: 'A numbered-release coach jacket in a waxed cotton shell with hidden snap closure.', imageUrl: '/assets/first-pic.png', imageUrls: '/assets/first-pic.png, /assets/man.png, /assets/vault.png', tags: 'vault,new,limited', colors: 'Black', rating: 4.8, reviews: 2, dateAdded: new Date().toISOString(), category: 'Jackets', sizes: ['S', 'M', 'L', 'XL'] }
];

const SEED_ORDERS = [
  { id: 1, userEmail: 'customer@demo.com', userId: '', address: '14 Baker Street, London, UK', country: 'United Kingdom', city: 'London', phoneNumber: '+44 7700 900123', orderDate: '2026-06-02T10:30:00.000Z', status: 'Delivered', deliveryMethod: 'standard', paymentMethod: 'card', totalAmount: 98, items: [{ productId: 1, productName: 'Signature Crew T-Shirt', quantity: 2, price: 49, imageUrl: '/assets/acc.webp', size: 'M', color: 'Black' }, { productId: 5, productName: 'Minimal Structured Cap', quantity: 1, price: 39, imageUrl: '/assets/vault.png', size: 'One Size', color: 'Black' }] },
  { id: 2, userEmail: 'customer@demo.com', userId: '', address: '14 Baker Street, London, UK', country: 'United Kingdom', city: 'London', phoneNumber: '+44 7700 900123', orderDate: '2026-07-12T15:45:00.000Z', status: 'Out for Delivery', deliveryMethod: 'express', paymentMethod: 'card', totalAmount: 189, items: [{ productId: 3, productName: 'Tailored Track Jacket', quantity: 1, price: 189, imageUrl: '/assets/first-pic.png', size: 'L', color: 'Black' }] },
  { id: 3, userEmail: 'customer@demo.com', userId: '', address: '14 Baker Street, London, UK', country: 'United Kingdom', city: 'London', phoneNumber: '+44 7700 900123', orderDate: '2026-08-04T09:20:00.000Z', status: 'Pending', deliveryMethod: 'standard', paymentMethod: 'cod', totalAmount: 198, items: [{ productId: 9, productName: 'Bias-Cut Slip Dress', quantity: 1, price: 119, imageUrl: '/assets/acc.webp', size: 'S', color: 'Ivory' }, { productId: 6, productName: 'Ribbed Knit Fitted Top', quantity: 1, price: 79, imageUrl: '/assets/woman.png', size: 'M', color: 'Beige' }] },
  { id: 4, userEmail: 'customer@demo.com', userId: '', address: '14 Baker Street, London, UK', country: 'United Kingdom', city: 'London', phoneNumber: '+44 7700 900123', orderDate: '2026-05-18T11:05:00.000Z', status: 'Cancelled', deliveryMethod: 'standard', paymentMethod: 'card', totalAmount: 95, items: [{ productId: 11, productName: 'Vault Archive Logo Tee', quantity: 1, price: 95, imageUrl: '/assets/vault.png', size: 'M', color: 'Black' }] },
  { id: 5, userEmail: 'sara@demo.com', userId: '', address: '221 Rue de Rivoli, Paris, France', country: 'France', city: 'Paris', phoneNumber: '+33 6 12 34 56 78', orderDate: '2026-07-28T13:10:00.000Z', status: 'Order Received', deliveryMethod: 'standard', paymentMethod: 'card', totalAmount: 408, items: [{ productId: 8, productName: 'Tailored Single-Breasted Blazer', quantity: 1, price: 219, imageUrl: '/assets/woman_main.webp', size: 'M', color: 'Black' }, { productId: 10, productName: 'Structured Shoulder Bag', quantity: 1, price: 189, imageUrl: '/assets/vault.png', size: 'One Size', color: 'Tan' }] }
];

const SEED_SUPPORT = [
  { id: 1, orderId: 2, requestType: 'AdminChat', customerName: 'Mark Johnson', customerEmail: 'customer@demo.com', message: 'Can I change my delivery address for order #2?', reason: '', status: 'Resolved', isRead: true, createdAt: '2026-07-13T09:00:00.000Z', updatedAt: '2026-07-13T12:15:00.000Z', adminResponse: 'Hi Mark — we have updated the address to your office. Delivery will be slightly delayed.' },
  { id: 2, orderId: 4, requestType: 'Cancellation', customerName: 'Mark Johnson', customerEmail: 'customer@demo.com', message: 'Cancellation requested for order #4. Reason: Changed my mind about the colour.', reason: 'Changed my mind about the colour.', status: 'Resolved', isRead: true, createdAt: '2026-05-19T10:00:00.000Z', updatedAt: '2026-05-19T16:40:00.000Z', adminResponse: 'Your order has been cancelled and the refund has been initiated.' },
  { id: 3, orderId: null, requestType: 'AdminChat', customerName: 'Sara Malik', customerEmail: 'sara@demo.com', message: 'Do you have the Tailored Single-Breasted Blazer in a size M?', reason: '', status: 'New', isRead: false, createdAt: '2026-08-08T18:25:00.000Z', updatedAt: null, adminResponse: '' }
];

export async function seedFirestore() {
  const snap = await getDocs(collection(db, 'products'));
  if (!snap.empty) return { seeded: false, reason: 'products already exist' };
  for (const p of SEED_PRODUCTS) await setDoc(doc(db, 'products', String(p.id)), p);
  for (const o of SEED_ORDERS) await setDoc(doc(db, 'orders', String(o.id)), o);
  for (const s of SEED_SUPPORT) await setDoc(doc(db, 'support', String(s.id)), s);
  await setDoc(doc(db, 'counters', 'seq'), { productSeq: 12, orderSeq: 5, supportSeq: 3 }, { merge: true });
  return { seeded: true };
}
