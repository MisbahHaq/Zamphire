import { Link } from 'react-router-dom';
import { money, getImages } from '../store';

export default function ProductCard({ product }) {
  const image = getImages(product)[0] || product.imageUrl;
  return (
    <Link to={`/products/${product.id}`} className="product-card hover-lift">
      <div className="product-card-media">
        <img src={image} alt={product.name} loading="lazy" />
      </div>
      <div className="product-card-meta">
        <div>
          <h3>{product.name}</h3>
          <p>{money(product.price)}</p>
        </div>
        <span className="product-card-link">View →</span>
      </div>
    </Link>
  );
}
