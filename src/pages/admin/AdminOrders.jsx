import { useEffect, useState, useCallback } from 'react';
import { adminService } from '../../services/admin.service';
import { RefreshCw, ChevronRight, Search } from 'lucide-react';

const STATUS_COLOR = {
  pending:      'bg-solar-accent/10 text-solar-accent',
  confirmed:    'bg-solar-blue/10 text-solar-blue',
  processing:   'bg-solar-blue/10 text-solar-blue',
  dispatched:   'bg-solar-green/10 text-solar-green',
  in_transit:   'bg-solar-green/10 text-solar-green',
  out_delivery: 'bg-solar-green/10 text-solar-green',
  delivered:    'bg-solar-green/10 text-solar-green',
  cancelled:    'bg-solar-red/10 text-solar-red',
  refunded:     'bg-solar-dim/10 text-solar-muted',
};

const STATUSES = ['pending','confirmed','processing','dispatched','in_transit','out_delivery','delivered','cancelled'];

export default function AdminOrders() {
  const [orders, setOrders]   = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(null);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [expanded, setExpanded] = useState(null);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getOrders(page, LIMIT, {
        ...(search && { search }),
        ...(status && { status }),
      });
      const d = res?.data || res;
      setOrders(d.data || d.orders || d || []);
      setTotal(d.total ?? 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  async function advance(id) {
    setActing(id);
    try {
      const res = await adminService.advanceOrder(id);
      const updated = res?.data || res;
      setOrders(o => o.map(x => x.id === id ? { ...x, ...updated } : x));
    } catch (e) { console.error(e); }
    finally { setActing(null); }
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold text-solar-text">Orders</h1>
          <p className="text-xs text-solar-dim mt-0.5">{total.toLocaleString()} total</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-solar-muted hover:text-solar-text transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-solar-dim" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search order number…"
            className="w-full bg-solar-card border border-solar-border rounded-lg pl-8 pr-3 py-2 text-xs text-solar-text placeholder-solar-dim focus:outline-none focus:border-solar-accent"
          />
        </div>
        <select
          value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="bg-solar-card border border-solar-border rounded-lg px-3 py-2 text-xs text-solar-text focus:outline-none focus:border-solar-accent"
        >
          <option value="">All status</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-solar-card border border-solar-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-solar-border bg-solar-surface/50">
                {['', 'Order #', 'Buyer', 'Items', 'Total', 'Status', 'Payment', 'Date', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-solar-dim font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-solar-border/40">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-solar-border rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : orders.length === 0
                  ? <tr><td colSpan={9} className="text-center py-10 text-solar-dim">No orders found</td></tr>
                  : orders.map(o => (
                      <>
                        <tr
                          key={o.id}
                          className="border-b border-solar-border/40 hover:bg-solar-surface/40 transition-colors cursor-pointer"
                          onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                        >
                          {/* Expand toggle */}
                          <td className="px-3 py-3">
                            <ChevronRight
                              size={13}
                              className={`text-solar-dim transition-transform ${expanded === o.id ? 'rotate-90' : ''}`}
                            />
                          </td>
                          <td className="px-4 py-3 font-mono text-solar-accent font-semibold whitespace-nowrap">
                            {o.orderNumber}
                          </td>
                          <td className="px-4 py-3 text-solar-text whitespace-nowrap">
                            {o.buyer ? `${o.buyer.firstName} ${o.buyer.lastName}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-solar-muted">{o.items?.length ?? '—'}</td>
                          <td className="px-4 py-3 font-semibold text-solar-text whitespace-nowrap">
                            ₦{Number(o.total).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${STATUS_COLOR[o.status] || 'bg-solar-border text-solar-muted'}`}>
                              {o.status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${
                              o.paymentStatus === 'paid' ? 'bg-solar-green/10 text-solar-green' : 'bg-solar-accent/10 text-solar-accent'
                            }`}>
                              {o.paymentStatus || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-solar-dim whitespace-nowrap">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            {!['delivered','cancelled','refunded'].includes(o.status) && (
                              <button
                                disabled={acting === o.id}
                                onClick={() => advance(o.id)}
                                className="px-3 py-1 rounded bg-solar-accent/10 text-solar-accent text-[10px] font-medium hover:bg-solar-accent/20 disabled:opacity-40 transition-colors whitespace-nowrap"
                              >
                                {acting === o.id ? '…' : 'Advance'}
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Expanded row */}
                        {expanded === o.id && (
                          <tr key={`${o.id}-exp`} className="border-b border-solar-border bg-solar-surface/20">
                            <td colSpan={9} className="px-6 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                {/* Delivery */}
                                <div>
                                  <p className="text-solar-dim mb-1 font-medium">Delivery Address</p>
                                  {o.shippingAddress
                                    ? <p className="text-solar-muted">{[o.shippingAddress.street, o.shippingAddress.city, o.shippingAddress.state].filter(Boolean).join(', ')}</p>
                                    : <p className="text-solar-dim">—</p>
                                  }
                                </div>
                                {/* Items */}
                                <div className="md:col-span-2">
                                  <p className="text-solar-dim mb-1 font-medium">Items</p>
                                  <div className="space-y-1">
                                    {(o.items || []).map((item, i) => (
                                      <div key={i} className="flex items-center justify-between">
                                        <span className="text-solar-muted truncate max-w-xs">{item.productName || item.name} ×{item.quantity}</span>
                                        <span className="text-solar-text font-semibold ml-4">₦{Number(item.price * item.quantity).toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-4 py-3 border-t border-solar-border flex items-center justify-between">
            <span className="text-xs text-solar-dim">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-xs rounded bg-solar-surface border border-solar-border text-solar-muted disabled:opacity-40 hover:text-solar-text transition-colors">
                Prev
              </button>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-xs rounded bg-solar-surface border border-solar-border text-solar-muted disabled:opacity-40 hover:text-solar-text transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
