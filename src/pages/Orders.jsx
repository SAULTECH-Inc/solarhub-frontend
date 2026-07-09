import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ordersService, deliveryService } from '../services/commerce.service';
import { useApp } from '../context/AppContext';
import { ORDER_STEPS } from '../context/AppContext';
import SEO from '../components/SEO';
import { Package, MapPin, MessageCircle, Star, Zap, AlertCircle, Shield, Loader2 } from 'lucide-react';
import api from '../lib/apiClient';
import { escrowService } from '../services/escrow.service';

const DISPUTE_CATEGORIES = {
  order: [
    { value:'item_not_received',     label:'Item Not Received' },
    { value:'item_not_as_described', label:'Item Not As Described' },
    { value:'damaged_item',          label:'Damaged Item' },
    { value:'logistics_issue',       label:'Logistics / Delivery Issue' },
    { value:'other',                 label:'Other' },
  ],
  payment: [
    { value:'unauthorized_charge', label:'Unauthorized Charge' },
    { value:'double_charge',       label:'Double Charge' },
    { value:'refund_not_issued',   label:'Refund Not Issued' },
    { value:'other',               label:'Other' },
  ],
  fraud: [
    { value:'scam_attempt',           label:'Scam Attempt' },
    { value:'off_platform_payment',   label:'Asked to Pay Outside Platform' },
    { value:'account_compromised',    label:'My Account Was Compromised' },
    { value:'fake_product',           label:'Counterfeit / Fake Product' },
  ],
  inquiry: [
    { value:'other', label:'General Inquiry or Complaint' },
  ],
};

