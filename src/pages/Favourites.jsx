import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { favouritesService } from '../services/index';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

export default function Favourites() {
  const { user, dispatch, addToCart } = useApp();
  const [favs,    setFavs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    favouritesService.getAll(1, 50)
      .then(r => { const d = r?.data ?? r; setFavs(d?.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div className="text-center py-24 text-solar-dim">
      <div className="text-5xl mb-4">🤍</div>
      <h2 className="font-heading text-lg mb-3">Sign in to see favourites</h2>
      <button onClick={() => dispatch({ type:'OPEN_AUTH', payload:'login' })} className="btn-primary">Sign In</button>
    </div>
  );

  if (loading) return (
    <div className="max-w-[1200px] mx-auto px-5 py-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_,i) => <div key={i} className="section-card h-72 animate-pulse bg-solar-card2"/>)}
      </div>
    </div>
  );

  const products = favs.map(f => f.product).filter(Boolean);

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-2xl font-bold">❤️ Saved Products</h1>
        {products.length > 0 && (
          <button onClick={() => products.forEach(p => addToCart(p))} className="btn-primary text-sm">
            🛒 Add All to Cart
          </button>
        )}
      </div>
      {products.length === 0 ? (
        <div className="text-center py-24 text-solar-dim">
          <div className="text-5xl mb-4">🤍</div>
          <h2 className="font-heading text-lg mb-3">No saved products yet</h2>
          <p className="text-sm mb-6">Click the heart icon on any product to save it here</p>
          <Link to="/marketplace" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => <ProductCard key={p.id} product={p}/>)}
        </div>
      )}
    </div>
  );
}
