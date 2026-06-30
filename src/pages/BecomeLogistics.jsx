import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import SEO from '../components/SEO';
import { logisticsService } from '../services/logistics.service';
import {
  Truck, User, MapPin, DollarSign, CheckCircle,
  Building2, Bike, Car, Package, Plus, X,
} from 'lucide-react';

const STEPS = [
  { num: 1, icon: <Truck size={15}/>,       label: 'Provider Type' },
  { num: 2, icon: <User size={15}/>,         label: 'Basic Info' },
  { num: 3, icon: <MapPin size={15}/>,       label: 'Coverage' },
  { num: 4, icon: <DollarSign size={15}/>,   label: 'Rates' },
  { num: 5, icon: <CheckCircle size={15}/>,  label: 'Done' },
];

const NG_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

const VEHICLE_TYPES = [
  { value: 'motorcycle', label: 'Motorcycle', icon: <Bike size={16}/> },
  { value: 'car',        label: 'Car',        icon: <Car size={16}/> },
  { value: 'van',        label: 'Van',        icon: <Truck size={16}/> },
  { value: 'truck',      label: 'Truck',      icon: <Truck size={16}/> },
  { value: 'bicycle',    label: 'Bicycle',    icon: <Bike size={16}/> },
  { value: 'other',      label: 'Other',      icon: <Package size={16}/> },
];

const CURRENCIES = ['NGN', 'USD', 'GHS', 'KES'];

function F({ label, req, children, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-solar-muted">
        {label}{req && <span className="text-solar-accent ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-solar-dim">{hint}</p>}
    </div>
  );
}

function TagInput({ label, values, onAdd, onRemove, placeholder }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onAdd(v);
    setInput('');
  };
  return (
    <F label={label}>
      <div className="flex gap-2">
        <input className="solar-input flex-1" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder} />
        <button type="button" onClick={add} className="btn-ghost px-3"><Plus size={14}/></button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {values.map(v => (
            <span key={v} className="flex items-center gap-1 bg-solar-accent/10 text-solar-accent text-xs px-2 py-0.5 rounded-full">
              {v}
              <button type="button" onClick={() => onRemove(v)}><X size={10}/></button>
            </span>
          ))}
        </div>
      )}
    </F>
  );
}

