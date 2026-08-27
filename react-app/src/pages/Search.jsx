import { Link, useSearchParams } from 'react-router-dom';
import { searchProducts, money, getImages } from '../store';
import { useData } from '../context/DataContext';
import ProductCard from '../components/ProductCard';

export default function Search() {
  const [params] = useSearchParams();
  const { products } = useData();
  const q = params.get('q') || '';
  const results = q ? searchProducts(products, q) : [];

  return (
    <div className="home-page" style={{ paddingTop: '2rem' }}>
      <section className="home-section home-section-white" style={{ paddingTop: '2rem' }}>
        <div className="section-shell">
          <p className="section-kicker">Search</p>
          <h2 className="search-results-heading mb-4">{q ? `Results for “${q}”` : 'Search products'}</h2>
          {!q && <p className="text-caption">Type a product name, tag or keyword in the search bar above.</p>}
          {q && results.length === 0 && <p className="text-caption">No products match your search.</p>}
          {results.length > 0 && (
            <div className="product-grid">
              {results.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
