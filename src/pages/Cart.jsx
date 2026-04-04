import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { favouritesService } from '../services/index';

const fp = n => '₦' + Number(n).toLocaleString();

export default function Cart() {
  const { cart, cartTotal, updateCartQty, removeFromCart, toggleFavourite, favourites, dispatch } = useApp();
  const nav = useNavigate();
  const items = cart?.items || [];

  return (
    <div className="max-w-[1100px] mx-auto px-5 py-10">
      <h1 className="font-heading text-2xl font-bold mb-8">Shopping Cart</h1>
      {!items.length ? (
        <div className="text-center py-20 text-solar-dim">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="font-heading text-lg mb-3">Your cart is empty</h2>
          <Link to="/marketplace" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-3">
            {items.map(({product:p, quantity:qty, id:itemId}) => p && (
              <div key={itemId||p.id} className="section-card p-4 flex gap-4">
                <div className="w-20 h-20 bg-solar-card2 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                  {p.icon||'⚡'}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${p.id}`} className="text-sm font-medium text-solar-text hover:text-solar-accent line-clamp-2">{p.name}</Link>
                  <div className="text-xs text-solar-muted mt-1">{p.seller?.storeName||p.sellerCity||''}</div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button onClick={()=>updateCartQty(itemId||p.id, qty-1)} className="w-7 h-7 rounded-lg bg-solar-surface border border-solar-border text-solar-muted hover:text-solar-text text-base flex items-center justify-center">−</button>
                      <span className="text-sm font-semibold w-5 text-center">{qty}</span>
                      <button onClick={()=>updateCartQty(itemId||p.id, qty+1)} className="w-7 h-7 rounded-lg bg-solar-surface border border-solar-border text-solar-muted hover:text-solar-text text-base flex items-center justify-center">+</button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-heading text-solar-accent font-semibold">{fp(Number(p.price)*qty)}</span>
                      <button onClick={()=>toggleFavourite(p.id)} className={`text-sm transition-colors ${favourites.includes(p.id)?'text-red-400':'text-solar-muted hover:text-red-400'}`}>{favourites.includes(p.id)?'❤️':'🤍'}</button>
                      <button onClick={()=>removeFromCart(itemId||p.id)} className="text-sm text-red-400/70 hover:text-red-400">✕</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="section-card p-5 sticky top-20">
              <h3 className="font-heading text-sm font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2.5 text-sm mb-4">
                <div className="flex justify-between text-solar-muted">
                  <span>Subtotal ({items.reduce((s,i)=>s+i.quantity,0)} items)</span>
                  <span>{fp(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-solar-muted"><span>Delivery</span><span className="text-solar-dim">Calculated at checkout</span></div>
                <hr className="border-solar-border my-2"/>
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span><span className="font-heading text-solar-accent text-lg">{fp(cartTotal)}</span>
                </div>
              </div>
              <button onClick={()=>nav('/checkout')} className="btn-primary w-full py-3">Checkout →</button>
              <Link to="/marketplace" className="btn-ghost w-full mt-2 text-sm text-center block">Continue Shopping</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
