import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { calcWithDiscount, discountLabel } from '../lib/discountUtils';
import SEO from '../components/SEO';
import { ShoppingCart, Heart, Zap } from 'lucide-react';
const fp = n => '₦' + Number(n).toLocaleString();

export default function Cart() {
  const { cart, updateCartQty, removeFromCart, toggleFavourite, favourites, dispatch } = useApp();
  const nav   = useNavigate();
  const items = cart?.items || [];

  // Calculate totals with discounts
  const lineItems = items.map(({ product: p, quantity: qty, id: itemId }) => {
    if (!p) return null;
    const { total, saving, appliedRule } = calcWithDiscount(+p.price, qty, p.discounts);
    return { p, qty, itemId: itemId || p.id, total, saving, appliedRule };
  }).filter(Boolean);

  const subtotal      = lineItems.reduce((s, l) => s + l.total, 0);
  const totalSavings  = lineItems.reduce((s, l) => s + l.saving, 0);
  const totalQty      = lineItems.reduce((s, l) => s + l.qty, 0);

  return (
    <div className="max-w-[1100px] mx-auto px-5 py-10">
      <SEO title="Shopping Cart" noindex />
      <h1 className="font-heading text-2xl font-bold mb-8">Shopping Cart</h1>

      {!items.length ? (
        <div className="text-center py-20 text-solar-dim">
          <div className="flex justify-center mb-4"><ShoppingCart size={56} className="text-solar-dim opacity-40"/></div>
          <h2 className="font-heading text-lg mb-3">Your cart is empty</h2>
          <Link to="/marketplace" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-[1fr_320px] gap-8">

          {/* Line items */}
          <div className="space-y-3">
            {lineItems.map(({ p, qty, itemId, total, saving, appliedRule }) => (
              <div key={itemId} className="section-card p-4 flex gap-4">
                {/* Thumb */}
                <div className="w-20 h-20 bg-solar-card2 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden border border-solar-border">
                  {p.thumbnail
                    ? <img src={p.thumbnail} alt="" className="w-full h-full object-cover" />
                    : <Zap size={32} className="text-solar-accent opacity-50"/>}
                </div>

                <div className="flex-1 min-w-0">
                  <Link to={`/product/${p.id}`} className="text-sm font-medium text-solar-text hover:text-solar-accent line-clamp-2">
                    {p.name}
                  </Link>
                  <div className="text-xs text-solar-dim mt-0.5">
                    {[p.seller?.storeName || p.seller?.firstName, p.sellerCity].filter(Boolean).join(' · ')}
                  </div>

                  {/* Discount badge */}
                  {appliedRule && (
                    <div className="mt-1 inline-flex items-center gap-1 bg-solar-accent/10 border border-solar-accent/25 text-solar-accent text-[10px] font-semibold px-2 py-0.5 rounded-md">
                      {discountLabel(appliedRule)} applied (×{qty})
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    {/* Qty stepper */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQty(itemId, qty - 1)}
                        className="w-7 h-7 rounded-lg bg-solar-surface border border-solar-border text-solar-muted hover:text-solar-text text-base flex items-center justify-center transition-all"
                      >−</button>
                      <span className="text-sm font-semibold w-6 text-center">{qty}</span>
                      <button
                        onClick={() => updateCartQty(itemId, qty + 1)}
                        className="w-7 h-7 rounded-lg bg-solar-surface border border-solar-border text-solar-muted hover:text-solar-text text-base flex items-center justify-center transition-all"
                      >+</button>
                    </div>

                    {/* Price + actions */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-heading text-solar-accent font-semibold">{fp(total)}</div>
                        {saving > 0 && (
                          <div className="text-[10px] text-solar-green">
                            You save {fp(saving)}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => toggleFavourite(p.id)}
                        className={`text-sm transition-colors ${favourites.includes(p.id) ? 'text-red-400' : 'text-solar-muted hover:text-red-400'}`}
                      >{favourites.includes(p.id) ? <Heart size={14} fill="currentColor"/> : <Heart size={14}/>}</button>
                      <button
                        onClick={() => removeFromCart(itemId)}
                        className="text-sm text-red-400/60 hover:text-red-400 transition-colors"
                      >✕</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="space-y-4">
            <div className="section-card p-5 sticky top-20">
              <h3 className="font-heading text-sm font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2.5 text-sm mb-4">
                <div className="flex justify-between text-solar-muted">
                  <span>Subtotal ({totalQty} item{totalQty !== 1 ? 's' : ''})</span>
                  <span>{fp(subtotal + totalSavings)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-solar-green">
                    <span className="flex items-center gap-1">Volume discounts</span>
                    <span>−{fp(totalSavings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-solar-muted">
                  <span>Delivery</span>
                  <span className="text-solar-dim">At checkout</span>
                </div>
                <hr className="border-solar-border my-2" />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span className="font-heading text-solar-accent text-lg">{fp(subtotal)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="bg-solar-green/10 border border-solar-green/20 rounded-xl p-2.5 text-xs text-solar-green text-center font-medium">
                    You're saving {fp(totalSavings)} on this order!
                  </div>
                )}
              </div>
              <button onClick={() => nav('/checkout')} className="btn-primary w-full py-3">
                Checkout →
              </button>
              <Link to="/marketplace" className="btn-ghost w-full mt-2 text-sm text-center block">
                Continue Shopping
              </Link>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
