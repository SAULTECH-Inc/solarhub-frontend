import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { paymentsService } from '../services/commerce.service';

const fp = n => '₦' + Number(n).toLocaleString();
const STEPS = ['Delivery', 'Payment', 'Review'];
const NG_STATES = ['Lagos','Abuja (FCT)','Kano','Oyo','Rivers','Kaduna','Ogun','Anambra','Edo','Delta','Imo','Enugu','Cross River','Ondo','Other'];

export default function Checkout() {
  const { cart, cartTotal, user, dispatch, placeOrder, toast } = useApp();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName||'', lastName: user?.lastName||'',
    phone:'', email: user?.email||'',
    address:'', city:'', state:'Lagos', landmark:'',
    payment:'online', deliveryMethod:'standard', currency:'NGN',
  });

  const items = cart?.items || [];
  const deliveryFee = form.deliveryMethod==='express'?8500:form.deliveryMethod==='pickup'?0:3500;
  const finalTotal  = cartTotal + deliveryFee;
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  if (!items.length) { nav('/cart'); return null; }

  async function doPlace() {
    if (!user) { dispatch({type:'OPEN_AUTH',payload:'login'}); return; }
    if (!form.address||!form.phone||!form.city) { toast('Please fill all required fields','err'); return; }
    setSaving(true);
    try {
      const dto = {
        deliveryAddress:{ firstName:form.firstName, lastName:form.lastName,
          phone:form.phone, address:form.address, city:form.city, state:form.state, country:'Nigeria' },
        deliveryMethod:form.deliveryMethod, deliveryFee, currency:form.currency,
        paymentMethod: form.payment
      };
      const result = await placeOrder(dto);
      if (!result.success) return;
      const orderId = result.order?.id;
      
      // If payment is purely Cash on Delivery, skip online gateway and mark success
      if (form.payment === 'cash') {
        toast('Order placed successfully via Payment on Delivery', 'ok');
        nav('/orders');
        return;
      }
      
      // Attempt online payment routing
      if (orderId && form.payment === 'online') {
        try {
          const payRes = await paymentsService.initiate(orderId, form.currency, 'card');
          const pd = payRes?.data ?? payRes;
          if (pd?.paymentUrl) { window.location.href = pd.paymentUrl; return; }
          if (pd?.clientSecret) { window.location.href = `/orders?payment_intent=${pd.clientSecret}`; return; }
          throw new Error('Payment gateway did not return a valid checkout URL.');
        } catch(e) { 
          toast('Order placed but online payment failed to load. Please try paying from the Orders page.', 'err');
          console.warn('Payment init failed:', e);
          return; // Stop navigation so user can see error toast and explicitly click /orders on their own or retry
        }
      }
      
      nav('/orders');
    } catch(e) { toast(e.message,'err'); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-[1100px] mx-auto px-5 py-10">
      <h1 className="font-heading text-2xl font-bold mb-8">Checkout</h1>
      <div className="flex items-center mb-10 max-w-sm">
        {STEPS.map((s,i) => (
          <div key={s} className="flex items-center flex-1 last:flex-initial">
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold font-heading transition-all ${i<step?'bg-solar-green/20 border-solar-green text-solar-green':i===step?'bg-solar-accent/20 border-solar-accent text-solar-accent':'bg-solar-surface border-solar-border text-solar-dim'}`}>{i<step?'✓':i+1}</div>
            <span className={`ml-2 text-xs font-medium ${i===step?'text-solar-text':'text-solar-dim'}`}>{s}</span>
            {i<STEPS.length-1&&<div className={`flex-1 h-0.5 mx-3 ${i<step?'bg-solar-green':'bg-solar-border'}`}/>}
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <div>
          {step===0&&(
            <div className="section-card p-6 animate-slide-up">
              <h2 className="font-heading text-base font-semibold mb-5">Delivery Information</h2>
              <div className="grid grid-cols-2 gap-4">
                {[['firstName','First Name',true],['lastName','Last Name',false],['phone','Phone Number',true,'tel'],['email','Email',false,'email']].map(([k,l,r,t])=>(
                  <div key={k} className="fld"><label className="text-xs text-solar-muted mb-1 block">{l}{r&&<span className="text-solar-accent ml-1">*</span>}</label>
                  <input className="solar-input" type={t||'text'} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={l}/></div>
                ))}
                <div className="fld col-span-2"><label className="text-xs text-solar-muted mb-1 block">Address <span className="text-solar-accent">*</span></label><input className="solar-input" value={form.address} onChange={e=>set('address',e.target.value)} placeholder="Street address"/></div>
                <div className="fld"><label className="text-xs text-solar-muted mb-1 block">City <span className="text-solar-accent">*</span></label><input className="solar-input" value={form.city} onChange={e=>set('city',e.target.value)} placeholder="e.g. Ikeja"/></div>
                <div className="fld"><label className="text-xs text-solar-muted mb-1 block">State</label>
                  <select className="solar-input" value={form.state} onChange={e=>set('state',e.target.value)}>{NG_STATES.map(s=><option key={s}>{s}</option>)}</select></div>
                <div className="fld"><label className="text-xs text-solar-muted mb-1 block">Currency</label>
                  <select className="solar-input" value={form.currency} onChange={e=>set('currency',e.target.value)}>
                    <option value="NGN">₦ NGN — Nigerian Naira</option>
                    <option value="USD">$ USD — US Dollar</option>
                    <option value="CNY">¥ CNY — Chinese Yuan</option>
                    <option value="GHS">GH₵ GHS — Ghanaian Cedi</option>
                  </select></div>
              </div>
              <h3 className="font-heading text-sm font-semibold mt-6 mb-3">Delivery Method</h3>
              <div className="space-y-3">
                {[{val:'standard',label:'Standard Delivery',sub:'2–5 business days',cost:3500},{val:'express',label:'Express Delivery',sub:'Next business day',cost:8500},{val:'pickup',label:'Seller Pickup',sub:'Arrange with seller',cost:0}].map(m=>(
                  <label key={m.val} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${form.deliveryMethod===m.val?'border-solar-accent bg-solar-accent/5':'border-solar-border hover:border-solar-border2'}`}>
                    <input type="radio" name="delivery" value={m.val} checked={form.deliveryMethod===m.val} onChange={e=>set('deliveryMethod',e.target.value)} className="accent-solar-accent"/>
                    <div className="flex-1"><div className="text-sm font-medium">{m.label}</div><div className="text-xs text-solar-muted">{m.sub}</div></div>
                    <span className="font-heading text-sm font-semibold text-solar-accent">{m.cost===0?'Free':fp(m.cost)}</span>
                  </label>
                ))}
              </div>
              <button onClick={()=>setStep(1)} className="btn-primary w-full mt-6 py-3">Continue to Payment →</button>
            </div>
          )}
          {step===1&&(
            <div className="section-card p-6 animate-slide-up">
              <h2 className="font-heading text-base font-semibold mb-5">Payment Method</h2>
              <div className="space-y-3 mb-4">
                {[
                  {val:'online',label:'Pay Online (Card, Transfer, USSD)',ico:'💳',sub:'Securely processed by Paystack/Stripe'},
                  {val:'cash',label:'Payment on Delivery',ico:'💵',sub:'Pay when your items arrive'}
                ].map(m=>(
                  <label key={m.val} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${form.payment===m.val?'border-solar-accent bg-solar-accent/5':'border-solar-border hover:border-solar-border2'}`}>
                    <input type="radio" name="pay" value={m.val} checked={form.payment===m.val} onChange={e=>set('payment',e.target.value)} className="accent-solar-accent"/>
                    <span className="text-xl">{m.ico}</span>
                    <div className="flex-1"><div className="text-sm font-medium">{m.label}</div><div className="text-xs text-solar-muted">{m.sub}</div></div>
                  </label>
                ))}
              </div>
              {form.currency==='CNY'&&<div className="p-3 bg-solar-blue/10 border border-solar-blue/25 rounded-xl text-xs text-solar-muted">ℹ️ CNY payments are processed via Stripe.</div>}
              {['USD','GHS'].includes(form.currency)&&<div className="p-3 bg-solar-accent/10 border border-solar-accent/25 rounded-xl text-xs text-solar-muted">ℹ️ {form.currency} payments are processed via Paystack.</div>}
              <div className="flex gap-3 mt-6">
                <button onClick={()=>setStep(0)} className="btn-ghost flex-shrink-0">← Back</button>
                <button onClick={()=>setStep(2)} className="btn-primary flex-1 py-3">Review Order →</button>
              </div>
            </div>
          )}
          {step===2&&(
            <div className="section-card p-6 animate-slide-up">
              <h2 className="font-heading text-base font-semibold mb-5">Review Your Order</h2>
              <div className="space-y-3 mb-5">
                {items.map(({product:p,quantity:qty})=>(
                  <div key={p?.id} className="flex gap-3 items-center">
                    <span className="text-2xl">{p?.icon||'⚡'}</span>
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium line-clamp-1">{p?.name}</div><div className="text-xs text-solar-muted">Qty: {qty}</div></div>
                    <span className="font-heading text-solar-accent text-sm">{fp(Number(p?.price||0)*qty)}</span>
                  </div>
                ))}
              </div>
              <hr className="border-solar-border mb-4"/>
              <div className="text-sm mb-4">
                <div className="text-solar-muted text-xs mb-1">Delivery to</div>
                <div className="font-medium">{form.firstName} {form.lastName}</div>
                <div className="text-solar-muted text-xs">{form.address}, {form.city}, {form.state}</div>
                <div className="text-solar-muted text-xs">{form.phone}</div>
              </div>
              <div className="text-sm mb-6">
                <div className="text-solar-muted text-xs mb-1">Payment</div>
                <div className="font-medium capitalize">{form.payment.replace(/_/g,' ')} · {form.currency}</div>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setStep(1)} className="btn-ghost flex-shrink-0">← Back</button>
                <button onClick={doPlace} disabled={saving} className="btn-primary flex-1 py-3 text-sm">
                  {saving?<span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>Processing…</span>:`✓ Place Order · ${fp(finalTotal)}`}
                </button>
              </div>
              <p className="text-xs text-solar-dim mt-3 text-center">🔒 Payments secured by Paystack / Stripe</p>
            </div>
          )}
        </div>
        <div className="section-card p-5 h-fit sticky top-20">
          <h3 className="font-heading text-sm font-semibold mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm mb-4">
            {items.map(({product:p,quantity:qty})=>(
              <div key={p?.id} className="flex justify-between text-solar-muted">
                <span className="line-clamp-1 flex-1 mr-2">{p?.name?.slice(0,24)}… ×{qty}</span>
                <span className="flex-shrink-0">{fp(Number(p?.price||0)*qty)}</span>
              </div>
            ))}
            <hr className="border-solar-border my-2"/>
            <div className="flex justify-between text-solar-muted"><span>Delivery</span><span>{deliveryFee===0?'Free':fp(deliveryFee)}</span></div>
            <hr className="border-solar-border my-2"/>
            <div className="flex justify-between font-semibold text-base"><span>Total</span><span className="font-heading text-solar-accent text-lg">{fp(finalTotal)}</span></div>
          </div>
          <div className="bg-solar-green/10 border border-solar-green/25 rounded-lg p-3 text-xs text-solar-green">🛡️ SolarHub Buyer Guarantee</div>
        </div>
      </div>
    </div>
  );
}
