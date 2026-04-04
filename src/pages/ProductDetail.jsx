import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productsService } from '../services/products.service';
import { reviewsService, chatService } from '../services/index';
import { useApp } from '../context/AppContext';
import ProductCard from '../components/ProductCard';

const fp = n => '₦' + Number(n).toLocaleString();

const PAYMENT_LABELS = {
  escrow:'Platform Escrow', before_delivery:'Payment Before Delivery',
  on_delivery:'Payment on Delivery', after_inspection:'Payment After Inspection',
};

function ReviewsSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({ avg: 0, total: 0 });
  const { user } = useApp();
  const [form, setForm] = useState({ rating: 5, title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    reviewsService.getForProduct(productId, 1, 10)
      .then(r => { const d = r?.data ?? r; setReviews(d?.data || []); setMeta({ avg: d?.avg || 0, total: d?.total || 0 }); })
      .catch(() => {});
  }, [productId]);

  async function submit() {
    if (!user) return;
    setSubmitting(true);
    try {
      await reviewsService.create({ productId, ...form });
      const r = await reviewsService.getForProduct(productId, 1, 10);
      const d = r?.data ?? r; setReviews(d?.data || []); setMeta({ avg: d?.avg || 0, total: d?.total || 0 });
      setForm({ rating: 5, title: '', body: '' });
    } catch(e) { alert(e.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="section-card mt-6">
      <div className="p-4 border-b border-solar-border flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold">Reviews ({meta.total})</h3>
        {meta.avg > 0 && <div className="flex items-center gap-2"><span className="text-solar-accent font-bold">{meta.avg}</span><span className="text-xs text-solar-muted">/ 5.0</span></div>}
      </div>
      <div className="p-4 space-y-4">
        {reviews.map(r => (
          <div key={r.id} className="border-b border-solar-border pb-4 last:border-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-solar-accent/20 text-solar-accent font-bold text-xs flex items-center justify-center">{r.user?.firstName?.[0] || 'U'}</div>
              <span className="text-sm font-medium">{r.user?.firstName || 'User'}</span>
              <span className="text-solar-accent text-xs">{'★'.repeat(r.rating)}</span>
              {r.verified && <span className="badge-green text-[9px]">Verified</span>}
            </div>
            {r.title && <div className="text-sm font-medium mb-1">{r.title}</div>}
            {r.body && <div className="text-sm text-solar-muted">{r.body}</div>}
            {r.sellerReply && (
              <div className="mt-2 ml-4 bg-solar-accent/5 border-l-2 border-solar-accent pl-3 py-1.5 text-xs text-solar-muted">
                <span className="font-medium text-solar-text">Seller reply:</span> {r.sellerReply}
              </div>
            )}
          </div>
        ))}
        {reviews.length === 0 && <p className="text-solar-muted text-sm">No reviews yet. Be the first!</p>}
        {user && (
          <div className="border-t border-solar-border pt-4 mt-4">
            <h4 className="font-heading text-xs font-semibold mb-3 text-solar-accent">Leave a Review</h4>
            <div className="flex items-center gap-1 mb-3">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setForm(f => ({...f, rating:n}))} className={`text-xl transition-colors ${n<=form.rating?'text-solar-accent':'text-solar-border'}`}>★</button>
              ))}
            </div>
            <input className="solar-input mb-2 text-sm" placeholder="Title (optional)" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}/>
            <textarea className="solar-input mb-3 text-sm" rows={3} placeholder="Share your experience..." value={form.body} onChange={e => setForm(f=>({...f,body:e.target.value}))}/>
            <button onClick={submit} disabled={submitting} className="btn-primary text-sm py-2">{submitting?'Submitting…':'Submit Review'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { addToCart, dispatch, favourites, user } = useApp();
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    setLoading(true);
    productsService.getById(id)
      .then(r => {
        const p = r?.data ?? r;
        setProduct(p);
        if (p?.category?.slug) {
          productsService.search({ category: p.category.slug, limit: 4, page: 1 })
            .then(sr => { const d = sr?.data ?? sr; setSimilar((d?.data || []).filter(x => x.id !== p.id).slice(0,4)); })
            .catch(() => {});
        }
      })
      .catch(() => nav('/marketplace'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="max-w-[1200px] mx-auto px-5 py-10">
      <div className="grid md:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-4"><div className="section-card h-72 animate-pulse bg-solar-card2"/><div className="h-40 animate-pulse bg-solar-card2 rounded-xl"/></div>
        <div className="space-y-4"><div className="section-card h-64 animate-pulse bg-solar-card2"/></div>
      </div>
    </div>
  );
  if (!product) return null;

  async function contactSeller() {
    if (!user) { dispatch({ type:'OPEN_AUTH', payload:'login' }); return; }
    if (!product?.seller?.id) return;
    setMessaging(true);
    try {
      const res = await chatService.createRoom({
        type: 'buyer_seller',
        productId: product.id,
        agentId: product.seller.id,
        subject: `Enquiry about ${product.name}`,
      });
      const room = res.data || res;
      nav(`/messages?room_id=${room.id}`);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setMessaging(false);
    }
  }

  const isFav = favourites.includes(product.id);
  const icon = product.category?.icon || { panel:'☀️', battery:'🔋', inverter:'⚡', controller:'🔌', light:'💡', accessory:'🔧' }[product.category?.slug?.split('-')[0]] || '⚡';

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-10">
      <Link to="/marketplace" className="btn-ghost text-sm px-0 mb-6 inline-flex">← Back to Marketplace</Link>
      <div className="grid md:grid-cols-[1fr_360px] gap-8">
        <div>
          <div className="bg-gradient-to-br from-solar-surface to-solar-card2 border border-solar-border rounded-2xl h-72 flex items-center justify-center text-8xl mb-6">{icon}</div>
          <div className="flex items-center gap-2.5 flex-wrap mb-3">
            {product.category && <span className="badge-blue">{product.category.name}</span>}
            {product.badge && <span className="badge-amber">{product.badge}</span>}
            {product.averageRating > 0 && <span className="text-solar-accent text-sm">★ {product.averageRating}</span>}
            <span className="text-solar-muted text-sm">{product.reviewCount || 0} reviews</span>
            {product.stock <= 5 && product.stock > 0 && <span className="badge-red">Only {product.stock} left</span>}
            {product.stock === 0 && <span className="badge-red">Out of Stock</span>}
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>
          {product.description && <p className="text-solar-muted text-sm mb-5 leading-relaxed">{product.description}</p>}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="section-card">
              <div className="p-4 border-b border-solar-border"><h3 className="font-heading text-xs font-semibold uppercase tracking-widest text-solar-accent">Full Specifications</h3></div>
              <table className="w-full">
                <tbody>
                  {Object.entries(product.specs).map(([k,v]) => (
                    <tr key={k} className="border-b border-solar-border last:border-0">
                      <td className="py-2.5 px-4 text-solar-muted text-sm w-5/12">{k}</td>
                      <td className="py-2.5 px-4 text-solar-text text-sm font-medium">{String(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-5 bg-solar-card border border-solar-border rounded-xl p-4">
            <h3 className="font-heading text-xs font-semibold uppercase tracking-widest text-solar-muted mb-3">🚚 Delivery & Payment</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-solar-dim text-xs mb-1">Max Delivery</div><div className="font-medium">{product.deliveryDays || 3} business days</div></div>
              <div><div className="text-solar-dim text-xs mb-1">Shipping Cost</div><div className="font-medium capitalize">{product.shippingPayer || 'Buyer'} pays</div></div>
              {product.paymentTerms?.length > 0 && (
                <div className="col-span-2">
                  <div className="text-solar-dim text-xs mb-1.5">Payment Options</div>
                  <div className="flex gap-2 flex-wrap">
                    {product.paymentTerms.map(t => <span key={t} className="badge-blue text-[10.5px]">{PAYMENT_LABELS[t] || t}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>
          <ReviewsSection productId={product.id} />
        </div>
        <div className="space-y-4">
          <div className="section-card p-5 sticky top-20">
            <div className="text-solar-muted text-xs mb-1">Unit Price</div>
            <div className="font-heading text-3xl font-bold text-solar-accent mb-1">{fp(product.price)}</div>
            <div className="text-solar-dim text-xs mb-4">+ delivery by location</div>
            <div className="space-y-2.5">
              <button onClick={() => addToCart(product)} disabled={product.stock === 0}
                className="btn-primary w-full py-3 text-sm disabled:opacity-50">
                {product.stock === 0 ? '❌ Out of Stock' : '🛒 Add to Cart'}
              </button>
              <button onClick={contactSeller} disabled={messaging}
                className="btn-outline w-full py-2.5 text-sm disabled:opacity-50">
                {user ? (messaging ? '⏳ Connecting…' : '📩 Message Seller') : '🔑 Sign in to Message'}
              </button>
              <button onClick={() => dispatch({ type:'TOGGLE_FAV_LOCAL', payload: product.id })}
                className={`w-full py-2.5 text-sm rounded-lg border transition-all flex items-center justify-center gap-2 ${isFav ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'bg-transparent border-solar-border text-solar-muted hover:border-solar-muted hover:text-solar-text'}`}>
                {isFav ? '❤️ Saved to Favourites' : '🤍 Save to Favourites'}
              </button>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-solar-green animate-pulse-slow' : 'bg-red-400'}`} />
              <span className="text-xs text-solar-muted">{product.stock > 0 ? `${product.stock} units in stock` : 'Out of stock'}</span>
            </div>
            <div className="mt-4 p-3 bg-solar-accent/5 border border-solar-accent/20 rounded-lg">
              <p className="text-xs text-solar-muted mb-2">Not sure if this fits your system?</p>
              <Link to="/advisor" className="text-xs text-solar-accent hover:text-solar-accent2">⚡ Use Solar Advisor →</Link>
            </div>
          </div>
          {product.seller && (
            <div className="section-card p-4">
              <div className="text-[11px] text-solar-muted uppercase tracking-widest font-medium mb-3">Seller</div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-solar-accent to-solar-orange flex items-center justify-center text-sm font-bold text-black flex-shrink-0">
                  {(product.seller.storeName || product.seller.firstName || 'S')[0]}
                </div>
                <div>
                  <div className="font-semibold text-sm">{product.seller.storeName || product.seller.firstName}</div>
                  <div className="text-xs text-solar-muted">{product.sellerCity || product.seller.storeCity}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {product.seller.sellerVerified && <span className="badge-green">✓ Verified</span>}
                {product.averageRating > 0 && <span className="badge-amber">⭐ {product.averageRating}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="font-heading text-lg font-semibold mb-5">Similar <span className="text-solar-accent">Products</span></h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similar.map(s => <ProductCard key={s.id} product={s}/>)}
          </div>
        </section>
      )}
    </div>
  );
}
