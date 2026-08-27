import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBookmarks } from '../context/BookmarkContext';
import { useData } from '../context/DataContext';
import { money, formatDate } from '../store';
import ProductCard from '../components/ProductCard';

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { ids } = useBookmarks();
  const { orders, products, recentIds } = useData();
  const [tab, setTab] = useState('orders');
  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState(user?.address || '');
  const [msg, setMsg] = useState('');

  if (!user) return null;

  const userOrders = orders.filter((o) => o.userEmail === user.email);
  const recent = recentIds.map((id) => products.find((p) => p.id === id)).filter(Boolean);

  const saveName = async (e) => {
    e.preventDefault();
    await updateProfile({ name });
    setMsg('Username updated.');
  };
  const saveAddress = async (e) => {
    e.preventDefault();
    await updateProfile({ address });
    setMsg('Address updated.');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="profile-page">
      <div className="container-fluid px-4 px-lg-5" style={{ maxWidth: 1200 }}>
        <h1 className="cart-main-title mb-4">Profile</h1>
        <div className="profile-main-grid">
          <aside className="profile-sidebar">
            <div className="profile-avatar-circle mb-2">{user.name?.[0]?.toUpperCase() || 'U'}</div>
            <h3 className="profile-name">{user.name}</h3>
            <p className="text-caption">{user.email}</p>
            <hr style={{ borderColor: '#222' }} />
            <form onSubmit={saveName} className="mb-3">
              <label className="checkout-field-label">Update Username</label>
              <input className="checkout-input" value={name} onChange={(e) => setName(e.target.value)} />
              <button className="btn-minimal mt-2" type="submit">Save</button>
            </form>
            <form onSubmit={saveAddress}>
              <label className="checkout-field-label">Update Address</label>
              <input className="checkout-input" value={address} onChange={(e) => setAddress(e.target.value)} />
              <button className="btn-minimal mt-2" type="submit">Save</button>
            </form>
            {msg && <p className="text-caption mt-2" style={{ color: '#9f9' }}>{msg}</p>}
            <hr style={{ borderColor: '#222' }} />
            <button className="btn-minimal mt-2" onClick={handleLogout}>Logout</button>
          </aside>

          <section className="profile-content">
            <div className="profile-tab-bar mb-4">
              <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>Past Orders</button>
              <button className={tab === 'recent' ? 'active' : ''} onClick={() => setTab('recent')}>Recently Viewed</button>
              <button className={tab === 'bookmarks' ? 'active' : ''} onClick={() => setTab('bookmarks')}>Bookmarks</button>
            </div>

            {tab === 'orders' && (
              <div>
                {orders.length === 0 ? <p className="text-caption">No orders yet.</p> : (
                  <div className="d-flex flex-column gap-3">
                    {orders.map((o) => (
                      <div key={o.id} className="profile-order-card">
                        <div className="d-flex justify-content-between">
                          <strong>#{o.id}</strong><span className="text-caption">{formatDate(o.orderDate)}</span>
                        </div>
                        <div className="text-caption">{o.items.length} item(s) • {o.status} • {money(o.totalAmount)}</div>
                        <div className="text-caption">Ship to: {o.address}, {o.city}, {o.country}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'recent' && (
              <div className="row g-3">
                {recent.length === 0 ? <p className="text-caption">Nothing viewed yet.</p> : recent.map((p) => <div className="col-6 col-md-3" key={p.id}><ProductCard product={p} /></div>)}
              </div>
            )}

            {tab === 'bookmarks' && (
              <div className="row g-3">
                {ids.length === 0 ? <p className="text-caption">No bookmarks yet.</p> : ids.map((id) => {
                  const prod = products.find((p) => p.id === id);
                  return prod ? <div className="col-6 col-md-3" key={id}><ProductCard product={prod} /></div> : null;
                })}
              </div>
            )}
            {tab === 'bookmarks' && ids.length > 0 && <Link className="btn-minimal mt-3" to="/bookmarks">View all bookmarks</Link>}
          </section>
        </div>
      </div>
    </div>
  );
}
