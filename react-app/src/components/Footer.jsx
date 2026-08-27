export default function Footer() {
  return (
    <footer className="bg-dark text-white" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
      <div className="container-fluid px-4 px-lg-5" style={{ maxWidth: 1400 }}>
        <div className="row g-4 gx-0" style={{ borderTop: '1px solid #222', paddingTop: '3rem' }}>
          <div className="col-12 col-lg-4 mb-4 mb-lg-0">
            <h2 className="m-0 mb-4" style={{ fontSize: '0.85rem', fontWeight: 200, letterSpacing: '0.35em', textTransform: 'uppercase' }}>Represent</h2>
            <p className="m-0" style={{ maxWidth: 340, fontSize: '0.8rem', fontWeight: 300, color: '#777', lineHeight: 1.8, letterSpacing: '0.03em' }}>
              Sign up to receive exclusive access to new drops, restocks and members-only releases.
            </p>
          </div>
          <div className="col-6 col-lg-2 offset-lg-1">
            <p className="text-caption mb-3" style={{ color: '#555' }}>Help</p>
            <ul className="list-unstyled" style={{ fontSize: '0.78rem', fontWeight: 300, color: '#888', lineHeight: 2.2 }}>
              <li><a href="#" className="text-decoration-none" style={{ color: '#888' }}>Contact</a></li>
              <li><a href="#" className="text-decoration-none" style={{ color: '#888' }}>Shipping</a></li>
              <li><a href="#" className="text-decoration-none" style={{ color: '#888' }}>Returns</a></li>
              <li><a href="#" className="text-decoration-none" style={{ color: '#888' }}>FAQs</a></li>
            </ul>
          </div>
          <div className="col-6 col-lg-2">
            <p className="text-caption mb-3" style={{ color: '#555' }}>Connect</p>
            <ul className="list-unstyled" style={{ fontSize: '0.78rem', fontWeight: 300, color: '#888', lineHeight: 2.2 }}>
              <li><a href="#" className="text-decoration-none" style={{ color: '#888' }}>Instagram</a></li>
              <li><a href="#" className="text-decoration-none" style={{ color: '#888' }}>Twitter / X</a></li>
              <li><a href="#" className="text-decoration-none" style={{ color: '#888' }}>YouTube</a></li>
            </ul>
          </div>
          <div className="col-12 mt-5 pt-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
              <p className="text-caption m-0" style={{ color: '#444', fontSize: '0.75rem' }}>© 2026 Represent. All rights reserved.</p>
              <div className="d-flex gap-4" style={{ fontSize: '0.75rem' }}>
                <a href="#" className="text-decoration-none" style={{ color: '#555' }}>Terms</a>
                <a href="#" className="text-decoration-none" style={{ color: '#555' }}>Privacy</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
