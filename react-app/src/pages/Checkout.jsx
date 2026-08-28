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
    country: 'Pakistan',
    city: '',
    state: '',
    postcode: '',
    phone: '',
    notes: '',
    deliveryMethod: 'standard',
    paymentMethod: 'cod'
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
  const total = subtotal + deliveryFee;

  const valid = Boolean(
    form.address.trim() &&
    form.country.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.postcode.trim() &&
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
      state: form.state,
      postcode: form.postcode,
      phoneNumber: form.phone,
      notes: form.notes,
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
                  <label className="checkout-field-label">Country</label>
                  <input
                    className="checkout-input"
                    value="Pakistan"
                    disabled
                    readOnly
                  />
                </div>

                <div className="col-6">
                  <label className="checkout-field-label">Town / City *</label>
                  <input
                    className="checkout-input"
                    value={form.city}
                    onChange={set('city')}
                    required
                  />
                </div>

                <div className="col-6">
                  <label className="checkout-field-label">State *</label>
                  <input
                    className="checkout-input"
                    value={form.state}
                    onChange={set('state')}
                    required
                  />
                </div>

                <div className="col-6">
                  <label className="checkout-field-label">Postcode *</label>
                  <input
                    className="checkout-input"
                    value={form.postcode}
                    onChange={set('postcode')}
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

                <div className="col-12">
                  <label className="checkout-field-label">Notes</label>
                  <textarea
                    className="checkout-input"
                    value={form.notes}
                    onChange={set('notes')}
                    rows="3"
                    style={{ resize: 'vertical' }}
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
                        : 'Express (+₨500)'}
                    </span>
                  </label>
                ))}
              </div>

              <h3 className="checkout-section-title">Payment</h3>

              <div>
                {['cod'].map((m) => (
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
                      Cash on Delivery
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

                <div className="mt-3" style={{ color: '#000', fontSize: '0.85rem' }}>
                  <p className="mb-1">Pay with cash upon Delivery.</p>
                  <p className="mb-1">Important Note: Please Confirm your order on WhatsApp after placing it to avoid delays.</p>
                  <p className="mb-0">We will also send you a Confirmation Message on WhatsApp after your order is placed.</p>
                </div>

                {!valid && (
                  <small
                    className="d-block mt-2"
                    style={{ color: '#000' }}
                  >
                    Address, town/city, state, postcode and phone are required.
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
