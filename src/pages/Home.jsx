import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsService } from '../services/products.service';
import { categoriesService } from '../services/index';
import ProductCard from '../components/ProductCard';
import SEO, { orgSchema, websiteSchema, itemListSchema } from '../components/SEO';
import { Sun, BatteryFull, Zap, Settings2, Lightbulb, Wrench } from 'lucide-react';

const CAT_SVG = {
  'solar-panels':       <Sun size={32} className="text-solar-accent" />,
  'batteries':          <BatteryFull size={32} className="text-solar-accent" />,
  'inverters':          <Zap size={32} className="text-solar-accent" />,
  'charge-controllers': <Settings2 size={32} className="text-solar-accent" />,
  'solar-lights':       <Lightbulb size={32} className="text-solar-accent" />,
  'accessories':        <Wrench size={32} className="text-solar-accent" />,
};

const FALLBACK_CATS = [
  { key:'solar-panels',      label:'Solar Panels',  desc:'Mono, Poly, Bifacial, HJT' },
  { key:'batteries',         label:'Batteries',     desc:'LiFePO4, AGM, Gel, Flooded' },
  { key:'inverters',         label:'Inverters',     desc:'Pure Sine, Hybrid, Grid-Tie' },
  { key:'charge-controllers',label:'Controllers',   desc:'MPPT & PWM' },
  { key:'solar-lights',      label:'Solar Lights',  desc:'Street, Garden, Flood' },
  { key:'accessories',       label:'Accessories',   desc:'Cables, Mounts' },
];

const STATS = [
  { val:'1,200+', label:'Products Listed' },
  { val:'340+',   label:'Verified Sellers' },
  { val:'28',     label:'States Covered' },
  { val:'3×',     label:'System Options' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [cats,     setCats]     = useState(FALLBACK_CATS);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    productsService.getFeatured(8)
      .then(r => {
        const d = r?.data ?? r;
        setFeatured(Array.isArray(d) ? d : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    categoriesService.getAll()
      .then(r => { const d = r?.data ?? r; if (Array.isArray(d) && d.length) setCats(d.map(c => ({ key: c.slug, label: c.name, icon: c.icon || '⚡', desc: c.description }))); })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-grid min-h-screen">
      <SEO
        canonical="/"
        description="Nigeria's premier solar marketplace. Buy solar panels, batteries, inverters & charge controllers from verified sellers. Hire certified solar engineers. AI-powered system advisor."
        jsonLd={[
          orgSchema(),
          websiteSchema(),
          ...(featured.length ? [itemListSchema(featured, 'Featured Solar Products Nigeria')] : []),
        ]}
      />
      <section className="px-5 pt-20 pb-14 text-center"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(245,158,11,0.08), transparent)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex-1 max-w-[60px] h-px bg-solar-accent/20" />
            <span className="font-heading text-[11px] tracking-[3px] uppercase text-solar-accent">Nigeria's Solar Marketplace</span>
            <div className="flex-1 max-w-[60px] h-px bg-solar-accent/20" />
          </div>
          <h1 className="font-heading text-4xl md:text-6xl font-bold leading-tight mb-5">
            Buy & Sell <span className="text-solar-accent">Solar</span> Gadgets<br/>with Expert Precision
          </h1>
          <p className="text-solar-muted text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            Deep product specs, verified sellers, an AI-powered system advisor and full ecommerce. All in one platform.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/marketplace" className="btn-primary btn-lg">Browse Products</Link>
            <Link to="/advisor" className="btn-outline btn-lg inline-flex items-center gap-1.5"><Zap size={16}/>Solar Advisor</Link>
          </div>
          <div className="flex gap-10 justify-center mt-14 pt-10 border-t border-solar-border flex-wrap">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <span className="font-heading text-3xl font-bold text-solar-accent block">{s.val}</span>
                <div className="text-xs text-solar-muted mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-5">
        <section className="py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-semibold">Browse by <span className="text-solar-accent">Category</span></h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {cats.map(cat => (
              <Link key={cat.key} to={`/marketplace?cat=${cat.key}`}
                className="bg-solar-card border border-solar-border rounded-xl p-4 text-center card-hover group">
                <span className="mb-2 flex justify-center group-hover:scale-110 transition-transform">
                  {CAT_SVG[cat.key] || <Zap size={32} className="text-solar-accent" />}
                </span>
                <h3 className="font-heading text-xs font-semibold text-solar-text mb-1">{cat.label}</h3>
                <p className="text-[10.5px] text-solar-dim leading-snug hidden md:block">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-semibold">Featured <span className="text-solar-accent">Products</span></h2>
            <Link to="/marketplace" className="btn-ghost text-sm">View all →</Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="section-card h-72 animate-pulse bg-solar-card2" />
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-solar-dim">
              <div className="flex justify-center mb-3"><Sun size={40} className="text-solar-accent opacity-60"/></div>
              <p>Be the first to list a product!</p>
              <Link to="/sell" className="btn-primary mt-4 inline-flex">List a Product</Link>
            </div>
          )}
        </section>

        <section className="pb-16">
          <div className="rounded-2xl p-10 flex items-center justify-between gap-6 flex-wrap"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(16,185,129,0.05))', border: '1px solid rgba(245,158,11,0.25)' }}>
            <div className="max-w-lg">
              <h2 className="font-heading text-2xl font-bold mb-3">Not sure what solar system you need?</h2>
              <p className="text-solar-muted text-sm leading-relaxed">
                Tell our AI your appliances and power needs. It designs <strong className="text-solar-text">3 complete system options</strong> (Budget, Performance and All-in-One) with full part lists and ₦ cost estimates.
              </p>
            </div>
            <Link to="/advisor" className="btn-primary btn-lg flex-shrink-0 inline-flex items-center gap-1.5"><Zap size={16}/>Try Solar Advisor</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
