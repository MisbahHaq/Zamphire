import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignUp() {
  const [form, setForm] = useState({ name: '', email: '', dateOfBirth: '', address: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signup, user, ready } = useAuth();

  if (ready && user) return <Navigate to="/profile" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('The password and confirmation password do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    const res = await signup({ name: form.name, email: form.email, dateOfBirth: form.dateOfBirth, address: form.address, password: form.password });
    if (!res.ok) { setError(res.error); return; }
    navigate('/profile');
  };

  return (
    <div className="auth-page">
      <div className="auth-left d-none d-lg-flex flex-column justify-content-center align-items-start p-5" style={{ flex: '1 1 50%' }}>
        <h1 style={{ fontSize: 'clamp(2.5rem,5vw,4.5rem)', fontWeight: 200, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Join</h1>
        <p style={{ color: '#888', maxWidth: 360, lineHeight: 1.8 }}>Create an account to track orders, save items and unlock the vault.</p>
      </div>
      <div className="auth-form-side d-flex flex-column justify-content-center p-4 p-lg-5" style={{ flex: '1 1 50%', maxWidth: 620 }}>
        <h2 className="text-uppercase mb-4" style={{ letterSpacing: '0.1em', fontWeight: 300 }}>Create Account</h2>
        {error && <p className="auth-error mb-3">{error}</p>}
        <form onSubmit={submit}>
          <div className="auth-field mb-3"><label>Name</label><input value={form.name} onChange={set('name')} required /></div>
          <div className="auth-field mb-3"><label>Email</label><input type="email" value={form.email} onChange={set('email')} required /></div>
          <div className="auth-field mb-3"><label>Date of Birth</label><input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} required /></div>
          <div className="auth-field mb-3"><label>Address</label><input value={form.address} onChange={set('address')} required /></div>
          <div className="auth-field mb-3"><label>Password</label><input type="password" value={form.password} onChange={set('password')} required /></div>
          <div className="auth-field mb-4"><label>Confirm Password</label><input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required /></div>
          <div className="d-flex align-items-center gap-3 mt-2">
            <button type="submit" className="auth-submit" aria-label="Create account"><i className="bi bi-arrow-right"></i></button>
            <Link to="/login" className="auth-link">Already have an account?</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
