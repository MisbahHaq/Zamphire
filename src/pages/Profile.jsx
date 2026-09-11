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
        <div className="profile-header-bar mb-4">
          <div className="d-flex align-items-center gap-3">
            <div className="profile-avatar-circle">{user.name?.[0]?.toUpperCase() || 'U'}</div>
            <div>
              <h1 className="cart-main-title mb-1" style={{ fontSize: '1.5rem' }}>{user.name}</h1>
              <p className="text-caption mb-0">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-4">
            <div className="profile-sidebar">
              <h5 className="checkout-section-title mb-3">Account Settings</h5>
              <form onSubmit={saveName} className="mb-3">
                <label className="checkout-field-label">Update Username</label>
                <input className="checkout-input" value={name} onChange={(e) => setName(e.target.value)} />
                <button className="btn-minimal mt-2" type="submit">Save</button>
              </form>
              <form onSubmit={saveAddress} className="mb-3">
                <label className="checkout-field-label">Update Address</label>
                <input className="checkout-input" value={address} onChange={(e) => setAddress(e.target.value)} />
                <button className="btn-minimal mt-2" type="submit">Save</button>
              </form>
              {msg && <p className="text-caption mt-2" style={{ color: '#9f9' }}>{msg}</p>}
              <hr style={{ borderColor: '#222' }} />
              <button className="btn-minimal mt-2" onClick={handleLogout}>Logout</button>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="profile-content">
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
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {o.items.map((it, i) => (
                              <img key={i} src={it.imageUrl} alt={it.productName} style={{ width: 48, height: 48, objectFit: 'cover', border: '1px solid #222' }} />
                            ))}
                          </div>
                          <div className="text-caption mt-2">{o.items.length} item(s) • {o.status} • {money(o.totalAmount)}</div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
