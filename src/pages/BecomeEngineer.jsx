import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { engineersService } from '../services/index';
import MediaUploader from '../components/MediaUploader';
import SocialLinksEditor from '../components/SocialLinksEditor';
import { User, IdCard, MapPin, Zap, CheckCircle, Lock, Check } from 'lucide-react';

const SPECIALIZATIONS = [
  'Solar Panel Installation', 'Battery Systems', 'Inverter Setup',
  'Off-Grid Systems', 'Grid-Tie Systems', 'Hybrid Systems', 'Maintenance & Repair',
];

const STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

const STEPS = [
  { num: 1, icon: <User size={16}/>, label: 'Personal Info' },
  { num: 2, icon: <IdCard size={16}/>, label: 'Identity / KYC' },
  { num: 3, icon: <MapPin size={16}/>, label: 'Location' },
  { num: 4, icon: <Zap size={16}/>, label: 'Professional' },
  { num: 5, icon: <CheckCircle size={16}/>, label: 'Done' },
];

function F({ label, req, children, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-solar-muted">
        {label}{req && <span className="text-solar-accent ml-1">*</span>}
      </label>
      {children}
      {hint && <span className="text-[10px] text-solar-dim">{hint}</span>}
    </div>
  );
}

export default function BecomeEngineer() {
  const navigate   = useNavigate();
  const { user, dispatch, toast } = useApp();
  const [step, setStep]         = useState(1);
  const [saving, setSaving]     = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false); // true when profile already exists
  const [profileLoading, setProfileLoading] = useState(true);

  // Form state
  const [form, setForm] = useState({
    fullName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    phone: user?.phone || '',
    bio: '',
    profilePhoto: '',
    nin: '',
    ninData: null,
    govtIdType: 'NIN',
    govtIdUrl: '',
    address: '',
    city: '',
    state: '',
    latitude: '',
    longitude: '',
    serviceRadiusKm: 50,
    yearsOfExperience: 0,
    specializations: [],
    certifications: [],
    availableForHire: true,
    socialLinks: {},
  });

  // On mount: check if the user already has an engineer profile and pre-fill if so
  useEffect(() => {
    if (!user) { setProfileLoading(false); return; }
    engineersService.getMyProfile()
      .then(res => {
        const p = res?.data ?? res;
        if (!p?.id) return;
        setIsUpdate(true);
        setForm({
          fullName:          p.fullName          || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          phone:             p.phone             || user.phone || '',
          bio:               p.bio               || '',
          profilePhoto:      p.profilePhoto      || '',
          nin:               p.nin               || '',
          ninData:           null,
          govtIdType:        p.govtIdType        || 'NIN',
          govtIdUrl:         p.govtIdUrl         || '',
          address:           p.address           || '',
          city:              p.city              || '',
          state:             p.state             || '',
          latitude:          p.latitude          != null ? String(p.latitude)  : '',
          longitude:         p.longitude         != null ? String(p.longitude) : '',
          serviceRadiusKm:   p.serviceRadiusKm   ?? 50,
          yearsOfExperience: p.yearsOfExperience ?? 0,
          specializations:   p.specializations   || [],
          certifications:    p.certifications    || [],
          availableForHire:  p.availableForHire  ?? true,
          socialLinks:       p.socialLinks       || {},
        });
      })
      .catch(() => { /* no profile yet — create mode stays */ })
      .finally(() => setProfileLoading(false));
  }, [user]);

  // Certifications builder
  const [certInput, setCertInput] = useState({ name: '', issuer: '', year: '', url: '' });

  function update(key, val) { setForm(f => ({ ...f, [key]: val })); }
  function toggleSpec(s) {
    setForm(f => ({
      ...f,
      specializations: f.specializations.includes(s)
        ? f.specializations.filter(x => x !== s)
        : [...f.specializations, s],
    }));
  }
  function addCert() {
    if (!certInput.name || !certInput.issuer) return;
    setForm(f => ({ ...f, certifications: [...f.certifications, { ...certInput }] }));
    setCertInput({ name: '', issuer: '', year: '', url: '' });
  }
  function removeCert(i) {
    setForm(f => ({ ...f, certifications: f.certifications.filter((_, idx) => idx !== i) }));
  }

  function getGPS() {
    if (!navigator.geolocation) return toast('Geolocation is not supported by your browser', 'err');
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        update('latitude',  pos.coords.latitude.toFixed(7));
        update('longitude', pos.coords.longitude.toFixed(7));
        setGpsLoading(false);
        toast('Location captured!', 'ok');
      },
      err => {
        setGpsLoading(false);
        const msg = {
          1: 'Location access denied — please allow it in your browser settings, then try again.',
          2: 'Location unavailable — please enter your coordinates manually.',
          3: 'Location request timed out — please try again or enter manually.',
        }[err.code] || 'Could not get location. Please enter coordinates manually.';
        toast(msg, 'err');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  function validateStep() {
    if (step === 1 && !form.fullName) return 'Please enter your full name';
    if (step === 2 && (!form.nin || !form.govtIdType)) return 'NIN and ID type are required';
    if (step === 3 && (!form.address || !form.city || !form.state)) return 'Address, city and state are required';
    if (step === 4 && form.specializations.length === 0) return 'Select at least one specialization';
    return null;
  }

  function next() {
    if (!user) { dispatch({ type: 'OPEN_AUTH', payload: 'signup' }); return; }
    const err = validateStep();
    if (err) { toast(err, 'err'); return; }
    if (step < 4) { setStep(s => s + 1); return; }
    submit();
  }

  async function submit() {
    setSaving(true);
    const payload = {
      ...form,
      latitude:          form.latitude  ? +form.latitude  : undefined,
      longitude:         form.longitude ? +form.longitude : undefined,
      yearsOfExperience: +form.yearsOfExperience,
      serviceRadiusKm:   +form.serviceRadiusKm,
    };
    try {
      if (isUpdate) {
        await engineersService.update(payload);
        setStep(5);
        toast('Engineer profile updated!', 'ok');
      } else {
        await engineersService.create(payload);
        setStep(5);
        toast('Engineer profile created!', 'ok');
      }
    } catch (e) {
      toast(e.response?.data?.message || e.message || 'Could not save profile', 'err');
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center">
        <div className="flex justify-center mb-4"><Zap size={56} className="text-solar-accent opacity-70"/></div>
        <h1 className="font-heading text-2xl font-bold mb-3">Become a Solar Engineer</h1>
        <p className="text-solar-muted text-sm mb-6">Create an account or sign in to register as an engineer on Solar Maket.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => dispatch({ type: 'OPEN_AUTH', payload: 'signup' })} className="btn-primary">Create Account</button>
          <button onClick={() => dispatch({ type: 'OPEN_AUTH', payload: 'login' })}  className="btn-outline">Log In</button>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="max-w-[700px] mx-auto px-5 py-20 text-center">
        <div className="w-8 h-8 border-2 border-solar-border border-t-solar-accent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-solar-dim text-sm">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto px-5 py-10">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold">
          {isUpdate ? 'Update Your ' : 'Become a '}<span className="text-solar-accent">Solar Engineer</span>{isUpdate ? ' Profile' : ''}
        </h1>
        <p className="text-solar-muted text-sm mt-1">
          {isUpdate ? 'Edit your profile details — changes go live immediately.' : "Join Nigeria's growing network of certified solar professionals"}
        </p>
        {isUpdate && (
          <div className="mt-3 inline-flex items-center gap-2 text-xs text-solar-green bg-solar-green/10 border border-solar-green/25 rounded-xl px-3 py-2">
            ✓ You already have an engineer profile — editing it below
          </div>
        )}
      </div>

      {/* Step progress */}
      <div className="flex mb-8">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex-1 flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1.5 transition-all
              ${step > s.num ? 'bg-solar-green text-black' : step === s.num ? 'bg-solar-accent text-black' : 'bg-solar-surface text-solar-dim border border-solar-border'}`}>
              {step > s.num ? <Check size={14}/> : s.icon}
            </div>
            <div className={`text-[10px] text-center hidden sm:block ${step === s.num ? 'text-solar-accent font-medium' : 'text-solar-dim'}`}>
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-full mt-4 -translate-y-5 ${step > s.num ? 'bg-solar-green' : 'bg-solar-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: Personal Info ─────────────────────────────── */}
      {step === 1 && (
        <div className="section-card p-6 space-y-5 animate-slide-up">
          <h2 className="font-heading text-sm font-semibold text-solar-accent uppercase tracking-widest">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="Full Legal Name" req>
              <input className="solar-input col-span-2" placeholder="e.g. Emeka Okonkwo"
                value={form.fullName} onChange={e => update('fullName', e.target.value)} />
            </F>
            <F label="Phone Number" req>
              <input className="solar-input" placeholder="+234 800 000 0000"
                value={form.phone} onChange={e => update('phone', e.target.value)} />
            </F>
            <div className="col-span-2 mt-2 border-t border-solar-border pt-4 px-4 pb-2 bg-solar-surface rounded-xl">
              <span className="text-xs font-semibold text-solar-muted uppercase tracking-widest mb-3 block text-center">Professional Photo</span>
              <MediaUploader 
                avatarMode 
                value={form.profilePhoto ? [{ url: form.profilePhoto, resourceType: 'image' }] : []} 
                onChange={v => update('profilePhoto', v[0]?.url || '')} 
              />
            </div>
          </div>
          <F label="Professional Bio" hint="Describe your experience and what makes you great">
            <textarea className="solar-input" rows={4}
              placeholder="I am a certified solar engineer with 8 years of experience specialising in hybrid off-grid systems across Lagos and the South-West…"
              value={form.bio} onChange={e => update('bio', e.target.value)} />
          </F>

          <SocialLinksEditor value={form.socialLinks} onChange={v => update('socialLinks', v)} />
        </div>
      )}

      {/* ── Step 2: Identity / KYC ───────────────────────────── */}
      {step === 2 && (
        <div className="section-card p-6 space-y-5 animate-slide-up">
          <h2 className="font-heading text-sm font-semibold text-solar-accent uppercase tracking-widest">Identity Verification (KYC)</h2>
          <div className="bg-solar-accent/5 border border-solar-accent/20 rounded-xl p-4 text-xs text-solar-muted flex gap-2">
            <Lock size={14} className="text-solar-accent flex-shrink-0"/>
            Your NIN and ID details are stored securely and only accessible to Solar Maket administrators for verification purposes. They are never shared publicly.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="ID Type" req>
              <select className="solar-input" value={form.govtIdType} onChange={e => update('govtIdType', e.target.value)}>
                <option value="NIN">NIN (National ID Number)</option>
                <option value="BVN">BVN (Bank Verification Number)</option>
                <option value="Passport">International Passport</option>
                <option value="Driver's Licence">Driver's Licence</option>
                <option value="Voter Card">Voter's Card (PVC)</option>
              </select>
            </F>
            <F label="NIN / ID Number" req hint="Your 11-digit NIN or relevant ID number">
              <input className="solar-input font-mono" placeholder="12345678901"
                value={form.nin} onChange={e => update('nin', e.target.value)} />
            </F>
            <div className="col-span-2">
              <label className="text-xs font-medium text-solar-muted block mb-1.5">
                ID Document Photo <span className="text-solar-dim">(optional)</span>
              </label>
              <MediaUploader
                value={form.govtIdUrl ? [{ url: form.govtIdUrl, resourceType: 'image' }] : []}
                onChange={v => update('govtIdUrl', v[0]?.url || '')}
                folder="kyc"
                maxFiles={1}
                label="Upload ID scan / photo"
              />
              <p className="text-[10px] text-solar-dim mt-1.5">
                Passport data page, driver's licence, voter card, etc. Stored securely — never shown publicly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Location ─────────────────────────────────── */}
      {step === 3 && (
        <div className="section-card p-6 space-y-5 animate-slide-up">
          <h2 className="font-heading text-sm font-semibold text-solar-accent uppercase tracking-widest">Location & Service Area</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="Street Address" req>
              <input className="solar-input col-span-2" placeholder="12 Solar Street, Victoria Island"
                value={form.address} onChange={e => update('address', e.target.value)} />
            </F>
            <F label="City" req>
              <input className="solar-input" placeholder="Lagos"
                value={form.city} onChange={e => update('city', e.target.value)} />
            </F>
            <F label="State" req>
              <select className="solar-input" value={form.state} onChange={e => update('state', e.target.value)}>
                <option value="">Select state…</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </F>
          </div>

          {/* GPS */}
          <div className="bg-solar-surface border border-solar-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-heading text-xs font-semibold text-solar-muted uppercase tracking-widest">GPS Coordinates</span>
              <button onClick={getGPS} disabled={gpsLoading}
                className="text-xs text-solar-accent border border-solar-accent/30 rounded-lg px-3 py-1.5 hover:bg-solar-accent/10 transition-all disabled:opacity-50 flex items-center gap-1.5">
                {gpsLoading ? <span className="w-3 h-3 border border-solar-accent/40 border-t-solar-accent rounded-full animate-spin" /> : <MapPin size={13}/>}
                {gpsLoading ? 'Getting location…' : 'Use My Location'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <F label="Latitude">
                <input className="solar-input font-mono text-sm" placeholder="6.4550575"
                  value={form.latitude} onChange={e => update('latitude', e.target.value)} />
              </F>
              <F label="Longitude">
                <input className="solar-input font-mono text-sm" placeholder="3.3941357"
                  value={form.longitude} onChange={e => update('longitude', e.target.value)} />
              </F>
            </div>
          </div>

          <F label="Service Radius (km)" hint="Maximum distance you're willing to travel for jobs">
            <input type="range" min="10" max="500" step="10" value={form.serviceRadiusKm}
              onChange={e => update('serviceRadiusKm', e.target.value)}
              className="accent-solar-accent w-full" />
            <div className="text-center text-solar-accent font-heading font-bold text-sm mt-1">{form.serviceRadiusKm} km</div>
          </F>
        </div>
      )}

      {/* ── Step 4: Professional ─────────────────────────────── */}
      {step === 4 && (
        <div className="section-card p-6 space-y-6 animate-slide-up">
          <h2 className="font-heading text-sm font-semibold text-solar-accent uppercase tracking-widest">Professional Details</h2>

          <F label="Years of Experience">
            <input type="number" min="0" max="50" className="solar-input w-24"
              value={form.yearsOfExperience} onChange={e => update('yearsOfExperience', e.target.value)} />
          </F>

          <div>
            <label className="text-xs font-medium text-solar-muted block mb-3">
              Specializations <span className="text-solar-accent">*</span>
              <span className="text-solar-dim ml-2">(select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map(s => (
                <button key={s} type="button" onClick={() => toggleSpec(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    form.specializations.includes(s)
                      ? 'bg-solar-accent text-black border-solar-accent'
                      : 'bg-solar-surface text-solar-muted border-solar-border hover:border-solar-accent/50'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <label className="text-xs font-medium text-solar-muted block mb-3">Certifications <span className="text-solar-dim">(optional)</span></label>
            <div className="space-y-2 mb-3">
              {form.certifications.map((c, i) => (
                <div key={i} className="flex items-center justify-between bg-solar-surface border border-solar-border rounded-xl px-4 py-2.5">
                  <div>
                    <span className="text-sm font-medium text-solar-text">{c.name}</span>
                    <span className="text-xs text-solar-dim ml-2">· {c.issuer}{c.year ? ` · ${c.year}` : ''}</span>
                  </div>
                  <button onClick={() => removeCert(i)} className="text-solar-dim text-xs hover:text-red-400 transition-colors">✕</button>
                </div>
              ))}
            </div>
            <div className="bg-solar-surface border border-solar-border rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className="solar-input text-sm" placeholder="Certificate Name *"
                  value={certInput.name} onChange={e => setCertInput(x => ({ ...x, name: e.target.value }))} />
                <input className="solar-input text-sm" placeholder="Issuing Body *"
                  value={certInput.issuer} onChange={e => setCertInput(x => ({ ...x, issuer: e.target.value }))} />
                <input className="solar-input text-sm" placeholder="Year (optional)" type="number"
                  value={certInput.year} onChange={e => setCertInput(x => ({ ...x, year: e.target.value }))} />
                <input className="solar-input text-sm" placeholder="Certificate URL (optional)"
                  value={certInput.url} onChange={e => setCertInput(x => ({ ...x, url: e.target.value }))} />
              </div>
              <button onClick={addCert} className="btn-ghost text-xs w-full">+ Add Certification</button>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.availableForHire}
              onChange={e => update('availableForHire', e.target.checked)}
              className="w-4 h-4 rounded accent-solar-accent" />
            <span className="text-sm text-solar-text">I am currently <strong>available for hire</strong></span>
          </label>
        </div>
      )}

      {/* ── Step 5: Done ─────────────────────────────────────── */}
      {step === 5 && (
        <div className="section-card p-10 text-center animate-slide-up space-y-4">
          <div className="flex justify-center"><CheckCircle size={64} className="text-solar-green"/></div>
          <h2 className="font-heading text-2xl font-bold text-solar-green">You're Live!</h2>
          <p className="text-solar-muted text-sm max-w-sm mx-auto leading-relaxed">
            Your engineer profile is now visible in the Solar Maket marketplace. Clients can find and contact you immediately.
          </p>
          <div className="bg-solar-accent/5 border border-solar-accent/20 rounded-xl p-4 text-xs text-solar-muted text-left space-y-1.5 max-w-sm mx-auto">
            <p>Profile is publicly visible</p>
            <p>Solar Maket may periodically review profiles for quality</p>
            <p>Build your rating by completing jobs and earning reviews</p>
            <p>Your NIN/ID is securely stored and private</p>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={() => navigate('/engineers')} className="btn-primary">Browse Engineers →</button>
            <button onClick={() => navigate('/')} className="btn-outline">Go Home</button>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      {step < 5 && (
        <div className="flex justify-between mt-6">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/engineers')}
            className="btn-ghost">
            ← {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button onClick={next} disabled={saving}
            className="btn-primary px-8 flex items-center gap-2">
            {saving && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
            {step === 4
            ? saving
              ? 'Saving…'
              : isUpdate ? '✓ Update Profile' : '✓ Create Profile'
            : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
}
