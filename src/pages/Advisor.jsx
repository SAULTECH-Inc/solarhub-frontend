import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { advisorService } from '../services/index';
import { APPL_DB, toWatts } from '../data/appliances';
import SEO from '../components/SEO';
import { Zap, Sun, BatteryFull, Plug, CheckCircle, XCircle, Wrench, ShoppingCart, Lightbulb, Check, X, Star, MapPin, ExternalLink } from 'lucide-react';
const fp = n => '₦' + Number(n).toLocaleString();

const STEPS = ['Appliances','Capacity','Preferences','Results'];

// Appliance picker
function AppliancePicker({ selected, onToggle, onAddCustom }) {
  const [q, setQ]       = useState('');
  const [open, setOpen] = useState(false);
  const boxRef          = useRef();

  useEffect(() => {
    const h = e => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const all  = Object.entries(APPL_DB).flatMap(([g, items]) => items.map(i => ({...i, group: g})));
  const filt = q ? all.filter(i => i.n.toLowerCase().includes(q.toLowerCase())) : null;
  const groups = filt
    ? Object.fromEntries(Object.entries(APPL_DB).map(([g, items]) => [g, items.filter(i => i.n.toLowerCase().includes(q.toLowerCase()))]).filter(([,v]) => v.length))
    : APPL_DB;

  function keydown(e) {
    if (e.key === 'Enter' && q.trim()) {
      if (!selected.find(s => s.n === q.trim())) onAddCustom(q.trim());
      setQ(''); setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <div onClick={() => { setOpen(true); boxRef.current?.querySelector('input')?.focus(); }}
        className={`min-h-[52px] bg-solar-surface border rounded-xl p-2.5 flex flex-wrap gap-1 cursor-text transition-colors ${open?'border-solar-accent':'border-solar-border hover:border-solar-border2'}`}>
        {selected.map(a => (
          <div key={a.n} className="chip">
            {a.n}
            <button onClick={e=>{e.stopPropagation();onToggle(a.n,a.suggestW);}} className="text-solar-accent opacity-60 hover:opacity-100 ml-1 text-base leading-none">×</button>
          </div>
        ))}
        <input value={q} onChange={e=>{setQ(e.target.value);setOpen(true);}} onFocus={()=>setOpen(true)} onKeyDown={keydown}
          placeholder={selected.length?'':'Search appliances…'} className="bg-transparent border-none outline-none text-sm text-solar-text flex-1 min-w-[140px] py-1"/>
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-solar-card border border-solar-border2 rounded-xl shadow-2xl max-h-72 overflow-y-auto z-50">
          {Object.entries(groups).length === 0 ? (
            <div className="p-5 text-center text-solar-dim text-sm">
              {q?<>No match — <button onClick={()=>{onAddCustom(q);setQ('');setOpen(false);}} className="btn-outline text-xs mt-2">+ Add "{q}"</button></>:'Start typing…'}
            </div>
          ) : Object.entries(groups).map(([grp,items]) => (
            <div key={grp}>
              <div className="px-4 py-2 text-[10.5px] font-semibold uppercase tracking-widest text-solar-dim bg-solar-card sticky top-0">{grp}</div>
              {items.map(item => {
                const sel = selected.some(s => s.n === item.n);
                return (
                  <div key={item.n} onClick={()=>onToggle(item.n,item.w)}
                    className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors text-sm ${sel?'bg-solar-accent/10 text-solar-accent':'hover:bg-solar-surface text-solar-text'}`}>
                    <span>{item.n}</span>
                    <span className="text-xs text-solar-dim">{item.w}W est.</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Capacity card per appliance
function CapCard({ appliance: a, onChange }) {
  const [qty,  setQty]  = useState(1);
  const [pow,  setPow]  = useState(a.suggestW||'');
  const [unit, setUnit] = useState('W');
  const [hrs,  setHrs]  = useState('');

  useEffect(() => {
    const w = toWatts(parseFloat(pow)||0, unit);
    const wh = hrs ? w * qty * parseFloat(hrs) : 0;
    onChange(a.n, { qty, w: parseFloat(pow)||0, unit, hrs: parseFloat(hrs)||0, calcW: w*qty, wh });
  }, [qty, pow, unit, hrs]);

  const tw = toWatts(parseFloat(pow)||0, unit) * qty;
  const wh = hrs ? Math.round(tw * parseFloat(hrs)) : 0;

  return (
    <div className="bg-solar-surface border border-solar-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 font-medium text-sm">
          <Zap size={14} className="text-solar-accent opacity-60 flex-shrink-0"/>{a.n}
          {a.suggestW&&<button onClick={()=>{setPow(String(a.suggestW));setUnit('W');}} className="text-[11px] border border-solar-border text-solar-dim hover:border-solar-accent hover:text-solar-accent px-2 py-0.5 rounded-full">Suggest {a.suggestW}W</button>}
        </div>
        <div className="font-heading text-sm text-solar-accent">{wh>0?`${wh.toLocaleString()} Wh/day`:tw>0?`${Math.round(tw).toLocaleString()}W`:'—'}</div>
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] text-solar-muted">Qty</label>
          <input type="number" value={qty} min="1" max="50" onChange={e=>setQty(parseInt(e.target.value)||1)} className="solar-input w-14 text-center text-sm py-2"/>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] text-solar-muted">Power</label>
          <input type="number" value={pow} placeholder="e.g. 150" onChange={e=>setPow(e.target.value)} className="solar-input w-24 text-sm py-2"/>
          <select value={unit} onChange={e=>setUnit(e.target.value)} className="solar-input w-16 text-sm py-2 px-1.5">
            <option>W</option><option>VA</option><option>kW</option><option>kVA</option><option>A</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-[11px] text-solar-muted whitespace-nowrap">Hrs/day</label>
          <input type="number" value={hrs} placeholder="optional" min="0" max="24" step="0.5" onChange={e=>setHrs(e.target.value)} className="solar-input w-28 text-sm py-2"/>
        </div>
      </div>
    </div>
  );
}

// Result detail renderer
function RecDetail({ rec, adjLoad }) {
  return (
    <div className="animate-slide-up space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="font-heading text-xl font-bold">{rec.title}</div>
          <p className="text-solar-muted text-sm mt-1">{rec.focus}</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(rec.pros||[]).map(p=><span key={p} className="badge-green text-[10.5px]">{p}</span>)}
          {(rec.cons||[]).map(c=><span key={c} className="badge-red text-[10.5px]">{c}</span>)}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[{l:'Daily Load',v:Math.round(adjLoad||0).toLocaleString(),u:'Wh/day',s:'inc. 25% losses'},
          {l:'System Voltage',v:rec.systemVoltage,u:'V DC',s:'bus voltage'},
          {l:'Usable Battery',v:(rec.batteries?.totalWhUsable||0).toLocaleString(),u:'Wh',s:`at ${rec.batteries?.type||''} DoD`},
          {l:'PV Array',v:rec.panels?.totalWattage||0,u:'W',s:`${rec.panels?.quantity}×${rec.panels?.wattageEach}W`}
        ].map(s=>(
          <div key={s.l} className="bg-solar-surface border border-solar-border rounded-xl p-3.5">
            <div className="text-[11px] uppercase tracking-widest text-solar-dim mb-1.5">{s.l}</div>
            <div className="font-heading text-lg font-semibold">{s.v} <span className="text-sm font-normal text-solar-muted">{s.u}</span></div>
            <div className="text-[11px] text-solar-muted mt-0.5">{s.s}</div>
          </div>
        ))}
      </div>
      {[{ico:<Sun size={20} className="text-solar-accent"/>,title:'Solar Panels',qty:`×${rec.panels?.quantity||0}`,tags:[`${rec.panels?.wattageEach||0}W each`,'amber',`${rec.panels?.totalWattage||0}W total`,'green',rec.panels?.type||'','blue'],note:rec.panels?.arrangement},
        {ico:<BatteryFull size={20} className="text-solar-accent"/>,title:'Batteries',qty:`×${rec.batteries?.quantity||0}`,tags:[`${rec.batteries?.capacityAhOrWh||`${rec.batteries?.capacityAh||0}Ah`} @ ${rec.batteries?.voltageEach||0}V`,'amber',rec.batteries?.type||'','green'],note:rec.batteries?.arrangement},
        {ico:<Zap size={20} className="text-solar-accent"/>,title:'Inverter',qty:`${rec.inverter?.capacityKva||0}kVA`,tags:[rec.inverter?.type||'','amber',`${rec.inverter?.dcInputVoltage||rec.systemVoltage}V DC`,'blue',rec.inverter?.hasBuiltInMppt?'MPPT built-in':'',rec.inverter?.hasBuiltInMppt?'green':'',rec.inverter?.hasGridFailover?'Grid failover':'',rec.inverter?.hasGridFailover?'green':''],note:rec.inverter?.model&&`Example: ${rec.inverter.model}`},
      ].map(card=>(
        <div key={card.title} className="bg-solar-surface border border-solar-border rounded-xl p-4">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="flex items-center">{card.ico}</span>
            <h4 className="font-heading text-sm font-semibold flex-1">{card.title}</h4>
            <span className="font-heading text-lg font-bold text-solar-accent">{card.qty}</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {card.tags.reduce((acc,v,i,arr)=>i%2===0&&v?[...acc,{t:v,c:arr[i+1]}]:acc,[]).map(({t,c})=>(
              <span key={t} className={`badge-${c||'blue'}`}>{t}</span>
            ))}
          </div>
          {card.note&&<p className="text-solar-muted text-xs mt-2">{card.note}</p>}
        </div>
      ))}
      {rec.chargeController ? (
        <div className="bg-solar-surface border border-solar-border rounded-xl p-4">
          <div className="flex items-center gap-2.5 mb-2"><Plug size={20} className="text-solar-accent flex-shrink-0"/><h4 className="font-heading text-sm font-semibold flex-1">Charge Controller</h4><span className="font-heading text-lg font-bold text-solar-accent">{rec.chargeController.currentA}A</span></div>
          <div className="flex gap-1.5"><span className="badge-green">{rec.chargeController.type||'MPPT'}</span><span className="badge-blue">Max {rec.chargeController.maxPvVoltage||150}V</span></div>
          {rec.chargeController.model&&<p className="text-solar-muted text-xs mt-2">Example: {rec.chargeController.model}</p>}
        </div>
      ) : (
        <div className="bg-solar-green/5 border border-solar-green/25 rounded-xl p-4 flex gap-3 items-start">
          <CheckCircle size={20} className="text-solar-green flex-shrink-0 mt-0.5"/>
          <div><div className="font-heading text-sm font-semibold text-solar-green">Charge Controller — Included</div>
          <p className="text-solar-muted text-xs mt-1">Built into the all-in-one hybrid inverter. No separate controller needed.</p></div>
        </div>
      )}
      <div className="bg-solar-card2 border border-solar-border2 rounded-xl p-5">
        <div className="text-xs text-solar-dim uppercase tracking-widest mb-2">Estimated Total Cost</div>
        <div className="font-heading text-2xl font-bold text-solar-accent mb-4">{fp(rec.estimatedCostNGN?.totalMin||0)} – {fp(rec.estimatedCostNGN?.totalMax||0)}</div>
        {['panels','batteries','inverter','controller','accessories'].map(k=>(
          <div key={k} className="flex justify-between text-sm py-2 border-b border-solar-border last:border-0">
            <span className="text-solar-muted capitalize">{k}</span>
            <span className="text-solar-text font-medium">{rec.estimatedCostNGN?.[k]||'—'}</span>
          </div>
        ))}
      </div>
      {(rec.warnings||[]).length>0&&<div className="bg-red-500/5 border border-red-500/25 rounded-xl p-4">{rec.warnings.map((w,i)=><div key={i} className="text-sm text-red-400">{w}</div>)}</div>}
      {(rec.notes||[]).length>0&&(
        <ul className="space-y-0">
          {rec.notes.map((n,i)=>(
            <li key={i} className="flex gap-2.5 py-2.5 border-b border-solar-border last:border-0 text-sm text-solar-muted">
              <span className="text-solar-accent">•</span>{n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Marketplace product card inside the drawer ──────────────
function ProductCard({ p }) {
  return (
    <a
      href={`/product/${p.slug}`}
      className="flex flex-col bg-solar-card2 border border-solar-border hover:border-solar-accent rounded-xl overflow-hidden transition-colors group"
    >
      {p.thumbnail
        ? <img src={p.thumbnail} alt={p.name} className="w-full h-32 object-cover"/>
        : <div className="w-full h-32 bg-solar-surface flex items-center justify-center text-solar-dim text-xs">No image</div>
      }
      <div className="p-3 flex flex-col gap-1 flex-1">
        <div className="text-xs font-medium text-solar-text line-clamp-2 leading-snug">{p.name}</div>
        {p.brand && <div className="text-[10px] text-solar-dim">{p.brand}</div>}
        <div className="font-heading text-sm font-bold text-solar-accent mt-auto">
          ₦{p.price.toLocaleString()}
        </div>
        {p.averageRating > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-solar-dim">
            <Star size={10} className="text-solar-accent fill-solar-accent"/>
            {Number(p.averageRating).toFixed(1)}
            <span>({p.reviewCount})</span>
          </div>
        )}
        {p.location && (
          <div className="flex items-center gap-1 text-[10px] text-solar-dim">
            <MapPin size={9}/>{p.location}
          </div>
        )}
        <div className="flex items-center gap-1 text-[10px] text-solar-accent group-hover:gap-2 transition-all mt-1">
          View listing <ExternalLink size={9}/>
        </div>
      </div>
    </a>
  );
}

const DRAWER_TABS = [
  { key: 'panels',      label: 'Panels' },
  { key: 'batteries',   label: 'Batteries' },
  { key: 'inverters',   label: 'Inverters' },
  { key: 'controllers', label: 'Controller' },
  { key: 'accessories', label: 'Accessories' },
];

function ComponentsDrawer({ sessionId, tier, preference, onClose }) {
  const [items,   setItems]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [tab,     setTab]     = useState('panels');

  useEffect(() => {
    if (!sessionId || !tier) { setLoading(false); return; }
    const pref = preference === 'budget' ? 'budget'
               : preference === 'quality' ? 'quality'
               : 'balanced';
    advisorService.getMarketplaceItems(sessionId, tier, pref)
      .then(res => {
        const d = res?.data ?? res;
        setItems(d.products || {});
        // default to first tab that has products
        const first = DRAWER_TABS.find(t => (d.products?.[t.key] || []).length > 0);
        if (first) setTab(first.key);
      })
      .catch(e => setError(e.message || 'Failed to load products'))
      .finally(() => setLoading(false));
  }, [sessionId, tier, preference]);

  const products = items?.[tab] || [];

  return (
    <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-solar-card border border-solar-border2 rounded-t-2xl md:rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-solar-border">
          <div>
            <div className="font-heading text-base font-bold">Buy Components Individually</div>
            <div className="text-xs text-solar-muted mt-0.5">Solar Maket listings matching your recommendation</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-solar-surface hover:bg-solar-border transition-colors">
            <X size={16} className="text-solar-muted"/>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 overflow-x-auto no-scrollbar border-b border-solar-border pb-3">
          {DRAWER_TABS.map(t => {
            const count = items?.[t.key]?.length || 0;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${tab === t.key ? 'bg-solar-accent text-black' : 'bg-solar-surface text-solar-muted hover:text-solar-text'}`}>
                {t.label}{count > 0 && <span className="ml-1 opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="w-8 h-8 border-4 border-solar-border border-t-solar-accent rounded-full animate-spin"/>
              <div className="text-sm text-solar-muted">Loading Solar Maket listings…</div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-solar-muted text-sm">{error}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart size={32} className="text-solar-dim mx-auto mb-3"/>
              <div className="text-sm text-solar-muted">No listings found for this category yet.</div>
              <a href="/marketplace" className="btn-outline text-xs mt-4 inline-flex items-center gap-1">
                Browse Marketplace <ExternalLink size={12}/>
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {products.map(p => <ProductCard key={p.id} p={p}/>)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-solar-border flex items-center justify-between gap-3">
          <div className="text-xs text-solar-dim">
            {!loading && items && `${Object.values(items).flat().length} total listings across all categories`}
          </div>
          <a href="/marketplace" className="btn-outline text-xs inline-flex items-center gap-1">
            View All Marketplace <ExternalLink size={11}/>
          </a>
        </div>
      </div>
    </div>
  );
}

const TIPS = ['Calculating daily energy load…','Sizing battery banks…','Designing budget system…','Designing performance system…','Designing all-in-one system…','Estimating NGN costs…'];

export default function Advisor() {
  const [step,  setStep]  = useState(0);
  const [picked,setPicked]= useState([
    {n:'2HP Inverter A/C',suggestW:1500},{n:'170L Refrigerator',suggestW:150},
    {n:'43" LED TV',suggestW:80},{n:'Ceiling Fan',suggestW:60},{n:'LED Bulb (9W)',suggestW:9},
  ]);
  const [capacity,  setCapacity]  = useState({});
  const [prefs,     setPrefs]     = useState({ loc:'5.5', bk:'1.5', grid:'unreliable', pri:'all' });
  const [recs,      setRecs]      = useState(null);
  const [adjLoad,   setAdjLoad]   = useState(0);
  const [peakLoad,  setPeakLoad]  = useState(0);
  const [activeRec, setActiveRec] = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [tip,         setTip]         = useState(TIPS[0]);
  const [error,       setError]       = useState('');
  const [showDrawer,  setShowDrawer]  = useState(false);
  const tipRef = useRef(null);

  const toggleAppl = (name, w) => setPicked(p => p.find(x=>x.n===name) ? p.filter(x=>x.n!==name) : [...p, {n:name, suggestW:w}]);
  const addCustom  = name => { if (!picked.find(x=>x.n===name)) setPicked(p=>[...p,{n:name,suggestW:null}]); };
  const updateCap  = (name, data) => setCapacity(c=>({...c,[name]:data}));

  const totalW  = Object.values(capacity).reduce((s,c)=>s+(c?.calcW||0),0);
  const totalWh = Object.values(capacity).reduce((s,c)=>s+(c?.wh||0),0);

  async function calculate() {
    const rows = picked.map(a=>{
      const c = capacity[a.n]||{};
      return { name:a.n, watts:Math.round(c.calcW||a.suggestW||0), quantity:c.qty||1, hoursPerDay:c.hrs>0?c.hrs:8, unit:c.unit||'W' };
    }).filter(r=>r.watts>0);

    if (!rows.length) { setError('Please enter power values for at least one appliance'); setStep(1); return; }
    setError(''); setStep(3); setLoading(true);

    tipRef.current = setInterval(()=>setTip(t=>TIPS[(TIPS.indexOf(t)+1)%TIPS.length]), 1300);

    const preferences = {
      location: prefs.loc, sunHours: parseFloat(prefs.loc),
      backupFactor: parseFloat(prefs.bk), gridSituation: prefs.grid, priority: prefs.pri,
    };

    try {
      const res = await advisorService.calculate(rows, preferences);
      const d = res?.data ?? res;
      const results = d?.results || d;
      if (results?.recommendations) {
        setRecs({ ...results, sessionId: d.session?.id });
        setAdjLoad(results.adjustedDailyLoad||0);
        setPeakLoad(results.peakLoad||0);
      }
      else { throw new Error('No recommendations returned'); }
    } catch(e) {
      setError(e.message);
      setRecs(null);
    } finally {
      clearInterval(tipRef.current); setLoading(false);
    }
  }

  return (
    <div className="max-w-[1100px] mx-auto px-5 py-10">
      <SEO
        title="AI Solar System Advisor — Design Your Solar Setup"
        description="Tell our AI your appliances and power needs. Get 3 complete solar system designs — Budget, Performance, and All-in-One — with part lists and ₦ cost estimates tailored for Nigeria."
        canonical="/advisor"
        breadcrumbs={[{ name: 'Home', url: '/' }, { name: 'Solar System Advisor' }]}
      />
      <div className="flex items-center gap-4 mb-8 p-6 rounded-2xl" style={{background:'linear-gradient(135deg,rgba(245,158,11,0.06),rgba(16,185,129,0.04))',border:'1px solid #1e293b'}}>
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-solar-accent to-solar-orange flex items-center justify-center flex-shrink-0"><Zap size={24} className="text-black"/></div>
        <div>
          <h1 className="font-heading text-xl font-bold">Solar System Advisor</h1>
          <p className="text-solar-muted text-sm mt-1">List your appliances → AI designs <strong className="text-solar-text">3 complete system options</strong> with ₦ estimates.</p>
        </div>
      </div>

      {/* Step track */}
      <div className="flex items-center mb-8 overflow-x-auto no-scrollbar">
        {STEPS.map((s,i)=>(
          <div key={i} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-semibold font-heading transition-all ${i<step?'bg-solar-green/20 border-solar-green text-solar-green':i===step?'bg-solar-accent/20 border-solar-accent text-solar-accent':'bg-solar-surface border-solar-border text-solar-dim'}`}>{i<step?<Check size={14}/>:i+1}</div>
              <div className={`text-[10px] mt-1 ${i===step?'text-solar-accent':i<step?'text-solar-green':'text-solar-dim'}`}>{s}</div>
            </div>
            {i<STEPS.length-1&&<div className={`w-12 h-0.5 mx-2 mb-5 ${i<step?'bg-solar-green':'bg-solar-border'}`}/>}
          </div>
        ))}
      </div>

      {/* Step 0: Appliances */}
      {step===0&&(
        <div className="section-card p-6 animate-slide-up">
          <div className="font-heading text-sm font-semibold mb-1">Select Your Appliances</div>
          <p className="text-solar-muted text-xs mb-5">Search and select every device you want to power. Press Enter to add custom items.</p>
          <AppliancePicker selected={picked} onToggle={toggleAppl} onAddCustom={addCustom}/>
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <span className="text-sm text-solar-muted">Selected: <strong className="text-solar-accent">{picked.length}</strong> appliances</span>
            <span className="text-xs text-solar-dim">Quick add:</span>
            {[['1HP Inverter A/C',700],['2HP Inverter A/C',1500],['170L Refrigerator',150],['43" LED TV',80],['Ceiling Fan',60],['LED Bulb (9W)',9]].map(([n,w])=>(
              <button key={n} onClick={()=>{if(!picked.find(x=>x.n===n))setPicked(p=>[...p,{n,suggestW:w}]);}}
                className={`text-[11px] border rounded-full px-2.5 py-1 transition-all ${picked.find(x=>x.n===n)?'bg-solar-accent/20 border-solar-accent/50 text-solar-accent':'border-solar-border text-solar-muted hover:border-solar-accent hover:text-solar-accent'}`}>
                {n.split(' ').slice(0,2).join(' ')}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-6 pt-5 border-t border-solar-border">
            <div className="text-xs text-solar-dim">Select at least 1 appliance</div>
            <button onClick={()=>setStep(1)} disabled={!picked.length} className="btn-primary">Next: Set Capacity →</button>
          </div>
        </div>
      )}

      {/* Step 1: Capacity */}
      {step===1&&(
        <div className="section-card p-6 animate-slide-up">
          <div className="font-heading text-sm font-semibold mb-1">Specify Appliance Capacity</div>
          <p className="text-solar-muted text-xs mb-5">Enter the power rating for each device. Hours/day is optional but improves accuracy.</p>
          {error&&<div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-sm text-red-400 mb-4">{error}</div>}
          <div className="space-y-3 mb-5">{picked.map((a,i)=><CapCard key={a.n} appliance={a} onChange={updateCap}/>)}</div>
          <div className="bg-solar-surface border border-solar-border rounded-xl p-3.5 text-xs text-solar-muted mb-5 flex items-start gap-1.5">
            <Lightbulb size={13} className="text-solar-accent flex-shrink-0 mt-px"/><span><strong className="text-solar-text">Tip:</strong> For A/C labeled "VA" on the nameplate, select VA unit. 1HP Inverter A/C ≈ 700W, Window type ≈ 900W.</span>
          </div>
          <div className="flex justify-between pt-5 border-t border-solar-border">
            <button onClick={()=>setStep(0)} className="btn-ghost">← Back</button>
            <button onClick={()=>setStep(2)} className="btn-primary">Next: Preferences →</button>
          </div>
        </div>
      )}

      {/* Step 2: Preferences */}
      {step===2&&(
        <div className="section-card p-6 animate-slide-up">
          <div className="font-heading text-sm font-semibold mb-1">Location & Preferences</div>
          <p className="text-solar-muted text-xs mb-5">Fine-tune your recommendations with these settings.</p>
          <div className="grid grid-cols-2 gap-4 mb-5">
            {[[{id:'adv-loc',label:'Location (sun hours)',value:prefs.loc,onChange:v=>setPrefs(p=>({...p,loc:v})),options:[['5.5','Lagos / Port Harcourt (5.5h)'],['6.5','Abuja / Kano (6.5h)'],['7','Maiduguri (7.0h)'],['6','Other (6.0h)']]}],
               [{id:'adv-bk',label:'Backup Duration',value:prefs.bk,onChange:v=>setPrefs(p=>({...p,bk:v})),options:[['1','≥ 8 hours/day'],['1.5','≥ 12 hours/day'],['2','Full 24h autonomy'],['3','2-day autonomy']]}],
               [{id:'adv-grid',label:'Grid Power',value:prefs.grid,onChange:v=>setPrefs(p=>({...p,grid:v})),options:[['none','No grid – off-grid'],['unreliable','Unreliable (NEPA)'],['reliable','Reliable – hybrid']]}],
               [{id:'adv-pri',label:'Priority',value:prefs.pri,onChange:v=>setPrefs(p=>({...p,pri:v})),options:[['all','Show all 3 options'],['budget','Lowest cost'],['quality','Quality & lifespan'],['compact','Space saving']]}],
            ].flat().map(f=>(
              <div key={f.id} className="flex flex-col gap-1.5">
                <label className="text-xs text-solar-muted">{f.label}</label>
                <select value={f.value} onChange={e=>f.onChange(e.target.value)} className="solar-input">
                  {f.options.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="bg-solar-surface border border-solar-border rounded-xl p-4 mb-5">
            <div className="font-heading text-xs uppercase tracking-widest text-solar-muted mb-3">Load Summary</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-solar-dim text-xs">Peak Load</span><div className="font-semibold text-solar-accent mt-0.5">{Math.round(totalW).toLocaleString()}W</div></div>
              <div><span className="text-solar-dim text-xs">Daily Energy</span><div className="font-semibold text-solar-accent mt-0.5">{totalWh>0?Math.round(totalWh).toLocaleString()+' Wh':'Add hours above'}</div></div>
              <div><span className="text-solar-dim text-xs">Appliances</span><div className="font-semibold mt-0.5">{picked.length}</div></div>
              <div><span className="text-solar-dim text-xs">Adjusted</span><div className="font-semibold mt-0.5">{totalWh>0?Math.round(totalWh*1.25).toLocaleString()+' Wh':'—'}</div></div>
            </div>
          </div>
          <div className="flex justify-between pt-5 border-t border-solar-border">
            <button onClick={()=>setStep(1)} className="btn-ghost">← Back</button>
            <button onClick={calculate} className="btn-primary btn-lg inline-flex items-center gap-2"><Zap size={16}/>Calculate My Solar System</button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step===3&&(
        <div className="animate-slide-up">
          {loading?(
            <div className="section-card p-16 flex flex-col items-center gap-5">
              <div className="w-10 h-10 border-4 border-solar-border border-t-solar-accent rounded-full animate-spin"/>
              <div className="font-heading text-sm text-solar-muted">Designing your 3 solar systems…</div>
              <div className="text-xs text-solar-dim">{tip}</div>
            </div>
          ) : error ? (
            <div className="section-card p-10 text-center">
              <div className="flex justify-center mb-4"><XCircle size={48} className="text-red-400"/></div>
              <div className="font-heading text-base mb-3 text-solar-text">Could not generate recommendations</div>
              <p className="text-solar-muted text-sm mb-6">{error}</p>
              <button onClick={()=>setStep(2)} className="btn-outline">← Try Again</button>
            </div>
          ) : recs ? (
            <>
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                  <div className="font-heading text-xl font-semibold">System Recommendations</div>
                  <div className="text-sm text-solar-muted mt-1">{adjLoad.toLocaleString()} Wh/day · {peakLoad.toLocaleString()}W peak · {(recs.recommendations||[]).length} options</div>
                </div>
                <button onClick={()=>{setStep(0);setRecs(null);}} className="btn-ghost text-sm">← Start Over</button>
              </div>
              {/* Tabs */}
              <div className="flex gap-3 mb-5 overflow-x-auto no-scrollbar pb-1">
                {(recs.recommendations||[]).map((r,i)=>(
                  <div key={r.id} onClick={()=>setActiveRec(i)}
                    className={`rec-tab flex-1 min-w-[165px] ${activeRec===i?'active':''}`}>
                    <div className="font-heading text-sm font-semibold mb-1">{r.title}</div>
                    <div className="text-[11px] text-solar-muted mb-2">{r.tagline}</div>
                    <div className="font-heading text-xs text-solar-accent mb-2">
                      {fp(r.estimatedCostNGN?.totalMin||0)}–{fp(r.estimatedCostNGN?.totalMax||0)}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {r.id==='budget'&&<><span className="rpill pg-">Low cost</span><span className="rpill pr-">Short life</span></>}
                      {r.id==='performance'&&<><span className="rpill pg-">Long life</span><span className="rpill pa-">Efficient</span></>}
                      {r.id==='spacesaver'&&<><span className="rpill pg-">Compact</span><span className="rpill pa-">WiFi</span></>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="section-card p-6">
                {recs.recommendations?.[activeRec]&&<RecDetail rec={recs.recommendations[activeRec]} adjLoad={adjLoad}/>}
              </div>
              <div className="text-center mt-6 space-y-4">
                <div className="p-6 bg-gradient-to-br from-solar-accent/10 to-transparent border border-solar-accent/30 rounded-xl flex flex-col items-center">
                  <h3 className="font-heading text-lg font-bold mb-2 text-solar-text">Want this specific setup installed?</h3>
                  <p className="text-solar-muted text-sm mb-4">Skip the hassle of buying individual parts. Send this AI blueprint directly to verified engineers and sellers to get full installation quotes.</p>
                  <Link to={`/request-quote?session=${recs.sessionId||''}&tier=${recs.recommendations[activeRec].id}`} className="btn-primary btn-lg shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-[1.02] transition-transform inline-flex items-center gap-2">
                    <Wrench size={16}/>Get Quotes from Engineers
                  </Link>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <div className="h-px bg-solar-border flex-1 max-w-[150px]"></div>
                  <span className="text-xs text-solar-dim font-heading uppercase tracking-widest">OR</span>
                  <div className="h-px bg-solar-border flex-1 max-w-[150px]"></div>
                </div>
                <button
                  onClick={() => setShowDrawer(true)}
                  className="btn-outline btn-lg inline-flex mt-4 w-[400px] max-w-full justify-center items-center gap-2"
                >
                  <ShoppingCart size={16}/>Buy Components Myself
                </button>
                <div className="text-[11px] text-solar-dim mt-2 tracking-wide">Pulls real listings from Solar Maket sorted by your preference</div>

                {showDrawer && recs?.sessionId && (
                  <ComponentsDrawer
                    sessionId={recs.sessionId}
                    tier={recs.recommendations[activeRec]?.id}
                    preference={prefs.pri === 'budget' ? 'budget' : prefs.pri === 'quality' ? 'quality' : 'balanced'}
                    onClose={() => setShowDrawer(false)}
                  />
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
