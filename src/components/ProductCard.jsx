import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { cardPromoLabel, discountLabel } from '../lib/discountUtils';
import { Sun, BatteryFull, Zap, Plug, Lightbulb, Wrench, ShoppingCart, Heart } from 'lucide-react';

const fp = n => '₦' + Number(n).toLocaleString();

const COND = {
  new:           { label: 'New',          cls: 'badge-green' },
  used_like_new: { label: 'Like New',     cls: 'badge-blue'  },
  used_good:     { label: 'Used – Good',  cls: 'badge-blue'  },
  refurbished:   { label: 'Refurbished',  cls: 'badge-amber' },
};

const CAT_ICONS = {
  'solar-panels':       <Sun size={40} className="text-solar-accent opacity-70"/>,
  'batteries':          <BatteryFull size={40} className="text-solar-accent opacity-70"/>,
  'inverters':          <Zap size={40} className="text-solar-accent opacity-70"/>,
  'charge-controllers': <Plug size={40} className="text-solar-accent opacity-70"/>,
  'solar-lights':       <Lightbulb size={40} className="text-solar-accent opacity-70"/>,
  'accessories':        <Wrench size={40} className="text-solar-accent opacity-70"/>,
};

/** Returns up to 4 meaningful spec pills for the product */
function getSpecs(p) {
  const s = p.specs || {};
  const cat = p.category?.slug || '';
  const pills = [];

  if (cat.includes('panel')) {
    if (s.pmaxWp)        pills.push({ label: `${s.pmaxWp} Wp`,        cls: 'badge-green' });
    if (s.efficiencyPct) pills.push({ label: `${s.efficiencyPct}% eff`, cls: 'badge-blue' });
    if (s.type)          pills.push({ label: s.type.split('(')[0].trim(), cls: 'badge-blue' });
    if (s.vocV)          pills.push({ label: `Voc ${s.vocV}V`,          cls: 'badge-blue' });
  } else if (cat.includes('batter')) {
    if (s.capacityAh) pills.push({ label: `${s.capacityAh} Ah`,    cls: 'badge-green' });
    if (s.voltageV)   pills.push({ label: `${s.voltageV}V`,         cls: 'badge-blue' });
    if (s.chemistry)  pills.push({ label: s.chemistry,              cls: 'badge-blue' });
    if (s.cycleLife)  pills.push({ label: `${s.cycleLife} cycles`,  cls: 'badge-blue' });
  } else if (cat.includes('inverter')) {
    if (s.continuousW)  pills.push({ label: `${s.continuousW}W`,                    cls: 'badge-green' });
    if (s.type)         pills.push({ label: s.type.split('(')[0].trim(),             cls: 'badge-blue' });
    if (s.efficiencyPct)pills.push({ label: `${s.efficiencyPct}% eff`,              cls: 'badge-blue' });
    if (s.dcInputV)     pills.push({ label: `${s.dcInputV}V DC`,                    cls: 'badge-blue' });
  } else if (cat.includes('controller')) {
    if (s.type)            pills.push({ label: s.type,                              cls: 'badge-green' });
    if (s.chargeCurrentA)  pills.push({ label: `${s.chargeCurrentA}A`,             cls: 'badge-blue' });
    if (s.maxPvVocV)       pills.push({ label: `Max ${s.maxPvVocV}V`,              cls: 'badge-blue' });
  } else if (cat.includes('light')) {
    if (s.lumens)      pills.push({ label: `${s.lumens} lm`,  cls: 'badge-green' });
    if (s.ipRating)    pills.push({ label: s.ipRating,         cls: 'badge-blue' });
    if (s.lightingHrs) pills.push({ label: `${s.lightingHrs}h lighting`, cls: 'badge-blue' });
  } else {
    const vals = Object.entries(s).filter(([, v]) => v).slice(0, 3);
    vals.forEach(([k, v]) => pills.push({ label: String(v), cls: 'badge-blue' }));
  }
  return pills.slice(0, 4);
}

