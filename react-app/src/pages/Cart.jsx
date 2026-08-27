import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { money } from '../store';

export default function Cart() {
  const { items, subtotal, setQty, remove } = useCart();

  return (
    <div className="cart-page-wrapper">
      <div className="container-fluid px-4 px-lg-5" style={{ maxWidth: 1200 }}>
        <div className="d-flex align-items-end justify-content-between cart-header-row mb-4">
          <h1 className="cart-main-title">Your Bag</h1>
          <Link to="/" className="btn-dashed">Continue Shopping</Link>
        </div>

        {items.length === 0 ? (
          <p className="text-caption">Your bag is empty.</p>
        ) : (
          <div className="row g-5">
            <div className="col-12 col-lg-8">
              <div className="row cart-header-row">
                <div className="col-5 column-title">Product</div>
                <div className="col-3 column-title text-center">Size / Color</div>
                <div className="col-2 column-title text-center">Qty</div>
                <div className="col-2 column-title text-end">Total</div>
              </div>
              {items.map((it) => (
                <div className="row cart-item-row align-items-center" key={it.index}>
                  <div className="col-5">
                    <Link to={`/products/${it.productId}`} className="product-title-link">{it.productName}</Link>
                  </div>
                  <div className="col-3 text-center">
                    <span className="size-display-box">{it.size || '—'}</span>
                    <div className="text-caption" style={{ marginTop: 4 }}>{it.color || '—'}</div>
                  </div>
                  <div className="col-2 d-flex justify-content-center">
                    <div className="qty-stepper-container">
                      <button className="qty-step-btn" onClick={() => setQty(it.index, it.quantity - 1)}>−</button>
                      <input className="qty-stepper-input" value={it.quantity} onChange={(e) => setQty(it.index, parseInt(e.target.value || '0', 10))} />
                      <button className="qty-step-btn" onClick={() => setQty(it.index, it.quantity + 1)}>+</button>
                    </div>
                  </div>
                  <div className="col-2 d-flex justify-content-end align-items-center gap-3">
                    <span className="item-price-text">{money(it.total)}</span>
                    <button className="icon-btn" style={{ color: '#000', width: 'auto', height: 'auto' }} onClick={() => remove(it.index)} aria-label="Remove"><i className="bi bi-x-lg"></i></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="col-12 col-lg-4">
              <div className="profile-sidebar">
                <h3 className="checkout-section-title">Summary</h3>
                <div className="d-flex justify-content-between mb-3"><span className="text-caption">Subtotal</span><span>{money(subtotal)}</span></div>
                <div className="d-flex justify-content-between mb-3"><span className="text-caption">Delivery & Payment fees</span><span>Calculated at checkout</span></div>
                <Link to="/checkout" className="checkout-banner-btn">Proceed to Checkout</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
