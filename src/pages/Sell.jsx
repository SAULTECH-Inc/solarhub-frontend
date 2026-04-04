import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { usersService } from '../services/index';
import { productsService } from '../services/products.service';
import MediaUploader from '../components/MediaUploader';

const CATS = ['panel','battery','inverter','controller','light','accessory'];
const CAT_META = {
  panel:      { icon:'☀️', label:'Solar Panel',       desc:'PV modules' },
  battery:    { icon:'🔋', label:'Battery',           desc:'Storage units' },
  inverter:   { icon:'⚡', label:'Inverter',          desc:'Power conversion' },
  controller: { icon:'🔌', label:'Charge Controller', desc:'MPPT / PWM' },
  light:      { icon:'💡', label:'Solar Light',       desc:'Lighting systems' },
  accessory:  { icon:'🔧', label:'Accessory',         desc:'Cables, mounts' },
};

const XPROMPTS = {
  panel:'Extract solar panel specs. Return ONLY valid JSON: brand,model,pmax_wp,voc_v,vmp_v,isc_a,imp_a,efficiency_pct,temp_coeff_pmax,dimensions_mm,weight_kg,cell_count,max_sys_voltage_v,certifications',
  battery:'Extract battery specs. Return ONLY valid JSON: brand,model,chemistry,capacity_ah,voltage_v,dod_pct,cycle_life,charge_rate,discharge_rate,has_bms,weight_kg,certifications',
  inverter:'Extract inverter specs. Return ONLY valid JSON: brand,model,type,continuous_w,surge_w,efficiency_pct,dc_input_v,ac_output_v,no_load_w,transfer_ms,has_mppt,has_grid_failover,communication,weight_kg,certifications',
  controller:'Extract charge controller specs. Return ONLY valid JSON: brand,model,type,max_pv_voc_v,charge_current_a,max_eff_pct,pv_power_48v_w,communication,certifications',
  light:'Extract solar light specs. Return ONLY valid JSON: lumens,led_power_w,color_temp_k,panel_w,battery_ah,lighting_hrs,ip_rating',
  accessory:'Extract product specs. Return ONLY valid JSON with any visible fields.',
};
const XMAP = {
  panel:{brand:'#fbr',model:'#fmod',pmax_wp:'#sp-pmax',voc_v:'#sp-voc',vmp_v:'#sp-vmp',isc_a:'#sp-isc',imp_a:'#sp-imp',efficiency_pct:'#sp-eff',temp_coeff_pmax:'#sp-tc',dimensions_mm:'#sp-dim',weight_kg:'#sp-wt',cell_count:'#sp-cells',max_sys_voltage_v:'#sp-sv',certifications:'#sp-cert'},
  battery:{brand:'#fbr',model:'#fmod',capacity_ah:'#sb-ah',voltage_v:'#sb-v',dod_pct:'#sb-dod',cycle_life:'#sb-cyc',charge_rate:'#sb-chr',discharge_rate:'#sb-dis',weight_kg:'#sb-wt',certifications:'#sb-cert'},
  inverter:{brand:'#fbr',model:'#fmod',continuous_w:'#si-cont',surge_w:'#si-surge',efficiency_pct:'#si-eff',dc_input_v:'#si-dcv',ac_output_v:'#si-acv',no_load_w:'#si-nl',transfer_ms:'#si-tx',communication:'#si-comm',weight_kg:'#si-wt',certifications:'#si-cert'},
  controller:{brand:'#fbr',model:'#fmod',max_pv_voc_v:'#sc-voc',charge_current_a:'#sc-amp',max_eff_pct:'#sc-eff',pv_power_48v_w:'#sc-pv48',communication:'#sc-comm'},
  light:{lumens:'#sl-lm',led_power_w:'#sl-w',color_temp_k:'#sl-cct',panel_w:'#sl-pv',battery_ah:'#sl-ah',lighting_hrs:'#sl-hrs',ip_rating:'#sl-ip'},
  accessory:{},
};

function F({ label, req, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-solar-muted">{label}{req && <span className="text-solar-accent ml-1">*</span>}</label>
      {children}
    </div>
  );
}

const STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

