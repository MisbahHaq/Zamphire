import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import ProductCard from '../components/ProductCard';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low-high', label: 'Price: Low to High' },
  { value: 'price-high-low', label: 'Price: High to Low' },
  { value: 'name-a-z', label: 'Name: A–Z' },
  { value: 'name-z-a', label: 'Name: Z–A' }
];

export default function Men() {
  return <Catalog gender="Men" title="Men" hero="/assets/Perfume-Men-7.jpg" />;
}

export function Women() {
  return <Catalog gender="Women" title="Women" hero="/assets/Perfume-Women-2.webp" />;
}

function Catalog({ gender, title, hero }) {
  const { products } = useData();
  const [sort, setSort] = useState('newest');

  const list = useMemo(() => {
    let l = products.filter((p) => p.gender === gender);
    switch (sort) {
      case 'price-low-high': l = l.slice().sort((a, b) => a.price - b.price); break;
      case 'price-high-low': l = l.slice().sort((a, b) => b.price - a.price); break;
      case 'name-a-z': l = l.slice().sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-z-a': l = l.slice().sort((a, b) => b.name.localeCompare(a.name)); break;
      default: l = l.slice().sort((a, b) => b.id - a.id);
    }
    return l;
  }, [gender, sort, products]);

  return (
    <div className="home-page" style={{ paddingTop: 0 }}>
      <img src={hero} alt={title} className="hero-banner-image" />
      <section className="home-section home-section-white">
        <div className="section-shell">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Collection</p>
              <h2>{title}</h2>
            </div>
            <div className="select-wrapper">
              <select className="minimal-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          {list.length > 0 ? (
            <div className="product-grid">
              {list.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <p className="text-caption">No products in this collection yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
