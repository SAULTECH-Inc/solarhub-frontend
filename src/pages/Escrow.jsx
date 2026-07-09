import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Truck, CheckCircle, AlertCircle, Clock, Ban, ChevronRight, X, Plus, Loader2, CreditCard, Package } from 'lucide-react';
import { escrowService } from '../services/escrow.service';
import { useApp } from '../context/AppContext';
import SEO from '../components/SEO';

const fp = n => '₦' + Number(n || 0).toLocaleString();

const STATUS_META = {
  pending_agreement: { label: 'Awaiting Seller',    color: 'badge-blue',  icon: Clock },
  awaiting_payment:  { label: 'Awaiting Payment',   color: 'badge-amber', icon: CreditCard },
  funded:            { label: 'Funded – Held',       color: 'badge-green', icon: Shield },
  shipped:           { label: 'Shipped',             color: 'badge-amber', icon: Truck },
  completed:         { label: 'Completed',           color: 'badge-green', icon: CheckCircle },
  disputed:          { label: 'Disputed',            color: 'badge-red',   icon: AlertCircle },
  refunded:          { label: 'Refunded',            color: 'badge-blue',  icon: CheckCircle },
  cancelled:         { label: 'Cancelled',           color: 'badge-red',   icon: Ban },
};

// ── Bank Account Modal (sellers) ──────────────────────────────────────────────
function BankAccountModal({ onClose, onSaved }) {
  const [bankCode, setBankCode] = useState('');
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useApp();

  const COMMON_BANKS = [
    { code: '044', name: 'Access Bank' },
    { code: '023', name: 'Citibank' },
    { code: '063', name: 'Diamond Bank' },
    { code: '050', name: 'EcoBank' },
    { code: '084', name: 'Enterprise Bank' },
    { code: '070', name: 'Fidelity Bank' },
    { code: '011', name: 'First Bank of Nigeria' },
    { code: '214', name: 'First City Monument Bank' },
    { code: '058', name: 'Guaranty Trust Bank' },
    { code: '030', name: 'Heritage Bank' },
    { code: '301', name: 'Jaiz Bank' },
    { code: '082', name: 'Keystone Bank' },
    { code: '221', name: 'Stanbic IBTC Bank' },
    { code: '068', name: 'Standard Chartered Bank' },
    { code: '232', name: 'Sterling Bank' },
    { code: '100', name: 'Suntrust Bank' },
    { code: '032', name: 'Union Bank of Nigeria' },
    { code: '033', name: 'United Bank for Africa' },
    { code: '215', name: 'Unity Bank' },
    { code: '035', name: 'Wema Bank' },
    { code: '057', name: 'Zenith Bank' },
    { code: '304', name: 'Opay' },
    { code: '999992', name: 'Palmpay' },
    { code: '090405', name: 'Moniepoint MFB' },
    { code: '090267', name: 'Kuda MFB' },
  ];

  async function submit(e) {
    e.preventDefault();
    if (!bankCode || account.length < 10) { setError('Enter a valid bank and 10-digit account number'); return; }
    setLoading(true); setError('');
    try {
      const res = await escrowService.registerBankAccount({ bankCode, accountNumber: account });
      toast('Bank account added!', 'ok');
      onSaved(res?.data ?? res);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not verify account');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-solar-card border border-solar-border rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-solar-border">
          <h3 className="font-heading text-base font-semibold">Add Bank Account for Payouts</h3>
          <button onClick={onClose} className="text-solar-dim hover:text-solar-text"><X size={18}/></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-solar-dim uppercase tracking-wider mb-1.5">Bank</label>
            <select className="solar-input" value={bankCode} onChange={e => setBankCode(e.target.value)} required>
              <option value="">Select bank…</option>
              {COMMON_BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-solar-dim uppercase tracking-wider mb-1.5">Account Number</label>
            <input className="solar-input" placeholder="10-digit account number" maxLength={10}
              value={account} onChange={e => setAccount(e.target.value.replace(/\D/g, ''))} required />
          </div>
          {error && <p className="text-solar-red text-xs bg-solar-red/10 border border-solar-red/20 rounded-lg px-3 py-2">{error}</p>}
          <p className="text-xs text-solar-muted">Your account name will be verified via Paystack before saving.</p>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>}
            {loading ? 'Verifying…' : 'Add Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Ship Modal (sellers) ──────────────────────────────────────────────────────
function ShipModal({ escrow, onClose, onShipped }) {
  const [form, setForm] = useState({ carrier: '', trackingNumber: '', trackingUrl: '', note: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useApp();

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await escrowService.markShipped(escrow.id, form);
      toast('Marked as shipped!', 'ok');
      onShipped(res?.data ?? res);
      onClose();
    } catch (err) { setError(err.message || 'Failed'); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-solar-card border border-solar-border rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-solar-border">
          <h3 className="font-heading text-base font-semibold">Mark as Shipped</h3>
          <button onClick={onClose} className="text-solar-dim hover:text-solar-text"><X size={18}/></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {[['carrier','Carrier (e.g. DHL, GIG)'],['trackingNumber','Tracking Number'],['trackingUrl','Tracking URL']].map(([k,l]) => (
            <div key={k}>
              <label className="block text-xs text-solar-dim uppercase tracking-wider mb-1.5">{l}</label>
              <input className="solar-input" value={form[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))} placeholder={l}/>
            </div>
          ))}
          <div>
            <label className="block text-xs text-solar-dim uppercase tracking-wider mb-1.5">Note to Buyer</label>
            <textarea className="solar-input resize-none h-20" value={form.note} onChange={e => setForm(f => ({...f,note:e.target.value}))} placeholder="Any additional info for the buyer…"/>
          </div>
          {error && <p className="text-solar-red text-xs">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin"/> : <Truck size={16}/>}
            {loading ? 'Saving…' : 'Confirm Shipment'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Dispute Modal (buyers) ────────────────────────────────────────────────────
function DisputeModal({ escrow, onClose, onRaised }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useApp();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await escrowService.raiseDispute(escrow.id, reason);
      toast('Dispute raised — admin will review within 24h', 'ok');
      onRaised();
      onClose();
    } catch (err) { toast(err.message, 'err'); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-solar-card border border-solar-border rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-solar-border">
          <h3 className="font-heading text-base font-semibold text-solar-red">Raise a Dispute</h3>
          <button onClick={onClose} className="text-solar-dim hover:text-solar-text"><X size={18}/></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="bg-solar-amber/10 border border-solar-amber/30 rounded-xl p-3 text-xs text-solar-amber">
            Once raised, funds are frozen until our team resolves the dispute (24–72 hours).
          </div>
          <div>
            <label className="block text-xs text-solar-dim uppercase tracking-wider mb-1.5">Reason</label>
            <textarea className="solar-input resize-none h-28" required value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Describe the issue in detail — include what was expected vs what happened, dates, etc."/>
          </div>
          <button type="submit" disabled={loading || !reason.trim()} className="w-full py-2.5 rounded-xl text-sm font-medium bg-solar-red/20 border border-solar-red/40 text-solar-red hover:bg-solar-red/30 transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin"/> : <AlertCircle size={16}/>}
            {loading ? 'Submitting…' : 'Submit Dispute'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Escrow Detail Card ────────────────────────────────────────────────────────
function EscrowDetail({ escrow: initial, role, onRefresh }) {
  const [escrow, setEscrow] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [shipModal, setShipModal] = useState(false);
  const [disputeModal, setDisputeModal] = useState(false);
  const { toast, user } = useApp();

  const refresh = useCallback(async () => {
    const res = await escrowService.getOne(escrow.id);
    setEscrow(res?.data ?? res);
    onRefresh?.();
  }, [escrow.id, onRefresh]);

  const meta = STATUS_META[escrow.status] || { label: escrow.status, color: 'badge-blue', icon: Clock };
  const Icon = meta.icon;

  async function sellerRespond(decision) {
    setLoading(true);
    try {
      const res = await escrowService.respond(escrow.id, decision);
      setEscrow(res?.data ?? res);
      toast(decision === 'accept' ? 'Escrow accepted!' : 'Escrow declined', decision === 'accept' ? 'ok' : '');
    } catch (err) { toast(err.message, 'err'); }
    finally { setLoading(false); }
  }

  async function fundEscrow() {
    setLoading(true);
    try {
      const res = await escrowService.fundEscrow(escrow.id, user.email, 'NGN');
      const data = res?.data ?? res;
      if (data.paymentUrl) window.location.href = data.paymentUrl;
    } catch (err) { toast(err.message, 'err'); }
    finally { setLoading(false); }
  }

  async function confirmDelivery() {
    if (!window.confirm('Confirm you received the goods and are satisfied? This will release funds to the seller.')) return;
    setLoading(true);
    try {
      const res = await escrowService.confirmDelivery(escrow.id);
      setEscrow(res?.data ?? res);
      toast('Delivery confirmed — funds released to seller!', 'ok');
    } catch (err) { toast(err.message, 'err'); }
    finally { setLoading(false); }
  }

  const autoReleaseDate = escrow.autoReleaseAt ? new Date(escrow.autoReleaseAt) : null;
  const daysLeft = autoReleaseDate ? Math.max(0, Math.ceil((autoReleaseDate - Date.now()) / 86400000)) : null;

  return (
    <div className="section-card p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="font-mono text-xs text-solar-dim">{escrow.reference}</div>
          <div className="font-heading text-xl font-bold text-solar-accent mt-1">{fp(escrow.amount)}</div>
          <div className="text-xs text-solar-muted mt-0.5">
            Platform fee: {fp(escrow.feeAmount)} ({escrow.feePercent}%) · You receive: {fp(escrow.sellerAmount)}
          </div>
        </div>
        <span className={meta.color}><Icon size={12} className="inline mr-1"/>{meta.label}</span>
      </div>

      {/* Timeline */}
      <div className="space-y-2 text-xs">
        {[
          ['Initiated',      escrow.createdAt],
          ['Seller agreed',  escrow.sellerAgreedAt],
          ['Funded',         escrow.fundedAt],
          ['Shipped',        escrow.shippedAt],
          ['Confirmed',      escrow.confirmedAt],
          ['Released',       escrow.releasedAt],
          ['Disputed',       escrow.disputedAt],
          ['Cancelled',      escrow.cancelledAt],
        ].filter(([,d]) => d).map(([l,d]) => (
          <div key={l} className="flex justify-between text-solar-muted">
            <span>{l}</span>
            <span className="font-mono">{new Date(d).toLocaleString('en-NG', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
          </div>
        ))}
      </div>

      {/* Tracking info */}
      {escrow.trackingInfo && Object.values(escrow.trackingInfo).some(Boolean) && (
        <div className="bg-solar-card2 rounded-xl p-3 text-xs space-y-1">
          <div className="font-medium text-solar-text mb-1">Shipment Details</div>
          {escrow.trackingInfo.carrier      && <div className="text-solar-muted">Carrier: <span className="text-solar-text">{escrow.trackingInfo.carrier}</span></div>}
          {escrow.trackingInfo.trackingNumber && <div className="text-solar-muted">Tracking #: <span className="font-mono text-solar-accent">{escrow.trackingInfo.trackingNumber}</span></div>}
          {escrow.trackingInfo.trackingUrl  && <a href={escrow.trackingInfo.trackingUrl} target="_blank" rel="noreferrer" className="text-solar-accent underline">Track package →</a>}
          {escrow.trackingInfo.note         && <div className="text-solar-muted italic">"{escrow.trackingInfo.note}"</div>}
        </div>
      )}

      {/* Auto-release countdown */}
      {escrow.status === 'shipped' && daysLeft !== null && (
        <div className="bg-solar-amber/10 border border-solar-amber/30 rounded-xl p-3 text-xs text-solar-amber">
          <Clock size={12} className="inline mr-1"/>
          Funds auto-release to seller in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong> if no dispute is raised.
        </div>
      )}

      {/* Admin note */}
      {escrow.adminNote && (
        <div className="bg-solar-card2 rounded-xl p-3 text-xs text-solar-muted">
          <span className="font-medium text-solar-text">Admin Note: </span>{escrow.adminNote}
        </div>
      )}

      {/* Cancel reason */}
      {escrow.cancelReason && (
        <div className="text-xs text-solar-red bg-solar-red/10 border border-solar-red/20 rounded-xl p-3">
          {escrow.cancelReason}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {/* Seller: accept/decline */}
        {role === 'seller' && escrow.status === 'pending_agreement' && (
          <div className="flex gap-2">
            <button onClick={() => sellerRespond('accept')} disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm">
              {loading ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>} Accept
            </button>
            <button onClick={() => sellerRespond('decline')} disabled={loading}
              className="flex-1 py-2 text-sm rounded-xl border border-solar-red/40 text-solar-red hover:bg-solar-red/10 transition-all flex items-center justify-center gap-1.5">
              <Ban size={14}/> Decline
            </button>
          </div>
        )}

        {/* Buyer: fund */}
        {role === 'buyer' && escrow.status === 'awaiting_payment' && (
          <button onClick={fundEscrow} disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
            {loading ? <Loader2 size={14} className="animate-spin"/> : <CreditCard size={14}/>}
            {loading ? 'Redirecting to payment…' : 'Pay into Escrow'}
          </button>
        )}

        {/* Seller: mark shipped */}
        {role === 'seller' && escrow.status === 'funded' && (
          <button onClick={() => setShipModal(true)}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
            <Truck size={14}/> Mark as Shipped
          </button>
        )}

        {/* Buyer: confirm / dispute */}
        {role === 'buyer' && escrow.status === 'shipped' && (
          <div className="flex flex-col gap-2">
            <button onClick={confirmDelivery} disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
              {loading ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>}
              {loading ? 'Releasing funds…' : 'Confirm Delivery & Release Funds'}
            </button>
            <button onClick={() => setDisputeModal(true)}
              className="w-full py-2 text-sm rounded-xl border border-solar-red/40 text-solar-red hover:bg-solar-red/10 transition-all flex items-center justify-center gap-2">
              <AlertCircle size={14}/> Raise a Dispute
            </button>
          </div>
        )}
      </div>

      {shipModal   && <ShipModal   escrow={escrow} onClose={() => setShipModal(false)}   onShipped={e => { setEscrow(e); onRefresh?.(); }}/>}
      {disputeModal && <DisputeModal escrow={escrow} onClose={() => setDisputeModal(false)} onRaised={refresh}/>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Escrow() {
  const { user, dispatch, escrowEnabled } = useApp();
  const { escrowId } = useParams();
  const nav = useNavigate();

  const [tab,          setTab]          = useState('buying'); // 'buying' | 'selling'
  const [escrows,      setEscrows]      = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [bankModal,    setBankModal]    = useState(false);

  const isSeller = user?.role === 'seller' || user?.role === 'admin';
  const isBuyer  = user?.role === 'buyer'  || user?.role === 'admin';

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const fn = tab === 'buying' ? escrowService.myBuyerList : escrowService.mySellerList;
      const res = await fn(1, 20);
      const data = res?.data ?? res;
      setEscrows(data?.data || []);
    } catch {}
    finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { if (user) loadList(); }, [user, tab, loadList]);

  useEffect(() => {
    if (tab === 'selling' && isSeller) {
      escrowService.getBankAccounts()
        .then(res => setBankAccounts((res?.data ?? res) || []))
        .catch(() => {});
    }
  }, [tab, isSeller]);

  useEffect(() => {
    if (escrowId) {
      escrowService.getOne(escrowId)
        .then(res => setSelected(res?.data ?? res))
        .catch(() => {});
    }
  }, [escrowId]);

  if (!user) return (
    <div className="text-center py-24 text-solar-dim">
      <Shield size={48} className="mx-auto mb-4 opacity-30"/>
      <h2 className="font-heading text-lg mb-3">Sign in to view your escrow transactions</h2>
      <button onClick={() => dispatch({ type:'OPEN_AUTH', payload:'login' })} className="btn-primary">Sign In</button>
    </div>
  );

  if (!escrowEnabled) return (
    <div className="text-center py-24 text-solar-dim max-w-md mx-auto px-5">
      <Shield size={48} className="mx-auto mb-4 opacity-30"/>
      <h2 className="font-heading text-lg mb-2">Escrow Unavailable</h2>
      <p className="text-sm text-solar-muted">The escrow feature is currently turned off by the platform. Check back soon.</p>
    </div>
  );

  return (
    <div className="max-w-[1000px] mx-auto px-5 py-10">
      <SEO title="Escrow" noindex />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Shield size={22} className="text-solar-accent"/>Escrow</h1>
          <p className="text-solar-muted text-sm mt-1">Your money is held safely until you confirm delivery.</p>
        </div>
        {selected && (
          <button onClick={() => { setSelected(null); nav('/escrow'); }} className="btn-ghost text-sm">← Back to list</button>
        )}
      </div>

      {/* How it works banner */}
      {!selected && (
        <div className="bg-solar-accent/10 border border-solar-accent/30 rounded-2xl p-4 mb-6">
          <div className="text-xs font-semibold text-solar-accent uppercase tracking-wider mb-3">How Escrow Works</div>
          <div className="grid sm:grid-cols-4 gap-3 text-xs text-solar-muted">
            {[
              ['1', 'Buyer & seller agree to use escrow', Shield],
              ['2', 'Buyer pays — funds held by platform', CreditCard],
              ['3', 'Seller ships; buyer confirms receipt', Truck],
              ['4', 'Funds released to seller (minus fee)', CheckCircle],
            ].map(([n, t, Ic]) => (
              <div key={n} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-solar-accent/20 text-solar-accent text-[10px] font-bold flex items-center justify-center flex-shrink-0">{n}</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected ? (
        <EscrowDetail
          escrow={selected}
          role={tab === 'buying' ? 'buyer' : 'seller'}
          onRefresh={loadList}
        />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-solar-card2 p-1 rounded-xl mb-5 w-fit">
            {isBuyer  && <button onClick={() => setTab('buying')}  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab==='buying'  ? 'bg-solar-accent text-black' : 'text-solar-muted hover:text-solar-text'}`}>As Buyer</button>}
            {isSeller && <button onClick={() => setTab('selling')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab==='selling' ? 'bg-solar-accent text-black' : 'text-solar-muted hover:text-solar-text'}`}>As Seller</button>}
          </div>

          {/* Seller: bank accounts */}
          {tab === 'selling' && isSeller && (
            <div className="section-card p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-heading text-sm font-semibold">Payout Bank Accounts</div>
                <button onClick={() => setBankModal(true)} className="btn-ghost text-xs flex items-center gap-1"><Plus size={12}/>Add</button>
              </div>
              {bankAccounts.length === 0 ? (
                <p className="text-xs text-solar-muted">No bank account added yet. Add one to receive escrow payouts.</p>
              ) : (
                <div className="space-y-2">
                  {bankAccounts.map(b => (
                    <div key={b.id} className="flex items-center justify-between bg-solar-card2 rounded-xl px-3 py-2 text-xs">
                      <div>
                        <div className="font-medium text-solar-text">{b.accountName}</div>
                        <div className="text-solar-muted">{b.bankName} · {b.accountNumber}</div>
                      </div>
                      {b.isDefault && <span className="badge-green text-[10px]">Default</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="section-card h-24 animate-pulse bg-solar-card2"/>)}</div>
          ) : escrows.length === 0 ? (
            <div className="text-center py-16 text-solar-dim">
              <Package size={40} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm">No escrow transactions yet.</p>
              {tab === 'buying' && <p className="text-xs text-solar-muted mt-1">On an order page, choose "Pay with Escrow" to get started.</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {escrows.map(e => {
                const meta = STATUS_META[e.status] || { label: e.status, color: 'badge-blue', icon: Clock };
                const Icon = meta.icon;
                return (
                  <button key={e.id} onClick={() => { setSelected(e); nav(`/escrow/${e.id}`); }}
                    className="section-card p-4 w-full text-left hover:border-solar-border2 transition-all card-hover flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs text-solar-dim">{e.reference}</div>
                      <div className="font-heading text-solar-accent font-semibold mt-0.5">{fp(e.amount)}</div>
                      <div className="text-xs text-solar-muted mt-0.5">{new Date(e.createdAt).toLocaleDateString('en-NG', { year:'numeric', month:'short', day:'numeric' })}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={meta.color + ' text-xs'}><Icon size={10} className="inline mr-1"/>{meta.label}</span>
                      <ChevronRight size={14} className="text-solar-dim"/>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {bankModal && (
        <BankAccountModal
          onClose={() => setBankModal(false)}
          onSaved={acc => setBankAccounts(prev => [acc, ...prev])}
        />
      )}
    </div>
  );
}
