import { useParams, Link } from 'react-router-dom';
import { money, formatDate } from '../store';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function OrderConfirmation() {
  const { id } = useParams();
  const { user } = useAuth();
  const { orders } = useData();
  const order = orders.find((o) => String(o.id) === String(id));

  if (!order || order.userEmail !== user?.email) {
    return (
      <div className="confirm-page" style={{ marginTop: '4rem' }}>
        <p className="text-caption">Order not found.</p>
        <Link className="btn-minimal" to="/">Back to store</Link>
      </div>
    );
  }

  return (
    <div className="confirm-page" style={{ marginTop: '4rem' }}>
      <i className="bi bi-check2-circle" style={{ fontSize: '3rem' }}></i>
      <h1 className="home-hero-title" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', margin: '1rem 0' }}>Thank You</h1>
      <p className="text-caption">Order #{order.id} placed on {formatDate(order.orderDate)}</p>
      <div className="profile-sidebar mt-4 text-start" style={{ background: '#111', margin: '2rem auto', maxWidth: 520, color: '#fff' }}>
        <div className="d-flex justify-content-between"><span className="text-caption">Status</span><span>{order.status}</span></div>
        <div className="d-flex justify-content-between"><span className="text-caption">Total</span><span>{money(order.totalAmount)}</span></div>
        <div className="d-flex justify-content-between"><span className="text-caption">Delivery</span><span>{order.deliveryMethod}</span></div>
        <div className="d-flex justify-content-between"><span className="text-caption">Payment</span><span>{order.paymentMethod}</span></div>
        <hr style={{ borderColor: '#222' }} />
        {order.items.map((it, i) => (
          <div key={i} className="d-flex justify-content-between" style={{ fontSize: '0.8rem' }}>
            <span>{it.productName} × {it.quantity}</span>
            <span>{money(it.price * it.quantity)}</span>
          </div>
        ))}
      </div>
      <div className="d-flex justify-content-center gap-3">
        <Link className="btn-minimal" to="/profile">View Orders</Link>
        <Link className="btn-minimal btn-filled" to="/">Continue Shopping</Link>
      </div>
    </div>
  );
}
