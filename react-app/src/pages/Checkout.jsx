import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, money } from '../store';

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    address: user?.address || '',
    country: '',
    city: '',
    phone: '',
    deliveryMethod: 'standard',
    paymentMethod: 'card'
  });

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-box"><p className="text-caption">Your bag is empty.</p></div>
      </div>
    );
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const deliveryFee = form.deliveryMethod === 'express' ? 500 : 0;
  const paymentFee = form.paymentMethod === 'cod' ? 800 : 0;
  const total = subtotal + deliveryFee + paymentFee;

  const valid = Boolean(
    form.address.trim() &&
    form.country.trim() &&
    form.city.trim() &&
    form.phone.trim()
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!valid) return;

    const order = await createOrder({
      userEmail: user.email,
      userId: user.uid,
      address: form.address,
      country: form.country,
      city: form.city,
      phoneNumber: form.phone,
      deliveryMethod: form.deliveryMethod,
      paymentMethod: form.paymentMethod,
      totalAmount: +total.toFixed(2),
      items: items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        price: it.price,
        imageUrl: it.imageUrl,
        size: it.size,
        color: it.color
      }))
    });

    await clear();
    navigate('/order-confirmation/' + order.id);
  };

  return (
    <div className="checkout-page">
      <div className="checkout-box">
        <h1 className="cart-main-title mb-4">Checkout</h1>

        <form onSubmit={submit}>
          <div className="row g-4">
            <div className="col-12 col-lg-7">
              <h3 className="checkout-section-title">Information</h3>

              <div className="row g-3 mb-4">
                <div className="col-6">
                  <label className="checkout-field-label">First name</label>
                  <input
                    className="checkout-input"
                    value={form.firstName}
                    onChange={set('firstName')}
                  />
                </div>

                <div className="col-6">
                  <label className="checkout-field-label">Last name</label>
                  <input
                    className="checkout-input"
                    value={form.lastName}
                    onChange={set('lastName')}
                  />
                </div>

                <div className="col-12">
                  <label className="checkout-field-label">Email</label>
                  <input
                    className="checkout-input"
                    value={form.email}
                    onChange={set('email')}
                  />
                </div>

                <div className="col-12">
                  <label className="checkout-field-label">Address *</label>
                  <input
                    className="checkout-input"
                    value={form.address}
                    onChange={set('address')}
                    required
                  />
                </div>

                <div className="col-6">
                  <label className="checkout-field-label">Country / Region *</label>
                  <input
                    className="checkout-input"
                    value={form.country}
                    onChange={set('country')}
                    required
                  />
                </div>

                <div className="col-6">
                  <label className="checkout-field-label">City *</label>
                  <input
                    className="checkout-input"
                    value={form.city}
                    onChange={set('city')}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="checkout-field-label">Phone number *</label>
                  <input
                    className="checkout-input"
                    value={form.phone}
                    onChange={set('phone')}
                    required
                  />
                </div>
              </div>

              <h3 className="checkout-section-title">Delivery</h3>

              <div className="mb-4">
                {['standard', 'express'].map((m) => (
                  <label
                    key={m}
                    className="d-flex align-items-center gap-2 mb-2"
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      checked={form.deliveryMethod === m}
                      onChange={() =>
                        setForm({ ...form, deliveryMethod: m })
                      }
                    />

                    <span
                      className="text-uppercase"
                      style={{
                        fontSize: '0.75rem',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {m === 'standard'
                        ? 'Standard (Free)'
                        : 'Express (+$500)'}
                    </span>
                  </label>
                ))}
              </div>

              <h3 className="checkout-section-title">Payment</h3>

              <div>
                {['card', 'cod', 'online'].map((m) => (
                  <label
                    key={m}
                    className="d-flex align-items-center gap-2 mb-2"
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={form.paymentMethod === m}
                      onChange={() =>
                        setForm({ ...form, paymentMethod: m })
                      }
                    />

                    <span
                      className="text-uppercase"
                      style={{
                        fontSize: '0.75rem',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {m === 'card'
                        ? 'Card'
                        : m === 'cod'
                          ? 'Cash on Delivery (+$800)'
                          : 'Online Bank Transfer'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="col-12 col-lg-5">
              <div
                className="profile-sidebar"
                style={{ color: '#000' }}
              >
                <h3
                  className="checkout-section-title"
                  style={{ color: '#000' }}
                >
                  Order Summary
                </h3>

                {items.map((it) => (
                  <div
                    key={it.index}
                    className="d-flex justify-content-between mb-2"
                    style={{
                      fontSize: '0.8rem',
                      color: '#000'
                    }}
                  >
                    <span>{it.productName} × {it.quantity}</span>
                    <span>{money(it.total)}</span>
                  </div>
                ))}

                <hr style={{ borderColor: '#222' }} />

                <div
                  className="d-flex justify-content-between mb-2"
                  style={{ color: '#000' }}
                >
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>

                <div
                  className="d-flex justify-content-between mb-2"
                  style={{ color: '#000' }}
                >
                  <span>Delivery</span>
                  <span>{money(deliveryFee)}</span>
                </div>

                <div
                  className="d-flex justify-content-between mb-2"
                  style={{ color: '#000' }}
                >
                  <span>Payment fee</span>
                  <span>{money(paymentFee)}</span>
                </div>

                <div
                  className="d-flex justify-content-between mb-3"
                  style={{ color: '#000' }}
                >
                  <strong>Total</strong>
                  <strong>{money(total)}</strong>
                </div>

                <button
                  type="submit"
                  className="pay-btn"
                  disabled={!valid}
                >
                  {valid ? 'Place Order' : 'Fill required fields'}
                </button>

                {!valid && (
                  <small
                    className="d-block mt-2"
                    style={{ color: '#000' }}
                  >
                    Address, country, city and phone are required.
                  </small>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
