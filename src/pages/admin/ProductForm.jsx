import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import * as store from '../../store';

const GENDERS = ['Men', 'Women'];

const empty = {
  name: '', gender: 'Men', price: '', description: '',
  images: [''], tags: '', sizes: '50ml,100ml', stock: '10'
};

function fromProduct(p) {
  return {
    name: p.name, gender: p.gender || 'Men',
    price: String(p.price), description: p.description,
    images: (p.imageUrls || p.imageUrl || '').toString().split(',').map((s) => s.trim()).filter(Boolean),
    tags: (p.tags || '').toString(),
    sizes: (p.sizes || '').toString(),
    stock: String(p.stock)
  };
}

export default function ProductForm() {
  const { id } = useParams();
  const editing = id && id !== 'new';
  const navigate = useNavigate();
  const { products } = useData();
  const existing = editing ? products.find((p) => String(p.id) === String(id)) : null;

  const [form, setForm] = useState(() => (existing ? fromProduct(existing) : empty));

  useEffect(() => {
    if (existing) setForm(fromProduct(existing));
  }, [existing]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setImage = (i) => (e) => setForm((f) => {
    const images = f.images.slice();
    images[i] = e.target.value;
    return { ...f, images };
  });
  const addImage = () => setForm((f) => ({ ...f, images: [...f.images, ''] }));
  const removeImage = (i) => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));

  const submit = async (e) => {
    e.preventDefault();
    const imageList = form.images.map((s) => s.trim()).filter(Boolean);
    const product = {
      name: form.name,
      gender: form.gender,
      price: parseFloat(form.price) || 0,
      description: form.description,
      imageUrl: imageList[0] || '',
      imageUrls: imageList.join(', '),
      tags: form.tags,
      sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      stock: parseInt(form.stock, 10) || 0,
      rating: existing?.rating || 4.5,
      reviews: existing?.reviews || 0,
      dateAdded: existing?.dateAdded || new Date().toISOString()
    };
    if (editing) await store.updateProduct(id, product);
    else await store.addProduct(product);
    navigate('/admin/products');
  };

  const field = (label, key, type = 'text') => (
    <div className="auth-field mb-3">
      <label>{label}</label>
      <input type={type} value={form[key]} onChange={set(key)} />
    </div>
  );

  return (
    <div className="admin-product-form" style={{ maxWidth: 680 }}>
      <h1 className="admin-page-title">{editing ? 'Edit Product' : 'Add Product'}</h1>
       <form onSubmit={submit}>
         {field('Name', 'name')}
         <div className="auth-field mb-3">
           <label>Gender / Section</label>
           <select className="checkout-input" value={form.gender} onChange={set('gender')}>
             {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
           </select>
          </div>
         <div className="row g-3">
           <div className="col-6">{field('Price', 'price', 'number')}</div>
           <div className="col-6">{field('Stock', 'stock', 'number')}</div>
         </div>
         {field('Bottle Sizes (ml, comma separated)', 'sizes')}

        <div className="auth-field mb-2">
          <label>Image URLs</label>
          {form.images.map((url, i) => (
            <div key={i} className="d-flex gap-2 mb-2">
              <input className="checkout-input" value={url} onChange={setImage(i)} placeholder="https://... or /assets/image.png" />
              {form.images.length > 1 && (
                <button type="button" className="btn-minimal" onClick={() => removeImage(i)} aria-label="Remove image">×</button>
              )}
            </div>
          ))}
          <button type="button" className="btn-minimal mt-1" onClick={addImage}>Add image URL</button>
        </div>

        {field('Tags (comma separated)', 'tags')}
        <div className="auth-field mb-4">
          <label>Description</label>
          <textarea value={form.description} onChange={set('description')} rows={4} />
        </div>
        <div className="d-flex gap-3">
          <button type="submit" className="auth-submit" aria-label="Save"><i className="bi bi-check-lg"></i></button>
          <button type="button" className="btn-minimal" style={{ color: '#fff' }} onClick={() => navigate('/admin/products')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
