import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { getImages, getTags, money, storeConfig } from '../store';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useBookmarks } from '../context/BookmarkContext';
import { useData } from '../context/DataContext';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { has, toggle } = useBookmarks();
  const { products, pushRecent } = useData();

  const product = useMemo(() => products.find((p) => String(p.id) === String(id)), [products, id]);

  const images = useMemo(() => (product ? getImages(product) : []), [product]);
  const tags = useMemo(() => (product ? getTags(product) : []), [product]);
  const sizes = useMemo(() => (tags.indexOf('accessories') !== -1 ? ['One Size'] : ['XS', 'S', 'M', 'L']), [tags]);

  const [mainImage, setMainImage] = useState(images[0]);
  const [selectedSize, setSelectedSize] = useState('');
  const [bookmarked, setBookmarked] = useState(product ? has(product.id) : false);
  const [openAcc, setOpenAcc] = useState({ details: false, shipping: false, faq: false });

  useEffect(() => {
    if (product) {
      pushRecent(product.id);
      setMainImage(images[0]);
      setSelectedSize('');
      setBookmarked(has(product.id));
    }
  }, [id]);

  if (!product) {
    return (
      <div className="editorial-wrapper" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-center">
          <p className="text-caption mb-3">Product not found.</p>
          <Link className="btn-minimal" to="/">Back to store</Link>
        </div>
      </div>
    );
  }

  const relatedProducts = useMemo(
    () => products.filter((p) => p.gender === product.gender && p.id !== product.id).slice(0, 8),
    [products, product]
  );

  const updateCta = () => {
    if (selectedSize) return 'Add to Bag — ' + selectedSize;
    return 'Select A Size';
  };

  const onBookmark = (e) => {
    e.preventDefault();
    if (!user) {
      if (window.confirm('Please log in to bookmark items.')) navigate('/login?next=' + encodeURIComponent('/products/' + product.id));
      return;
    }
    const added = toggle(product.id);
    setBookmarked(added);
  };

  const onAddToBag = () => {
    if (!selectedSize) { window.alert('Please choose a size.'); return; }
    addToCart(product.id, selectedSize, '', 1);
    window.alert('Added to bag.');
  };

  return (
    <div className="editorial-wrapper product-detail-body">
      <div className="product-hero-matrix">
        <div className="media-gallery-pane">
          <div className="gallery-thumbs-column">
            {images.length > 1 && (
              <>
                {images.map((src, i) => (
                  <div key={i} className="thumb-frame-container" onClick={() => setMainImage(src)} style={{ outline: src === mainImage ? '1px solid #000' : 'none' }}>
                    <img src={src} alt={`Asset ${i + 1}`} />
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="main-image-display-frame">
            <img src={mainImage} alt={product.name} id="mainProductImage" />
          </div>
        </div>

        <div className="product-meta-editorial-pane">
          <div>
            <div className="meta-header-group">
              <div className="d-flex justify-content-between align-items-start" style={{ gap: 15 }}>
                <div>
                  <div className="pd-brand">{storeConfig.name}</div>
                  <h1 style={{ margin: 0 }}>{product.name}</h1>
                </div>
                <button className="border-0 bg-transparent p-0" onClick={onBookmark} style={{ cursor: 'pointer', color: bookmarked ? '#000' : '#999', flexShrink: 0, marginTop: 5 }}>
                  <i className={`bi ${bookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}`} style={{ fontSize: '1.4rem' }}></i>
                </button>
              </div>
              <div className="editorial-price-badge">{money(product.price)}</div>
            </div>

            <div className="pd-size-row">
              <div className="section-editorial-caption">Select Size</div>
              <button className="pd-size-guide-link" onClick={() => setOpenAcc((o) => ({ ...o, faq: o.faq }))}>Size Guide</button>
            </div>
            <div className="brutalist-option-grid">
              {sizes.map((s) => (
                <button key={s} type="button" className={`brutalist-btn size-btn ${selectedSize === s ? 'selected-option' : ''}`} onClick={() => setSelectedSize(s)}>{s}</button>
              ))}
            </div>

             <button className="velora-monolith-cta" onClick={onAddToBag}>{updateCta()}</button>

            <div className="pd-shipping-note">
              <i className="bi bi-truck"></i> Free standard shipping on all orders.
            </div>
          </div>

          <div className="editorial-accordion-divider">
            <div className="accordion-minimal-item">
              <button className="accordion-minimal-btn" onClick={() => setOpenAcc((o) => ({ ...o, details: !o.details }))}>
                <span>Product Details</span><i className={`bi ${openAcc.details ? 'bi-dash-lg' : 'bi-plus-lg'}`}></i>
              </button>
              <div className="accordion-minimal-content" style={{ maxHeight: openAcc.details ? 200 : 0 }}>
                <p>{product.description}</p>
                {tags.length > 0 && <p><strong>Tags:</strong> {tags.join(', ')}</p>}
              </div>
            </div>
            <div className="accordion-minimal-item">
              <button className="accordion-minimal-btn" onClick={() => setOpenAcc((o) => ({ ...o, shipping: !o.shipping }))}>
                <span>Shipping and Returns</span><i className={`bi ${openAcc.shipping ? 'bi-dash-lg' : 'bi-plus-lg'}`}></i>
              </button>
              <div className="accordion-minimal-content" style={{ maxHeight: openAcc.shipping ? 200 : 0 }}>
                <p>Standard delivery settles within 3-5 business days. Free shipping on all orders. Returns are honored within a 30-day window.</p>
              </div>
            </div>
            <div className="accordion-minimal-item">
              <button className="accordion-minimal-btn" onClick={() => setOpenAcc((o) => ({ ...o, faq: !o.faq }))}>
                <span>FAQ</span><i className={`bi ${openAcc.faq ? 'bi-dash-lg' : 'bi-plus-lg'}`}></i>
              </button>
              <div className="accordion-minimal-content" style={{ maxHeight: openAcc.faq ? 200 : 0 }}>
                <p>How do I choose my size? Refer to the size chart in the size guide for measurements. What is the return policy? Items can be returned within 30 days of delivery.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div id="relatedSection">
          <div className="matrix-interstitial-title">Other Sides</div>
          <div className="swiper-editorial-container">
            <div className="swiper-custom-navigation">
              <div className="nav-arrow-box related-prev"><i className="bi bi-arrow-left"></i></div>
              <div className="nav-arrow-box related-next"><i className="bi bi-arrow-right"></i></div>
            </div>
            <Swiper modules={[Navigation]} slidesPerView={4} spaceBetween={24} navigation={{ nextEl: '.related-next', prevEl: '.related-prev' }}
              breakpoints={{ 0: { slidesPerView: 2, spaceBetween: 16 }, 768: { slidesPerView: 3, spaceBetween: 20 }, 1200: { slidesPerView: 4, spaceBetween: 24 } }}>
              {relatedProducts.map((p) => (
                <SwiperSlide key={p.id}>
                  <Link to={`/products/${p.id}`} className="matrix-display-node">
                    <div className="matrix-node-image-frame"><img src={getImages(p)[0]} alt={p.name} /></div>
                    <div className="matrix-node-meta-row"><span>{p.name}</span><span className="node-price">{money(p.price)}</span></div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}
    </div>
  );
}
