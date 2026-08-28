import { Link } from 'react-router-dom';
import { bestSellers, getImages, money } from '../store';
import { useData } from '../context/DataContext';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const { products } = useData();
  const bestSellersList = bestSellers(products, 8);

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-kicker">Zamphire / New Season</p>
          <h1 className="home-hero-title">Quiet luxury with a sharper edge</h1>
          <p className="home-hero-lede">A refined edit of menswear, womenswear and statement pieces built around clean silhouettes, premium textures and everyday confidence.</p>
          <div className="home-hero-actions">
            <Link className="home-btn home-btn-light" to="/men">Shop Men</Link>
            <Link className="home-btn home-btn-light" to="/women">Shop Women</Link>
            <a className="home-btn home-btn-light" href="#bestsellers">View Bestsellers</a>
          </div>
        </div>
        <div className="home-hero-visual-grid">
          <div className="hero-visual-card hero-visual-card-large">
            <img src="/assets/Perfume-13.jpg" alt="Zamphire editorial fashion look" loading="eager" />
          </div>
          <div className="hero-visual-card">
            <img src="/assets/Perfume-8.jpg" alt="Zamphire men collection" loading="lazy" />
          </div>
          <div className="hero-visual-card hero-visual-note">
            <strong>New drops weekly</strong>
            <span>Fresh pieces added to the collection as soon as they land.</span>
          </div>
        </div>
      </section>

      <section className="home-section home-section-white" id="bestsellers">
        <div className="section-shell">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Bestsellers</p>
              <h2>Current favorites</h2>
            </div>
            <p>Explore the latest pieces selected for strong styling, clean proportions and everyday wearability.</p>
          </div>
          {bestSellersList.length > 0 ? (
            <div className="product-grid">
              {bestSellersList.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="feature-grid">
              <div className="feature-tile">
                <span>Collection</span>
                <strong>No products yet</strong>
                <p>Add products from the admin panel and they will appear here in the homepage grid.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="home-section">
        <div className="section-shell">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Shop by edit</p>
              <h2>Choose your lane</h2>
            </div>
            <p>Designed as a cleaner shopping path, each category opens into a focused grid for faster browsing.</p>
          </div>
          <div className="category-grid">
            <Link to="/men" className="category-card category-card-wide">
              <img src="/assets/Perfume-Men-1.jpg" alt="Shop men collection" loading="lazy" />
              <div className="category-card-content"><span>Men</span><strong>Sharp essentials</strong></div>
            </Link>
            <Link to="/women" className="category-card">
              <img src="/assets/Perfume-Women-1.jpg" alt="Shop women collection" loading="lazy" />
              <div className="category-card-content"><span>Women</span><strong>Modern forms</strong></div>
            </Link>
            <Link to="/vault" className="category-card">
              <img src="/assets/vault.png" alt="Shop The Vault collection" loading="lazy" />
              <div className="category-card-content"><span>The Vault</span><strong>Rare pieces</strong></div>
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="section-shell">
          <div className="feature-grid">
            <div className="feature-tile"><span>Build</span><strong>Clean structure</strong><p>Every layout uses consistent spacing, strong image hierarchy and responsive grid columns.</p></div>
            <div className="feature-tile"><span>Texture</span><strong>Premium finish</strong><p>Large visuals, restrained typography and neutral backgrounds keep the focus on the product.</p></div>
            <div className="feature-tile"><span>Motion</span><strong>Subtle depth</strong><p>Hover states and scaled imagery add polish without slowing down the browsing experience.</p></div>
          </div>
        </div>
      </section>

      <section className="home-section home-section-white">
        <div className="section-shell">
          <div className="newsletter-panel">
            <div>
              <p className="section-kicker">Inner circle</p>
              <h2>Get the next drop first</h2>
              <p>Join the list for new releases, restocks and member-only access to the latest edits.</p>
            </div>
            <form action="#" method="post" className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Email address" aria-label="Email subscription entry field" required />
              <button type="submit" aria-label="Submit subscription">Join</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
