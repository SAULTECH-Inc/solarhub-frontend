const STARS = (r) => '★'.repeat(Math.round(r || 0)) + '☆'.repeat(5 - Math.round(r || 0));

const SPEC_COLORS = {
  'Solar Panel Installation': 'bg-yellow-500/15 text-yellow-400',
  'Battery Systems':          'bg-green-500/15  text-green-400',
  'Inverter Setup':           'bg-blue-500/15   text-blue-400',
  'Off-Grid Systems':         'bg-purple-500/15 text-purple-400',
  'Grid-Tie Systems':         'bg-cyan-500/15   text-cyan-400',
  'Hybrid Systems':           'bg-orange-500/15 text-orange-400',
  'Maintenance & Repair':     'bg-red-500/15    text-red-400',
};

export default function EngineerCard({ engineer, onClick }) {
  const {
    id, fullName, city, state, profilePhoto,
    specializations = [], averageRating = 0, reviewCount = 0,
    yearsOfExperience = 0, availableForHire, isVerified,
    completedJobs = 0, user,
  } = engineer;

  const displayName = fullName || (user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Engineer');
  const avatar      = profilePhoto || user?.avatar;

  return (
    <div
      onClick={() => onClick?.(id)}
      className="bg-solar-card border border-solar-border rounded-2xl p-5 flex flex-col gap-4 cursor-pointer
                 hover:border-solar-accent/50 hover:shadow-lg hover:shadow-solar-accent/5
                 hover:-translate-y-1 transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          {avatar ? (
            <img src={avatar} alt={displayName}
              className="w-14 h-14 rounded-full object-cover border-2 border-solar-border group-hover:border-solar-accent/50 transition-colors" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-solar-accent to-solar-orange
                            flex items-center justify-center text-xl font-bold text-black border-2 border-solar-border">
              {displayName[0]?.toUpperCase() || '⚡'}
            </div>
          )}
          {availableForHire && (
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-solar-card" title="Available for hire" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-heading font-semibold text-sm text-solar-text truncate">{displayName}</h3>
            {isVerified && (
              <span title="Verified by SolarHub" className="text-solar-accent text-xs">✓</span>
            )}
          </div>
          <p className="text-xs text-solar-muted mt-0.5">📍 {city}, {state}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-solar-accent text-xs tracking-tight">{STARS(averageRating)}</span>
            <span className="text-xs text-solar-dim">({reviewCount})</span>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="font-heading font-bold text-solar-accent text-lg leading-none">{yearsOfExperience}</div>
          <div className="text-[10px] text-solar-dim leading-tight">yrs exp.</div>
        </div>
      </div>

      {/* Specializations */}
      {specializations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {specializations.slice(0, 3).map(s => (
            <span key={s}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${SPEC_COLORS[s] || 'bg-solar-surface text-solar-muted'}`}>
              {s}
            </span>
          ))}
          {specializations.length > 3 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-solar-surface text-solar-dim">
              +{specializations.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-solar-border">
        <span className="text-xs text-solar-dim">
          {completedJobs} jobs completed
        </span>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
          availableForHire
            ? 'bg-green-500/15 text-green-400'
            : 'bg-solar-surface text-solar-dim'
        }`}>
          {availableForHire ? '● Available' : '○ Busy'}
        </span>
      </div>
    </div>
  );
}
