import { useParams, Link } from 'react-router-dom';
import { updateOrderStatus, money, formatDate } from '../../store';
import { useData } from '../../context/DataContext';

const STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

export default function OrderDetail() {
  const { id } = useParams();
  const { orders } = useData();
  const order = orders.find((o) => String(o.id) === String(id));

  if (!order) return <p className="text-caption">Order not found.</p>;

  return (
    <div className="admin-order-detail" style={{ maxWidth: 820 }}>
      <Link to="/admin/orders" className="admin-action mb-3 d-inline-block">← Back to orders</Link>
      <h1 className="admin-page-title">Order #{order.id}</h1>
      <div className="admin-detail-grid">
        <div>
          <h3 className="admin-section-title">Customer</h3>
          <p className="text-caption">{order.userEmail}</p>
          <p className="text-caption">{order.address}, {order.city}, {order.country}</p>
          <p className="text-caption">{order.phoneNumber}</p>
        </div>
        <div>
          <h3 className="admin-section-title">Details</h3>
          <p className="text-caption">Date: {formatDate(order.orderDate)}</p>
          <p className="text-caption">Delivery: {order.deliveryMethod}</p>
          <p className="text-caption">Payment: {order.paymentMethod}</p>
          <p><strong>Total: {money(order.totalAmount)}</strong></p>
        </div>
        <div>
          <h3 className="admin-section-title">Status</h3>
          <select className="checkout-input" value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <h3 className="admin-section-title mt-4">Items</h3>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Product</th><th>Size</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
          <tbody>
            {order.items.map((it, i) => (
              <tr key={i}>
                <td>{it.productName}</td>
                <td>{it.size || '—'}</td>
                <td>{it.quantity}</td>
                <td>{money(it.price)}</td>
                <td>{money(it.price * it.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
