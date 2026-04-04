import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const fp = n => '₦' + Number(n).toLocaleString();

export default function CartDrawer() {
  const { cart, cartOpen, cartTotal, dispatch, updateCartQty, removeFromCart } = useApp();
  const nav  = useNavigate();
  const items = cart?.items || [];

  return (
    <>
      {cartOpen && <div className="fixed inset-0 bg-black/60 z-[150] animate-fade-in" onClick={()=>dispatch({type:'SET_CART_OPEN',payload:false})}/>}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-solar-card border-l border-solar-border z-[160] flex flex-col transition-transform duration-300 ease-in-out shadow-2xl ${cartOpen?'translate-x-0':'translate-x-full'}`}>
        <div className="flex items-center justify-between p-5 border-b border-solar-border">
          <div>
            <h2 className="font-heading font-semibold text-base">Shopping Cart</h2>
            <p className="text-xs text-solar-muted mt-0.5">{items.length} item{items.length!==1?'s':''}</p>
          </div>
          <button onClick={()=>dispatch({type:'SET_CART_OPEN',payload:false})} className="text-solar-muted hover:text-solar-text bg-solar-surface rounded-lg w-8 h-8 flex items-center justify-center text-lg">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!items.length ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-solar-dim">
              <span className="text-5xl">🛒</span>
              <div className="font-heading text-sm">Your cart is empty</div>
              <button onClick={()=>{dispatch({type:'SET_CART_OPEN',payload:false});nav('/marketplace');}} className="btn-outline text-xs">Browse Products</button>
            </div>
          ) : items.map(({product:p, quantity:qty, id:itemId}) => p && (
            <div key={itemId||p.id} className="flex gap-3 bg-solar-surface border border-solar-border rounded-xl p-3">
              <div className="w-14 h-14 bg-solar-card2 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">{p.icon||'⚡'}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-solar-text line-clamp-2 leading-snug">{p.name}</p>
                <p className="font-heading text-solar-accent text-sm font-semibold mt-1">{fp(p.price)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={()=>updateCartQty(itemId||p.id,qty-1)} className="w-6 h-6 rounded bg-solar-card border border-solar-border text-solar-muted hover:text-solar-text text-sm flex items-center justify-center">−</button>
                  <span className="text-xs font-semibold w-4 text-center">{qty}</span>
                  <button onClick={()=>updateCartQty(itemId||p.id,qty+1)} className="w-6 h-6 rounded bg-solar-card border border-solar-border text-solar-muted hover:text-solar-text text-sm flex items-center justify-center">+</button>
                  <button onClick={()=>removeFromCart(itemId||p.id)} className="ml-auto text-xs text-red-400 hover:text-red-300">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {items.length>0&&(
          <div className="p-4 border-t border-solar-border space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-solar-muted text-sm">Subtotal</span>
              <span className="font-heading font-bold text-solar-accent text-lg">{fp(cartTotal)}</span>
            </div>
            <button onClick={()=>{dispatch({type:'SET_CART_OPEN',payload:false});nav('/checkout');}} className="btn-primary w-full py-3">Proceed to Checkout →</button>
            <button onClick={()=>{dispatch({type:'SET_CART_OPEN',payload:false});nav('/cart');}} className="btn-ghost w-full text-xs">View Full Cart</button>
          </div>
        )}
      </div>
    </>
  );
}
