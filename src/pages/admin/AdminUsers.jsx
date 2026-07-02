import { useEffect, useState, useCallback } from 'react';
import { adminService } from '../../services/admin.service';
import { Search, RefreshCw, CheckCircle, Ban, ShieldCheck } from 'lucide-react';

const ROLE_COLOR = {
  admin:  'bg-solar-accent/10 text-solar-accent',
  seller: 'bg-solar-blue/10 text-solar-blue',
  buyer:  'bg-solar-green/10 text-solar-green',
};
const STATUS_COLOR = {
  active:   'bg-solar-green/10 text-solar-green',
  pending:  'bg-solar-accent/10 text-solar-accent',
  banned:   'bg-solar-red/10 text-solar-red',
  inactive: 'bg-solar-border text-solar-muted',
};

export default function AdminUsers() {
  const [users, setUsers]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(null);
  const [search, setSearch]   = useState('');
  const [role, setRole]       = useState('');
  const [status, setStatus]   = useState('');
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers(page, LIMIT, {
        ...(search && { search }),
        ...(role   && { role }),
        ...(status && { status }),
      });
      const d = res?.data || res;
      setUsers(d.data || d.users || d || []);
      setTotal(d.total ?? (d.data?.length ?? 0));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, role, status]);

  useEffect(() => { load(); }, [load]);

  async function setUserStatus(id, newStatus) {
    setActing(id);
    try {
      await adminService.updateStatus(id, newStatus);
      setUsers(u => u.map(x => x.id === id ? { ...x, status: newStatus } : x));
    } catch (e) { console.error(e); }
    finally { setActing(null); }
  }

  async function verifySeller(id, approved) {
    setActing(id);
    try {
      await adminService.verifySeller(id, approved);
      setUsers(u => u.map(x => x.id === id ? { ...x, sellerVerified: approved } : x));
    } catch (e) { console.error(e); }
    finally { setActing(null); }
  }

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-xl font-bold text-solar-text">Users</h1>
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
            placeholder="Search name or email…"
            className="w-full bg-solar-card border border-solar-border rounded-lg pl-8 pr-3 py-2 text-xs text-solar-text placeholder-solar-dim focus:outline-none focus:border-solar-accent"
          />
        </div>
        <select
          value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
          className="bg-solar-card border border-solar-border rounded-lg px-3 py-2 text-xs text-solar-text focus:outline-none focus:border-solar-accent"
        >
          <option value="">All roles</option>
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="bg-solar-card border border-solar-border rounded-lg px-3 py-2 text-xs text-solar-text focus:outline-none focus:border-solar-accent"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-solar-card border border-solar-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-solar-border bg-solar-surface/50">
                {['User', 'Role', 'Status', 'Seller', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-solar-dim font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-solar-border/40">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-3 bg-solar-border rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : users.length === 0
                  ? <tr><td colSpan={6} className="text-center py-10 text-solar-dim">No users found</td></tr>
                  : users.map(u => (
                      <tr key={u.id} className="border-b border-solar-border/40 hover:bg-solar-surface/40 transition-colors">
                        {/* User */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-solar-accent/20 flex items-center justify-center text-solar-accent text-[10px] font-bold flex-shrink-0">
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-solar-text truncate max-w-[140px]">{u.firstName} {u.lastName}</p>
                              <p className="text-[10px] text-solar-dim truncate max-w-[140px]">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Role */}
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${ROLE_COLOR[u.role] || 'bg-solar-border text-solar-muted'}`}>
                            {u.role}
                          </span>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${STATUS_COLOR[u.status] || 'bg-solar-border text-solar-muted'}`}>
                            {u.status}
                          </span>
                        </td>
                        {/* Seller verified */}
                        <td className="px-4 py-3">
                          {u.role === 'seller'
                            ? u.sellerVerified
                              ? <span className="flex items-center gap-1 text-solar-green text-[10px]"><ShieldCheck size={11}/> Verified</span>
                              : <span className="text-[10px] text-solar-dim">Unverified</span>
                            : <span className="text-[10px] text-solar-border">—</span>
                          }
                        </td>
                        {/* Joined */}
                        <td className="px-4 py-3 text-solar-dim whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {u.status !== 'banned'
                              ? <button
                                  disabled={acting === u.id}
                                  onClick={() => setUserStatus(u.id, 'banned')}
                                  className="flex items-center gap-1 px-2 py-1 rounded bg-solar-red/10 text-solar-red text-[10px] hover:bg-solar-red/20 disabled:opacity-40 transition-colors"
                                >
                                  <Ban size={10}/> Ban
                                </button>
                              : <button
                                  disabled={acting === u.id}
                                  onClick={() => setUserStatus(u.id, 'active')}
                                  className="flex items-center gap-1 px-2 py-1 rounded bg-solar-green/10 text-solar-green text-[10px] hover:bg-solar-green/20 disabled:opacity-40 transition-colors"
                                >
                                  <CheckCircle size={10}/> Activate
                                </button>
                            }
                            {u.role === 'seller' && !u.sellerVerified && (
                              <button
                                disabled={acting === u.id}
                                onClick={() => verifySeller(u.id, true)}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-solar-accent/10 text-solar-accent text-[10px] hover:bg-solar-accent/20 disabled:opacity-40 transition-colors"
                              >
                                <ShieldCheck size={10}/> Verify
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
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
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 text-xs rounded bg-solar-surface border border-solar-border text-solar-muted disabled:opacity-40 hover:text-solar-text transition-colors"
              >
                Prev
              </button>
              <button
                disabled={page === pages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 text-xs rounded bg-solar-surface border border-solar-border text-solar-muted disabled:opacity-40 hover:text-solar-text transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
