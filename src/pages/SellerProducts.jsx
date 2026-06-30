import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sellerProductsService } from '../services/commerce.service';
import { useApp } from '../context/AppContext';
import MediaUploader from '../components/MediaUploader';
import DiscountEditor from '../components/DiscountEditor';
import { Sun, BatteryFull, Zap, Plug, Lightbulb, Wrench, Package, Trash2, Store, Eye } from 'lucide-react';

const CAT_META = {
  panel:      { icon: <Sun size={20} className="text-solar-accent"/>, label: 'Solar Panel' },
  battery:    { icon: <BatteryFull size={20} className="text-solar-accent"/>, label: 'Battery' },
  inverter:   { icon: <Zap size={20} className="text-solar-accent"/>, label: 'Inverter' },
  controller: { icon: <Plug size={20} className="text-solar-accent"/>, label: 'Charge Controller' },
  light:      { icon: <Lightbulb size={20} className="text-solar-accent"/>, label: 'Solar Light' },
  accessory:  { icon: <Wrench size={20} className="text-solar-accent"/>, label: 'Accessory' },
};

const SLUG_TO_CAT = {
  'solar-panels': 'panel', 'batteries': 'battery', 'inverters': 'inverter',
  'charge-controllers': 'controller', 'solar-lights': 'light', 'accessories': 'accessory',
};

const STATUS_MAP = {
  active:   { label: 'Active',   cls: 'badge-green' },
  pending:  { label: 'Pending',  cls: 'badge-amber' },
  inactive: { label: 'Inactive', cls: 'badge-blue' },
  sold_out: { label: 'Sold Out', cls: 'badge-red' },
  deleted:  { label: 'Deleted',  cls: 'badge-red' },
};

