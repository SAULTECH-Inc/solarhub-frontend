import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import SEO from '../components/SEO';
import { logisticsService } from '../services/logistics.service';
import {
  Truck, Users, Package, CheckCircle, XCircle, Clock, ArrowRight,
  MapPin, Phone, Star, BarChart2, Plus, RefreshCw, User, Bike,
  Car, AlertTriangle, ChevronDown,
} from 'lucide-react';

const STATUS_META = {
  pending:    { label: 'Pending',    color: 'text-yellow-400',    bg: 'bg-yellow-400/10',  icon: <Clock size={12}/> },
  accepted:   { label: 'Accepted',   color: 'text-blue-400',      bg: 'bg-blue-400/10',    icon: <CheckCircle size={12}/> },
  rejected:   { label: 'Rejected',   color: 'text-red-400',       bg: 'bg-red-400/10',     icon: <XCircle size={12}/> },
  picked_up:  { label: 'Picked Up',  color: 'text-solar-accent',  bg: 'bg-solar-accent/10',icon: <Package size={12}/> },
  in_transit: { label: 'In Transit', color: 'text-solar-accent',  bg: 'bg-solar-accent/10',icon: <Truck size={12}/> },
  delivered:  { label: 'Delivered',  color: 'text-solar-green',   bg: 'bg-solar-green/10', icon: <CheckCircle size={12}/> },
  failed:     { label: 'Failed',     color: 'text-red-400',       bg: 'bg-red-400/10',     icon: <XCircle size={12}/> },
};

const NEXT_STATUSES = {
  accepted:  ['picked_up'],
  picked_up: ['in_transit'],
  in_transit:['delivered', 'failed'],
};

