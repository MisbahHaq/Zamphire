import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { getImages, getTags, getColors, money } from '../store';
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
  const colors = useMemo(() => (product ? getColors(product) : []), [product]);
  const sizes = useMemo(() => (tags.indexOf('accessories') !== -1 ? ['One Size'] : ['S', 'M', 'L']), [tags]);

  const [mainImage, setMainImage] = useState(images[0]);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(colors[0] || '');
  const [bookmarked, setBookmarked] = useState(product ? has(product.id) : false);

  useEffect(() => {
    if (product) {
      pushRecent(product.id);
      setMainImage(images[0]);
      setSelectedColor(colors[0] || '');
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
    if (selectedSize && selectedColor) return 'ADD TO BAG — ' + selectedSize + ' / ' + selectedColor;
    if (selectedColor) return 'ADD TO BAG — ' + selectedColor;
    return 'Select Size And Color';
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
    if (!selectedColor) { window.alert('Please choose a color.'); return; }
    addToCart(product.id, selectedSize, selectedColor, 1);
    window.alert('Added to bag.');
  };

  const [openAcc, setOpenAcc] = useState({ details: false, shipping: false });

  return (
    <div className="editorial-wrapper product-detail-body">
      <div className="product-hero-matrix">
        <div className="media-gallery-pane">
          <div className="main-image-display-frame">
            <img src={mainImage} alt={product.name} id="mainProductImage" />
          </div>
          {images.length > 1 && (
            <div className="editorial-thumbnails-strip">
              {images.map((src, i) => (
                <div key={i} className="thumb-frame-container" onClick={() => setMainImage(src)} style={{ outline: src === mainImage ? '1px solid #000' : 'none' }}>
                  <img src={src} alt={`Asset ${i + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="product-meta-editorial-pane">
          <div>
            <div className="meta-header-group">
              <div className="d-flex justify-content-between align-items-start" style={{ gap: 15 }}>
                <h1>{product.name}</h1>
                <button className="border-0 bg-transparent p-0" onClick={onBookmark} style={{ cursor: 'pointer', color: bookmarked ? '#000' : '#999', flexShrink: 0, marginTop: 5 }}>
                  <i className={`bi ${bookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}`} style={{ fontSize: '1.4rem' }}></i>
                </button>
              </div>
              <div className="editorial-price-badge">{money(product.price)}</div>
            </div>

            <div className="section-editorial-caption">Size selection</div>
            <div className="brutalist-option-grid">
              {sizes.map((s) => (
                <button key={s} type="button" className={`brutalist-btn size-btn ${selectedSize === s ? 'selected-option' : ''}`} onClick={() => setSelectedSize(s)}>{s}</button>
              ))}
            </div>

            <div className="section-editorial-caption">Color options</div>
            <div className="color-flex-row">
              {colors.map((c, i) => (
                <button key={c} type="button" className={`brutalist-btn color-btn ${selectedColor === c ? 'selected-option' : ''}`} style={{ minWidth: 80 }} onClick={() => setSelectedColor(c)}>{c}</button>
              ))}
            </div>

            <button className="velora-monolith-cta" onClick={onAddToBag}>{updateCta()}</button>

            <div className="product-fine-print">
              <div>Model details: 185cm architecture wearing dynamic size Medium</div>
              <div>Allocation value: Earn 240 Prestige Points on purchase</div>
              <div>Logistics: Complimented delivery over $300 thresholds</div>
              <div>Availability Index: {product.stock} units remain in workspace stock</div>
            </div>
          </div>

          <div className="editorial-accordion-divider">
            <div className="accordion-minimal-item">
              <button className="accordion-minimal-btn" onClick={() => setOpenAcc((o) => ({ ...o, details: !o.details }))}>
                <span>Product Specifications</span><i className={`bi ${openAcc.details ? 'bi-dash-lg' : 'bi-plus-lg'}`}></i>
              </button>
              <div className="accordion-minimal-content" style={{ maxHeight: openAcc.details ? 200 : 0 }}>{product.description}</div>
            </div>
            <div className="accordion-minimal-item">
              <button className="accordion-minimal-btn" onClick={() => setOpenAcc((o) => ({ ...o, shipping: !o.shipping }))}>
                <span>Fulfillment & Returns</span><i className={`bi ${openAcc.shipping ? 'bi-dash-lg' : 'bi-plus-lg'}`}></i>
              </button>
              <div className="accordion-minimal-content" style={{ maxHeight: openAcc.shipping ? 200 : 0 }}>Standard priority dispatch operations settle within 3-5 standard workspace business timelines. Returns are honored within a 30-day window frame.</div>
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
