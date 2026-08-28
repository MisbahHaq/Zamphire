import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useBookmarks } from '../context/BookmarkContext';
import { useData } from '../context/DataContext';
import { searchProducts, money } from '../store';

export default function Navbar() {
  const { user, isAdmin } = useAuth();
  const { count: cartCount } = useCart();
  const { count: bookmarkCount } = useBookmarks();
  const { products } = useData();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef(null);
  const mobileRef = useRef(null);

  const doSearch = (q, desktop) => {
    navigate('/search?q=' + encodeURIComponent(q));
    setSearchOpen(false);
    setQuery('');
    setSuggestions([]);
    setOpen(false);
    if (desktop) searchRef.current.value = '';
    else if (mobileRef.current) mobileRef.current.value = '';
  };

  const computeSuggestions = (q) => {
    if (!q.trim()) { setSuggestions([]); return; }
    setSuggestions(searchProducts(products, q).slice(0, 6));
  };

  useEffect(() => {
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.parentElement.contains(e.target) &&
          mobileRef.current && !mobileRef.current.parentElement.contains(e.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const loginHref = user ? (isAdmin ? '/admin' : '/profile') : '/login';

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-black border-bottom border-secondary py-2">
      <div className="container-fluid px-3 px-md-4 position-relative d-flex align-items-center justify-content-between">
        <button className="navbar-toggler border-0 shadow-none p-0" type="button" onClick={() => setOpen(!open)} aria-label="Toggle navigation" style={{ zIndex: 11 }}>
          <span className="navbar-toggler-icon"></span>
        </button>

         <Link className="navbar-brand position-absolute start-50 translate-middle-x text-white m-0" style={{ letterSpacing: '0.35em', fontSize: '0.78rem', fontWeight: 200, textTransform: 'uppercase', zIndex: 20 }} to="/">Zamphire</Link>

        <div className="d-lg-none d-flex align-items-center" style={{ gap: '0.25rem', zIndex: 11 }}>
          <Link to={loginHref} className="icon-btn" id="userLoginLinkMobile">
            <i className={`bi ${user ? 'bi-person-circle' : 'bi-person'}`} style={{ fontSize: '0.95rem', color: '#fff' }}></i>
          </Link>
          <Link to="/cart" className="icon-btn position-relative" id="cartLinkMobile">
            <i className="bi bi-bag" style={{ fontSize: '0.95rem' }}></i>
            <span className="badge-count position-absolute" style={{ top: '-2px', right: '-4px' }}>{cartCount}</span>
          </Link>
        </div>

        <div className={`collapse navbar-collapse w-100 mt-0 px-0 ${open ? 'show' : ''}`} id="navbarContent" style={{ zIndex: 10 }}>
          <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-between w-100 gap-2 pt-0">
            <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center gap-3 gap-lg-4 pt-0">
              <div className="d-lg-none w-100 my-0">
                <form className="d-flex align-items-center mobile-search-box" style={{ borderBottom: 0 }} onSubmit={(e) => { e.preventDefault(); if (query.trim()) doSearch(query, false); }}>
                  <input ref={mobileRef} type="text" className="form-control minimal-line-input" placeholder="Search products..." autoComplete="off"
                    onChange={(e) => { setQuery(e.target.value); computeSuggestions(e.target.value); }} />
                </form>
                {suggestions.length > 0 && (
                  <div id="searchSuggestionsMobileInner" style={{ display: 'block' }}>
                    {suggestions.map((p) => (
                      <Link key={p.id} className="suggestion-item" to={`/products/${p.id}`} onClick={() => { setSuggestions([]); setOpen(false); }}>
                        <img src={p.imageUrl} alt="" />
                        <div className="suggestion-meta"><span className="suggestion-name">{p.name}</span><span className="suggestion-price">{money(p.price)}</span></div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link className="nav-link-minimal" to="/men">Men</Link>
              <Link className="nav-link-minimal" to="/women">Women</Link>
              <Link className="nav-link-minimal d-lg-none" to="/vault">The Vault</Link>
              <Link className="nav-link-minimal d-lg-none" to="/bookmarks">Bookmarks <span className="badge-count ms-1" style={{ display: bookmarkCount ? 'inline-block' : 'none' }}>{bookmarkCount}</span></Link>
              {isAdmin && <Link className="nav-link-minimal d-lg-none" to="/admin">Admin Panel</Link>}
            </div>

            <div className="d-none d-lg-flex align-items-center gap-4">
              <Link className="nav-link-minimal" to="/vault">The Vault</Link>
              <div className="d-flex align-items-center" style={{ position: 'relative' }}>
                <button type="button" className="icon-btn" id="searchToggle" aria-label="Search" onClick={() => setSearchOpen(!searchOpen)}>
                  <i className={`bi ${searchOpen ? 'bi-x-lg' : 'bi-search'}`} style={{ fontSize: '0.95rem' }}></i>
                </button>
                <div id="searchWrap" className={searchOpen ? 'open' : ''}>
                  <form id="searchForm" className="d-flex align-items-center ms-2" onSubmit={(e) => { e.preventDefault(); if (query.trim()) doSearch(query, true); }}>
                    <input ref={searchRef} type="text" id="searchInput" className="form-control" placeholder="Search..." autoComplete="off"
                      onChange={(e) => { setQuery(e.target.value); computeSuggestions(e.target.value); }} />
                  </form>
                  {suggestions.length > 0 && (
                    <div id="searchSuggestions" style={{ display: 'block' }}>
                      {suggestions.map((p) => (
                        <Link key={p.id} className="suggestion-item" to={`/products/${p.id}`} onClick={() => { setSuggestions([]); setSearchOpen(false); setQuery(''); }}>
                          <img src={p.imageUrl} alt="" />
                          <div className="suggestion-meta"><span className="suggestion-name">{p.name}</span><span className="suggestion-price">{money(p.price)}</span></div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Link to={loginHref} className="icon-btn" id="userLoginLink" title={user ? (isAdmin ? 'Admin Panel' : 'Account') : 'Login'}>
                <i className={`bi ${user ? 'bi-person-circle' : 'bi-person'}`} style={{ fontSize: '0.95rem', color: '#fff' }}></i>
              </Link>
              <Link to="/bookmarks" className="icon-btn position-relative" id="bookmarkLink">
                <i className="bi bi-bookmark" style={{ fontSize: '0.95rem', color: '#fff' }}></i>
                <span className="badge-count position-absolute" style={{ top: '-4px', right: '-6px', display: bookmarkCount ? 'inline-block' : 'none' }}>{bookmarkCount}</span>
              </Link>
              <Link to="/cart" className="icon-btn position-relative" id="cartLink">
                <i className="bi bi-bag" style={{ fontSize: '0.95rem' }}></i>
                <span className="badge-count position-absolute" style={{ top: '-2px', right: '-4px' }}>{cartCount}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
