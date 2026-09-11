import { Link } from 'react-router-dom';
import { useBookmarks } from '../context/BookmarkContext';
import { useData } from '../context/DataContext';
import ProductCard from '../components/ProductCard';

export default function Bookmarks() {
  const { ids, toggle } = useBookmarks();
  const { products } = useData();
  const items = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean);

  return (
    <div className="bookmarks-page">
      <div className="container-fluid px-4 px-lg-5" style={{ maxWidth: 1200 }}>
        <h1 className="cart-main-title mb-4">Bookmarks</h1>
        {items.length === 0 ? (
          <p className="text-caption">You have no bookmarked products yet. <Link className="btn-minimal" to="/">Browse the store</Link></p>
        ) : (
          <div className="row g-3">
            {items.map((p) => (
              <div className="col-6 col-md-3" key={p.id}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
