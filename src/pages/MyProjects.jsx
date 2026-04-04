import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { rfqsService, chatService } from '../services/index';

const fp = n => '₦' + Number(n).toLocaleString();

export default function MyProjects() {
  const { user } = useApp();
  const nav = useNavigate();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { nav('/'); return; }
    fetchMyProjects();
  }, [user]);

  const fetchMyProjects = () => {
    setLoading(true);
    rfqsService.getMyRfqs(1, 20)
      .then(r => setRfqs(r?.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const acceptBid = async (rfq, bid) => {
    if (!window.confirm(`Are you sure you want to award this project to ${bid.contractor?.firstName}?`)) return;
    try {
      await rfqsService.acceptBid(bid.id);
      alert('Project Awarded successfully! Navigate to your messages to finalize.');
      // Auto create a room with the contractor to finalize
      await chatService.createRoom({ type: 'buyer_seller', agentId: bid.contractorId, subject: `Project: ${rfq.systemSpecs?.title || 'Solar Installation'}` });
      fetchMyProjects();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const messageBidder = async (rfq, bid) => {
    try {
      const res = await chatService.createRoom({ type: 'buyer_seller', agentId: bid.contractorId, subject: `Regarding your bid for: ${rfq.systemSpecs?.title}` });
      const room = res.data || res;
      nav(`/messages?room_id=${room.id}`);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading your projects...</div>;

  return (
    <div className="max-w-[1000px] mx-auto px-5 py-10">
      <h1 className="font-heading text-2xl font-bold mb-6">My Projects & Quotes</h1>
      {rfqs.length === 0 ? (
        <div className="section-card p-10 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h2 className="font-heading text-xl mb-2">No projects yet</h2>
          <p className="text-solar-muted text-sm mb-6">Use the Solar Advisor to generate a technical specification and request quotes.</p>
          <button onClick={() => nav('/advisor')} className="btn-primary">Go to Solar Advisor</button>
        </div>
      ) : (
        <div className="space-y-8">
          {rfqs.map(rfq => (
            <div key={rfq.id} className="section-card border-l-4 border-l-solar-accent">
              <div className="p-6 border-b border-solar-border bg-solar-surface/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`badge-${rfq.status === 'open' ? 'green' : rfq.status === 'awarded' ? 'blue' : 'amber'} uppercase text-[10px]`}>
                      {rfq.status}
                    </span>
                    <span className="text-xs text-solar-dim">Posted {new Date(rfq.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="font-bold text-sm text-solar-accent">{rfq.bidCount} Bids Received</div>
                </div>
                <h2 className="font-heading text-lg font-bold mb-1">{rfq.systemSpecs?.title || 'Custom Solar Installation'}</h2>
                <div className="text-sm text-solar-muted mb-3 flex items-center gap-2">📍 {rfq.city}, {rfq.state} <span className="opacity-50">|</span> ⏱️ Timeline: {rfq.timeline}</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-solar-card2 px-2 py-1 border border-solar-border2 rounded">💡 Peak Load: {rfq.systemSpecs?.peakLoad || 'N/A'}W</span>
                  <span className="bg-solar-card2 px-2 py-1 border border-solar-border2 rounded">⚡ Inverter: {rfq.systemSpecs?.inverter?.capacityKva}kVA</span>
                  <span className="bg-solar-card2 px-2 py-1 border border-solar-border2 rounded">🔋 Storage: {rfq.systemSpecs?.batteries?.quantity} units</span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-solar-dim mb-4">Incoming Quotes</h3>
                {rfq.bids?.length === 0 ? (
                  <p className="text-sm text-solar-muted">No bids received yet. Engineers receive notifications when new projects are posted.</p>
                ) : (
                  <div className="space-y-4">
                    {rfq.bids.map(bid => (
                      <div key={bid.id} className={`p-5 rounded-xl border transition-colors ${bid.status === 'accepted' ? 'bg-solar-green/5 border-solar-green/30' : 'bg-solar-card2 border-solar-border hover:border-solar-accent/50'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-solar-accent to-solar-orange flex items-center justify-center font-bold text-black text-sm">
                              {(bid.contractor?.firstName || 'E')[0]}
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{bid.contractor?.firstName} {bid.contractor?.lastName}</div>
                              <div className="text-xs text-solar-dim">Verified Professional</div>
                            </div>
                          </div>
                          {bid.status === 'accepted' && <span className="badge-green">👑 Awarded</span>}
                        </div>
                        <p className="text-sm text-solar-text mb-4 italic">"{bid.proposalText}"</p>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-solar-surface rounded p-2 text-center">
                            <div className="text-[10px] text-solar-muted uppercase">Hardware</div>
                            <div className="font-mono text-sm">{fp(bid.hardwareCost)}</div>
                          </div>
                          <div className="bg-solar-surface rounded p-2 text-center">
                            <div className="text-[10px] text-solar-muted uppercase">Labor</div>
                            <div className="font-mono text-sm">{fp(bid.laborCost)}</div>
                          </div>
                          <div className="bg-solar-surface rounded p-2 text-center">
                            <div className="text-[10px] text-solar-accent uppercase font-bold">Total</div>
                            <div className="font-mono text-sm font-bold text-solar-accent">{fp(bid.totalAmount)}</div>
                          </div>
                        </div>
                        {rfq.status === 'open' && (
                          <div className="flex gap-3">
                            <button onClick={()=>acceptBid(rfq, bid)} className="btn-primary flex-1 py-2 text-sm">✓ Accept Quote & Hire</button>
                            <button onClick={()=>messageBidder(rfq, bid)} className="btn-outline flex-1 py-2 text-sm">💬 Message</button>
                          </div>
                        )}
                        {bid.status === 'accepted' && (
                           <button onClick={()=>messageBidder(rfq, bid)} className="btn-outline w-full py-2 text-sm">💬 Open Chat with Engineer</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
