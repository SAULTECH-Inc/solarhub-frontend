import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { engineersService, chatService } from '../services/index';
import { useApp } from '../context/AppContext';

const STARS = (r) => '★'.repeat(Math.round(r || 0)) + '☆'.repeat(5 - Math.round(r || 0));

export default function EngineerProfile() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const { user, dispatch } = useApp();
  const [eng, setEng]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    setLoading(true);
    engineersService.getPublic(id)
      .then(r => setEng(r?.data ?? r))
      .catch(() => setError('Engineer not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="max-w-[800px] mx-auto px-5 py-16 text-center">
      <div className="w-8 h-8 border-2 border-solar-accent/30 border-t-solar-accent rounded-full animate-spin mx-auto" />
    </div>
  );

  if (error || !eng) return (
    <div className="max-w-[800px] mx-auto px-5 py-20 text-center">
      <div className="text-5xl mb-4">🔧</div>
      <h2 className="font-heading text-xl mb-4">{error || 'Engineer not found'}</h2>
      <button onClick={() => navigate('/engineers')} className="btn-primary">← Back to Engineers</button>
    </div>
  );

  const displayName = eng.fullName || (eng.user ? `${eng.user.firstName} ${eng.user.lastName || ''}`.trim() : 'Engineer');
  const avatar = eng.profilePhoto || eng.user?.avatar;

  async function contactEngineer() {
    if (!user) { dispatch({ type:'OPEN_AUTH', payload:'login' }); return; }
    if (!eng.userId) return;
    setMessaging(true);
    try {
      const res = await chatService.createRoom({
        type: 'buyer_seller',
        agentId: eng.userId,
        subject: `Enquiry about Engineer Service`,
      });
      const room = res.data || res;
      navigate(`/messages?room_id=${room.id}`);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setMessaging(false);
    }
  }

  return (
    <div className="max-w-[900px] mx-auto px-5 py-10">
      <button onClick={() => navigate('/engineers')} className="btn-ghost text-sm mb-6">← Back to Engineers</button>

      <div className="grid md:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="section-card p-6 text-center">
            {avatar ? (
              <img src={avatar} alt={displayName}
                className="w-24 h-24 rounded-full object-cover border-4 border-solar-accent/30 mx-auto mb-4" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-solar-accent to-solar-orange
                              flex items-center justify-center text-3xl font-bold text-black mx-auto mb-4">
                {displayName[0]?.toUpperCase() || '⚡'}
              </div>
            )}
            <h1 className="font-heading text-lg font-bold text-solar-text">{displayName}</h1>
            {eng.isVerified && (
              <div className="inline-flex items-center gap-1.5 mt-1.5 bg-solar-accent/10 text-solar-accent text-xs px-2.5 py-1 rounded-full">
                ✓ Verified by SolarHub
              </div>
            )}
            <p className="text-solar-muted text-sm mt-2">📍 {eng.city}, {eng.state}</p>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <span className="text-solar-accent text-sm">{STARS(eng.averageRating)}</span>
              <span className="text-xs text-solar-dim">({eng.reviewCount} reviews)</span>
            </div>

            <div className={`mt-3 text-xs font-medium px-3 py-1 rounded-full inline-flex items-center gap-1.5 ${
              eng.availableForHire
                ? 'bg-green-500/15 text-green-400'
                : 'bg-solar-surface text-solar-dim'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${eng.availableForHire ? 'bg-green-400' : 'bg-solar-dim'}`} />
              {eng.availableForHire ? 'Available for hire' : 'Currently busy'}
            </div>

            <button
              onClick={contactEngineer} disabled={messaging}
              className="btn-primary w-full mt-4 disabled:opacity-50">
              {messaging ? '⏳ Connecting…' : '📩 Contact Engineer'}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="section-card p-5 space-y-3">
            {[
              { icon: '🏆', label: 'Years of Experience', val: `${eng.yearsOfExperience}+ years` },
              { icon: '✅', label: 'Jobs Completed',      val: eng.completedJobs },
              { icon: '📍', label: 'Service Radius',      val: `${eng.serviceRadiusKm ?? 50} km` },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs text-solar-muted flex items-center gap-1.5">{s.icon} {s.label}</span>
                <span className="font-heading font-semibold text-solar-text text-sm">{s.val}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className="space-y-6">
          {/* Bio */}
          {eng.bio && (
            <div className="section-card p-6">
              <h2 className="font-heading text-sm font-semibold text-solar-accent uppercase tracking-widest mb-3">About</h2>
              <p className="text-solar-muted text-sm leading-relaxed">{eng.bio}</p>
            </div>
          )}

          {/* Specializations */}
          {eng.specializations?.length > 0 && (
            <div className="section-card p-6">
              <h2 className="font-heading text-sm font-semibold text-solar-accent uppercase tracking-widest mb-4">Specializations</h2>
              <div className="flex flex-wrap gap-2">
                {eng.specializations.map(s => (
                  <span key={s} className="bg-solar-accent/10 text-solar-accent border border-solar-accent/25 rounded-full px-3 py-1 text-xs font-medium">
                    ⚡ {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {eng.certifications?.length > 0 && (
            <div className="section-card p-6">
              <h2 className="font-heading text-sm font-semibold text-solar-accent uppercase tracking-widest mb-4">Certifications</h2>
              <div className="space-y-3">
                {eng.certifications.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 bg-solar-surface rounded-xl p-3">
                    <span className="text-xl">🏅</span>
                    <div>
                      <div className="font-medium text-sm text-solar-text">{c.name}</div>
                      <div className="text-xs text-solar-muted">{c.issuer}{c.year ? ` · ${c.year}` : ''}</div>
                      {c.url && (
                        <a href={c.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-solar-accent hover:underline mt-0.5 inline-block">
                          View Certificate ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews placeholder */}
          <div className="section-card p-6">
            <h2 className="font-heading text-sm font-semibold text-solar-accent uppercase tracking-widest mb-4">
              Client Reviews ({eng.reviewCount})
            </h2>
            {eng.reviewCount === 0 ? (
              <p className="text-solar-dim text-sm">No reviews yet. Be the first to hire and review this engineer!</p>
            ) : (
              <p className="text-solar-dim text-sm">Reviews coming soon…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
