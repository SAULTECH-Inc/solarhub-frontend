import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import SEO from '../components/SEO';
import { logisticsService } from '../services/logistics.service';
import {
  Truck, MapPin, Star, Building2, User, Bike, Car, Package,
  Search, Filter, CheckCircle, X, Phone, Clock, ChevronRight,
} from 'lucide-react';

const NG_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

const VEHICLE_ICONS = {
  motorcycle: <Bike size={12}/>,
  car:        <Car size={12}/>,
  van:        <Truck size={12}/>,
  truck:      <Truck size={12}/>,
  bicycle:    <Bike size={12}/>,
  other:      <Package size={12}/>,
};

function ProviderCard({ provider, onAssign, orderMode }) {
  const rating = Number(provider.rating || 0).toFixed(1);
  return (
    <div className="section-card p-5 hover:border-solar-border2 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-solar-accent/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {provider.logo
            ? <img src={provider.logo} alt="" className="w-12 h-12 object-cover rounded-xl"/>
            : provider.type === 'company'
              ? <Building2 size={22} className="text-solar-accent"/>
              : <User size={22} className="text-solar-accent"/>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-semibold text-sm">{provider.name}</h3>
            {provider.isVerified && <CheckCircle size={13} className="text-solar-green flex-shrink-0"/>}
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${provider.type === 'company' ? 'bg-blue-400/10 text-blue-400' : 'bg-solar-accent/10 text-solar-accent'}`}>
              {provider.type === 'company' ? 'Company' : 'Individual'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-solar-muted">
            <span className="flex items-center gap-1">
              <Star size={10} className="text-yellow-400 fill-yellow-400"/>
              {rating} ({provider.totalRatings || 0})
            </span>
            <span className="flex items-center gap-1">
              <Package size={10}/>
              {provider.totalDeliveries || 0} deliveries
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-heading font-bold text-solar-accent text-sm">{provider.currency} {Number(provider.baseRate).toLocaleString()}</div>
          <div className="text-[10px] text-solar-dim">base rate</div>
        </div>
      </div>

      {provider.description && (
        <p className="text-xs text-solar-muted mb-3 line-clamp-2">{provider.description}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-3">
        {provider.vehicleTypes?.slice(0, 4).map(v => (
          <span key={v} className="flex items-center gap-1 text-[10px] bg-solar-surface px-2 py-0.5 rounded-full text-solar-dim capitalize">
            {VEHICLE_ICONS[v]}{v}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-1 text-xs text-solar-muted mb-4">
        <MapPin size={11}/>
        {provider.coverageStates?.slice(0, 4).join(', ')}
        {provider.coverageStates?.length > 4 && ` +${provider.coverageStates.length - 4} more`}
      </div>

      {orderMode
        ? <button onClick={() => onAssign(provider)} className="btn-primary w-full text-sm py-2">
            Assign this Provider
          </button>
        : <button onClick={() => onAssign(provider)} className="btn-ghost w-full text-sm py-2 flex items-center justify-center gap-1">
            View Details <ChevronRight size={13}/>
          </button>}
    </div>
  );
}

function AssignModal({ provider, orderId, onClose, onDone }) {
  const { user, toast } = useApp();
  const [form, setForm] = useState({
    agreedRate: provider.baseRate,
    currency:   provider.currency,
    sellerNote: '',
    estimatedPickup: '',
    pickupAddress: { address: '', city: '', state: '', phone: user?.phone || '', contactName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() },
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({...f, [k]: v}));
  const setPickup = (k, v) => setForm(f => ({...f, pickupAddress: {...f.pickupAddress, [k]: v}}));

  async function submit() {
    if (!form.pickupAddress.address || !form.pickupAddress.city || !form.pickupAddress.phone) {
      toast('Fill all pickup address fields', 'err'); return;
    }
    setSaving(true);
    try {
      await logisticsService.assignShipment({
        orderId,
        providerId: provider.id,
        agreedRate: parseFloat(form.agreedRate),
        currency: form.currency,
        sellerNote: form.sellerNote || undefined,
        estimatedPickup: form.estimatedPickup || undefined,
        pickupAddress: form.pickupAddress,
      });
      toast('Logistics provider assigned! They will confirm shortly.', 'ok');
      onDone();
    } catch (e) {
      toast(e?.response?.data?.message || 'Failed to assign', 'err');
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="section-card w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold">Assign {provider.name}</h3>
          <button onClick={onClose}><X size={16} className="text-solar-muted"/></button>
        </div>

        <div className="bg-solar-accent/5 border border-solar-accent/20 rounded-xl p-3">
          <div className="text-xs text-solar-muted mb-1">Shipping Order #{orderId?.slice(0,8)}</div>
          <div className="font-heading font-bold text-solar-accent">{provider.currency} {Number(provider.baseRate).toLocaleString()} base rate</div>
          {provider.ratePerKm && <div className="text-xs text-solar-muted">+ {provider.ratePerKm}/km</div>}
        </div>

        <div>
          <label className="text-xs font-medium text-solar-muted mb-1 block">Agreed Rate ({provider.currency}) *</label>
          <input className="solar-input" type="number" min="0" value={form.agreedRate} onChange={e => set('agreedRate', e.target.value)}/>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-solar-muted">Pickup Address *</p>
          <input className="solar-input" value={form.pickupAddress.address} onChange={e => setPickup('address', e.target.value)} placeholder="Street address"/>
          <div className="grid grid-cols-2 gap-2">
            <input className="solar-input" value={form.pickupAddress.city} onChange={e => setPickup('city', e.target.value)} placeholder="City"/>
            <input className="solar-input" value={form.pickupAddress.state} onChange={e => setPickup('state', e.target.value)} placeholder="State"/>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="solar-input" type="tel" value={form.pickupAddress.phone} onChange={e => setPickup('phone', e.target.value)} placeholder="Contact phone"/>
            <input className="solar-input" value={form.pickupAddress.contactName} onChange={e => setPickup('contactName', e.target.value)} placeholder="Contact name"/>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-solar-muted mb-1 block">Estimated pickup date</label>
          <input className="solar-input" type="date" value={form.estimatedPickup} onChange={e => set('estimatedPickup', e.target.value)}/>
        </div>

        <div>
          <label className="text-xs font-medium text-solar-muted mb-1 block">Note to provider</label>
          <textarea className="solar-input resize-none" rows={2} value={form.sellerNote} onChange={e => set('sellerNote', e.target.value)} placeholder="Special instructions…"/>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Assigning…' : 'Confirm Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LogisticsProviders() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { user, dispatch, toast } = useApp();

  const [providers, setProviders] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [modal,     setModal]     = useState(null);
  const [filters,   setFilters]   = useState({ state: '', type: '', vehicleType: '' });
  const [showFilter, setShowFilter] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) };
      const res = await logisticsService.listProviders(params);
      setProviders(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch {
      toast('Failed to load providers', 'err');
    } finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  function handleAssign(provider) {
    if (orderId) {
      if (!user) { dispatch({ type: 'OPEN_AUTH', payload: 'login' }); return; }
      setModal({ provider });
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <SEO title="Logistics Providers" />

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-1">Logistics Providers</h1>
          {orderId
            ? <p className="text-sm text-solar-muted">Select a provider to handle delivery for order <span className="text-solar-accent font-medium">#{orderId.slice(0,8)}</span></p>
            : <p className="text-sm text-solar-muted">Verified dispatch agents and logistics companies</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilter(f => !f)} className={`btn-ghost flex items-center gap-1.5 text-sm px-3 py-2 ${showFilter ? 'border-solar-accent text-solar-accent' : ''}`}>
            <Filter size={13}/>Filters
          </button>
          {!orderId && user?.isLogistics && (
            <button onClick={() => nav('/logistics/dashboard')} className="btn-primary text-sm px-3 py-2">My Dashboard</button>
          )}
          {!user?.isLogistics && (
            <button onClick={() => nav('/become-logistics')} className="btn-ghost text-sm px-3 py-2">Register as Provider</button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilter && (
        <div className="section-card p-4 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-solar-muted mb-1 block">State</label>
            <select className="solar-input" value={filters.state} onChange={e => setFilters(f => ({...f, state: e.target.value}))}>
              <option value="">All states</option>
              {NG_STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-solar-muted mb-1 block">Provider type</label>
            <select className="solar-input" value={filters.type} onChange={e => setFilters(f => ({...f, type: e.target.value}))}>
              <option value="">All types</option>
              <option value="individual">Individual Agent</option>
              <option value="company">Logistics Company</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-solar-muted mb-1 block">Vehicle type</label>
            <select className="solar-input" value={filters.vehicleType} onChange={e => setFilters(f => ({...f, vehicleType: e.target.value}))}>
              <option value="">Any vehicle</option>
              {['motorcycle','car','van','truck','bicycle','other'].map(v => <option key={v} value={v} className="capitalize">{v}</option>)}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-solar-accent border-t-transparent rounded-full animate-spin"/>
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-16 text-solar-muted">
          <Truck size={40} className="mx-auto mb-3 opacity-30"/>
          <p className="font-medium mb-1">No providers found</p>
          <p className="text-sm">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-solar-muted mb-4">{total} provider{total !== 1 ? 's' : ''} available</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map(p => (
              <ProviderCard key={p.id} provider={p} onAssign={handleAssign} orderMode={!!orderId}/>
            ))}
          </div>
          {total > 12 && (
            <div className="flex justify-center gap-2 mt-6">
              <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="btn-ghost px-4 disabled:opacity-40">← Prev</button>
              <span className="flex items-center text-sm text-solar-muted px-3">Page {page} of {Math.ceil(total/12)}</span>
              <button disabled={page * 12 >= total} onClick={() => setPage(p => p+1)} className="btn-ghost px-4 disabled:opacity-40">Next →</button>
            </div>
          )}
        </>
      )}

      {modal && (
        <AssignModal
          provider={modal.provider}
          orderId={orderId}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); nav(`/orders/${orderId}`); }}
        />
      )}
    </div>
  );
}
