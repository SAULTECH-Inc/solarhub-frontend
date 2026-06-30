import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { engineersService } from '../services/index';
import EngineerCard from '../components/EngineerCard';
import SEO from '../components/SEO';
import { Zap, Wrench } from 'lucide-react';

const SPECIALIZATIONS = [
  'Solar Panel Installation','Battery Systems','Inverter Setup',
  'Off-Grid Systems','Grid-Tie Systems','Hybrid Systems','Maintenance & Repair',
];

const STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

export default function Engineers() {
  const navigate = useNavigate();
  const [engineers, setEngineers]   = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);

  const [filters, setFilters] = useState({
    state: '', specialization: '', minRating: '', availableOnly: false, minYears: '',
  });
  const [search, setSearch] = useState('');

  function setF(key, val) { setFilters(f => ({ ...f, [key]: val })); setPage(1); }

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 16, ...filters };
    if (!params.state)          delete params.state;
    if (!params.specialization) delete params.specialization;
    if (!params.minRating)      delete params.minRating;
    if (!params.minYears)       delete params.minYears;
    if (!params.availableOnly)  delete params.availableOnly;

    engineersService.search(params)
      .then(r => {
        const d = r?.data ?? r;
        setEngineers(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
        setTotal(d?.total ?? 0);
      })
      .catch(() => setEngineers([]))
      .finally(() => setLoading(false));
  }, [page, filters]);

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-10">
      <SEO
        title="Hire Certified Solar Engineers in Nigeria"
        description={`Find and hire ${total || '300'}+ verified solar installation engineers across all 36 states in Nigeria. Compare profiles, ratings, and get instant quotes.`}
        canonical="/engineers"
        breadcrumbs={[{ name: 'Home', url: '/' }, { name: 'Solar Engineers' }]}
      />
      {/* Hero */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-solar-accent/10 border border-solar-accent/25 rounded-full px-4 py-1.5 mb-4">
          <Zap size={14} className="text-solar-accent"/>
          <span className="text-xs font-medium text-solar-accent tracking-wide uppercase">Verified Solar Engineers</span>
        </div>
        <h1 className="font-heading text-3xl md:text-5xl font-bold mb-4">
          Hire a <span className="text-solar-accent">Solar Engineer</span>
        </h1>
        <p className="text-solar-muted text-lg max-w-xl mx-auto leading-relaxed">
          Connect with certified solar installation engineers across Nigeria. Real professionals, real results.
        </p>
        <button onClick={() => navigate('/become-engineer')}
          className="mt-6 btn-outline text-sm gap-2 inline-flex items-center">
          <Wrench size={15}/> Register as an Engineer
        </button>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        {/* Filter sidebar */}
        <aside className="space-y-5">
          <div className="section-card p-5 space-y-5">
            <div className="font-heading text-xs font-semibold uppercase tracking-widest text-solar-accent">Filters</div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-solar-muted">State</label>
              <select value={filters.state} onChange={e => setF('state', e.target.value)} className="solar-input text-sm">
                <option value="">All States</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-solar-muted">Specialization</label>
              <select value={filters.specialization} onChange={e => setF('specialization', e.target.value)} className="solar-input text-sm">
                <option value="">All Specializations</option>
                {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-solar-muted">Min. Rating</label>
              <select value={filters.minRating} onChange={e => setF('minRating', e.target.value)} className="solar-input text-sm">
                <option value="">Any Rating</option>
                <option value="3">3★ & above</option>
                <option value="4">4★ & above</option>
                <option value="4.5">4.5★ & above</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-solar-muted">Min. Experience (years)</label>
              <select value={filters.minYears} onChange={e => setF('minYears', e.target.value)} className="solar-input text-sm">
                <option value="">Any Experience</option>
                <option value="1">1+ year</option>
                <option value="3">3+ years</option>
                <option value="5">5+ years</option>
                <option value="10">10+ years</option>
              </select>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={filters.availableOnly}
                onChange={e => setF('availableOnly', e.target.checked)}
                className="w-4 h-4 rounded accent-solar-accent" />
              <span className="text-sm text-solar-text">Available for hire only</span>
            </label>

            <button onClick={() => { setFilters({ state:'', specialization:'', minRating:'', availableOnly:false, minYears:'' }); setPage(1); }}
              className="btn-ghost text-xs w-full">
              ✕ Clear Filters
            </button>
          </div>

          {/* Stats */}
          <div className="section-card p-5 space-y-3">
            <div className="font-heading text-xs font-semibold uppercase tracking-widest text-solar-muted">Platform Stats</div>
            {[
              { val: total, label: 'Registered Engineers' },
              { val: '38',  label: 'States Covered' },
              { val: '4.7★',label: 'Avg. Client Rating' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs text-solar-muted">{s.label}</span>
                <span className="font-heading font-bold text-solar-accent text-sm">{s.val}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Grid */}
        <div>
          {/* Results bar */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-solar-muted">
              {loading ? 'Loading…' : `${total} engineer${total !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="section-card h-52 animate-pulse bg-solar-card2" />
              ))}
            </div>
          ) : engineers.length === 0 ? (
            <div className="text-center py-20 text-solar-dim">
              <div className="flex justify-center mb-4"><Wrench size={48} className="text-solar-dim opacity-40"/></div>
              <p className="font-heading text-lg mb-2">No engineers found</p>
              <p className="text-sm mb-6">Try adjusting your filters</p>
              <button onClick={() => navigate('/become-engineer')} className="btn-primary">
                Be the first in your area →
              </button>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {engineers.map(e => (
                  <EngineerCard key={e.id} engineer={e} onClick={id => navigate(`/engineers/${id}`)} />
                ))}
              </div>

              {/* Pagination */}
              {total > 16 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-ghost text-sm disabled:opacity-40">← Prev</button>
                  <span className="text-sm text-solar-muted py-2 px-3">Page {page} of {Math.ceil(total / 16)}</span>
                  <button disabled={page >= Math.ceil(total / 16)} onClick={() => setPage(p => p + 1)} className="btn-ghost text-sm disabled:opacity-40">Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
