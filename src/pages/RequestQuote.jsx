import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { advisorService, rfqsService } from '../services/index';

export default function RequestQuote() {
  const [params] = useSearchParams();
  const sessionId = params.get('session');
  const tierId = params.get('tier');
  
  const { user } = useApp();
  const nav = useNavigate();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: 'Lagos',
    timeline: 'Within 2 weeks',
    description: ''
  });

  useEffect(() => {
    if (!sessionId) {
      nav('/advisor'); return;
    }
    advisorService.getSession(sessionId)
      .then(r => {
        const d = r?.data ?? r;
        if (!d) throw new Error('Session not found');
        setSession(d);
      })
      .catch(err => setError('Could not load technical details for this quote.'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to submit a quote request.');
      return;
    }
    if (!form.address || !form.city) return;
    setSubmitting(true);
    try {
      const rec = session.results?.recommendations?.find(r => r.id === tierId) || session.results?.recommendations?.[0];
      await rfqsService.create({
        advisorSessionId: sessionId,
        systemSpecs: rec,
        selectedTier: tierId,
        ...form
      });
      nav('/my-projects', { replace: true });
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="max-w-[800px] mx-auto p-10 text-center">Loading specs...</div>;
  if (error) return <div className="max-w-[800px] mx-auto p-10 text-center text-red-500">{error}</div>;

  const rec = session?.results?.recommendations?.find(r => r.id === tierId) || session?.results?.recommendations?.[0];

  return (
    <div className="max-w-[800px] mx-auto px-5 py-10">
      <button onClick={() => nav(-1)} className="btn-ghost text-sm mb-6">← Back to Advisor</button>
      <h1 className="font-heading text-2xl font-bold mb-2">Request Installation Quotes</h1>
      <p className="text-solar-muted text-sm mb-8">Your technical requirements are securely attached. Verified engineers will review and send you formal bids.</p>
      
      <div className="grid md:grid-cols-[1fr_300px] gap-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="section-card p-6">
            <h3 className="font-heading text-sm font-semibold mb-4 uppercase tracking-widest text-solar-accent">Site Details</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-solar-muted mb-1.5">State</label>
                <select value={form.state} onChange={e=>setForm({...form, state: e.target.value})} className="solar-input w-full">
                  {['Lagos','Abuja','Ogun','Oyo','Kano','Rivers','Enugu','Kaduna','Delta'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-solar-muted mb-1.5">City / LGA</label>
                <input value={form.city} onChange={e=>setForm({...form, city: e.target.value})} required placeholder="e.g. Lekki" className="solar-input w-full"/>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-solar-muted mb-1.5">Install Address</label>
              <textarea value={form.address} onChange={e=>setForm({...form, address: e.target.value})} required rows={2} placeholder="Building name, Street..." className="solar-input w-full"/>
              <p className="text-[10px] text-solar-dim mt-1">Exact address is hidden from the public job board until you hire someone.</p>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-solar-muted mb-1.5">Expected Timeline</label>
              <select value={form.timeline} onChange={e=>setForm({...form, timeline: e.target.value})} className="solar-input w-full">
                {['As soon as possible', 'Within 2 weeks', 'Within 1 month', 'Flexible / Not urgent'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-solar-muted mb-1.5">Additional Notes (Optional)</label>
              <textarea value={form.description} onChange={e=>setForm({...form, description: e.target.value})} rows={3} placeholder="e.g. My roof is flat, house is pre-wired..." className="solar-input w-full"/>
            </div>
          </div>
          
          <button type="submit" disabled={submitting} className="btn-primary btn-lg w-full">
            {submitting ? 'Submitting...' : 'Post Request to Job Board'}
          </button>
        </form>

        <aside className="space-y-4">
          <div className="bg-solar-card2 border border-solar-border2 rounded-xl p-5">
            <h3 className="font-heading text-[11px] font-bold text-solar-dim uppercase tracking-widest mb-3">Attached AI Blueprint</h3>
            {rec && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-medium text-sm text-solar-accent mb-2">
                  <span>{rec.icon}</span> {rec.title}
                </div>
                <div className="text-xs text-solar-muted flex justify-between border-b border-solar-border border-dashed py-1.5">
                  <span>Inverter Output</span><strong className="text-solar-text">{rec.inverter?.capacityKva}kVA</strong>
                </div>
                <div className="text-xs text-solar-muted flex justify-between border-b border-solar-border border-dashed py-1.5">
                  <span>Battery Usable</span><strong className="text-solar-text">{rec.batteries?.totalWhUsable?.toLocaleString()}Wh</strong>
                </div>
                <div className="text-xs text-solar-muted flex justify-between border-b border-solar-border border-dashed py-1.5">
                  <span>Solar Array</span><strong className="text-solar-text">{rec.panels?.totalWattage?.toLocaleString()}W</strong>
                </div>
                <div className="text-xs text-solar-muted flex justify-between py-1.5">
                  <span>Peak Load</span><strong className="text-solar-text">{session.peakWatts?.toLocaleString()}W</strong>
                </div>
              </div>
            )}
          </div>
          <div className="bg-solar-accent/5 border border-solar-accent/20 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-solar-accent mb-2">How this works</h4>
            <ul className="text-xs text-solar-muted space-y-2">
              <li>1. Submit your project specs.</li>
              <li>2. Engineers bid on your job.</li>
              <li>3. Chat & negotiate directly.</li>
              <li>4. Check reviews and hire!</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
