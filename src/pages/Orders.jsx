import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ordersService, deliveryService } from '../services/commerce.service';
import { useApp } from '../context/AppContext';
import { ORDER_STEPS } from '../context/AppContext';

const fp = n => '₦' + Number(n).toLocaleString();

const STATUS_BADGE = {
  pending:       ['badge-blue', '📋 Placed'],
  confirmed:     ['badge-green','✅ Confirmed'],
  processing:    ['badge-amber','⚙️ Processing'],
  dispatched:    ['badge-amber','🏭 Dispatched'],
  in_transit:    ['badge-amber','🚚 In Transit'],
  out_delivery:  ['badge-amber','🛵 Out for Delivery'],
  delivered:     ['badge-green','✅ Delivered'],
  cancelled:     ['badge-red',  '❌ Cancelled'],
};

function TrackingView({ orderId }) {
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deliveryService.getTracking(orderId)
      .then(r => setTrack(r?.data ?? r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <div className="h-32 animate-pulse bg-solar-card2 rounded-xl"/>;
  if (!track) return null;

  const doneStatuses = (track.tracking || []).map(t => t.event);
  const eventToStatus = {
    order_placed:'pending', payment_confirmed:'confirmed', processing:'processing',
    dispatched:'dispatched', in_transit:'in_transit', out_for_delivery:'out_delivery', delivered:'delivered',
  };

  return (
    <div className="space-y-0">
      {ORDER_STEPS.map((step, i) => {
        const eventKey = Object.keys(eventToStatus).find(k => eventToStatus[k] === step.status);
        const isDone = doneStatuses.includes(eventKey);
        const isCurrent = track.order?.status === step.status;
        const isLast = i === ORDER_STEPS.length - 1;
        const trackEvt = track.tracking?.find(t => t.event === eventKey);
        return (
          <div key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`track-dot ${isDone ? 'done' : isCurrent ? 'on' : 'off'}`}/>
              {!isLast && <div className={`track-line ${isDone ? 'dn' : 'off'}`}/>}
            </div>
            <div className={`pb-4 flex-1 ${isLast ? 'pb-0' : ''}`}>
              <div className={`text-sm font-medium mt-0.5 ${isDone || isCurrent ? 'text-solar-text' : 'text-solar-dim'}`}>
                {step.icon} {step.label}
              </div>
              {trackEvt && <div className="text-xs text-solar-muted mt-1">{new Date(trackEvt.timestamp).toLocaleString()}</div>}
              {isCurrent && !isDone && <div className="text-xs text-solar-accent mt-1 animate-pulse-slow">In progress…</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Orders() {
  const { user, dispatch } = useApp();
  const nav = useNavigate();
  const { orderId } = useParams();
  const [orders,  setOrders]  = useState([]);
  const [selected,setSelected]= useState(orderId || null);
  const [loading, setLoading] = useState(true);
  const [selOrder,setSelOrder]= useState(null);

  useEffect(() => {
    if (!user) return;
    ordersService.getMyOrders(1, 20)
      .then(r => { const d = r?.data ?? r; setOrders(d?.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (selected) {
      ordersService.getById(selected)
        .then(r => setSelOrder(r?.data ?? r))
        .catch(() => {});
    } else { setSelOrder(null); }
  }, [selected]);

  if (!user) return (
    <div className="text-center py-24 text-solar-dim">
      <div className="text-5xl mb-4">📦</div>
      <h2 className="font-heading text-lg mb-3">Sign in to view your orders</h2>
      <button onClick={() => dispatch({ type:'OPEN_AUTH', payload:'login' })} className="btn-primary">Sign In</button>
    </div>
  );

  if (loading) return <div className="max-w-[1100px] mx-auto px-5 py-10"><div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="section-card h-32 animate-pulse bg-solar-card2"/>)}</div></div>;

  if (!orders.length) return (
    <div className="text-center py-24 text-solar-dim">
      <div className="text-5xl mb-4">📦</div>
      <h2 className="font-heading text-lg mb-3">No orders yet</h2>
      <Link to="/marketplace" className="btn-primary">Start Shopping</Link>
    </div>
  );

  return (
    <div className="max-w-[1100px] mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-2xl font-bold">My Orders</h1>
        {selected && <button onClick={() => setSelected(null)} className="btn-ghost text-sm">← All Orders</button>}
      </div>

      {selected && selOrder ? (
        <div className="grid md:grid-cols-[1fr_300px] gap-8 animate-slide-up">
          <div className="space-y-5">
            <div className="section-card p-5">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                  <div className="font-heading text-sm font-semibold">{selOrder.orderNumber}</div>
                  <div className="text-xs text-solar-muted mt-1">{new Date(selOrder.createdAt).toLocaleDateString('en-NG', {year:'numeric',month:'long',day:'numeric'})}</div>
                </div>
                <span className={STATUS_BADGE[selOrder.status]?.[0] || 'badge-blue'}>{STATUS_BADGE[selOrder.status]?.[1] || selOrder.status}</span>
              </div>
              {selOrder.estimatedDelivery && (
                <div className="text-sm"><div className="text-solar-dim text-xs mb-1">Estimated Delivery</div>
                <div className="font-medium text-solar-green">{new Date(selOrder.estimatedDelivery).toDateString()}</div></div>
              )}
            </div>
            <div className="section-card p-5">
              <h3 className="font-heading text-sm font-semibold mb-4">📍 Live Tracking</h3>
              <TrackingView orderId={selected}/>
            </div>
            <div className="section-card p-5">
              <h3 className="font-heading text-sm font-semibold mb-4">Order Items</h3>
              <div className="space-y-3">
                {(selOrder.items || []).map(item => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <span className="text-2xl">⚡</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium line-clamp-1">{item.productName}</div>
                      <div className="text-xs text-solar-muted">Qty: {item.quantity}</div>
                    </div>
                    <span className="font-heading text-solar-accent text-sm">{fp(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>
            {selOrder.deliveryAddress && (
              <div className="section-card p-5">
                <h3 className="font-heading text-sm font-semibold mb-2">Delivery Address</h3>
                <div className="text-sm text-solar-muted">
                  {selOrder.deliveryAddress.firstName} {selOrder.deliveryAddress.lastName}<br/>
                  {selOrder.deliveryAddress.address}, {selOrder.deliveryAddress.city}, {selOrder.deliveryAddress.state}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="section-card p-5">
              <h3 className="font-heading text-sm font-semibold mb-4">Payment Summary</h3>
              <div className="space-y-2 text-sm text-solar-muted">
                <div className="flex justify-between"><span>Subtotal</span><span>{fp(selOrder.subtotal)}</span></div>
                <div className="flex justify-between"><span>Delivery</span><span>{fp(selOrder.deliveryFee)}</span></div>
                <hr className="border-solar-border"/>
                <div className="flex justify-between font-semibold text-solar-text text-base">
                  <span>Total Paid</span><span className="font-heading text-solar-accent">{fp(selOrder.total)}</span>
                </div>
              </div>
            </div>
            <div className="section-card p-4 space-y-2">
              <button onClick={() => dispatch({ type:'TOGGLE_CHAT' })} className="btn-outline w-full text-sm py-2">💬 Chat Support</button>
              {selOrder.status === 'delivered' && <button className="btn-outline w-full text-sm py-2">⭐ Leave Review</button>}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="section-card p-5 hover:border-solar-border2 transition-colors card-hover">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                  <div className="font-heading text-sm font-semibold text-solar-accent">{o.orderNumber}</div>
                  <div className="text-xs text-solar-muted mt-1">{new Date(o.createdAt).toLocaleDateString('en-NG',{year:'numeric',month:'long',day:'numeric'})} · {(o.items||[]).length} item{(o.items||[]).length!==1?'s':''}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={STATUS_BADGE[o.status]?.[0]||'badge-blue'}>{STATUS_BADGE[o.status]?.[1]||o.status}</span>
                  <span className="font-heading text-solar-accent font-semibold">{fp(o.total)}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap mb-4">
                {(o.items||[]).slice(0,3).map((item,i) => (
                  <div key={i} className="w-10 h-10 bg-solar-card2 rounded-lg flex items-center justify-center text-xl" title={item.productName}>⚡</div>
                ))}
              </div>
              <button onClick={() => setSelected(o.id)} className="btn-primary text-xs py-2 px-4">📍 Track Order</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
