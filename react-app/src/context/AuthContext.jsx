import { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  onUserChange, ensureUserDoc, updateProfile as fbUpdateProfile,
  login as fbLogin, signup as fbSignup, logout as fbLogout, loginWithGoogle as fbGoogle
} from '../store';
import { ADMIN_EMAILS, auth } from '../firebase';

function authError(e) {
  const code = e && e.code;
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled. Enable it in Firebase console → Authentication → Sign-in method.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. If you have not created an account yet, please sign up first.';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid':
      return 'Firebase API key is invalid. Check the values in your .env file.';
    case 'auth/network-request-failed':
      return 'Network error reaching Firebase. Check your connection.';
    default:
      return (e && e.message) || 'Authentication failed.';
  }
}

const AuthContext = createContext(null);
const AUTH_CACHE = 'represent_auth_user_v1';
const AUTH_DEBUG = 'represent_auth_debug_v1';

function debugLog(msg) {
  try {
    const arr = JSON.parse(localStorage.getItem(AUTH_DEBUG) || '[]');
    arr.push(new Date().toISOString().slice(11, 23) + ' ' + msg);
    localStorage.setItem(AUTH_DEBUG, JSON.stringify(arr.slice(-30)));
  } catch { /* ignore */ }
}

function loadCachedUser() {
  try { const raw = localStorage.getItem(AUTH_CACHE); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
function cacheUser(u) {
  try { if (u) localStorage.setItem(AUTH_CACHE, JSON.stringify(u)); else localStorage.removeItem(AUTH_CACHE); }
  catch { /* ignore */ }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadCachedUser());
  const [ready, setReady] = useState(false);

  const initializedRef = useRef(false);

  useEffect(() => {
    debugLog('AuthProvider mounted; cached=' + (loadCachedUser() ? loadCachedUser().email : 'none'));
    const onUnmountHook = () => debugLog('AuthProvider unmounted');
    const onPageHide = () => { try { debugLog('PAGEHIDE (navigation/reload/tab switch) currentUser=' + (auth.currentUser ? auth.currentUser.uid : 'null')); } catch {} };
    window.addEventListener('pagehide', onPageHide);
    const t = setTimeout(() => debugLog('ready after mount = ' + ready), 1500);
    const unsub = onUserChange(async (fbUser) => {
      // Firebase can emit a transient `null` while restoring or refreshing the
      // ID token (and during React 18 StrictMode remounts), even though the
      // user is still signed in. This causes spurious logouts on navigation /
      // page reload. To prevent that, we never clear an established session
      // purely from a listener `null`; a real sign-out only happens through the
      // explicit logout() above (which calls signOut(auth) and clears state).
      if (!fbUser) {
        const current = auth.currentUser;
        if (current) {
          debugLog('null event but auth.currentUser present -> ignore (' + current.uid + ')');
          fbUser = current;
        } else {
          // A bare `null` from Firebase (token restore / refresh / StrictMode
          // remount) must NEVER clear the session on its own. The only way to
          // sign out is the explicit logout() below, which calls signOut(auth)
          // and clears state. This prevents spurious logouts on navigation.
          debugLog('transient null -> keep current user; ready=true');
          setReady(true);
          return;
        }
      } else {
        initializedRef.current = true;
      }
      debugLog('signed-in event; uid = ' + fbUser.uid);
      let resolved;
      try {
        resolved = await ensureUserDoc(fbUser);
      } catch (e) {
        resolved = {
          uid: fbUser.uid, email: fbUser.email, name: fbUser.displayName || fbUser.email,
          address: '', isAdmin: ADMIN_EMAILS.indexOf((fbUser.email || '').toLowerCase()) !== -1
        };
      }
      initializedRef.current = true;
      setUser(resolved);
      cacheUser(resolved);
      setReady(true);
    });
    return () => {
      onUnmountHook();
      clearTimeout(t);
      window.removeEventListener('pagehide', onPageHide);
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug: log every user/ready transition
  useEffect(() => {
    debugLog(`state -> user=${user ? (user.email + (user.isAdmin ? ' (admin)' : '')) : 'null'} ready=${ready} currentUser=${auth.currentUser ? auth.currentUser.uid : 'null'}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, ready]);

  const login = async (email, password) => {
    try {
      const r = await fbLogin(email, password);
      if (r.ok && r.user) { setUser(r.user); cacheUser(r.user); }
      return r;
    } catch (e) { return { ok: false, error: authError(e) }; }
  };
  const signup = async (data) => {
    try {
      const r = await fbSignup(data);
      if (r.ok && r.user) { setUser(r.user); cacheUser(r.user); }
      return r;
    } catch (e) { return { ok: false, error: authError(e) }; }
  };
  const loginWithGoogle = async () => {
    try {
      const r = await fbGoogle();
      if (r.ok && r.user) { setUser(r.user); cacheUser(r.user); }
      return r;
    } catch (e) { return { ok: false, error: authError(e) }; }
  };
  const logout = async () => { await fbLogout(); setUser(null); cacheUser(null); };

  const updateProfile = async ({ name, address, dateOfBirth }) => {
    if (!user) return;
    await fbUpdateProfile(user.uid, { name, address, dateOfBirth });
    const updated = { ...user, name, address };
    setUser(updated);
    cacheUser(updated);
  };

  const value = {
    user, ready,
    isLoggedIn: !!user,
    isAdmin: !!(user && user.isAdmin),
    login, signup, logout, loginWithGoogle, updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
