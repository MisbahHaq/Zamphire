import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { unreadSupportCount } from '../../store';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { support } = useData();
  const navigate = useNavigate();
  const unread = unreadSupportCount(support);

  const links = [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/products', label: 'Products' },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/support', label: 'Support', badge: unread }
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">REPRESENT<span style={{ color: '#666' }}> / ADMIN</span></div>
        <nav className="admin-nav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}>
              {l.label}{l.badge ? <span className="admin-badge">{l.badge}</span> : null}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto">
          <Link to="/" className="admin-nav-link">View Store</Link>
          <button className="admin-nav-link" style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%' }} onClick={async () => { await logout(); navigate('/login'); }}>Logout</button>
        </div>
      </aside>
      <main className="admin-content">
        <div className="admin-topbar">
          <span>Welcome, {user?.name || 'Admin'}</span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
