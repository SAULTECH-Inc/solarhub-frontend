import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { rfqsService } from '../services/index';

const fp = n => '₦' + Number(n).toLocaleString();

export default function JobBoard() {
  const { user } = useApp();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRfq, setSelectedRfq] = useState(null);
  
  // Bid modal state
  const [bidding, setBidding] = useState(false);
  const [form, setForm] = useState({ hardwareCost: '', laborCost: '', proposalText: '' });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = () => {
    setLoading(true);
    rfqsService.getBoard()
      .then(r => setRfqs(r?.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const submitBid = async (e) => {
    e.preventDefault();
    setBidding(true);
    const hc = parseFloat(form.hardwareCost) || 0;
    const lc = parseFloat(form.laborCost) || 0;
    try {
      await rfqsService.submitBid(selectedRfq.id, {
        hardwareCost: hc,
        laborCost: lc,
        totalAmount: hc + lc,
        proposalText: form.proposalText
      });
      alert('Quote submitted successfully!');
      setSelectedRfq(null);
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setBidding(false);
    }
  };

  if (!user || (!user.isEngineer && !user.isSeller)) {
    return (
      <div className="max-w-[800px] mx-auto p-10 text-center">
        <h2 className="font-heading text-xl mb-4 text-solar-accent">Professional Job Board</h2>
        <p className="text-solar-muted text-sm mb-6">Only verified Engineers and Sellers can view and bid on projects.</p>
        <Link to="/become-engineer" className="btn-primary">Become an Engineer</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-10 relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-solar-text">Open Projects Job Board</h1>
          <p className="text-sm text-solar-muted mt-1">Review pre-calculated AI recommendations and submit your quotes.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-solar-dim">Loading open projects...</div>
      ) : rfqs.length === 0 ? (
        <div className="text-center py-20 bg-solar-surface rounded-xl border border-solar-border">
          <p className="text-solar-muted">No open projects in your area.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rfqs.map(r => {
            const spec = r.systemSpecs || {};
            return (
              <div key={r.id} className="section-card p-5 flex flex-col cursor-pointer hover:border-solar-accent transition-colors" onClick={() => setSelectedRfq(r)}>
                <div className="flex justify-between items-start mb-3">
                  <span className="badge-blue text-[10px] uppercase tracking-wider">{r.timeline || 'Flexible'}</span>
                  <span className="text-xs text-solar-dim">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-heading font-semibold text-sm mb-1">{spec.title || 'Custom System Installation'}</h3>
                <div className="text-xs text-solar-muted mb-4 flex items-center gap-1.5"><span className="text-sm">📍</span> {r.city}, {r.state}</div>
                
                <div className="bg-solar-card2 rounded-lg p-3 space-y-1.5 mb-4 flex-1">
                  <div className="flex justify-between text-xs"><span className="text-solar-dim">Inverter</span><span className="font-medium text-solar-text">{spec.inverter?.capacityKva}kVA</span></div>
                  <div className="flex justify-between text-xs"><span className="text-solar-dim">Solar Array</span><span className="font-medium text-solar-text">{spec.panels?.totalWattage}W</span></div>
                  <div className="flex justify-between text-xs"><span className="text-solar-dim">Battery Base</span><span className="font-medium text-solar-text">{spec.batteries?.quantity}x {spec.batteries?.capacityAhOrWh}</span></div>
                </div>
                
                <div className="flex justify-between items-center border-t border-solar-border pt-4">
                  <div className="text-xs text-solar-dim">{r.bidCount} Bids</div>
                  <button className="text-solar-accent text-sm font-semibold hover:underline">View Specs & Bid →</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedRfq && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4">
          <div className="bg-solar-card w-full max-w-[600px] rounded-2xl max-h-[90vh] overflow-y-auto section-card relative animate-slide-up">
            <button onClick={() => setSelectedRfq(null)} className="absolute top-4 right-4 text-2xl text-solar-muted hover:text-solar-text z-10">&times;</button>
            <div className="p-6 border-b border-solar-border">
              <span className="badge-blue text-[10px] uppercase mb-3 inline-block">{selectedRfq.timeline}</span>
              <h2 className="font-heading text-xl font-bold mb-1">Project Request</h2>
              <div className="text-sm text-solar-muted">📍 {selectedRfq.city}, {selectedRfq.state}</div>
            </div>
            <div className="p-6 bg-solar-surface/50 border-b border-solar-border">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-solar-accent mb-3">AI Technical Specs</h3>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div><span className="block text-solar-dim text-[10px]">INVERTER</span>{selectedRfq.systemSpecs?.inverter?.model || `${selectedRfq.systemSpecs?.inverter?.capacityKva}kVA Hybrid`}</div>
                <div><span className="block text-solar-dim text-[10px]">PANELS</span>{selectedRfq.systemSpecs?.panels?.quantity}x {selectedRfq.systemSpecs?.panels?.wattageEach}W</div>
                <div><span className="block text-solar-dim text-[10px]">BATTERIES</span>{selectedRfq.systemSpecs?.batteries?.quantity}x {selectedRfq.systemSpecs?.batteries?.capacityAhOrWh} {selectedRfq.systemSpecs?.batteries?.type}</div>
                <div><span className="block text-solar-dim text-[10px]">SYSTEM VOLTAGE</span>{selectedRfq.systemSpecs?.systemVoltage}V DC</div>
              </div>
              {selectedRfq.description && (
                <div className="bg-solar-card2 p-3 rounded-lg text-sm text-solar-text border border-solar-border2">
                  <strong className="block text-[10px] text-solar-dim mb-1">NOTES FROM BUYER</strong>
                  {selectedRfq.description}
                </div>
              )}
            </div>
            <form onSubmit={submitBid} className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-solar-accent mb-4">Submit Your Quote</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-solar-muted mb-1.5">Hardware Cost (₦)</label>
                  <input type="number" required value={form.hardwareCost} onChange={e=>setForm({...form, hardwareCost: e.target.value})} className="solar-input w-full font-mono"/>
                </div>
                <div>
                  <label className="block text-xs text-solar-muted mb-1.5">Installation/Labor (₦)</label>
                  <input type="number" required value={form.laborCost} onChange={e=>setForm({...form, laborCost: e.target.value})} className="solar-input w-full font-mono"/>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs text-solar-muted mb-1.5">Total Quote: <strong className="text-solar-accent ml-2 text-lg">{fp((parseFloat(form.hardwareCost)||0) + (parseFloat(form.laborCost)||0))}</strong></label>
              </div>
              <div className="mb-6">
                <label className="block text-xs text-solar-muted mb-1.5">Proposal Message / Terms</label>
                <textarea required rows="3" value={form.proposalText} onChange={e=>setForm({...form, proposalText: e.target.value})} className="solar-input w-full" placeholder="Detail the brands you will use, warranty terms, and your expertise..."></textarea>
              </div>
              <button type="submit" disabled={bidding} className="btn-primary btn-lg w-full">{bidding ? 'Submitting...' : 'Send Quote to Buyer'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
