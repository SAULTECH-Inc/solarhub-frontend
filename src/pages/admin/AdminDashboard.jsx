import { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import {
  Users, Package, ShoppingCart, TrendingUp,
  Clock, CheckCircle, XCircle, RefreshCw,
} from 'lucide-react';

function StatCard({ label, value, sub, icon: Icon, color = 'accent' }) {
  const colors = {
    accent: 'text-solar-accent bg-solar-accent/10',
    green:  'text-solar-green bg-solar-green/10',
    blue:   'text-solar-blue bg-solar-blue/10',
    red:    'text-solar-red bg-solar-red/10',
  };
  return (
    <div className="bg-solar-card border border-solar-border rounded-xl p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-solar-dim mb-1">{label}</p>
        <p className="text-2xl font-bold font-heading text-solar-text">{value ?? '—'}</p>
        {sub && <p className="text-xs text-solar-muted mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function RevenueChart({ data }) {
  if (!data?.length) return <p className="text-solar-dim text-sm">No revenue data yet.</p>;
  const max = Math.max(...data.map(d => d.amount), 1);
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div
            className="w-full bg-solar-accent/80 rounded-t-sm transition-all"
            style={{ height: `${(d.amount / max) * 100}%`, minHeight: d.amount ? 4 : 0 }}
          />
          <span className="text-[9px] text-solar-dim truncate w-full text-center">
            {d.date?.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}

const STATUS_COLOR = {
  pending:      'bg-solar-accent/10 text-solar-accent',
  confirmed:    'bg-solar-blue/10 text-solar-blue',
  processing:   'bg-solar-blue/10 text-solar-blue',
  dispatched:   'bg-solar-green/10 text-solar-green',
  delivered:    'bg-solar-green/10 text-solar-green',
  cancelled:    'bg-solar-red/10 text-solar-red',
};

export default function AdminDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const res = await adminService.getDashboard();
      setData(res?.data || res);
    } catch (e) {
      setError(e.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-7 h-7 border-2 border-solar-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="text-center py-16">
      <p className="text-solar-red mb-4">{error}</p>
      <button onClick={load} className="btn-primary text-sm">Retry</button>
    </div>
  );

  const { users, products, orders, payments, recentOrders = [], topProducts = [], revenueByDay = [] } = data || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-solar-text">Dashboard</h1>
          <p className="text-xs text-solar-dim mt-0.5">Platform overview</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-solar-muted hover:text-solar-text transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users"    value={users?.total?.toLocaleString()}    sub={`+${users?.newToday} today`}           icon={Users}        color="blue" />
        <StatCard label="Active Products" value={products?.active?.toLocaleString()} sub={`${products?.pending} pending review`} icon={Package}      color="accent" />
        <StatCard label="Total Orders"   value={orders?.total?.toLocaleString()}   sub={`${orders?.todayCount} today`}          icon={ShoppingCart} color="green" />
        <StatCard label="Revenue (NGN)"  value={`₦${(orders?.revenueNGN || 0).toLocaleString()}`} sub={`${payments?.successful} successful payments`} icon={TrendingUp} color="green" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Sellers',   value: users?.sellers,   icon: Users,        color: 'text-solar-blue'  },
          { label: 'Pending',   value: orders?.pending,  icon: Clock,        color: 'text-solar-accent'},
          { label: 'Delivered', value: orders?.delivered,icon: CheckCircle,  color: 'text-solar-green' },
          { label: 'Cancelled', value: orders?.cancelled, icon: XCircle,     color: 'text-solar-red'   },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-solar-surface border border-solar-border rounded-lg p-4 flex items-center gap-3">
            <Icon size={16} className={color} />
            <div>
              <p className="text-[10px] text-solar-dim">{label}</p>
              <p className="text-lg font-bold text-solar-text font-heading">{value ?? '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts + tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-solar-card border border-solar-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-solar-text mb-4">Revenue — Last 7 Days</h2>
          <RevenueChart data={revenueByDay} />
        </div>

        {/* Top products */}
        <div className="bg-solar-card border border-solar-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-solar-text mb-4">Top Products</h2>
          {topProducts.length === 0
            ? <p className="text-solar-dim text-xs">No sales yet.</p>
            : <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-solar-dim w-4">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-solar-text truncate">{p.name}</p>
                      <p className="text-[10px] text-solar-dim">{p.salesCount} sold</p>
                    </div>
                    <span className="text-xs font-semibold text-solar-accent whitespace-nowrap">
                      ₦{Number(p.revenue).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-solar-card border border-solar-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-solar-border">
          <h2 className="text-sm font-semibold text-solar-text">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-solar-border bg-solar-surface/50">
                {['Order #', 'Buyer', 'Total', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-solar-dim font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0
                ? <tr><td colSpan={5} className="text-center py-8 text-solar-dim">No orders yet</td></tr>
                : recentOrders.map(o => (
                    <tr key={o.id} className="border-b border-solar-border/50 hover:bg-solar-surface/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-solar-accent">{o.orderNumber}</td>
                      <td className="px-4 py-3 text-solar-text">
                        {o.buyer ? `${o.buyer.firstName} ${o.buyer.lastName}` : '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-solar-text">
                        ₦{Number(o.total).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${STATUS_COLOR[o.status] || 'bg-solar-border text-solar-muted'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-solar-dim">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
