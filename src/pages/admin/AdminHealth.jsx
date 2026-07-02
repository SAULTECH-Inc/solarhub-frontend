import { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import { RefreshCw, Database, Server, Cpu, MemoryStick } from 'lucide-react';

function HealthDot({ ok }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-solar-green' : 'bg-solar-red'}`} />
  );
}

export default function AdminHealth() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await adminService.getHealth();
      setData(res?.data || res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const mem = data?.memory;
  const toMB = (b) => b ? `${(b / 1024 / 1024).toFixed(1)} MB` : '—';

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-solar-text">System Health</h1>
          <p className="text-xs text-solar-dim mt-0.5">Auto-refreshes every 30s</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-solar-muted hover:text-solar-text transition-colors">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-solar-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Overall status */}
          <div className="md:col-span-2 bg-solar-card border border-solar-border rounded-xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
              data?.status === 'healthy' ? 'bg-solar-green/10' : 'bg-solar-red/10'
            }`}>
              {data?.status === 'healthy' ? '✓' : '!'}
            </div>
            <div>
              <p className="font-heading font-bold text-lg text-solar-text capitalize">{data?.status || '—'}</p>
              <p className="text-xs text-solar-dim">
                Uptime: {data?.uptime ? `${Math.floor(data.uptime / 3600)}h ${Math.floor((data.uptime % 3600) / 60)}m` : '—'}
                &nbsp;·&nbsp; Node {data?.nodeVersion}
              </p>
              <p className="text-[10px] text-solar-dim mt-0.5">{data?.timestamp}</p>
            </div>
          </div>

          {/* Database */}
          <div className="bg-solar-card border border-solar-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Database size={16} className="text-solar-blue" />
              <h3 className="text-sm font-semibold text-solar-text">Database</h3>
              <HealthDot ok={data?.database === 'connected'} />
            </div>
            <p className={`text-sm font-medium capitalize ${data?.database === 'connected' ? 'text-solar-green' : 'text-solar-red'}`}>
              {data?.database || '—'}
            </p>
          </div>

          {/* Redis */}
          <div className="bg-solar-card border border-solar-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Server size={16} className="text-solar-accent" />
              <h3 className="text-sm font-semibold text-solar-text">Redis Cache</h3>
              <HealthDot ok={data?.redis === 'connected'} />
            </div>
            <p className={`text-sm font-medium capitalize ${data?.redis === 'connected' ? 'text-solar-green' : 'text-solar-red'}`}>
              {data?.redis || '—'}
            </p>
          </div>

          {/* Memory */}
          {mem && (
            <div className="md:col-span-2 bg-solar-card border border-solar-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <MemoryStick size={16} className="text-solar-green" />
                <h3 className="text-sm font-semibold text-solar-text">Memory Usage</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Heap Used',   value: toMB(mem.heapUsed) },
                  { label: 'Heap Total',  value: toMB(mem.heapTotal) },
                  { label: 'RSS',         value: toMB(mem.rss) },
                  { label: 'External',    value: toMB(mem.external) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-solar-surface rounded-lg p-3">
                    <p className="text-[10px] text-solar-dim mb-1">{label}</p>
                    <p className="text-sm font-bold text-solar-text font-heading">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