export default function Sell() {
  const { user, dispatch, toast } = useApp();

  // ── Seller onboarding gate state ────────────────────────
  const [sellerStep, setSellerStep]       = useState(1); // 1=business, 2=identity
  const [sellerSaving, setSellerSaving]   = useState(false);
  const [gpsLoading, setGpsLoading]       = useState(false);
  const [sellerForm, setSellerForm]       = useState({
    storeName: '', storeDescription: '', businessType: 'Sole Proprietorship',
    businessRegNumber: '', taxId: '', storeBanner: '',
    storeAddress: '', storeCity: '', storeState: '',
    storeLatitude: '', storeLongitude: '',
    nin: '', govtIdType: 'NIN', govtIdUrl: '',
  });
  function setSF(k, v) { setSellerForm(f => ({ ...f, [k]: v })); }

  function getGPS() {
    if (!navigator.geolocation) return toast('Geolocation not supported', 'err');
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setSF('storeLatitude',  pos.coords.latitude.toFixed(7));
        setSF('storeLongitude', pos.coords.longitude.toFixed(7));
        setGpsLoading(false);
        toast('📍 Location captured!', 'ok');
      },
      () => { setGpsLoading(false); toast('Could not get location', 'err'); },
    );
  }

  async function submitSellerProfile() {
    const required = { storeName: 'Company / Store Name', storeAddress: 'Address',
      storeCity: 'City', storeState: 'State', businessRegNumber: 'Business Reg. Number',
      nin: 'NIN / ID Number', govtIdType: 'ID Type' };
    for (const [k, label] of Object.entries(required)) {
      if (!sellerForm[k]) { toast(`${label} is required`, 'err'); return; }
    }
    setSellerSaving(true);
    try {
      const res = await usersService.becomeSeller({
        ...sellerForm,
        storeLatitude:  sellerForm.storeLatitude  ? +sellerForm.storeLatitude  : undefined,
        storeLongitude: sellerForm.storeLongitude ? +sellerForm.storeLongitude : undefined,
      });
      const updated = res?.data ?? res;
      dispatch({ type: 'SET_USER', payload: updated });
      toast('Seller profile created! You can now list products 🎉', 'ok');
    } catch(e) {
      toast(e.response?.data?.message || e.message || 'Could not create seller profile', 'err');
    } finally {
      setSellerSaving(false);
    }
  }

  // ── Product listing state ────────────────────────────────
  const [step, setStep] = useState(0);
  const [cat, setCat] = useState(null);
  const [img64, setImg64] = useState(null);
  const [imgMime, setImgMime] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [xStatus, setXStatus] = useState(null);
  const [filledKeys, setFilledKeys] = useState([]);
  const fileRef = useRef();
  const formRef = useRef({});

  function S(id) { return formRef.current[id] || ''; }
  function setV(id, val) { formRef.current[id] = val; }

  function selCat(c) { setCat(c); setTimeout(() => setStep(1), 220); }

  function readImg(file) {
    const r = new FileReader();
    r.onload = ev => {
      const res = ev.target.result;
      setImg64(res.split(',')[1]); setImgMime(file.type);
      setPrevUrl(res);
    };
    r.readAsDataURL(file);
  }

  async function doExtract() {
    if (!img64) return;
    setExtracting(true); setXStatus({ type: 'loading', msg: '🤖 Reading label with AI…' });
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-haiku-4-5-20251001', max_tokens:900,
          messages:[{ role:'user', content:[
            { type:'image', source:{ type:'base64', media_type:imgMime, data:img64 }},
            { type:'text', text: XPROMPTS[cat] || XPROMPTS.accessory },
          ]}],
        }),
      });
      const data = await res.json();
      const raw = data.content?.[0]?.text || '{}';
      let ex; try { ex = JSON.parse(raw.replace(/```json|```/g,'').trim()); } catch { const m = raw.match(/\{[\s\S]+\}/); ex = m ? JSON.parse(m[0]) : {}; }
      const map = XMAP[cat] || {};
      const filled = [];
      for (const [k, sel] of Object.entries(map)) {
        if (ex[k] !== undefined && ex[k] !== '' && ex[k] !== null) {
          const el = document.querySelector(sel);
          if (el) { el.value = ex[k]; el.classList.add('border-solar-green', '!bg-solar-green/5'); filled.push(k); }
        }
      }
      if (ex.brand) { const b = document.getElementById('fbr'); if (b && !b.value) { b.value = ex.brand; filled.push('brand'); } }
      if (ex.model) { const m = document.getElementById('fmod'); if (m && !m.value) { m.value = ex.model; filled.push('model'); } }
      setFilledKeys(filled);
      setXStatus({ type:'ok', msg:`✅ ${filled.length} fields pre-filled — review values below` });
      toast(`${filled.length} specs extracted!`, 'ok');
    } catch {
      setXStatus({ type:'err', msg:'❌ Could not read specs. Please fill in manually.' });
    } finally { setExtracting(false); }
  }

  const [submitting, setSubmitting] = useState(false);
  // Stores step-1 field values before the step unmounts
  const [savedForm, setSavedForm] = useState({});
  const [mediaFiles, setMediaFiles] = useState([]);

  // Map local cat key → category slug expected by backend
  const CAT_SLUG = {
    panel: 'solar-panels', battery: 'batteries', inverter: 'inverters',
    controller: 'charge-controllers', light: 'solar-lights', accessory: 'accessories',
  };

  // Safe DOM read
  function g(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }

  // Save step-1 values then advance to specs
  function goToSpecs() {
    setSavedForm({
      name:  g('fn'),  brand: g('fbr'), model: g('fmod'),
      price: g('fpr'), qty:   g('fqty'), cond:  g('fcond'),
      loc:   g('floc'), war:  g('fwar'), desc:  g('fdesc'),
      dpay:  g('dpay'), dship: g('dship'), dmeth: g('dmeth'),
      ddays: g('ddays'), dzones: g('dzones'), dret: g('dret'),
    });
    setStep(2);
  }

  // Read spec fields from DOM (step 2 is mounted when submit runs)
  function collectSpecs() {
    if (cat === 'panel') return {
      type: g('sp-type'), pmaxWp: +g('sp-pmax') || undefined, vocV: +g('sp-voc') || undefined,
      vmpV: +g('sp-vmp') || undefined, iscA: +g('sp-isc') || undefined,
      impA: +g('sp-imp') || undefined, efficiencyPct: +g('sp-eff') || undefined,
      tempCoeff: g('sp-tc'), dimensions: g('sp-dim'), weightKg: +g('sp-wt') || undefined,
      cellCount: +g('sp-cells') || undefined, maxSysVoltage: +g('sp-sv') || undefined,
      certifications: g('sp-cert'),
    };
    if (cat === 'battery') return {
      chemistry: g('sb-chem'), capacityAh: +g('sb-ah') || undefined, voltageV: +g('sb-v') || undefined,
      dodPct: +g('sb-dod') || undefined, cycleLife: +g('sb-cyc') || undefined,
      chargeRate: g('sb-chr'), dischargeRate: g('sb-dis'),
      hasBms: g('sb-bms')?.includes('Yes'), weightKg: +g('sb-wt') || undefined,
      certifications: g('sb-cert'),
    };
    if (cat === 'inverter') return {
      type: g('si-type'), continuousW: +g('si-cont') || undefined, surgeW: +g('si-surge') || undefined,
      efficiencyPct: +g('si-eff') || undefined, dcInputV: g('si-dcv'), acOutputV: +g('si-acv') || undefined,
      noLoadW: +g('si-nl') || undefined, transferMs: +g('si-tx') || undefined,
      builtInMppt: g('si-mppt') !== 'No', gridFailover: g('si-gf') !== 'No',
      communication: g('si-comm'), weightKg: +g('si-wt') || undefined, certifications: g('si-cert'),
    };
    if (cat === 'controller') return {
      type: g('sc-type'), maxPvVocV: +g('sc-voc') || undefined,
      chargeCurrentA: +g('sc-amp') || undefined, maxEffPct: +g('sc-eff') || undefined,
      pvPower48vW: +g('sc-pv48') || undefined, communication: g('sc-comm'),
    };
    if (cat === 'light') return {
      lumens: +g('sl-lm') || undefined, ledPowerW: +g('sl-w') || undefined,
      colorTempK: g('sl-cct'), panelW: +g('sl-pv') || undefined,
      batteryAh: +g('sl-ah') || undefined, lightingHrs: +g('sl-hrs') || undefined,
      ipRating: g('sl-ip'),
    };
    return {};
  }

  async function submit() {
    if (!user) { dispatch({ type:'OPEN_AUTH', payload:'signup' }); return; }

    // Read from savedForm (step-1 data saved before unmounting)
    const name  = savedForm.name  || '';
    const price = savedForm.price || '';
    const qty   = savedForm.qty   || '';
    if (!name)  { toast('Product name is required — go back to step 1', 'err');  return; }
    if (!price) { toast('Price (₦) is required — go back to step 1', 'err');     return; }
    if (!qty)   { toast('Quantity is required — go back to step 1', 'err');       return; }

    const condMap = {
      'New': 'new', 'Used – Like New': 'used_like_new',
      'Used – Good': 'used_good', 'Refurbished': 'refurbished',
    };

    const dto = {
      name,
      brand:         savedForm.brand  || undefined,
      modelNumber:   savedForm.model  || undefined,
      price:         +price,
      stock:         +qty,
      description:   savedForm.desc   || undefined,
      condition:     condMap[savedForm.cond] || 'new',
      warrantyYears: savedForm.war    ? +savedForm.war   : undefined,
      sellerCity:    savedForm.loc    || user.storeCity  || undefined,
      categorySlug:  CAT_SLUG[cat]   || cat,
      paymentTerms:  [savedForm.dpay  || 'escrow'],
      shippingPayer: savedForm.dship  || 'buyer',
      deliveryDays:  savedForm.ddays  ? +savedForm.ddays : 3,
      serviceAreas:  savedForm.dzones || undefined,
      returnPolicy:  savedForm.dret   || undefined,
      images:        mediaFiles.map(m => m.url),
      thumbnail:     mediaFiles.length > 0 ? mediaFiles[0].url : undefined,
      specs:         collectSpecs(),
    };

    setSubmitting(true);
    try {
      await productsService.create(dto);
      setStep(3);
      toast('Product submitted for review! 🎉', 'ok');
    } catch(e) {
      const msg = e.response?.data?.message || e.message || 'Could not list product';
      toast(Array.isArray(msg) ? msg.join(', ') : msg, 'err');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Gate: not logged in ──────────────────────────────────
  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center">
        <div className="text-5xl mb-4">🏪</div>
        <h1 className="font-heading text-2xl font-bold mb-3">Start Selling on SolarHub</h1>
        <p className="text-solar-muted text-sm mb-6">Create an account to list your solar products and reach 12,000+ buyers.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => dispatch({ type:'OPEN_AUTH', payload:'signup' })} className="btn-primary">Create Account</button>
          <button onClick={() => dispatch({ type:'OPEN_AUTH', payload:'login' })}  className="btn-outline">Log In</button>
        </div>
      </div>
    );
  }

  // ── Gate: seller profile not complete ─────────────────────
  if (!user.isSeller || !user.sellerProfileComplete) {
    return (
      <div className="max-w-[700px] mx-auto px-5 py-10">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold">Set Up Your <span className="text-solar-accent">Seller Profile</span></h1>
          <p className="text-solar-muted text-sm mt-1">Complete your company profile once — then list unlimited products.</p>
        </div>

        {/* Progress tabs */}
        <div className="flex mb-8">
          {[{n:1,label:'Business Details'},{n:2,label:'Identity / KYC'}].map((s,i) => (
            <div key={s.n} className="flex-1">
              <div className={`py-2.5 text-center text-xs font-medium border-b-2 transition-all ${
                sellerStep > s.n ? 'border-solar-green text-solar-green'
                : sellerStep === s.n ? 'border-solar-accent text-solar-accent'
                : 'border-solar-border text-solar-dim'}`}>
                {sellerStep > s.n ? '✓ ' : ''}{s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Step 1: Business */}
        {sellerStep === 1 && (
          <div className="section-card p-6 space-y-5 animate-slide-up">
            <div className="font-heading text-xs font-semibold text-solar-accent uppercase tracking-widest">Company / Business Details</div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Company / Store Name" req>
                <input className="solar-input" placeholder="e.g. SunPower Nigeria Ltd"
                  value={sellerForm.storeName} onChange={e => setSF('storeName', e.target.value)} />
              </F>
              <F label="Business Type" req>
                <select className="solar-input" value={sellerForm.businessType} onChange={e => setSF('businessType', e.target.value)}>
                  <option>Sole Proprietorship</option>
                  <option>Partnership</option>
                  <option>Limited Liability Company (LLC)</option>
                  <option>NGO / Non-Profit</option>
                  <option>Other</option>
                </select>
              </F>
              <F label="Business Registration Number" req hint="CAC registration number">
                <input className="solar-input" placeholder="RC-1234567"
                  value={sellerForm.businessRegNumber} onChange={e => setSF('businessRegNumber', e.target.value)} />
              </F>
              <F label="Tax ID (TIN)" hint="Optional">
                <input className="solar-input" placeholder="12345678-0001"
                  value={sellerForm.taxId} onChange={e => setSF('taxId', e.target.value)} />
              </F>
              <F label="Store Description">
                <textarea className="solar-input col-span-2" rows={3}
                  placeholder="Describe your business, what you sell, and how long you've been operating…"
                  value={sellerForm.storeDescription} onChange={e => setSF('storeDescription', e.target.value)} />
              </F>
            </div>

            {/* Address */}
            <div className="font-heading text-xs font-semibold text-solar-accent uppercase tracking-widest mt-2">Business Address</div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Street Address" req>
                <input className="solar-input col-span-2" placeholder="12 Commerce Road, Ikeja"
                  value={sellerForm.storeAddress} onChange={e => setSF('storeAddress', e.target.value)} />
              </F>
              <F label="City" req>
                <input className="solar-input" placeholder="Lagos"
                  value={sellerForm.storeCity} onChange={e => setSF('storeCity', e.target.value)} />
              </F>
              <F label="State" req>
                <select className="solar-input" value={sellerForm.storeState} onChange={e => setSF('storeState', e.target.value)}>
                  <option value="">Select state…</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </F>
            </div>

            {/* GPS */}
            <div className="bg-solar-surface border border-solar-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-heading text-[11px] font-semibold text-solar-muted uppercase tracking-wide">GPS Coordinates (optional)</span>
                <button onClick={getGPS} disabled={gpsLoading}
                  className="text-xs text-solar-accent border border-solar-accent/30 rounded-lg px-3 py-1.5 hover:bg-solar-accent/10 transition-all disabled:opacity-50 flex items-center gap-1.5">
                  {gpsLoading ? <span className="w-3 h-3 border border-solar-accent/40 border-t-solar-accent rounded-full animate-spin" /> : '📍'}
                  {gpsLoading ? 'Getting…' : 'Use My Location'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="solar-input font-mono text-sm" placeholder="Latitude e.g. 6.4550575"
                  value={sellerForm.storeLatitude} onChange={e => setSF('storeLatitude', e.target.value)} />
                <input className="solar-input font-mono text-sm" placeholder="Longitude e.g. 3.3941357"
                  value={sellerForm.storeLongitude} onChange={e => setSF('storeLongitude', e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setSellerStep(2)} className="btn-primary">Next: Identity →</button>
            </div>
          </div>
        )}

        {/* Step 2: Identity */}
        {sellerStep === 2 && (
          <div className="section-card p-6 space-y-5 animate-slide-up">
            <div className="font-heading text-xs font-semibold text-solar-accent uppercase tracking-widest">Owner Identity Verification (KYC)</div>
            <div className="bg-solar-accent/5 border border-solar-accent/20 rounded-xl p-4 text-xs text-solar-muted flex gap-2">
              <span className="text-solar-accent flex-shrink-0">🔒</span>
              Your NIN and ID details are stored securely. They are only accessible to SolarHub administrators for verification and are never shared publicly.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <F label="Government ID Type" req>
                <select className="solar-input" value={sellerForm.govtIdType} onChange={e => setSF('govtIdType', e.target.value)}>
                  <option value="NIN">NIN (National ID Number)</option>
                  <option value="BVN">BVN (Bank Verification Number)</option>
                  <option value="Passport">International Passport</option>
                  <option value="Driver's Licence">Driver's Licence</option>
                  <option value="Voter Card">Voter's Card (PVC)</option>
                </select>
              </F>
              <F label="NIN / ID Number" req hint="Your 11-digit NIN or relevant ID number">
                <input className="solar-input font-mono" placeholder="12345678901"
                  value={sellerForm.nin} onChange={e => setSF('nin', e.target.value)} />
              </F>
              <F label="ID Document URL" hint="Optional — upload and paste link here">
                <input className="solar-input col-span-2" placeholder="https://… (optional)"
                  value={sellerForm.govtIdUrl} onChange={e => setSF('govtIdUrl', e.target.value)} />
              </F>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setSellerStep(1)} className="btn-ghost">← Back</button>
              <button onClick={submitSellerProfile} disabled={sellerSaving} className="btn-primary flex items-center gap-2">
                {sellerSaving && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                {sellerSaving ? 'Saving…' : '✓ Create Seller Profile'}
              </button>
            </div>
          </div>
        )}

        {/* Why it's needed */}
        <div className="mt-6 section-card p-5">
          <div className="font-heading text-xs font-semibold text-solar-muted uppercase tracking-widest mb-3">Why do we need this?</div>
          {[
            'Protect buyers from fraudulent listings',
            'Build trust and credibility in Nigeria\'s solar market',
            'Your NIN/ID is never shown publicly',
            'One-time setup — list unlimited products after',
          ].map(t => (
            <div key={t} className="flex items-start gap-2 text-xs text-solar-muted mb-2">
              <span className="text-solar-green mt-0.5">✅</span>{t}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-5 py-10">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold">List a <span className="text-solar-accent">Product</span></h1>
        <p className="text-solar-muted text-sm mt-1">AI label scan · Deep spec forms · Delivery terms</p>
      </div>

      <div className="grid md:grid-cols-[1fr_280px] gap-8">
        <div>
          {/* Step tabs */}
          <div className="flex mb-6">
            {['Category','Details','Specs','Done'].map((s, i) => (
              <div key={s} className={`flex-1 py-2.5 text-center text-xs font-medium border-b-2 transition-all
                ${i < step ? 'border-solar-green text-solar-green' : i === step ? 'border-solar-accent text-solar-accent' : 'border-solar-border text-solar-dim'}`}>
                {i < step ? '✓ ' : ''}{s}
              </div>
            ))}
          </div>

          {/* Step 0: Category */}
          {step === 0 && (
            <div className="section-card p-6 animate-slide-up">
              <h2 className="font-heading text-sm font-semibold mb-5">Choose Product Category</h2>
              <div className="grid grid-cols-3 gap-3">
                {CATS.map(c => (
                  <button key={c} onClick={() => selCat(c)}
                    className={`bg-solar-surface border rounded-xl p-4 text-center transition-all hover:-translate-y-1
                      ${cat === c ? 'border-solar-accent bg-solar-accent/10' : 'border-solar-border hover:border-solar-border2'}`}>
                    <span className="text-3xl block mb-2">{CAT_META[c].icon}</span>
                    <div className="font-heading text-xs font-semibold text-solar-text">{CAT_META[c].label}</div>
                    <div className="text-[10px] text-solar-dim mt-0.5">{CAT_META[c].desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="section-card p-6 animate-slide-up space-y-5">
              <h2 className="font-heading text-sm font-semibold">Basic Product Details</h2>
              <MediaUploader value={mediaFiles} onChange={setMediaFiles} folder="products" label="Product Photos & Videos" />
              <div className="grid grid-cols-2 gap-4">
                <F label="Product Name" req><input id="fn" className="solar-input" placeholder="e.g. Jinko Solar Tiger Neo 550W" /></F>
                <F label="Brand / Manufacturer" req><input id="fbr" className="solar-input" placeholder="Jinko Solar" /></F>
                <F label="Model Number"><input id="fmod" className="solar-input" placeholder="JKM550N-72HL4" /></F>
                <F label="Price (₦)" req><input id="fpr" type="number" className="solar-input" placeholder="245000" /></F>
                <F label="Quantity Available" req><input id="fqty" type="number" className="solar-input" placeholder="20" /></F>
                <F label="Condition">
                  <select id="fcond" className="solar-input"><option>New</option><option>Used – Like New</option><option>Used – Good</option><option>Refurbished</option></select>
                </F>
                <F label="Location (City)" req><input id="floc" className="solar-input" placeholder="Lagos" /></F>
                <F label="Warranty (years)"><input id="fwar" type="number" className="solar-input" placeholder="25" /></F>
                <F label="Product Description"><textarea id="fdesc" className="solar-input col-span-2" rows={3} placeholder="Describe your product, what's in the box..." /></F>
              </div>

              {/* Delivery section */}
              <div className="bg-solar-accent/5 border border-solar-accent/20 rounded-xl p-5 space-y-4">
                <h3 className="font-heading text-sm font-semibold text-solar-accent flex items-center gap-2">🚚 Delivery & Payment Terms</h3>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Payment Terms" req>
                    <select id="dpay" className="solar-input">
                      <option value="">Select term</option>
                      <option value="before">Payment Before Delivery</option>
                      <option value="pod">Payment on Delivery (POD)</option>
                      <option value="inspection">Payment After Inspection</option>
                      <option value="50pct">50% Upfront, 50% on Delivery</option>
                      <option value="escrow">Platform Escrow (Recommended)</option>
                    </select>
                  </F>
                  <F label="Shipping Cost Responsibility" req>
                    <select id="dship" className="solar-input">
                      <option value="">Who covers delivery?</option>
                      <option value="seller">Seller Pays – Free Delivery</option>
                      <option value="buyer">Buyer Pays</option>
                      <option value="shared">Shared – Split Equally</option>
                      <option value="negotiable">Negotiable</option>
                    </select>
                  </F>
                  <F label="Delivery Method">
                    <select id="dmeth" className="solar-input">
                      <option value="pickup">Pickup / In-Person Only</option>
                      <option value="local">Local Courier (Same City)</option>
                      <option value="interstate">Interstate Logistics</option>
                      <option value="door">Door-to-Door</option>
                      <option value="both">Local + Interstate</option>
                    </select>
                  </F>
                  <F label="Max Delivery Days" req>
                    <input id="ddays" type="number" className="solar-input" placeholder="e.g. 3" min="1" max="30" />
                    <span className="text-[10px] text-solar-dim">Business days from payment confirmation</span>
                  </F>
                  <F label="Service Areas">
                    <input id="dzones" className="solar-input" placeholder="Lagos, Ogun, Oyo, Nationwide" />
                  </F>
                  <F label="Return Policy">
                    <select id="dret" className="solar-input">
                      <option>No Returns Accepted</option>
                      <option>7-Day Return (Defects Only)</option>
                      <option>14-Day Return Policy</option>
                      <option>30-Day Return Policy</option>
                    </select>
                  </F>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(0)} className="btn-ghost">← Back</button>
                <button onClick={goToSpecs} className="btn-primary">Next: Specifications →</button>
              </div>
            </div>
          )}

          {/* Step 2: Specs */}
          {step === 2 && (
            <div className="section-card p-6 animate-slide-up space-y-5">
              <div>
                <h2 className="font-heading text-sm font-semibold">Technical Specifications</h2>
                <div className="text-xs text-solar-accent mt-1">{CAT_META[cat]?.icon} {CAT_META[cat]?.label}</div>
              </div>

              {/* AI scan */}
              <div className="bg-gradient-to-r from-solar-accent/5 to-blue-500/5 border border-solar-accent/25 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <div className="font-heading text-sm font-semibold text-solar-accent">AI Spec Extraction</div>
                    <div className="text-xs text-solar-muted">Upload or screenshot the product label — AI pre-fills the form</div>
                  </div>
                </div>

                {!prevUrl ? (
                  <div
                    onClick={() => fileRef.current.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f && f.type.startsWith('image/')) readImg(f); }}
                    className="border-2 border-dashed border-solar-border2 rounded-xl p-8 text-center cursor-pointer hover:border-solar-accent hover:bg-solar-accent/5 transition-all">
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { if(e.target.files[0]) readImg(e.target.files[0]); }} />
                    <div className="text-4xl mb-3">📷</div>
                    <div className="text-sm font-medium mb-1">Drop product label here or click to upload</div>
                    <div className="text-xs text-solar-dim">JPG, PNG, WEBP · Max 10MB</div>
                  </div>
                ) : (
                  <div className="flex gap-4 items-start bg-solar-surface border border-solar-border rounded-xl p-4">
                    <img src={prevUrl} alt="preview" className="w-20 h-20 object-contain rounded-lg border border-solar-border" />
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-1">Label image loaded</div>
                      <div className="text-xs text-solar-muted mb-3">AI will extract all visible specifications</div>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={doExtract} disabled={extracting}
                          className="flex items-center gap-2 bg-gradient-to-r from-solar-accent to-solar-orange text-black font-semibold text-sm px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">
                          {extracting ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : '✨'}
                          {extracting ? 'Extracting…' : xStatus?.type === 'ok' ? 'Re-extract' : 'Extract Specs with AI'}
                        </button>
                        <button onClick={() => { setImg64(null); setPrevUrl(null); setXStatus(null); }}
                          className="btn-ghost text-sm">✕ Remove</button>
                      </div>
                    </div>
                  </div>
                )}

                {xStatus && (
                  <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${
                    xStatus.type === 'ok' ? 'bg-solar-green/10 text-solar-green border border-solar-green/25'
                    : xStatus.type === 'err' ? 'bg-red-500/10 text-red-400 border border-red-500/25'
                    : 'text-solar-muted'}`}>
                    {xStatus.msg}
                  </div>
                )}
              </div>

              {/* Panel specs */}
              {cat === 'panel' && <>
                <div className="font-heading text-xs uppercase tracking-widest text-solar-accent border-b border-solar-border pb-2">Electrical Performance (STC)</div>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Panel Type" req><select id="sp-type" className="solar-input"><option>Monocrystalline</option><option>Polycrystalline</option><option>Bifacial Mono</option><option>HJT</option><option>PERC</option></select></F>
                  <F label="Peak Power – Pmax (Wp)" req><input id="sp-pmax" type="number" className="solar-input" placeholder="550" /></F>
                  <F label="Voc (V)" req><input id="sp-voc" type="number" step=".01" className="solar-input" placeholder="49.5" /></F>
                  <F label="Vmp (V)" req><input id="sp-vmp" type="number" step=".01" className="solar-input" placeholder="41.8" /></F>
                  <F label="Isc (A)" req><input id="sp-isc" type="number" step=".01" className="solar-input" placeholder="13.98" /></F>
                  <F label="Imp (A)"><input id="sp-imp" type="number" step=".01" className="solar-input" placeholder="13.16" /></F>
                  <F label="Efficiency (%)" req><input id="sp-eff" type="number" step=".1" className="solar-input" placeholder="22.3" /></F>
                  <F label="Temp. Coeff. Pmax (%/°C)"><input id="sp-tc" type="number" step=".01" className="solar-input" placeholder="-0.30" /></F>
                  <F label="Dimensions (mm)"><input id="sp-dim" className="solar-input" placeholder="2278×1134×35" /></F>
                  <F label="Weight (kg)"><input id="sp-wt" type="number" step=".1" className="solar-input" placeholder="28.2" /></F>
                  <F label="Cell Count"><input id="sp-cells" type="number" className="solar-input" placeholder="144" /></F>
                  <F label="Max System Voltage (V)"><input id="sp-sv" type="number" className="solar-input" placeholder="1500" /></F>
                  <F label="Certifications"><input id="sp-cert" className="solar-input col-span-2" placeholder="IEC 61215, IEC 61730, TÜV" /></F>
                </div>
              </>}

              {/* Battery specs */}
              {cat === 'battery' && <>
                <div className="font-heading text-xs uppercase tracking-widest text-solar-accent border-b border-solar-border pb-2">Chemistry & Capacity</div>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Chemistry" req><select id="sb-chem" className="solar-input"><option>LiFePO4</option><option>NMC</option><option>AGM</option><option>Gel</option><option>Flooded Lead-Acid</option></select></F>
                  <F label="Nominal Capacity (Ah)" req><input id="sb-ah" type="number" className="solar-input" placeholder="200" /></F>
                  <F label="Nominal Voltage (V)" req><input id="sb-v" type="number" className="solar-input" placeholder="48" /></F>
                  <F label="DoD (%)" req><input id="sb-dod" type="number" className="solar-input" placeholder="95" /></F>
                  <F label="Cycle Life (cycles)" req><input id="sb-cyc" type="number" className="solar-input" placeholder="4000" /></F>
                  <F label="Max Charge Rate"><input id="sb-chr" className="solar-input" placeholder="1C" /></F>
                  <F label="Max Discharge Rate"><input id="sb-dis" className="solar-input" placeholder="2C" /></F>
                  <F label="BMS Included"><select id="sb-bms" className="solar-input"><option>Yes – Built-in</option><option>No – External</option></select></F>
                  <F label="Weight (kg)"><input id="sb-wt" type="number" step=".1" className="solar-input" placeholder="88" /></F>
                  <F label="Certifications"><input id="sb-cert" className="solar-input" placeholder="IEC 62133, UN38.3, CE, UL1973" /></F>
                </div>
              </>}

              {/* Inverter specs */}
              {cat === 'inverter' && <>
                <div className="font-heading text-xs uppercase tracking-widest text-solar-accent border-b border-solar-border pb-2">Type & Power Rating</div>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Inverter Type" req>
                    <select id="si-type" className="solar-input">
                      <option>Pure Sine Wave Off-Grid</option>
                      <option>Hybrid (Built-in MPPT + Grid Failover)</option>
                      <option>Hybrid All-in-One (Inverter + Battery Pack)</option>
                      <option>Grid-Tie</option>
                      <option>Bi-directional / UPS</option>
                    </select>
                  </F>
                  <F label="Continuous Power (W)" req><input id="si-cont" type="number" className="solar-input" placeholder="5000" /></F>
                  <F label="Surge Power (W)"><input id="si-surge" type="number" className="solar-input" placeholder="10000" /></F>
                  <F label="Efficiency (%)"><input id="si-eff" type="number" step=".1" className="solar-input" placeholder="96" /></F>
                  <F label="DC Input Voltage (V)" req><select id="si-dcv" className="solar-input"><option>12</option><option>24</option><option>48</option></select></F>
                  <F label="AC Output Voltage (V)"><input id="si-acv" type="number" className="solar-input" placeholder="230" /></F>
                  <F label="No-Load Consumption (W)"><input id="si-nl" type="number" className="solar-input" placeholder="15" /></F>
                  <F label="Transfer Time (ms)"><input id="si-tx" type="number" className="solar-input" placeholder="20" /></F>
                  <F label="Built-in MPPT"><select id="si-mppt" className="solar-input"><option>No</option><option>Yes – Single MPPT</option><option>Yes – Dual MPPT</option></select></F>
                  <F label="Grid Auto-Failover"><select id="si-gf" className="solar-input"><option>No</option><option>Yes – Automatic</option></select></F>
                  <F label="Communication Ports"><input id="si-comm" className="solar-input" placeholder="RS485, USB, Bluetooth, WiFi" /></F>
                  <F label="Weight (kg)"><input id="si-wt" type="number" step=".1" className="solar-input" placeholder="22" /></F>
                  <F label="Certifications"><input id="si-cert" className="solar-input" placeholder="CE, IEC 62109" /></F>
                </div>
              </>}

              {/* Controller specs */}
              {cat === 'controller' && <>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Type" req><select id="sc-type" className="solar-input"><option>MPPT</option><option>PWM</option></select></F>
                  <F label="Max PV OC Voltage (V)" req><input id="sc-voc" type="number" className="solar-input" placeholder="150" /></F>
                  <F label="Rated Charge Current (A)" req><input id="sc-amp" type="number" className="solar-input" placeholder="85" /></F>
                  <F label="Max Efficiency (%)"><input id="sc-eff" type="number" step=".1" className="solar-input" placeholder="98" /></F>
                  <F label="Max PV @ 48V (W)"><input id="sc-pv48" type="number" className="solar-input" placeholder="4400" /></F>
                  <F label="Communication"><input id="sc-comm" className="solar-input" placeholder="Bluetooth, VE.Direct" /></F>
                </div>
              </>}

              {/* Light / Accessory simplified */}
              {(cat === 'light' || cat === 'accessory') && (
                <div className="grid grid-cols-2 gap-4">
                  {cat === 'light' && <>
                    <F label="Lumens (lm)" req><input id="sl-lm" type="number" className="solar-input" /></F>
                    <F label="LED Power (W)"><input id="sl-w" type="number" className="solar-input" /></F>
                    <F label="Color Temperature (K)"><input id="sl-cct" className="solar-input" /></F>
                    <F label="Panel Wattage (W)" req><input id="sl-pv" type="number" className="solar-input" /></F>
                    <F label="Battery Capacity (Ah)"><input id="sl-ah" type="number" className="solar-input" /></F>
                    <F label="Lighting Duration (h)" req><input id="sl-hrs" type="number" className="solar-input" /></F>
                    <F label="IP Rating" req><input id="sl-ip" className="solar-input" placeholder="IP66" /></F>
                  </>}
                  {cat === 'accessory' && <>
                    <F label="Accessory Type" req>
                      <select className="solar-input"><option>DC Solar Cable</option><option>MC4 Connector</option><option>Panel Mounting Structure</option><option>Battery Cable</option><option>Fuse / Circuit Breaker</option><option>Energy Meter</option><option>Other</option></select>
                    </F>
                    <F label="Key Specification" req><input className="solar-input" placeholder="e.g. 6mm², 100A, 1500V DC" /></F>
                    <F label="Voltage Rating (V)"><input className="solar-input" placeholder="1500V DC" /></F>
                    <F label="Current Rating (A)"><input type="number" className="solar-input" /></F>
                    <F label="IP Rating"><input className="solar-input" placeholder="IP67" /></F>
                    <F label="Quantity Unit"><select className="solar-input"><option>Per Piece</option><option>Per Metre</option><option>Per Roll (50m)</option><option>Per Pair</option></select></F>
                  </>}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(1)} className="btn-ghost">← Back</button>
                <button onClick={submit} disabled={submitting}
                  className="btn-primary py-3 px-8 flex items-center gap-2 disabled:opacity-60">
                  {submitting && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                  {submitting ? 'Submitting…' : '✓ List Product'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="section-card p-10 text-center animate-slide-up">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="font-heading text-xl font-bold text-solar-green mb-2">Listing Submitted!</h2>
              <p className="text-solar-muted text-sm mb-6">Your product will be reviewed and go live shortly.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => { setStep(0); setCat(null); setImg64(null); setPrevUrl(null); setXStatus(null); }}
                  className="btn-outline">List Another</button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden md:block">
          <div className="section-card p-5 space-y-4 sticky top-20">
            <div>
              <div className="font-heading text-xs font-semibold text-solar-accent mb-3 uppercase tracking-widest">Why SolarHub?</div>
              {['Reach 12,000+ solar buyers/month','AI label scan fills specs for you','Category-specific forms attract serious buyers','AI Advisor sends buyers to your listings','Verified seller badge builds trust'].map(t => (
                <div key={t} className="flex items-start gap-2 text-xs text-solar-muted mb-2.5">
                  <span className="text-solar-green mt-0.5">✅</span>{t}
                </div>
              ))}
            </div>
            <hr className="border-solar-border" />
            <div>
              <div className="font-heading text-xs font-semibold text-solar-muted mb-3 uppercase tracking-widest">📸 Scan Tips</div>
              {['Good lighting + flat label = best results','Datasheets & spec sheets work great','Always review AI values before submitting','Fill in anything AI couldn\'t read'].map(t => (
                <div key={t} className="flex items-start gap-2 text-xs text-solar-muted mb-2">
                  <span className="text-solar-accent">💡</span>{t}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
