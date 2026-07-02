import { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import { CheckCircle, XCircle, Star, StarOff, RefreshCw, Package } from 'lucide-react';

function ConfirmModal({ product, action, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-solar-card border border-solar-border rounded-xl p-6 w-full max-w-md animate-slide-up">
        <h3 className="font-heading font-bold text-solar-text mb-1 capitalize">{action} Product</h3>
        <p className="text-xs text-solar-muted mb-4 truncate">{product.name}</p>
        {action === 'reject' && (
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for rejection (optional)…"
            rows={3}
            className="w-full bg-solar-surface border border-solar-border rounded-lg px-3 py-2 text-xs text-solar-text placeholder-solar-dim focus:outline-none focus:border-solar-accent mb-4 resize-none"
          />
        )}
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-xs rounded-lg bg-solar-surface border border-solar-border text-solar-muted hover:text-solar-text transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className={`px-4 py-2 text-xs rounded-lg font-medium transition-colors ${
              action === 'approve'
                ? 'bg-solar-green/10 text-solar-green hover:bg-solar-green/20'
                : 'bg-solar-red/10 text-solar-red hover:bg-solar-red/20'
            }`}
          >
            {action === 'approve' ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [pending, setPending]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(null);
  const [confirm, setConfirm]   = useState(null); // { product, action }

  async function load() {
    setLoading(true);
    try {
      const res = await adminService.getPending();
      const d = res?.data || res;
      setPending(Array.isArray(d) ? d : d.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function moderate(product, action, reason) {
    setConfirm(null);
    setActing(product.id);
    try {
      await adminService.moderateProduct(product.id, action, reason);
      setPending(p => p.filter(x => x.id !== product.id));
    } catch (e) { console.error(e); }
    finally { setActing(null); }
  }

  async function toggleFeatured(product) {
    setActing(product.id);
    try {
      await adminService.setFeatured(product.id, !product.featured);
      setPending(p => p.map(x => x.id === product.id ? { ...x, featured: !x.featured } : x));
    } catch (e) { console.error(e); }
    finally { setActing(null); }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {confirm && (
        <ConfirmModal
          product={confirm.product}
          action={confirm.action}
          onConfirm={(reason) => moderate(confirm.product, confirm.action, reason)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold text-solar-text">Products</h1>
          <p className="text-xs text-solar-dim mt-0.5">Pending approval queue</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-solar-muted hover:text-solar-text transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading
        ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-solar-card border border-solar-border rounded-xl p-4 space-y-3 animate-pulse">
                <div className="h-32 bg-solar-border rounded-lg" />
                <div className="h-3 bg-solar-border rounded w-3/4" />
                <div className="h-3 bg-solar-border rounded w-1/2" />
              </div>
            ))}
          </div>
        : pending.length === 0
          ? (
            <div className="text-center py-20 bg-solar-card border border-solar-border rounded-xl">
              <Package size={40} className="text-solar-dim mx-auto mb-3" />
              <p className="text-solar-muted text-sm font-medium">No products awaiting approval</p>
              <p className="text-xs text-solar-dim mt-1">All caught up!</p>
            </div>
          )
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pending.map(p => (
                <div key={p.id} className="bg-solar-card border border-solar-border rounded-xl overflow-hidden flex flex-col">
                  {/* Image */}
                  <div className="relative h-40 bg-solar-surface flex items-center justify-center">
                    {p.thumbnail
                      ? <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                      : <Package size={36} className="text-solar-dim" />
                    }
                    {p.featured && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-solar-accent text-solar-bg text-[10px] font-bold rounded">
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-semibold text-solar-text line-clamp-2">{p.name}</p>
                      <p className="text-xs text-solar-dim mt-0.5">{p.brand}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-solar-accent">
                        ₦{Number(p.price).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-solar-dim capitalize">{p.category?.name || '—'}</span>
                    </div>
                    {p.seller && (
                      <p className="text-[10px] text-solar-muted">
                        Seller: {p.seller.firstName} {p.seller.lastName}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="mt-auto flex gap-2 flex-wrap">
                      <button
                        disabled={acting === p.id}
                        onClick={() => setConfirm({ product: p, action: 'approve' })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-solar-green/10 text-solar-green text-xs font-medium hover:bg-solar-green/20 disabled:opacity-40 transition-colors"
                      >
                        <CheckCircle size={13} /> Approve
                      </button>
                      <button
                        disabled={acting === p.id}
                        onClick={() => setConfirm({ product: p, action: 'reject' })}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-solar-red/10 text-solar-red text-xs font-medium hover:bg-solar-red/20 disabled:opacity-40 transition-colors"
                      >
                        <XCircle size={13} /> Reject
                      </button>
                      <button
                        disabled={acting === p.id}
                        onClick={() => toggleFeatured(p)}
                        title={p.featured ? 'Unfeature' : 'Feature'}
                        className="py-2 px-3 rounded-lg bg-solar-surface border border-solar-border text-solar-muted hover:text-solar-accent disabled:opacity-40 transition-colors"
                      >
                        {p.featured ? <StarOff size={13} /> : <Star size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
      }
    </div>
  );
}