const VEHICLE_ICONS = { motorcycle: <Bike size={14}/>, car: <Car size={14}/>, van: <Truck size={14}/>, truck: <Truck size={14}/>, bicycle: <Bike size={14}/>, other: <Package size={14}/> };

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.color} ${m.bg}`}>
      {m.icon}{m.label}
    </span>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="section-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-solar-accent">{icon}</span>
        <span className="text-xs text-solar-muted">{label}</span>
      </div>
      <div className="font-heading text-2xl font-bold">{value}</div>
      {sub && <div className="text-[11px] text-solar-dim mt-0.5">{sub}</div>}
    </div>
  );
}

function RejectModal({ shipmentId, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useApp();
  async function submit() {
    if (!reason.trim()) return;
    setSaving(true);
    try {
      await logisticsService.rejectShipment(shipmentId, { reason });
      toast('Shipment rejected', 'ok');
      onDone();
    } catch {
      toast('Failed to reject', 'err');
    } finally { setSaving(false); }
  }
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="section-card w-full max-w-sm p-5">
        <h3 className="font-heading font-semibold mb-3">Reject Shipment</h3>
        <textarea className="solar-input resize-none w-full mb-4" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for rejection…"/>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={submit} disabled={saving || !reason.trim()} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Rejecting…' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

function UpdateStatusModal({ shipment, agents, onClose, onDone }) {
  const [status, setStatus]  = useState('');
  const [note, setNote]      = useState('');
  const [location, setLoc]   = useState('');
  const [proof, setProof]    = useState('');
  const [saving, setSaving]  = useState(false);
  const { toast } = useApp();
  const nexts = NEXT_STATUSES[shipment.status] || [];

  async function submit() {
    if (!status) return;
    setSaving(true);
    try {
      await logisticsService.updateShipmentStatus(shipment.id, { status, note, location, proofOfDelivery: proof || undefined });
      toast('Status updated', 'ok');
      onDone();
    } catch {
      toast('Update failed', 'err');
    } finally { setSaving(false); }
  }
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="section-card w-full max-w-sm p-5 space-y-3">
        <h3 className="font-heading font-semibold">Update Delivery Status</h3>
        <div className="flex flex-wrap gap-2">
          {nexts.map(s => (
            <button key={s} type="button" onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${status === s ? 'bg-solar-accent text-white border-solar-accent' : 'border-solar-border text-solar-muted'}`}>
              {STATUS_META[s]?.label}
            </button>
          ))}
        </div>
        <input className="solar-input" value={location} onChange={e => setLoc(e.target.value)} placeholder="Current location (optional)"/>
        <textarea className="solar-input resize-none" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)"/>
        {status === 'delivered' && (
          <input className="solar-input" type="url" value={proof} onChange={e => setProof(e.target.value)} placeholder="Proof of delivery image URL (optional)"/>
        )}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={submit} disabled={saving || !status} className="btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Saving…' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddAgentModal({ onClose, onDone }) {
  const { toast } = useApp();
  const [form, setForm] = useState({ name:'', phone:'', email:'', vehicleType:'motorcycle', vehicleNumber:'', coverageAreas:[] });
  const [saving, setSaving] = useState(false);
  const [city, setCity] = useState('');
  const set = (k, v) => setForm(f => ({...f, [k]:v}));
  const addCity = () => { if (city.trim()) { set('coverageAreas', [...form.coverageAreas, city.trim()]); setCity(''); } };
  async function submit() {
    setSaving(true);
    try {
      await logisticsService.addAgent(form);
      toast('Agent added', 'ok');
      onDone();
    } catch (e) {
      toast(e?.response?.data?.message || 'Failed to add agent', 'err');
    } finally { setSaving(false); }
  }
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="section-card w-full max-w-md p-5 space-y-3">
        <h3 className="font-heading font-semibold">Add Delivery Agent</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-solar-muted mb-1 block">Name *</label><input className="solar-input" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Agent full name"/></div>
          <div><label className="text-xs text-solar-muted mb-1 block">Phone *</label><input className="solar-input" type="tel" value={form.phone} onChange={e=>set('phone',e.target.value)}/></div>
          <div><label className="text-xs text-solar-muted mb-1 block">Email</label><input className="solar-input" type="email" value={form.email} onChange={e=>set('email',e.target.value)}/></div>
          <div><label className="text-xs text-solar-muted mb-1 block">Vehicle *</label>
            <select className="solar-input" value={form.vehicleType} onChange={e=>set('vehicleType',e.target.value)}>
              {['motorcycle','car','van','truck','bicycle','other'].map(v=><option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="col-span-2"><label className="text-xs text-solar-muted mb-1 block">Vehicle Number</label><input className="solar-input" value={form.vehicleNumber} onChange={e=>set('vehicleNumber',e.target.value)} placeholder="e.g. LAG 123 XY"/></div>
        </div>
        <div>
          <label className="text-xs text-solar-muted mb-1 block">Coverage areas</label>
          <div className="flex gap-2">
            <input className="solar-input flex-1" value={city} onChange={e=>setCity(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addCity())} placeholder="City or area"/>
            <button type="button" onClick={addCity} className="btn-ghost px-3"><Plus size={14}/></button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {form.coverageAreas.map(c=>(
              <span key={c} className="flex items-center gap-1 bg-solar-accent/10 text-solar-accent text-xs px-2 py-0.5 rounded-full">
                {c}<button type="button" onClick={()=>set('coverageAreas',form.coverageAreas.filter(x=>x!==c))}><XCircle size={10}/></button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={submit} disabled={saving||!form.name||!form.phone} className="btn-primary flex-1 disabled:opacity-50">{saving?'Adding…':'Add Agent'}</button>
        </div>
      </div>
    </div>
  );
}

export default function LogisticsDashboard() {
  const nav = useNavigate();
  const { user, toast } = useApp();
  const [profile, setProfile] = useState(null);
  const [stats,   setStats]   = useState(null);
  const [shipments, setShipments] = useState([]);
  const [agents,    setAgents]    = useState([]);
  const [tab,       setTab]       = useState('shipments');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading,  setLoading]  = useState(true);
  const [modal, setModal]       = useState(null); // { type, data }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, st, sh] = await Promise.all([
        logisticsService.getMyProfile(),
        logisticsService.getMyStats(),
        logisticsService.getMyShipments(statusFilter ? { status: statusFilter } : {}),
      ]);
      setProfile(p.data);
      setStats(st.data);
      setShipments(sh.data?.data || sh.data || []);
      if (p.data?.type === 'company') {
        const ag = await logisticsService.getMyAgents();
        setAgents(ag.data || []);
      }
    } catch (e) {
      if (e?.response?.status === 404) nav('/become-logistics');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { if (user) load(); else nav('/'); }, [user, load]);

  async function acceptShipment(id) {
    try {
      await logisticsService.acceptShipment(id);
      toast('Shipment accepted', 'ok');
      load();
    } catch { toast('Failed to accept', 'err'); }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-solar-accent border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  const isCompany = profile?.type === 'company';

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <SEO title="Logistics Dashboard" />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-heading text-2xl font-bold">{profile?.name}</h1>
            {profile?.isVerified && <span className="text-[10px] bg-solar-green/20 text-solar-green px-2 py-0.5 rounded-full font-medium">Verified</span>}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
              profile?.status === 'active' ? 'bg-solar-green/10 text-solar-green'
              : profile?.status === 'pending' ? 'bg-yellow-400/10 text-yellow-400'
              : 'bg-red-400/10 text-red-400'
            }`}>{profile?.status}</span>
          </div>
          <p className="text-sm text-solar-muted capitalize">{profile?.type} logistics provider</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost px-3 py-2"><RefreshCw size={14}/></button>
          <button onClick={() => nav('/become-logistics')} className="btn-ghost px-3 py-2 text-xs">Edit Profile</button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon={<Package size={16}/>} label="Total Shipments" value={stats.total ?? 0}/>
          <StatCard icon={<Clock size={16}/>} label="Pending" value={stats.pending ?? 0}/>
          <StatCard icon={<Truck size={16}/>} label="Active" value={stats.active ?? 0}/>
          <StatCard icon={<CheckCircle size={16}/>} label="Delivered" value={stats.delivered ?? 0}/>
        </div>
      )}

      {profile?.status === 'pending' && (
        <div className="flex items-center gap-2 p-3 bg-yellow-400/10 border border-yellow-400/25 rounded-xl text-sm text-yellow-400 mb-5">
          <AlertTriangle size={15}/>
          Your profile is under review. You can start accepting shipments once approved.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-solar-border mb-5">
        {[
          { id: 'shipments', label: 'Shipments', icon: <Truck size={14}/> },
          ...(isCompany ? [{ id: 'agents', label: `Agents (${agents.length})`, icon: <Users size={14}/> }] : []),
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all ${
              tab === t.id ? 'border-solar-accent text-solar-accent' : 'border-transparent text-solar-muted hover:text-solar-text'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Shipments tab */}
      {tab === 'shipments' && (
        <div>
          {/* Filter */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {['', 'pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'failed'].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); }}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs border transition-all ${
                  statusFilter === s ? 'bg-solar-accent text-white border-solar-accent' : 'border-solar-border text-solar-muted'
                }`}>
                {s === '' ? 'All' : STATUS_META[s]?.label}
              </button>
            ))}
          </div>

          {shipments.length === 0 ? (
            <div className="text-center py-14 text-solar-muted">
              <Truck size={36} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm">No shipments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shipments.map(s => (
                <div key={s.id} className="section-card p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-heading font-semibold text-sm">Order #{s.orderId?.slice(0, 8)}</span>
                        <StatusBadge status={s.status}/>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-solar-muted">
                        <MapPin size={10}/>
                        {s.pickupAddress?.city}, {s.pickupAddress?.state}
                        <ArrowRight size={10} className="mx-0.5"/>
                        delivery address in order
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-heading font-bold text-solar-accent">{s.currency} {Number(s.agreedRate).toLocaleString()}</div>
                      <div className="text-[10px] text-solar-dim">{new Date(s.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  {s.sellerNote && <p className="text-xs text-solar-muted bg-solar-surface rounded-lg p-2 mb-3 italic">"{s.sellerNote}"</p>}
                  <div className="flex items-center gap-2 flex-wrap">
                    {s.status === 'pending' && (
                      <>
                        <button onClick={() => acceptShipment(s.id)} className="btn-primary text-xs px-3 py-1.5">Accept</button>
                        <button onClick={() => setModal({ type: 'reject', data: s })} className="btn-ghost text-xs px-3 py-1.5 text-red-400 border-red-400/30">Reject</button>
                      </>
                    )}
                    {NEXT_STATUSES[s.status] && (
                      <button onClick={() => setModal({ type: 'status', data: s })} className="btn-primary text-xs px-3 py-1.5">Update Status</button>
                    )}
                    {isCompany && ['accepted', 'picked_up', 'in_transit'].includes(s.status) && !s.agentId && (
                      <button onClick={() => setModal({ type: 'agent', data: s })} className="btn-ghost text-xs px-3 py-1.5">Assign Agent</button>
                    )}
                    {s.agentId && (
                      <span className="text-xs text-solar-muted flex items-center gap-1"><User size={10}/>Agent assigned</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Agents tab (company only) */}
      {tab === 'agents' && isCompany && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setModal({ type: 'addAgent' })} className="btn-primary flex items-center gap-1.5 text-sm px-4 py-2">
              <Plus size={14}/>Add Agent
            </button>
          </div>
          {agents.length === 0 ? (
            <div className="text-center py-14 text-solar-muted">
              <Users size={36} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm">No agents yet. Add your first delivery agent.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {agents.map(a => (
                <div key={a.id} className="section-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-solar-accent/10 flex items-center justify-center flex-shrink-0">
                      {a.avatar ? <img src={a.avatar} className="w-10 h-10 rounded-full object-cover"/> : <User size={18} className="text-solar-accent"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm">{a.name}</span>
                        {a.isAvailable
                          ? <span className="w-1.5 h-1.5 rounded-full bg-solar-green"/>
                          : <span className="w-1.5 h-1.5 rounded-full bg-red-400"/>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-solar-muted mt-0.5">
                        <span className="flex items-center gap-1">{VEHICLE_ICONS[a.vehicleType] || <Truck size={11}/>}{a.vehicleType}</span>
                        <span className="flex items-center gap-1"><Phone size={10}/>{a.phone}</span>
                      </div>
                    </div>
                    <span className="text-xs text-solar-muted">{a.totalDeliveries} deliveries</span>
                  </div>
                  {a.coverageAreas?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {a.coverageAreas.slice(0, 3).map(c => (
                        <span key={c} className="text-[10px] bg-solar-surface px-2 py-0.5 rounded-full text-solar-dim">{c}</span>
                      ))}
                      {a.coverageAreas.length > 3 && <span className="text-[10px] text-solar-dim">+{a.coverageAreas.length - 3}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'reject' && (
        <RejectModal shipmentId={modal.data.id} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }}/>
      )}
      {modal?.type === 'status' && (
        <UpdateStatusModal shipment={modal.data} agents={agents} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }}/>
      )}
      {modal?.type === 'addAgent' && (
        <AddAgentModal onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }}/>
      )}
      {modal?.type === 'agent' && (
        <AssignAgentModal shipmentId={modal.data.id} agents={agents} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }}/>
      )}
    </div>
  );
}