function F({ label, req, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-solar-muted">
        {label}{req && <span className="text-solar-accent ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────
function EditModal({ product, onClose, onSaved, toast }) {
  const cat = SLUG_TO_CAT[product.categorySlug || product.category?.slug] || 'accessory';

  const [lockLoading, setLockLoading] = useState(true);
  const [lockStatus, setLockStatus]   = useState(null);
  const [editStep, setEditStep]       = useState(1);
  const [saving, setSaving]           = useState(false);
  const [discounts, setDiscounts]     = useState(Array.isArray(product.discounts) ? product.discounts : []);
  const [mediaFiles, setMediaFiles]   = useState(() =>
    (product.images || []).map(url => (typeof url === 'string' ? { url } : url))
  );

  const [form, setForm] = useState({
    name:         product.name          || '',
    brand:        product.brand         || '',
    modelNumber:  product.modelNumber   || '',
    price:        product.price         || '',
    stock:        product.stock         || '',
    condition:    product.condition     || 'new',
    sellerCity:   product.sellerCity    || '',
    warrantyYears: product.warrantyYears || '',
    description:  product.description  || '',
    status:       product.status        || 'active',
    paymentTerms: product.paymentTerms?.[0] || 'escrow',
    shippingPayer: product.shippingPayer || 'buyer',
    deliveryDays:  product.deliveryDays  || '',
    serviceAreas:  product.serviceAreas  || '',
    returnPolicy:  product.returnPolicy  || 'No Returns Accepted',
  });

  const [specs, setSpecs] = useState(() => {
    const s = product.specs || {};
    if (cat === 'panel') return {
      type: s.type || 'Monocrystalline',
      pmaxWp: s.pmaxWp || '', vocV: s.vocV || '', vmpV: s.vmpV || '',
      iscA: s.iscA || '', impA: s.impA || '', efficiencyPct: s.efficiencyPct || '',
      tempCoeff: s.tempCoeff || '', dimensions: s.dimensions || '',
      weightKg: s.weightKg || '', cellCount: s.cellCount || '',
      maxSysVoltage: s.maxSysVoltage || '', certifications: s.certifications || '',
    };
    if (cat === 'battery') return {
      chemistry: s.chemistry || 'LiFePO4',
      capacityAh: s.capacityAh || '', voltageV: s.voltageV || '',
      dodPct: s.dodPct || '', cycleLife: s.cycleLife || '',
      chargeRate: s.chargeRate || '', dischargeRate: s.dischargeRate || '',
      hasBms: s.hasBms !== false, weightKg: s.weightKg || '',
      certifications: s.certifications || '',
    };
    if (cat === 'inverter') return {
      type: s.type || 'Pure Sine Wave Off-Grid',
      continuousW: s.continuousW || '', surgeW: s.surgeW || '',
      efficiencyPct: s.efficiencyPct || '', dcInputV: s.dcInputV || '48',
      acOutputV: s.acOutputV || '', noLoadW: s.noLoadW || '', transferMs: s.transferMs || '',
      builtInMppt: s.builtInMppt === true, gridFailover: s.gridFailover === true,
      communication: s.communication || '', weightKg: s.weightKg || '',
      certifications: s.certifications || '',
    };
    if (cat === 'controller') return {
      type: s.type || 'MPPT',
      maxPvVocV: s.maxPvVocV || '', chargeCurrentA: s.chargeCurrentA || '',
      maxEffPct: s.maxEffPct || '', pvPower48vW: s.pvPower48vW || '',
      communication: s.communication || '',
    };
    if (cat === 'light') return {
      lumens: s.lumens || '', ledPowerW: s.ledPowerW || '', colorTempK: s.colorTempK || '',
      panelW: s.panelW || '', batteryAh: s.batteryAh || '',
      lightingHrs: s.lightingHrs || '', ipRating: s.ipRating || '',
    };
    return { ...s };
  });

  useEffect(() => {
    sellerProductsService.getEditLock(product.id)
      .then(r => setLockStatus(r?.data ?? r))
      .catch(() => setLockStatus({ locked: false }))
      .finally(() => setLockLoading(false));
  }, [product.id]);

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function setS(k, v) { setSpecs(s => ({ ...s, [k]: v })); }

  const handleSave = async () => {
    if (lockStatus?.locked) return;
    if (!form.name) { toast('Product name is required', 'err'); return; }
    if (!form.price) { toast('Price is required', 'err'); return; }
    if (!form.stock && form.stock !== 0) { toast('Stock quantity is required', 'err'); return; }
    setSaving(true);
    try {
      await sellerProductsService.update(product.id, {
        name:          form.name,
        brand:         form.brand         || undefined,
        modelNumber:   form.modelNumber   || undefined,
        price:         +form.price,
        stock:         +form.stock,
        description:   form.description   || undefined,
        condition:     form.condition,
        warrantyYears: form.warrantyYears ? +form.warrantyYears : undefined,
        sellerCity:    form.sellerCity    || undefined,
        status:        form.status,
        paymentTerms:  [form.paymentTerms || 'escrow'],
        shippingPayer: form.shippingPayer || 'buyer',
        deliveryDays:  form.deliveryDays  ? +form.deliveryDays : undefined,
        serviceAreas:  form.serviceAreas  || undefined,
        returnPolicy:  form.returnPolicy  || undefined,
        images:        mediaFiles.map(m => m.url),
        thumbnail:     mediaFiles.length > 0 ? mediaFiles[0].url : undefined,
        specs,
        discounts:     discounts.filter(r => r.minQty > 0 && r.value > 0),
      });
      toast('Product updated!', 'ok');
      onSaved();
    } catch (e) {
      toast(e.response?.data?.message || e.message || 'Could not update product', 'err');
    } finally {
      setSaving(false);
    }
  };

  const locked = !lockLoading && lockStatus?.locked;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-solar-card border border-solar-border2 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">

        {/* Sticky header */}
        <div className="sticky top-0 bg-solar-card border-b border-solar-border px-6 pt-5 pb-0 z-10">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-heading text-lg font-bold text-solar-text">Edit Listing</h2>
              <p className="text-xs text-solar-dim mt-0.5 truncate max-w-[380px]">{product.name}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-solar-dim hover:text-solar-text hover:bg-solar-surface flex items-center justify-center transition-all flex-shrink-0 mt-0.5"
            >✕</button>
          </div>

          {/* Lock status */}
          {lockLoading ? (
            <div className="flex items-center gap-2 text-xs text-solar-dim mb-3">
              <span className="w-3 h-3 border border-solar-accent/40 border-t-solar-accent rounded-full animate-spin" />
              Checking edit availability…
            </div>
          ) : locked ? (
            <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 mb-3 text-xs">
              <span className="text-red-400 font-semibold">Editing locked — </span>
              <span className="text-red-300">{lockStatus.reason}</span>
            </div>
          ) : (
            <div className="bg-solar-green/10 border border-solar-green/25 rounded-xl p-3 mb-3 text-xs text-solar-green">
              This product is available to edit
            </div>
          )}

          {/* Step tabs */}
          <div className="flex">
            {['Details', 'Specifications'].map((s, i) => (
              <button
                key={s}
                onClick={() => !locked && setEditStep(i + 1)}
                className={`flex-1 py-2.5 text-center text-xs font-medium border-b-2 transition-all ${
                  i < editStep - 1 ? 'border-solar-green text-solar-green'
                  : i === editStep - 1 ? 'border-solar-accent text-solar-accent'
                  : 'border-solar-border text-solar-dim'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className={`p-6 space-y-5 transition-opacity ${locked ? 'opacity-40 pointer-events-none' : ''}`}>

          {/* ── Step 1: Details ── */}
          {editStep === 1 && (
            <div className="space-y-5 animate-slide-up">
              <MediaUploader
                value={mediaFiles}
                onChange={setMediaFiles}
                folder="products"
                label="Product Photos & Videos"
              />

              <div className="grid grid-cols-2 gap-4">
                <F label="Product Name" req>
                  <input className="solar-input" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Jinko Solar Tiger Neo 550W" />
                </F>
                <F label="Brand / Manufacturer">
                  <input className="solar-input" value={form.brand} onChange={e => setF('brand', e.target.value)} placeholder="Jinko Solar" />
                </F>
                <F label="Model Number">
                  <input className="solar-input" value={form.modelNumber} onChange={e => setF('modelNumber', e.target.value)} placeholder="JKM550N-72HL4" />
                </F>
                <F label="Price (₦)" req>
                  <input type="number" className="solar-input" value={form.price} onChange={e => setF('price', e.target.value)} placeholder="245000" />
                </F>
                <F label="Stock Available" req>
                  <input type="number" className="solar-input" value={form.stock} onChange={e => setF('stock', e.target.value)} placeholder="20" />
                </F>
                <F label="Condition">
                  <select className="solar-input" value={form.condition} onChange={e => setF('condition', e.target.value)}>
                    <option value="new">New</option>
                    <option value="used_like_new">Used – Like New</option>
                    <option value="used_good">Used – Good</option>
                    <option value="refurbished">Refurbished</option>
                  </select>
                </F>
                <F label="Listing Status">
                  <select className="solar-input" value={form.status} onChange={e => setF('status', e.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive (hidden)</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                </F>
                <F label="Location (City)">
                  <input className="solar-input" value={form.sellerCity} onChange={e => setF('sellerCity', e.target.value)} placeholder="Lagos" />
                </F>
                <F label="Warranty (years)">
                  <input type="number" className="solar-input" value={form.warrantyYears} onChange={e => setF('warrantyYears', e.target.value)} placeholder="25" />
                </F>
                <div className="col-span-2">
                  <F label="Product Description">
                    <textarea className="solar-input" rows={3} value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Describe your product, what's in the box…" />
                  </F>
                </div>
              </div>

              {/* Delivery & Payment */}
              <div className="bg-solar-accent/5 border border-solar-accent/20 rounded-xl p-5 space-y-4">
                <h3 className="font-heading text-sm font-semibold text-solar-accent flex items-center gap-2">Delivery &amp; Payment Terms</h3>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Payment Terms" req>
                    <select className="solar-input" value={form.paymentTerms} onChange={e => setF('paymentTerms', e.target.value)}>
                      <option value="before">Payment Before Delivery</option>
                      <option value="pod">Payment on Delivery (POD)</option>
                      <option value="inspection">Payment After Inspection</option>
                      <option value="50pct">50% Upfront, 50% on Delivery</option>
                      <option value="escrow">Platform Escrow (Recommended)</option>
                    </select>
                  </F>
                  <F label="Shipping Cost" req>
                    <select className="solar-input" value={form.shippingPayer} onChange={e => setF('shippingPayer', e.target.value)}>
                      <option value="seller">Seller Pays – Free Delivery</option>
                      <option value="buyer">Buyer Pays</option>
                      <option value="shared">Shared – Split Equally</option>
                      <option value="negotiable">Negotiable</option>
                    </select>
                  </F>
                  <F label="Max Delivery Days">
                    <input type="number" className="solar-input" value={form.deliveryDays} onChange={e => setF('deliveryDays', e.target.value)} placeholder="e.g. 3" min="1" max="30" />
                  </F>
                  <F label="Service Areas">
                    <input className="solar-input" value={form.serviceAreas} onChange={e => setF('serviceAreas', e.target.value)} placeholder="Lagos, Ogun, Nationwide" />
                  </F>
                  <div className="col-span-2">
                    <F label="Return Policy">
                      <select className="solar-input" value={form.returnPolicy} onChange={e => setF('returnPolicy', e.target.value)}>
                        <option>No Returns Accepted</option>
                        <option>7-Day Return (Defects Only)</option>
                        <option>14-Day Return Policy</option>
                        <option>30-Day Return Policy</option>
                      </select>
                    </F>
                  </div>
                </div>
              </div>

              <DiscountEditor value={discounts} onChange={setDiscounts} />

              <div className="flex justify-end">
                <button onClick={() => setEditStep(2)} className="btn-primary">
                  Next: Specifications →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Specs ── */}
          {editStep === 2 && (
            <div className="space-y-5 animate-slide-up">
              <div className="font-heading text-xs uppercase tracking-widest text-solar-accent border-b border-solar-border pb-2">
                {CAT_META[cat]?.icon} {CAT_META[cat]?.label} — Technical Specifications
              </div>

              {/* Panel specs */}
              {cat === 'panel' && <>
                <div className="font-heading text-xs uppercase tracking-widest text-solar-muted border-b border-solar-border pb-2">Electrical Performance (STC)</div>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Panel Type" req>
                    <select className="solar-input" value={specs.type} onChange={e => setS('type', e.target.value)}>
                      <option>Monocrystalline</option><option>Polycrystalline</option><option>Bifacial Mono</option><option>HJT</option><option>PERC</option>
                    </select>
                  </F>
                  <F label="Peak Power – Pmax (Wp)" req><input type="number" className="solar-input" value={specs.pmaxWp} onChange={e => setS('pmaxWp', e.target.value)} placeholder="550" /></F>
                  <F label="Voc (V)" req><input type="number" step=".01" className="solar-input" value={specs.vocV} onChange={e => setS('vocV', e.target.value)} placeholder="49.5" /></F>
                  <F label="Vmp (V)" req><input type="number" step=".01" className="solar-input" value={specs.vmpV} onChange={e => setS('vmpV', e.target.value)} placeholder="41.8" /></F>
                  <F label="Isc (A)" req><input type="number" step=".01" className="solar-input" value={specs.iscA} onChange={e => setS('iscA', e.target.value)} placeholder="13.98" /></F>
                  <F label="Imp (A)"><input type="number" step=".01" className="solar-input" value={specs.impA} onChange={e => setS('impA', e.target.value)} placeholder="13.16" /></F>
                  <F label="Efficiency (%)"><input type="number" step=".1" className="solar-input" value={specs.efficiencyPct} onChange={e => setS('efficiencyPct', e.target.value)} placeholder="22.3" /></F>
                  <F label="Temp. Coeff. Pmax (%/°C)"><input type="number" step=".01" className="solar-input" value={specs.tempCoeff} onChange={e => setS('tempCoeff', e.target.value)} placeholder="-0.30" /></F>
                  <F label="Dimensions (mm)"><input className="solar-input" value={specs.dimensions} onChange={e => setS('dimensions', e.target.value)} placeholder="2278×1134×35" /></F>
                  <F label="Weight (kg)"><input type="number" step=".1" className="solar-input" value={specs.weightKg} onChange={e => setS('weightKg', e.target.value)} placeholder="28.2" /></F>
                  <F label="Cell Count"><input type="number" className="solar-input" value={specs.cellCount} onChange={e => setS('cellCount', e.target.value)} placeholder="144" /></F>
                  <F label="Max System Voltage (V)"><input type="number" className="solar-input" value={specs.maxSysVoltage} onChange={e => setS('maxSysVoltage', e.target.value)} placeholder="1500" /></F>
                  <div className="col-span-2">
                    <F label="Certifications"><input className="solar-input" value={specs.certifications} onChange={e => setS('certifications', e.target.value)} placeholder="IEC 61215, IEC 61730, TÜV" /></F>
                  </div>
                </div>
              </>}

              {/* Battery specs */}
              {cat === 'battery' && <>
                <div className="font-heading text-xs uppercase tracking-widest text-solar-muted border-b border-solar-border pb-2">Chemistry &amp; Capacity</div>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Chemistry" req>
                    <select className="solar-input" value={specs.chemistry} onChange={e => setS('chemistry', e.target.value)}>
                      <option>LiFePO4</option><option>NMC</option><option>AGM</option><option>Gel</option><option>Flooded Lead-Acid</option>
                    </select>
                  </F>
                  <F label="Nominal Capacity (Ah)" req><input type="number" className="solar-input" value={specs.capacityAh} onChange={e => setS('capacityAh', e.target.value)} placeholder="200" /></F>
                  <F label="Nominal Voltage (V)" req><input type="number" className="solar-input" value={specs.voltageV} onChange={e => setS('voltageV', e.target.value)} placeholder="48" /></F>
                  <F label="DoD (%)"><input type="number" className="solar-input" value={specs.dodPct} onChange={e => setS('dodPct', e.target.value)} placeholder="95" /></F>
                  <F label="Cycle Life (cycles)"><input type="number" className="solar-input" value={specs.cycleLife} onChange={e => setS('cycleLife', e.target.value)} placeholder="4000" /></F>
                  <F label="Max Charge Rate"><input className="solar-input" value={specs.chargeRate} onChange={e => setS('chargeRate', e.target.value)} placeholder="1C" /></F>
                  <F label="Max Discharge Rate"><input className="solar-input" value={specs.dischargeRate} onChange={e => setS('dischargeRate', e.target.value)} placeholder="2C" /></F>
                  <F label="BMS Included">
                    <select className="solar-input" value={specs.hasBms ? 'Yes – Built-in' : 'No – External'} onChange={e => setS('hasBms', e.target.value.startsWith('Yes'))}>
                      <option>Yes – Built-in</option><option>No – External</option>
                    </select>
                  </F>
                  <F label="Weight (kg)"><input type="number" step=".1" className="solar-input" value={specs.weightKg} onChange={e => setS('weightKg', e.target.value)} placeholder="88" /></F>
                  <F label="Certifications"><input className="solar-input" value={specs.certifications} onChange={e => setS('certifications', e.target.value)} placeholder="IEC 62133, UN38.3, CE" /></F>
                </div>
              </>}

              {/* Inverter specs */}
              {cat === 'inverter' && <>
                <div className="font-heading text-xs uppercase tracking-widest text-solar-muted border-b border-solar-border pb-2">Type &amp; Power Rating</div>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Inverter Type" req>
                    <select className="solar-input" value={specs.type} onChange={e => setS('type', e.target.value)}>
                      <option>Pure Sine Wave Off-Grid</option>
                      <option>Hybrid (Built-in MPPT + Grid Failover)</option>
                      <option>Hybrid All-in-One (Inverter + Battery Pack)</option>
                      <option>Grid-Tie</option>
                      <option>Bi-directional / UPS</option>
                    </select>
                  </F>
                  <F label="Continuous Power (W)" req><input type="number" className="solar-input" value={specs.continuousW} onChange={e => setS('continuousW', e.target.value)} placeholder="5000" /></F>
                  <F label="Surge Power (W)"><input type="number" className="solar-input" value={specs.surgeW} onChange={e => setS('surgeW', e.target.value)} placeholder="10000" /></F>
                  <F label="Efficiency (%)"><input type="number" step=".1" className="solar-input" value={specs.efficiencyPct} onChange={e => setS('efficiencyPct', e.target.value)} placeholder="96" /></F>
                  <F label="DC Input Voltage (V)" req>
                    <select className="solar-input" value={specs.dcInputV} onChange={e => setS('dcInputV', e.target.value)}>
                      <option value="12">12</option><option value="24">24</option><option value="48">48</option>
                    </select>
                  </F>
                  <F label="AC Output Voltage (V)"><input type="number" className="solar-input" value={specs.acOutputV} onChange={e => setS('acOutputV', e.target.value)} placeholder="230" /></F>
                  <F label="No-Load Consumption (W)"><input type="number" className="solar-input" value={specs.noLoadW} onChange={e => setS('noLoadW', e.target.value)} placeholder="15" /></F>
                  <F label="Transfer Time (ms)"><input type="number" className="solar-input" value={specs.transferMs} onChange={e => setS('transferMs', e.target.value)} placeholder="20" /></F>
                  <F label="Built-in MPPT">
                    <select className="solar-input" value={specs.builtInMppt ? 'Yes – Single MPPT' : 'No'} onChange={e => setS('builtInMppt', !e.target.value.startsWith('No'))}>
                      <option>No</option><option>Yes – Single MPPT</option><option>Yes – Dual MPPT</option>
                    </select>
                  </F>
                  <F label="Grid Auto-Failover">
                    <select className="solar-input" value={specs.gridFailover ? 'Yes – Automatic' : 'No'} onChange={e => setS('gridFailover', !e.target.value.startsWith('No'))}>
                      <option>No</option><option>Yes – Automatic</option>
                    </select>
                  </F>
                  <F label="Communication Ports"><input className="solar-input" value={specs.communication} onChange={e => setS('communication', e.target.value)} placeholder="RS485, USB, Bluetooth" /></F>
                  <F label="Weight (kg)"><input type="number" step=".1" className="solar-input" value={specs.weightKg} onChange={e => setS('weightKg', e.target.value)} placeholder="22" /></F>
                  <div className="col-span-2">
                    <F label="Certifications"><input className="solar-input" value={specs.certifications} onChange={e => setS('certifications', e.target.value)} placeholder="CE, IEC 62109" /></F>
                  </div>
                </div>
              </>}

              {/* Controller specs */}
              {cat === 'controller' && (
                <div className="grid grid-cols-2 gap-4">
                  <F label="Type" req>
                    <select className="solar-input" value={specs.type} onChange={e => setS('type', e.target.value)}>
                      <option>MPPT</option><option>PWM</option>
                    </select>
                  </F>
                  <F label="Max PV OC Voltage (V)" req><input type="number" className="solar-input" value={specs.maxPvVocV} onChange={e => setS('maxPvVocV', e.target.value)} placeholder="150" /></F>
                  <F label="Rated Charge Current (A)" req><input type="number" className="solar-input" value={specs.chargeCurrentA} onChange={e => setS('chargeCurrentA', e.target.value)} placeholder="85" /></F>
                  <F label="Max Efficiency (%)"><input type="number" step=".1" className="solar-input" value={specs.maxEffPct} onChange={e => setS('maxEffPct', e.target.value)} placeholder="98" /></F>
                  <F label="Max PV @ 48V (W)"><input type="number" className="solar-input" value={specs.pvPower48vW} onChange={e => setS('pvPower48vW', e.target.value)} placeholder="4400" /></F>
                  <F label="Communication"><input className="solar-input" value={specs.communication} onChange={e => setS('communication', e.target.value)} placeholder="Bluetooth, VE.Direct" /></F>
                </div>
              )}

              {/* Solar light specs */}
              {cat === 'light' && (
                <div className="grid grid-cols-2 gap-4">
                  <F label="Lumens (lm)" req><input type="number" className="solar-input" value={specs.lumens} onChange={e => setS('lumens', e.target.value)} /></F>
                  <F label="LED Power (W)"><input type="number" className="solar-input" value={specs.ledPowerW} onChange={e => setS('ledPowerW', e.target.value)} /></F>
                  <F label="Color Temperature (K)"><input className="solar-input" value={specs.colorTempK} onChange={e => setS('colorTempK', e.target.value)} /></F>
                  <F label="Panel Wattage (W)" req><input type="number" className="solar-input" value={specs.panelW} onChange={e => setS('panelW', e.target.value)} /></F>
                  <F label="Battery Capacity (Ah)"><input type="number" className="solar-input" value={specs.batteryAh} onChange={e => setS('batteryAh', e.target.value)} /></F>
                  <F label="Lighting Duration (h)" req><input type="number" className="solar-input" value={specs.lightingHrs} onChange={e => setS('lightingHrs', e.target.value)} /></F>
                  <F label="IP Rating" req><input className="solar-input" value={specs.ipRating} onChange={e => setS('ipRating', e.target.value)} placeholder="IP66" /></F>
                </div>
              )}

              {/* Accessory — free-form */}
              {cat === 'accessory' && (
                <div className="text-xs text-solar-muted bg-solar-surface border border-solar-border rounded-xl p-4">
                  Technical specs for accessories are free-form. Edit them in the Details step description if needed.
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button onClick={() => setEditStep(1)} className="btn-ghost">← Back</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                  {saving && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                  {saving ? 'Saving…' : '✓ Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────────
function DeleteModal({ productName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-solar-card border border-solar-border2 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-up">
        <div className="mb-3 flex justify-center"><Trash2 size={32} className="text-red-400 opacity-60"/></div>
        <h3 className="font-heading font-bold text-lg mb-2">Remove listing?</h3>
        <p className="text-solar-muted text-sm mb-1 truncate font-medium">{productName}</p>
        <p className="text-solar-dim text-xs mb-6">This product will be removed from the marketplace. Existing orders will not be affected.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-outline flex-1">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 px-4 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-sm hover:bg-red-500/30 transition-all">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SellerProducts() {
  const { user, toast } = useApp();
  const navigate = useNavigate();

  const [products, setProducts]     = useState([]);
  const [quota, setQuota]           = useState(null);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(true);
  const [editProduct, setEditProduct]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const [prods, q] = await Promise.all([
        sellerProductsService.getMyProducts(p, 20),
        sellerProductsService.getQuota(),
      ]);
      const paginated = prods?.data ?? prods;
      setProducts(Array.isArray(paginated) ? paginated : (paginated?.data ?? []));
      setTotalPages(paginated?.pages || 1);
      setQuota(q?.data ?? q);
      setPage(p);
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!user?.isSeller) { navigate('/sell'); return; }
    load(1);
  }, [user]);

  const handleDelete = async (id) => {
    try {
      await sellerProductsService.delete(id);
      toast('Product removed', 'ok');
      setDeleteConfirm(null);
      load(page);
    } catch (e) {
      toast(e.message, 'err');
    }
  };

  if (!user?.isSeller) return null;

  const quotaPct = quota?.limit ? Math.min(100, (quota.used / quota.limit) * 100) : 0;
  const atLimit  = quota?.limit && quota.remaining === 0;

  return (
    <div className="max-w-[1100px] mx-auto px-5 py-10">

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold">My <span className="text-solar-accent">Listings</span></h1>
          {quota && (
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-solar-muted text-sm">
                {quota.used} of {quota.limit ?? '∞'} listings used
              </span>
              {quota.limit && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-solar-surface rounded-full overflow-hidden border border-solar-border">
                    <div
                      className={`h-full rounded-full transition-all ${atLimit ? 'bg-red-500' : 'bg-solar-green'}`}
                      style={{ width: `${quotaPct}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${atLimit ? 'text-red-400' : 'text-solar-green'}`}>
                    {atLimit ? 'Limit reached' : `${quota.remaining} remaining`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Link to="/subscription" className="btn-outline text-sm">Upgrade Plan</Link>
          <Link to="/sell" className="btn-primary text-sm">+ New Listing</Link>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="section-card p-16 text-center">
          <div className="w-8 h-8 border-2 border-solar-border border-t-solar-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-solar-dim text-sm">Loading listings…</p>
        </div>
      ) : products.length === 0 ? (
        <div className="section-card p-16 text-center animate-fade-in">
          <div className="mb-4 flex justify-center"><Store size={48} className="text-solar-dim opacity-40"/></div>
          <h2 className="font-heading text-lg font-semibold mb-2">No listings yet</h2>
          <p className="text-solar-muted text-sm mb-6">Start selling by creating your first product listing.</p>
          <Link to="/sell" className="btn-primary">Create Your First Listing</Link>
        </div>
      ) : (
        <>
          {/* Products grid cards */}
          <div className="grid gap-3">
            {products.map(p => {
              const badge = STATUS_MAP[p.status] || STATUS_MAP.inactive;
              return (
                <div
                  key={p.id}
                  className="section-card flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:border-solar-border2 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt="" className="w-16 h-16 rounded-xl object-cover border border-solar-border" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-solar-surface border border-solar-border flex items-center justify-center text-2xl">
                        {CAT_META[SLUG_TO_CAT[p.categorySlug || p.category?.slug]]?.icon || <Package size={24} className="text-solar-dim"/>}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-semibold text-solar-text text-sm truncate">{p.name}</p>
                      <span className={`${badge.cls} text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0`}>{badge.label}</span>
                    </div>
                    {p.brand && <p className="text-solar-dim text-xs">{p.brand}{p.modelNumber ? ` · ${p.modelNumber}` : ''}</p>}
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      <span className="text-solar-accent font-semibold text-sm">₦{Number(p.price).toLocaleString()}</span>
                      <span className={`text-xs ${p.stock === 0 ? 'text-red-400' : 'text-solar-muted'}`}>
                        {p.stock === 0 ? 'Out of stock' : `${p.stock} in stock`}
                      </span>
                      <span className="text-solar-dim text-xs flex items-center gap-1"><Eye size={11}/>{p.views ?? 0} views</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setEditProduct(p)}
                      className="btn-outline text-xs py-1.5 px-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(p)}
                      className="w-8 h-8 rounded-lg text-solar-dim hover:text-red-400 hover:bg-red-500/10 border border-solar-border hover:border-red-500/30 flex items-center justify-center transition-all text-sm"
                      title="Remove listing"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => load(page - 1)}
                disabled={page === 1}
                className="btn-ghost text-sm disabled:opacity-40"
              >← Prev</button>
              <span className="text-solar-muted text-sm px-3">Page {page} of {totalPages}</span>
              <button
                onClick={() => load(page + 1)}
                disabled={page === totalPages}
                className="btn-ghost text-sm disabled:opacity-40"
              >Next →</button>
            </div>
          )}
        </>
      )}

      {/* Edit modal */}
      {editProduct && (
        <EditModal
          product={editProduct}
          toast={toast}
          onClose={() => setEditProduct(null)}
          onSaved={() => { setEditProduct(null); load(page); }}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <DeleteModal
          productName={deleteConfirm.name}
          onConfirm={() => handleDelete(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