function RaiseDisputeModal({ order, onClose }) {
  const [type,        setType]        = useState('order');
  const [category,    setCategory]    = useState('');
  const [subject,     setSubject]     = useState('');
  const [description, setDescription] = useState('');
  const [amount,      setAmount]      = useState('');
  const [loading,     setLoading]     = useState(false);
  const [done,        setDone]        = useState(false);
  const [error,       setError]       = useState('');

  const cats = DISPUTE_CATEGORIES[type] || [];

  async function submit(e) {
    e.preventDefault();
    if (!category || !subject.trim() || !description.trim()) {
      setError('Please fill all required fields'); return;
    }
    setLoading(true); setError('');
    try {
      await api.post('/disputes', {
        type, category, subject, description,
        orderId: order?.id,
        amountDisputed: amount ? Number(amount) : undefined,
      });
      setDone(true);
    } catch(err) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-solar-card border border-solar-border rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-solar-border sticky top-0 bg-solar-card">
          <h3 className="font-heading text-base font-semibold">Raise a Dispute / Report Issue</h3>
          <button onClick={onClose} className="text-solar-dim hover:text-solar-text text-xl leading-none">✕</button>
        </div>
        <div className="p-5">
          {done ? (
            <div className="text-center py-8 space-y-3">
              <div className="text-5xl">✅</div>
              <div className="font-heading text-lg font-semibold text-solar-text">Dispute Submitted</div>
              <p className="text-solar-muted text-sm">Our team will review your case and respond within 24–48 hours. You can track progress via support chat.</p>
              <button onClick={onClose} className="btn-primary mt-2">Close</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {order && (
                <div className="bg-solar-card2 rounded-lg px-3 py-2 text-xs text-solar-muted">
                  Order: <span className="font-mono text-solar-accent">{order.orderNumber}</span>
                </div>
              )}

              {/* Type */}
              <div>
                <label className="block text-xs text-solar-dim uppercase tracking-wider mb-2">Issue Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[['order','📦 Order'],['payment','💳 Payment'],['fraud','🚨 Fraud'],['inquiry','💬 Inquiry']].map(([v,l]) => (
                    <button type="button" key={v} onClick={() => { setType(v); setCategory(''); }}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${type===v?'border-solar-accent bg-solar-accent/10 text-solar-accent':'border-solar-border text-solar-muted hover:border-solar-border2'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs text-solar-dim uppercase tracking-wider mb-1.5">Category <span className="text-solar-red">*</span></label>
                <select className="solar-input" value={category} onChange={e => setCategory(e.target.value)} required>
                  <option value="">Select a category…</option>
                  {cats.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs text-solar-dim uppercase tracking-wider mb-1.5">Subject <span className="text-solar-red">*</span></label>
                <input className="solar-input" placeholder="Brief summary of the issue…"
                  value={subject} onChange={e => setSubject(e.target.value)} maxLength={200} required />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-solar-dim uppercase tracking-wider mb-1.5">Full Description <span className="text-solar-red">*</span></label>
                <textarea className="input-field w-full h-28 resize-none"
                  placeholder="Please describe what happened in detail — include dates, amounts, and any communication with the seller…"
                  value={description} onChange={e => setDescription(e.target.value)} required />
              </div>

              {/* Amount */}
              {(type === 'order' || type === 'payment') && (
                <div>
                  <label className="block text-xs text-solar-dim uppercase tracking-wider mb-1.5">Amount in Dispute (₦)</label>
                  <input type="number" className="solar-input" placeholder="Leave blank if not a financial dispute"
                    value={amount} onChange={e => setAmount(e.target.value)} min="0" />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-solar-red text-xs bg-solar-red/10 border border-solar-red/20 rounded-lg px-3 py-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '🎫 Submit Dispute'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
const fp = n => '₦' + Number(n).toLocaleString();

const STATUS_BADGE = {
  pending:       ['badge-blue', 'Placed'],
  confirmed:     ['badge-green','Confirmed'],
  processing:    ['badge-amber','Processing'],
  dispatched:    ['badge-amber','Dispatched'],
  in_transit:    ['badge-amber','In Transit'],
  out_delivery:  ['badge-amber','Out for Delivery'],
  delivered:     ['badge-green','Delivered'],
  cancelled:     ['badge-red',  'Cancelled'],
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
                {step.label}
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
  const { user, dispatch, escrowEnabled } = useApp();
  const nav = useNavigate();
  const { orderId } = useParams();
  const [orders,         setOrders]         = useState([]);
  const [selected,       setSelected]       = useState(orderId || null);
  const [loading,        setLoading]        = useState(true);
  const [selOrder,       setSelOrder]       = useState(null);
  const [disputeModal,   setDisputeModal]   = useState(false);
  const [escrowLoading,  setEscrowLoading]  = useState(false);
  const [existingEscrow, setExistingEscrow] = useState(null);

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
      // Check if escrow already exists for this order
      if (escrowEnabled) {
        escrowService.getByOrder(selected)
          .then(r => setExistingEscrow(r?.data ?? r))
          .catch(() => setExistingEscrow(null));
      }
    } else { setSelOrder(null); setExistingEscrow(null); }
  }, [selected, escrowEnabled]);

  if (!user) return (
    <div className="text-center py-24 text-solar-dim">
      <div className="flex justify-center mb-4"><Package size={48} className="opacity-30"/></div>
      <h2 className="font-heading text-lg mb-3">Sign in to view your orders</h2>
      <button onClick={() => dispatch({ type:'OPEN_AUTH', payload:'login' })} className="btn-primary">Sign In</button>
    </div>
  );

  if (loading) return <div className="max-w-[1100px] mx-auto px-5 py-10"><div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="section-card h-32 animate-pulse bg-solar-card2"/>)}</div></div>;

  if (!orders.length) return (
    <div className="text-center py-24 text-solar-dim">
      <div className="flex justify-center mb-4"><Package size={48} className="opacity-30"/></div>
      <h2 className="font-heading text-lg mb-3">No orders yet</h2>
      <Link to="/marketplace" className="btn-primary">Start Shopping</Link>
    </div>
  );

  return (
    <div className="max-w-[1100px] mx-auto px-5 py-10">
      <SEO title="My Orders" noindex />
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
              <h3 className="font-heading text-sm font-semibold mb-4">Live Tracking</h3>
              <TrackingView orderId={selected}/>
            </div>
            <div className="section-card p-5">
              <h3 className="font-heading text-sm font-semibold mb-4">Order Items</h3>
              <div className="space-y-3">
                {(selOrder.items || []).map(item => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <Zap size={20} className="text-solar-accent opacity-60 flex-shrink-0"/>
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
              <button onClick={() => dispatch({ type:'TOGGLE_CHAT' })} className="btn-outline w-full text-sm py-2 inline-flex items-center justify-center gap-1.5"><MessageCircle size={14}/>Chat Support</button>
              {selOrder.status === 'delivered' && <button className="btn-outline w-full text-sm py-2 inline-flex items-center justify-center gap-1.5"><Star size={14}/>Leave Review</button>}

              {/* Escrow: show if feature is on, order is unpaid, and no escrow yet */}
              {escrowEnabled && selOrder.paymentStatus === 'pending' && !existingEscrow && (
                <button
                  disabled={escrowLoading}
                  onClick={() => nav(`/escrow?orderId=${selOrder.id}`)}
                  className="btn-outline w-full text-sm py-2 inline-flex items-center justify-center gap-1.5 border-solar-accent/40 text-solar-accent hover:bg-solar-accent/10">
                  {escrowLoading ? <Loader2 size={14} className="animate-spin"/> : <Shield size={14}/>}
                  Pay with Escrow
                </button>
              )}
              {/* Show escrow status link if one exists */}
              {escrowEnabled && existingEscrow && (
                <button onClick={() => nav(`/escrow/${existingEscrow.id}`)}
                  className="btn-outline w-full text-sm py-2 inline-flex items-center justify-center gap-1.5 border-solar-accent/40 text-solar-accent hover:bg-solar-accent/10">
                  <Shield size={14}/>View Escrow
                </button>
              )}

              <button onClick={() => setDisputeModal(true)} className="w-full text-sm py-2 inline-flex items-center justify-center gap-1.5 text-solar-red border border-solar-red/30 rounded-lg hover:bg-solar-red/10 transition-all"><AlertCircle size={14}/>Raise a Dispute</button>
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
                  <div key={i} className="w-10 h-10 bg-solar-card2 rounded-lg flex items-center justify-center" title={item.productName}><Zap size={18} className="text-solar-accent opacity-60"/></div>
                ))}
              </div>
              <button onClick={() => setSelected(o.id)} className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"><MapPin size={13}/>Track Order</button>
            </div>
          ))}
        </div>
      )}

      {disputeModal && (
        <RaiseDisputeModal
          order={selOrder}
          onClose={() => setDisputeModal(false)}
        />
      )}
    </div>
  );
}
