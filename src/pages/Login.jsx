import { useState } from 'react';
import { useNavigate, useSearchParams, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next');
  const { login, loginWithGoogle, user, ready, isAdmin } = useAuth();

  if (ready && user) {
    let dest = next ? decodeURIComponent(next) : '';
    if (!dest.startsWith('/')) dest = isAdmin ? '/admin' : '/profile';
    return <Navigate to={dest || (isAdmin ? '/admin' : '/profile')} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    const res = await login(email, password);
    if (!res.ok) { setError(res.error); return; }
    if (res.admin) navigate('/admin');
    else navigate((next && next.startsWith('/')) ? next : '/profile');
  };

  return (
    <div className="auth-page">
      <div className="auth-left d-none d-lg-flex flex-column justify-content-center align-items-start p-5" style={{ flex: '1 1 50%' }}>
         <h1 style={{ fontSize: 'clamp(2.5rem,5vw,4.5rem)', fontWeight: 200, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Zamphire</h1>
        <p style={{ color: '#888', maxWidth: 360, lineHeight: 1.8 }}>Sign in to access your bag, order history and member-only drops.</p>
      </div>
      <div className="auth-form-side d-flex flex-column justify-content-center p-4 p-lg-5" style={{ flex: '1 1 50%', maxWidth: 620 }}>
        <h2 className="text-uppercase mb-4" style={{ letterSpacing: '0.1em', fontWeight: 300 }}>Sign In</h2>
        {error && <p className="auth-error mb-3">{error}</p>}
        <form onSubmit={submit}>
          <div className="auth-field mb-4">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="auth-field mb-4">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="d-flex align-items-center gap-3 mt-4">
            <button type="submit" className="auth-submit" aria-label="Sign in"><i className="bi bi-arrow-right"></i></button>
            <Link to="/signup" className="auth-link">Create account</Link>
            <button type="button" className="auth-link btn btn-link p-0" onClick={async () => { const r = await loginWithGoogle(); if (r.ok) navigate(r.admin ? '/admin' : (next || '/profile')); else setError(r.error); }}>Sign in with Google</button>
          </div>
        </form>
        <div className="auth-demo-hint mt-5">
          <strong>Demo accounts</strong><br />
          Admin: <code>admin@represent.com</code> / <code>Qwerty123</code><br />
          Customer: <code>customer@demo.com</code> / <code>demo123</code>
        </div>
      </div>
    </div>
  );
}