export default function ProductCard({ product: p }) {
  const { addToCart, toggleFavourite, favourites } = useApp();
  const isFav    = favourites.includes(p.id);
  const specs    = getSpecs(p);
  const icon     = CAT_ICONS[p.category?.slug] || <Zap size={40} className="text-solar-accent opacity-70"/>;
  const catLbl   = p.category?.name || '';
  const cond     = COND[p.condition] || COND.new;
  const promo    = cardPromoLabel(p.discounts);
  const freeShip = p.shippingPayer === 'seller';
  const lowStock = p.stock > 0 && p.stock <= 5;
  const hasRating= p.averageRating > 0;

  // cheapest-minQty discount for inline teaser
  const lowestRule = Array.isArray(p.discounts) && p.discounts.length
    ? [...p.discounts].sort((a, b) => a.minQty - b.minQty)[0]
    : null;

  return (
    <div className="section-card card-hover group relative flex flex-col overflow-hidden">

      {/* Favourite */}
      <button
        onClick={e => { e.preventDefault(); toggleFavourite(p.id); }}
        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all
          ${isFav ? 'bg-red-500/20 text-red-400 opacity-100' : 'bg-solar-surface/80 text-solar-dim opacity-0 group-hover:opacity-100 hover:text-red-400'}`}
      >
        {isFav ? <Heart size={14} fill="currentColor"/> : <Heart size={14}/>}
      </button>

      {/* Discount promo bubble */}
      {promo && (
        <div className="absolute top-3 left-3 z-10 bg-solar-accent text-black text-[9px] font-bold px-2 py-1 rounded-lg shadow leading-none">
          {promo}
        </div>
      )}

      <Link to={`/product/${p.id}`} className="flex flex-col flex-1">

        {/* Image / icon */}
        {(p.thumbnail || p.images?.length) ? (
          <div className="h-36 w-full overflow-hidden border-b border-solar-border bg-solar-surface relative">
            <img src={p.thumbnail || p.images[0]} alt={p.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            {lowStock && (
              <div className="absolute bottom-0 inset-x-0 bg-red-500/85 text-white text-[10px] font-semibold text-center py-1">
                Only {p.stock} left
              </div>
            )}
          </div>
        ) : (
          <div className="h-36 bg-gradient-to-br from-solar-surface to-solar-card2 flex items-center justify-center border-b border-solar-border relative">
            {icon}
            {lowStock && (
              <div className="absolute bottom-0 inset-x-0 bg-red-500/85 text-white text-[10px] font-semibold text-center py-1">
                Only {p.stock} left
              </div>
            )}
          </div>
        )}

        <div className="p-3.5 flex flex-col flex-1 gap-2">

          {/* Row 1: category + condition */}
          <div className="flex items-center justify-between gap-2">
            {catLbl && <div className="text-[10px] text-solar-dim uppercase tracking-widest font-medium truncate">{catLbl}</div>}
            <span className={`${cond.cls} text-[9px] flex-shrink-0`}>{cond.label}</span>
          </div>

          {/* Row 2: custom badge */}
          {p.badge && <span className="badge-amber self-start text-[10px]">{p.badge}</span>}

          {/* Name */}
          <h3 className="text-sm font-semibold text-solar-text leading-snug line-clamp-2">{p.name}</h3>

          {/* Brand + model */}
          {(p.brand || p.modelNumber) && (
            <div className="text-[11px] text-solar-muted truncate">
              {[p.brand, p.modelNumber].filter(Boolean).join(' · ')}
            </div>
          )}

          {/* Spec pills — up to 4 */}
          {specs.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {specs.map((sp, i) => (
                <span key={i} className={`${sp.cls} text-[10px]`}>{sp.label}</span>
              ))}
            </div>
          )}

          {/* Meta row: stock · warranty · delivery */}
          <div className="flex items-center gap-3 flex-wrap text-[11px]">
            {p.stock > 5 && (
              <span className="text-solar-green font-medium">{p.stock} in stock</span>
            )}
            {p.stock === 0 && (
              <span className="text-red-400 font-semibold">Out of stock</span>
            )}
            {p.warrantyYears > 0 && (
              <span className="text-solar-dim">{p.warrantyYears}yr warranty</span>
            )}
            {freeShip
              ? <span className="text-solar-green">Free delivery</span>
              : p.deliveryDays > 0
                ? <span className="text-solar-dim">{p.deliveryDays}d delivery</span>
                : null}
          </div>

          {/* Rating */}
          {hasRating && (
            <div className="text-[11px] text-solar-accent">
              {'★'.repeat(Math.round(p.averageRating))}
              <span className="text-solar-dim ml-1">({p.reviewCount} review{p.reviewCount !== 1 ? 's' : ''})</span>
            </div>
          )}

          {/* Price */}
          <div className="mt-auto pt-1.5 border-t border-solar-border">
            <div className="font-heading text-solar-accent text-[17px] font-bold leading-none">
              {fp(p.price)}
              <span className="text-[11px] text-solar-muted font-normal ml-1">/ unit</span>
            </div>
            {lowestRule && (
              <div className="text-[10px] text-solar-accent/80 mt-1">
                Buy {lowestRule.minQty}+ → {discountLabel(lowestRule)}
              </div>
            )}
            <div className="text-[11px] text-solar-dim mt-1 truncate">
              {[p.sellerCity || p.seller?.storeCity, p.seller?.storeName || p.seller?.firstName].filter(Boolean).join(' · ')}
            </div>
          </div>

        </div>
      </Link>

      <div className="px-3.5 pb-3.5">
        <button
          onClick={() => addToCart(p)}
          disabled={p.stock === 0}
          className="btn-primary w-full text-xs py-2.5 disabled:opacity-50"
        >
          {p.stock === 0 ? 'Out of Stock' : <span className="inline-flex items-center gap-1.5"><ShoppingCart size={14}/>Add to Cart</span>}
        </button>
      </div>

    </div>
  );
}