export default function BecomeLogistics() {
  const nav = useNavigate();
  const { user, toast, dispatch } = useApp();
  const [step, setStep]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  const [form, setForm] = useState({
    type: '',
    name: '',
    description: '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    coverageStates: [],
    coverageCities: [],
    vehicleTypes: [],
    baseRate: '',
    ratePerKm: '',
    currency: 'NGN',
    maxWeightKg: '',
    businessRegNumber: '',
    logo: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!user) { dispatch({ type: 'OPEN_AUTH', payload: 'login' }); return; }
    logisticsService.getMyProfile()
      .then(r => { setForm(f => ({ ...f, ...r.data })); setIsUpdate(true); setStep(2); })
      .catch(() => {});
  }, [user]);

  async function submit() {
    setSaving(true);
    try {
      const dto = {
        ...form,
        baseRate:   parseFloat(form.baseRate) || 0,
        ratePerKm:  form.ratePerKm ? parseFloat(form.ratePerKm) : undefined,
        maxWeightKg: form.maxWeightKg ? parseFloat(form.maxWeightKg) : undefined,
      };
      if (isUpdate) await logisticsService.updateProfile(dto);
      else          await logisticsService.register(dto);
      toast(isUpdate ? 'Profile updated!' : 'Registered as logistics provider!', 'ok');
      setStep(5);
    } catch (e) {
      toast(e?.response?.data?.message || 'Registration failed', 'err');
    } finally {
      setSaving(false);
    }
  }

  const toggleArr = (k, val) => {
    set(k, form[k].includes(val) ? form[k].filter(x => x !== val) : [...form[k], val]);
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <SEO title="Become a Logistics Provider" />
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold mb-1">
          {isUpdate ? 'Update Logistics Profile' : 'Register as Logistics Provider'}
        </h1>
        <p className="text-sm text-solar-muted">Manage deliveries for sellers on Solar Maket</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center flex-1 last:flex-initial">
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
              i + 1 < step ? 'bg-solar-green/20 border-solar-green text-solar-green'
              : i + 1 === step ? 'bg-solar-accent/20 border-solar-accent text-solar-accent'
              : 'bg-solar-surface border-solar-border text-solar-dim'
            }`}>
              {i + 1 < step ? <CheckCircle size={14}/> : s.icon}
            </div>
            <span className={`ml-1.5 text-xs font-medium hidden sm:block ${i + 1 === step ? 'text-solar-text' : 'text-solar-dim'}`}>{s.label}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i + 1 < step ? 'bg-solar-green' : 'bg-solar-border'}`}/>}
          </div>
        ))}
      </div>

      <div className="section-card p-6 animate-slide-up">

        {/* ── Step 1: Type ─────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="font-heading text-base font-semibold mb-5">What type of provider are you?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { val: 'individual', icon: <User size={28}/>, title: 'Individual Agent', desc: 'You operate independently with your own vehicle(s)' },
                { val: 'company',    icon: <Building2 size={28}/>, title: 'Logistics Company', desc: 'A registered company with a fleet and multiple agents' },
              ].map(opt => (
                <button key={opt.val} type="button"
                  onClick={() => { set('type', opt.val); setStep(2); }}
                  className={`p-5 rounded-2xl border-2 text-left transition-all hover:border-solar-accent ${
                    form.type === opt.val ? 'border-solar-accent bg-solar-accent/5' : 'border-solar-border'
                  }`}>
                  <div className="text-solar-accent mb-3">{opt.icon}</div>
                  <div className="font-heading font-semibold text-sm mb-1">{opt.title}</div>
                  <div className="text-xs text-solar-muted">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Basic Info ───────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-heading text-base font-semibold mb-2">Basic Information</h2>
            <F label={form.type === 'company' ? 'Company Name' : 'Display Name'} req>
              <input className="solar-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. FastRide Logistics" />
            </F>
            <F label="Description">
              <textarea className="solar-input resize-none" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Tell sellers what makes you reliable…"/>
            </F>
            <div className="grid grid-cols-2 gap-4">
              <F label="Phone" req>
                <input className="solar-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="08XXXXXXXXX"/>
              </F>
              <F label="Email" req>
                <input className="solar-input" type="email" value={form.email} onChange={e => set('email', e.target.value)}/>
              </F>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="City">
                <input className="solar-input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Lagos"/>
              </F>
              <F label="State">
                <select className="solar-input" value={form.state} onChange={e => set('state', e.target.value)}>
                  <option value="">Select state</option>
                  {NG_STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </F>
            </div>
            <F label="Address">
              <input className="solar-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address"/>
            </F>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep(1)} className="btn-ghost flex-shrink-0">← Back</button>
              <button onClick={() => setStep(3)} disabled={!form.name || !form.phone || !form.email} className="btn-primary flex-1 py-3 disabled:opacity-50">Continue →</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Coverage ─────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-heading text-base font-semibold mb-2">Coverage Areas</h2>
            <F label="States you cover" req hint="Select all states you can deliver to">
              <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">
                {NG_STATES.map(s => (
                  <button key={s} type="button"
                    onClick={() => toggleArr('coverageStates', s)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                      form.coverageStates.includes(s)
                        ? 'bg-solar-accent text-white border-solar-accent'
                        : 'border-solar-border text-solar-muted hover:border-solar-accent'
                    }`}>{s}</button>
                ))}
              </div>
            </F>
            <TagInput label="Cities you cover" values={form.coverageCities}
              onAdd={v => set('coverageCities', [...form.coverageCities, v])}
              onRemove={v => set('coverageCities', form.coverageCities.filter(x => x !== v))}
              placeholder="Type a city and press Enter"/>
            <F label="Vehicle types available" req>
              <div className="flex flex-wrap gap-2">
                {VEHICLE_TYPES.map(vt => (
                  <button key={vt.value} type="button"
                    onClick={() => toggleArr('vehicleTypes', vt.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
                      form.vehicleTypes.includes(vt.value)
                        ? 'bg-solar-accent text-white border-solar-accent'
                        : 'border-solar-border text-solar-muted hover:border-solar-accent'
                    }`}>
                    {vt.icon}{vt.label}
                  </button>
                ))}
              </div>
            </F>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep(2)} className="btn-ghost flex-shrink-0">← Back</button>
              <button onClick={() => setStep(4)} disabled={!form.coverageStates.length || !form.vehicleTypes.length} className="btn-primary flex-1 py-3 disabled:opacity-50">Continue →</button>
            </div>
          </div>
        )}

        {/* ── Step 4: Rates ────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-heading text-base font-semibold mb-2">Rates & Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <F label="Base delivery rate" req hint="Your minimum fee per delivery">
                <input className="solar-input" type="number" min="0" value={form.baseRate} onChange={e => set('baseRate', e.target.value)} placeholder="e.g. 2500"/>
              </F>
              <F label="Currency">
                <select className="solar-input" value={form.currency} onChange={e => set('currency', e.target.value)}>
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </F>
              <F label="Rate per km (optional)">
                <input className="solar-input" type="number" min="0" value={form.ratePerKm} onChange={e => set('ratePerKm', e.target.value)} placeholder="e.g. 150"/>
              </F>
              <F label="Max weight (kg, optional)">
                <input className="solar-input" type="number" min="0" value={form.maxWeightKg} onChange={e => set('maxWeightKg', e.target.value)} placeholder="e.g. 50"/>
              </F>
            </div>
            {form.type === 'company' && (
              <F label="Business Registration Number">
                <input className="solar-input" value={form.businessRegNumber} onChange={e => set('businessRegNumber', e.target.value)} placeholder="RC Number / CAC Reg"/>
              </F>
            )}
            <F label="Logo URL (optional)">
              <input className="solar-input" type="url" value={form.logo} onChange={e => set('logo', e.target.value)} placeholder="https://..."/>
            </F>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep(3)} className="btn-ghost flex-shrink-0">← Back</button>
              <button onClick={submit} disabled={saving || !form.baseRate} className="btn-primary flex-1 py-3 disabled:opacity-50">
                {saving
                  ? <span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>Saving…</span>
                  : isUpdate ? 'Update Profile' : 'Complete Registration'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Done ─────────────────────────────────── */}
        {step === 5 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-solar-green/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-solar-green"/>
            </div>
            <h2 className="font-heading text-xl font-bold mb-2">
              {isUpdate ? 'Profile Updated!' : 'Registration Submitted!'}
            </h2>
            <p className="text-solar-muted text-sm mb-6 max-w-sm mx-auto">
              {isUpdate
                ? 'Your logistics profile has been updated successfully.'
                : 'Your profile is under review. You\'ll be notified once approved and can start accepting deliveries.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => nav('/logistics/dashboard')} className="btn-primary px-6 py-2.5">Go to Dashboard</button>
              <button onClick={() => nav('/')} className="btn-ghost px-6 py-2.5">Back to Home</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
