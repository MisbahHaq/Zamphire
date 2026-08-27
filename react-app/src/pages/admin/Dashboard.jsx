import { useState } from 'react';
import { Link } from 'react-router-dom';
import { money, formatDate, seedFirestore } from '../../store';
import { useData } from '../../context/DataContext';

export default function Dashboard() {
  const { orders, products } = useData();
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  const revenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const pending = orders.filter((o) => o.status === 'Pending' || o.status === 'Processing').length;

  const stats = [
    { label: 'Total Products', value: products.length, to: '/admin/products' },
    { label: 'Total Orders', value: orders.length, to: '/admin/orders' },
    { label: 'Revenue', value: money(revenue), to: '/admin/orders' },
    { label: 'Pending Orders', value: pending, to: '/admin/orders' }
  ];

  const recent = [...orders].reverse().slice(0, 6);

  const onSeed = async () => {
    setSeeding(true);
    setSeedMsg('');
    const res = await seedFirestore();
    setSeeding(false);
    setSeedMsg(res.seeded ? 'Sample data seeded.' : ('Not seeded: ' + (res.reason || 'unknown')));
  };

  return (
    <div className="admin-dashboard">
      <h1 className="admin-page-title">Dashboard</h1>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="text-caption">Manage your store from here.</span>
        <button className="btn-minimal" disabled={seeding} onClick={onSeed}>{seeding ? 'Seeding…' : 'Seed sample data'}</button>
      </div>
      {seedMsg && <p className="text-caption mb-3" style={{ color: '#9f9' }}>{seedMsg}</p>}
      <div className="admin-stat-grid">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="admin-stat-card">
            <div className="admin-stat-value">{s.value}</div>
            <div className="admin-stat-label">{s.label}</div>
          </Link>
        ))}
      </div>

      <h3 className="admin-section-title mt-4">Recent Orders</h3>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>Date</th><th>Customer</th><th>Total</th><th>Status</th></tr>
          </thead>
          <tbody>
            {recent.map((o) => (
              <tr key={o.id}>
                <td><Link to={`/admin/orders/${o.id}`}>#{o.id}</Link></td>
                <td>{formatDate(o.orderDate)}</td>
                <td>{o.userEmail}</td>
                <td>{money(o.totalAmount)}</td>
                <td><span className="admin-status">{o.status}</span></td>
              </tr>
            ))}
            {recent.length === 0 && <tr><td colSpan={5} className="text-caption">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
