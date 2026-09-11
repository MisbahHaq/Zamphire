import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { money, formatDate } from '../store';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function OrderConfirmation() {
  const { id } = useParams();
  const { user } = useAuth();
  const { orders } = useData();
  const order = orders.find((o) => String(o.id) === String(id));
  const [dismissed, setDismissed] = useState(false);

  if (!order || order.userEmail !== user?.email) {
    return (
      <div className="confirm-page" style={{ marginTop: '4rem' }}>
        <p className="text-caption">Order not found.</p>
        <Link className="btn-minimal" to="/">Back to store</Link>
      </div>
    );
  }

  const paymentLabel = order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment';
  const whatsappUrl =
    `https://wa.me/?text=${encodeURIComponent(
      `Hi! I just placed order #${order.id} (${paymentLabel}, ${money(order.totalAmount)}). ` +
      (order.paymentMethod === 'cod'
        ? 'I would like to confirm this order.'
        : 'I have completed the payment. Please confirm my order.')
    )}`;

  return (
    <div className="confirm-page" style={{ marginTop: '4rem' }}>
      <i className="bi bi-check2-circle" style={{ fontSize: '3rem' }}></i>
      <h1 className="home-hero-title" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', margin: '1rem 0' }}>Thank You</h1>
      <p className="text-caption">Order #{order.id} placed on {formatDate(order.orderDate)}</p>

      {!dismissed && (
        <div className="whatsapp-confirm-popup mt-4">
          <div className="whatsapp-confirm-icon">
            <i className="bi bi-whatsapp" style={{ fontSize: '2rem', color: '#25D366' }}></i>
          </div>
          <h4 className="whatsapp-confirm-title">Confirm Your Order on WhatsApp</h4>
          <p className="whatsapp-confirm-text">
            Please send us a message on WhatsApp to confirm your order and avoid any delays.
            {order.paymentMethod === 'online' && (
              <> If you have completed the payment, mention your payment confirmation in the message.</>
            )}
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-minimal btn-filled whatsapp-btn"
          >
            <i className="bi bi-whatsapp me-2"></i>
            Open WhatsApp
          </a>
          <button
            className="whatsapp-confirm-dismiss"
            onClick={() => setDismissed(true)}
          >
            I'll do it later
          </button>
        </div>
      )}

      <div className="profile-sidebar profile-sidebar-light mt-4 text-start" style={{ background: '#fff', margin: '2rem auto', maxWidth: 520, color: '#000', border: '1px solid #ddd' }}>
        <div className="d-flex justify-content-between"><span className="text-caption">Status</span><span>{order.status}</span></div>
        <div className="d-flex justify-content-between"><span className="text-caption">Total</span><span>{money(order.totalAmount)}</span></div>
        <div className="d-flex justify-content-between"><span className="text-caption">Delivery</span><span>{order.deliveryMethod}</span></div>
        <div className="d-flex justify-content-between"><span className="text-caption">Payment</span><span>{paymentLabel}</span></div>
        <hr style={{ borderColor: '#ddd' }} />
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