function AssignAgentModal({ shipmentId, agents, onClose, onDone }) {
  const { toast } = useApp();
  const [agentId, setAgentId] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit() {
    setSaving(true);
    try {
      await logisticsService.assignAgent(shipmentId, { agentId });
      toast('Agent assigned', 'ok');
      onDone();
    } catch { toast('Failed', 'err'); } finally { setSaving(false); }
  }
  const avail = agents.filter(a => a.isAvailable && a.isActive);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="section-card w-full max-w-sm p-5 space-y-3">
        <h3 className="font-heading font-semibold">Assign Agent</h3>
        {avail.length === 0 ? <p className="text-sm text-solar-muted">No available agents.</p> : (
          <div className="space-y-2">
            {avail.map(a => (
              <label key={a.id} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer ${agentId === a.id ? 'border-solar-accent bg-solar-accent/5' : 'border-solar-border'}`}>
                <input type="radio" name="agent" value={a.id} checked={agentId === a.id} onChange={() => setAgentId(a.id)} className="accent-solar-accent"/>
                <div><div className="text-sm font-medium">{a.name}</div><div className="text-xs text-solar-muted">{a.vehicleType} · {a.phone}</div></div>
              </label>
            ))}
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={submit} disabled={saving || !agentId} className="btn-primary flex-1 disabled:opacity-50">{saving ? 'Assigning…' : 'Assign'}</button>
        </div>
      </div>
    </div>
  );
}
