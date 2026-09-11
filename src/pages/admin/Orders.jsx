import { useState } from 'react';
import { Link } from 'react-router-dom';
import { money, formatDate } from '../../store';
import { useData } from '../../context/DataContext';

const STATUSES = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function Orders() {
  const [filter, setFilter] = useState('All');
  const { orders } = useData();
  const list = orders.filter((o) => filter === 'All' || o.status === filter);

  return (
    <div className="admin-orders">
      <h1 className="admin-page-title">Orders</h1>
      <div className="admin-filter-bar mb-3">
        {STATUSES.map((s) => (
          <button key={s} className={'admin-filter' + (filter === s ? ' active' : '')} onClick={() => setFilter(s)}>{s}</button>
        ))}
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{formatDate(o.orderDate)}</td>
                <td>{o.userEmail}</td>
                <td>{o.items.length}</td>
                <td>{money(o.totalAmount)}</td>
                <td><span className="admin-status">{o.status}</span></td>
                <td><Link to={`/admin/orders/${o.id}`} className="admin-action">View</Link></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={7} className="text-caption">No orders.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
