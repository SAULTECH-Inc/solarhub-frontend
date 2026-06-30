import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deliveryService } from '../services/commerce.service';
import { ClipboardList, CheckCircle, Settings, Package, Truck, MapPin, PackageCheck, AlertTriangle, RotateCcw } from 'lucide-react';

const EVENT_META = {
  order_placed:      { icon: <ClipboardList size={16}/>, label: 'Order Placed',      color: 'text-blue-400',    dot: 'bg-blue-400'    },
  payment_confirmed: { icon: <CheckCircle size={16}/>,   label: 'Payment Confirmed', color: 'text-solar-green', dot: 'bg-solar-green'  },
  processing:        { icon: <Settings size={16}/>,      label: 'Processing',        color: 'text-purple-400',  dot: 'bg-purple-400'  },
  dispatched:        { icon: <Package size={16}/>,       label: 'Dispatched',        color: 'text-solar-accent',dot: 'bg-solar-accent' },
  in_transit:        { icon: <Truck size={16}/>,         label: 'In Transit',        color: 'text-sky-400',     dot: 'bg-sky-400'     },
  arrived_hub:       { icon: <Package size={16}/>,       label: 'Arrived at Hub',    color: 'text-cyan-400',    dot: 'bg-cyan-400'    },
  out_for_delivery:  { icon: <MapPin size={16}/>,        label: 'Out for Delivery',  color: 'text-orange-400',  dot: 'bg-orange-400'  },
  delivered:         { icon: <PackageCheck size={16}/>,  label: 'Delivered',         color: 'text-solar-green', dot: 'bg-solar-green'  },
  failed_delivery:   { icon: <AlertTriangle size={16}/>, label: 'Delivery Failed',   color: 'text-red-400',     dot: 'bg-red-400'     },
  returned:          { icon: <RotateCcw size={16}/>,     label: 'Returned',          color: 'text-solar-dim',   dot: 'bg-solar-dim'   },
};

function fmt(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function TrackingPage() {
  const { code: codeParam } = useParams();
  const navigate = useNavigate();

  const [code,    setCode]    = useState(codeParam || '');
  const [input,   setInput]   = useState(codeParam || '');
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (codeParam) fetch_(codeParam);
  }, [codeParam]);

  async function fetch_(trackCode) {
    setLoading(true); setError(''); setData(null);
    try {
      const res = await deliveryService.trackByCode(trackCode.trim().toUpperCase());
      setData(res);
      setCode(trackCode.trim().toUpperCase());
    } catch {
      setError('No shipment found for that tracking code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    if (!input.trim()) return;
    navigate(`/track/${input.trim().toUpperCase()}`, { replace: true });
    fetch_(input.trim());
  }

  const events      = data?.events || [];
  const latestEvent = events[events.length - 1];
  const latestMeta  = latestEvent ? EVENT_META[latestEvent.event] || {} : {};
  const progressPct = data?.progress ?? 0;

  return (
    <div className="max-w-[680px] mx-auto px-4 py-10 min-h-[70vh]">
      <h1 className="font-heading text-2xl md:text-3xl font-bold mb-1">Track Your Order</h1>
      <p className="text-solar-muted text-sm mb-7">Enter your tracking code to see live delivery status</p>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2.5 mb-8">
        <input
          value={input}
          onChange={e => setInput(e.target.value.toUpperCase())}
          placeholder="e.g. SH-TRK-ABC123"
          className="solar-input flex-1 font-mono tracking-wider text-sm"
        />
        <button type="submit" disabled={loading} className="btn-primary px-5 text-sm disabled:opacity-60 flex-shrink-0">
          {loading ? '…' : 'Track'}
        </button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="section-card p-5">
            <div className="flex flex-wrap justify-between gap-3 mb-5">
              <div>
                <div className="text-[10px] text-solar-dim uppercase tracking-widest mb-1">Tracking Code</div>
                <div className="font-mono font-bold text-lg tracking-wider text-solar-text">{code}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-solar-dim uppercase tracking-widest mb-1">Status</div>
                <span className={`font-bold text-sm ${latestMeta.color || 'text-solar-muted'}`}>
                  {latestMeta.icon} {latestMeta.label || 'Unknown'}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex justify-between text-[10px] text-solar-dim mb-2">
                <span>Order Placed</span>
                <span>{progressPct}% complete</span>
                <span>Delivered</span>
              </div>
              <div className="h-2 bg-solar-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-solar-green rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {data.estimatedDelivery && (
              <p className="text-xs text-solar-muted mt-3">
                Estimated delivery: <strong className="text-solar-text">{fmt(data.estimatedDelivery)}</strong>
              </p>
            )}
          </div>

          {/* Timeline */}
          <div className="section-card p-5">
            <h3 className="font-heading text-sm font-semibold mb-5">Shipment History</h3>

            {events.length === 0 ? (
              <p className="text-solar-dim text-sm text-center py-5">No tracking events yet.</p>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-6 bottom-6 w-px bg-solar-border" />

                {[...events].reverse().map((ev, idx) => {
                  const meta     = EVENT_META[ev.event] || { icon: <Package size={16}/>, label: ev.event, color: 'text-solar-muted', dot: 'bg-solar-dim' };
                  const isLatest = idx === 0;
                  return (
                    <div key={ev.id || idx} className="flex gap-4 mb-5 last:mb-0 relative">
                      {/* Circle */}
                      <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-base z-10
                        ${isLatest ? `${meta.dot} border-2 border-current` : 'bg-solar-surface border border-solar-border'}`}>
                        {meta.icon}
                      </div>
                      <div className="pt-1.5 min-w-0">
                        <p className={`font-semibold text-sm ${isLatest ? meta.color : 'text-solar-text'}`}>
                          {meta.label}
                        </p>
                        {ev.description && <p className="text-xs text-solar-muted mt-0.5">{ev.description}</p>}
                        {ev.location   && <p className="text-xs text-solar-dim mt-0.5 flex items-center gap-1"><MapPin size={10}/>{ev.location}</p>}
                        {ev.handlerName && <p className="text-xs text-solar-dim mt-0.5 flex items-center gap-1"><Truck size={10}/>{ev.handlerName}</p>}
                        <p className="text-[10px] text-solar-dim mt-1 uppercase tracking-wide">{fmt(ev.timestamp || ev.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
