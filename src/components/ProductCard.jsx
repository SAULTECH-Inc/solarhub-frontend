import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const fp = n => '₦' + Number(n).toLocaleString();

function getKeySpec(p) {
  const s = p.specs || {};
  const cat = p.category?.slug || '';
  if (cat.includes('panel'))      return [s.pmaxWp?`${s.pmaxWp}Wp`:s['Peak Power (Wp)']||null, s.efficiencyPct?`${s.efficiencyPct}%`:s['Module Efficiency']||null];
  if (cat.includes('batter'))     return [s.capacityAh?`${s.capacityAh}Ah`:s['Nominal Capacity']||null, s.chemistry||s['Chemistry']||null];
  if (cat.includes('inverter'))   return [s.continuousW?`${s.continuousW}W`:s['Continuous Power']||null, s.inverterType||s['Inverter Type']||null];
  if (cat.includes('controller')) return [s.ctrlType||s['Type']||null, s.chargeCurrentA?`${s.chargeCurrentA}A`:s['Charge Current']||null];
  if (cat.includes('light'))      return [s.lumens?`${s.lumens}lm`:s['Lumens']||null, s.ipRating||s['IP Rating']||null];
  const vals = Object.values(s).filter(Boolean);
  return [vals[0]?.toString()||null];
}

const CAT_ICONS = {
  'solar-panels':'☀️','batteries':'🔋','inverters':'⚡',
  'charge-controllers':'🔌','solar-lights':'💡','accessories':'🔧',
};

export default function ProductCard({ product: p }) {
  const { addToCart, toggleFavourite, favourites } = useApp();
  const isFav  = favourites.includes(p.id);
  const specs  = getKeySpec(p);
  const icon   = p.icon || CAT_ICONS[p.category?.slug] || '⚡';
  const catLbl = p.category?.name || p.category || '';

  return (
    <div className="section-card card-hover group relative flex flex-col">
      {/* Fav */}
      <button
        onClick={e => { e.preventDefault(); toggleFavourite(p.id); }}
        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-base transition-all
          ${isFav ? 'bg-red-500/20 text-red-400 opacity-100' : 'bg-solar-surface/80 text-solar-dim opacity-0 group-hover:opacity-100 hover:text-red-400'}`}>
        {isFav ? '❤️' : '🤍'}
      </button>

      <Link to={`/product/${p.id}`} className="flex flex-col flex-1">
        {(p.thumbnail || (p.images && p.images.length > 0)) ? (
          <div className="h-40 w-full overflow-hidden border-b border-solar-border relative bg-solar-surface">
            <img src={p.thumbnail || p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-solar-surface to-solar-card2 flex items-center justify-center text-5xl border-b border-solar-border">
            {icon}
          </div>
        )}
        <div className="p-4 flex flex-col flex-1 gap-1.5">
          {catLbl && <div className="text-[10.5px] text-solar-dim uppercase tracking-widest font-medium">{catLbl}</div>}
          {p.badge && <span className="badge-amber self-start text-[10px]">{p.badge}</span>}
          <h3 className="text-sm font-medium text-solar-text leading-snug line-clamp-2">{p.name}</h3>
          <div className="flex gap-1.5 flex-wrap mt-1">
            {specs[0] && <span className="badge-green">{specs[0]}</span>}
            {specs[1] && <span className="badge-blue">{String(specs[1]).split('(')[0].trim()}</span>}
          </div>
          <div className="mt-auto pt-2">
            <div className="font-heading text-solar-accent text-lg font-semibold">
              {fp(p.price)}<span className="text-xs text-solar-muted font-normal ml-1">/ unit</span>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] text-solar-dim">
                {p.sellerCity || p.seller?.storeCity || p.seller?.firstName || ''}
                {(p.sellerCity || p.seller) && ' · '}
                {p.seller?.storeName || p.seller?.firstName || ''}
              </span>
              {p.averageRating > 0 && (
                <span className="text-[11px] text-solar-accent">★ {p.averageRating} ({p.reviewCount})</span>
              )}
            </div>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <button onClick={() => addToCart(p)} disabled={p.stock === 0}
          className="btn-primary w-full text-xs py-2 disabled:opacity-50">
          {p.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
        </button>
      </div>
    </div>
  );
}
