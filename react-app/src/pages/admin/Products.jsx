import { Link } from 'react-router-dom';
import { deleteProduct, money, getImages } from '../../store';
import { useData } from '../../context/DataContext';

export default function Products() {
  const { products } = useData();

  return (
    <div className="admin-products">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="admin-page-title">Products</h1>
        <Link to="/admin/products/new" className="btn-minimal btn-filled">Add Product</Link>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>ID</th><th>Image</th><th>Name</th><th>Gender</th><th>Price</th><th>Stock</th><th></th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td><img src={getImages(p)[0]} alt="" style={{ width: 48, height: 60, objectFit: 'cover' }} /></td>
                <td>{p.name}</td>
                <td>{p.gender}</td>
                <td>{money(p.price)}</td>
                <td>{p.stock}</td>
                <td className="d-flex gap-3">
                  <Link to={`/admin/products/${p.id}`} className="admin-action">Edit</Link>
                  <button className="admin-action danger" onClick={async () => { if (confirm('Delete ' + p.name + '?')) await deleteProduct(p.id); }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
