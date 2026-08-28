import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEBUG_KEY = 'represent_route_debug_v1';
function debugLog(msg) {
  try {
    const arr = JSON.parse(localStorage.getItem(DEBUG_KEY) || '[]');
    arr.push(new Date().toISOString().slice(11, 23) + ' ' + msg);
    localStorage.setItem(DEBUG_KEY, JSON.stringify(arr.slice(-30)));
  } catch { /* ignore */ }
}

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isLoggedIn, isAdmin, ready } = useAuth();
  const location = useLocation();

  debugLog(`ProtectedRoute path=${location.pathname} ready=${ready} isLoggedIn=${isLoggedIn}`);

  if (!ready) return null;

  if (!isLoggedIn) {
    debugLog(`REDIRECT to /login from ${location.pathname} (not logged in)`);
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (adminOnly && !isAdmin) {
    debugLog(`REDIRECT to / from ${location.pathname} (not admin)`);
    return <Navigate to="/" replace />;
  }
  return children;
}
