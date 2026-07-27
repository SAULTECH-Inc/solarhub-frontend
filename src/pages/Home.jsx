import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsService } from '../services/products.service';
import { categoriesService } from '../services/index';
import ProductCard from '../components/ProductCard';
import SEO, { orgSchema, websiteSchema, itemListSchema } from '../components/SEO';
import { Sun, BatteryFull, Zap, Settings2, Lightbulb, Wrench, ShieldCheck, Star, Globe, Truck, Lock, BadgeCheck, Search, MessageCircle, CreditCard, Package } from 'lucide-react';

const CAT_SVG = {
  'solar-panels':       <Sun size={28} className="text-solar-accent" />,
  'batteries':          <BatteryFull size={28} className="text-solar-accent" />,
  'inverters':          <Zap size={28} className="text-solar-accent" />,
  'charge-controllers': <Settings2 size={28} className="text-solar-accent" />,
  'solar-lights':       <Lightbulb size={28} className="text-solar-accent" />,
  'accessories':        <Wrench size={28} className="text-solar-accent" />,
};

const FALLBACK_CATS = [
  { key:'solar-panels',       label:'Solar Panels',  desc:'Mono, Poly, Bifacial, HJT' },
  { key:'batteries',          label:'Batteries',     desc:'LiFePO4, AGM, Gel, Flooded' },
  { key:'inverters',          label:'Inverters',     desc:'Pure Sine, Hybrid, Grid-Tie' },
  { key:'charge-controllers', label:'Controllers',   desc:'MPPT & PWM' },
  { key:'solar-lights',       label:'Solar Lights',  desc:'Street, Garden, Flood' },
  { key:'accessories',        label:'Accessories',   desc:'Cables, Mounts & More' },
];

const STATS = [
  { val:'12,000+', label:'Products Listed' },
  { val:'1,800+',  label:'Verified Sellers' },
  { val:'30+',     label:'African Countries' },
  { val:'4.9★',    label:'Average Rating' },
];

const HOW_IT_WORKS = [
  {
    icon: <Search size={24} className="text-solar-accent" />,
    step: '01',
    title: 'Browse & Compare',
    desc: 'Search thousands of solar products from verified sellers across Africa. Filter by specs, price, and location.',
  },
  {
    icon: <MessageCircle size={24} className="text-solar-accent" />,
    step: '02',
    title: 'Connect with Sellers',
    desc: 'Chat directly with sellers, ask technical questions, and negotiate. Our Solar Advisor AI helps you pick the right system.',
  },
  {
    icon: <CreditCard size={24} className="text-solar-accent" />,
    step: '03',
    title: 'Pay Securely',
    desc: 'Checkout with confidence using our escrow payment protection — funds are only released when you confirm delivery.',
  },
  {
    icon: <Package size={24} className="text-solar-accent" />,
    step: '04',
    title: 'Receive & Power Up',
    desc: 'Track your order in real time. Once delivered and inspected, release payment to the seller. Simple.',
  },
];

const TRUST_BADGES = [
  {
    icon: <BadgeCheck size={28} className="text-solar-accent" />,
    title: 'Verified Sellers',
    desc: 'Every seller goes through identity and business verification before listing. Fake stores don\'t make it through.',
  },
  {
    icon: <Lock size={28} className="text-solar-accent" />,
    title: 'Escrow Protection',
    desc: 'Your money sits safely in escrow until you confirm the goods arrived and you\'re satisfied. No risk.',
  },
  {
    icon: <Globe size={28} className="text-solar-accent" />,
    title: 'Pan-African Reach',
    desc: 'Buyers and sellers across 30+ African countries. Order locally or source the best deal continent-wide.',
  },
  {
    icon: <Truck size={28} className="text-solar-accent" />,
    title: 'Real-Time Tracking',
    desc: 'Follow your shipment from dispatch to doorstep with live logistics tracking and automatic status updates.',
  },
  {
    icon: <ShieldCheck size={28} className="text-solar-accent" />,
    title: 'Dispute Resolution',
    desc: 'Our dedicated support team mediates disputes fairly. If something goes wrong, you\'re covered.',
  },
  {
    icon: <Zap size={28} className="text-solar-accent" />,
    title: 'AI Solar Advisor',
    desc: 'Tell us your appliances — our AI designs 3 complete solar system options with part lists and cost estimates.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Amara Diallo',
    role: 'Solar Installation Business, Dakar',
    country: '🇸🇳',
    rating: 5,
    text: 'I source panels from Nigeria and Ghana suppliers on Solar Market every month. The escrow system means I never lose money to bad actors again. Best platform on the continent.',
    avatar: 'AD',
  },
  {
    name: 'Chidi Okafor',
    role: 'Homeowner, Lagos',
    country: '🇳🇬',
    rating: 5,
    text: 'Used the Solar Advisor to size my system — it gave me three options with full part lists and prices. Ended up saving ₦180k compared to what installers quoted me. Incredible tool.',
    avatar: 'CO',
  },
  {
    name: 'Fatima Al-Rashid',
    role: 'Verified Seller, Cairo',
    country: '🇪🇬',
    rating: 5,
    text: 'As a seller, my reach went from local to pan-African overnight. Orders now come from Kenya, Ghana, Senegal. The platform handles payments and disputes so I can focus on my products.',
    avatar: 'FA',
  },
  {
    name: 'Kofi Mensah',
    role: 'Off-grid Community Project, Accra',
    country: '🇬🇭',
    rating: 5,
    text: 'We equipped 200 homes in rural Ghana using Solar Market. Competitive prices, genuine warranties, and the logistics tracking kept our project on schedule. Highly recommend.',
    avatar: 'KM',
  },
];

const COUNTRIES = ['🇳🇬','🇬🇭','🇿🇦','🇰🇪','🇸🇳','🇪🇬','🇪🇹','🇹🇿','🇺🇬','🇨🇮','🇨🇲','🇲🇦','🇹🇳','🇩🇿','🇷🇼'];

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
      .then(r => {
        const d = r?.data ?? r;
        if (Array.isArray(d) && d.length)
          setCats(d.map(c => ({ key: c.slug, label: c.name, icon: c.icon || '⚡', desc: c.description })));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-grid min-h-screen">
      <SEO
        canonical="/"
        description="Africa's premier solar marketplace. Buy solar panels, batteries, inverters & charge controllers from verified sellers across 30+ countries. Hire certified solar engineers. AI-powered system advisor."
        jsonLd={[
          orgSchema(),
          websiteSchema(),
          ...(featured.length ? [itemListSchema(featured, "Africa's Top Solar Products")] : []),
        ]}
      />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative px-5 pt-20 pb-16 text-center overflow-hidden"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(245,158,11,0.10), transparent)' }}>
        {/* floating country flags */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {COUNTRIES.map((flag, i) => (
            <span key={i} className="absolute text-2xl opacity-10 select-none"
              style={{
                top:  `${10 + (i * 23 % 75)}%`,
                left: `${(i * 137.5 % 100)}%`,
                animationDelay: `${i * 0.4}s`,
              }}>
              {flag}
            </span>
          ))}
        </div>

        <div className="relative max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="flex-1 max-w-[60px] h-px bg-solar-accent/25" />
            <span className="font-heading text-[11px] tracking-[3px] uppercase text-solar-accent">Africa's Solar Marketplace</span>
            <div className="flex-1 max-w-[60px] h-px bg-solar-accent/25" />
          </div>

          <h1 className="font-heading text-4xl md:text-6xl font-bold leading-tight mb-5">
            Power Africa with<br/><span className="text-solar-accent">Clean Solar Energy</span>
          </h1>
          <p className="text-solar-muted text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            Buy, sell and source solar equipment from verified suppliers across 30+ African countries. AI system advisor, escrow protection, real-time tracking — all in one platform.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/marketplace" className="btn-primary btn-lg">Browse Products</Link>
            <Link to="/advisor"     className="btn-outline btn-lg inline-flex items-center gap-1.5"><Zap size={16}/>Solar Advisor</Link>
          </div>

          {/* country flag strip */}
          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            <span className="text-xs text-solar-dim">Serving buyers & sellers in</span>
            <div className="flex gap-1.5 flex-wrap justify-center">
              {COUNTRIES.slice(0, 10).map((f, i) => <span key={i} className="text-xl">{f}</span>)}
              <span className="text-xs text-solar-muted self-center">+20 more</span>
            </div>
          </div>

          {/* stats */}
          <div className="flex gap-8 justify-center mt-12 pt-10 border-t border-solar-border flex-wrap">
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

        {/* ── How It Works ─────────────────────────────────────────────── */}
        <section className="py-16">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-2">
              How <span className="text-solar-accent">Solar Market</span> Works
            </h2>
            <p className="text-solar-muted text-sm max-w-md mx-auto">
              From browsing to powering up — the whole journey in four simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4 relative">
            {/* connector line on desktop */}
            <div className="hidden md:block absolute top-[52px] left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-px bg-solar-border z-0" />

            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className="relative z-10 bg-solar-card border border-solar-border rounded-2xl p-6 text-center card-hover">
                <div className="w-12 h-12 rounded-full bg-solar-accent/10 border border-solar-accent/30 flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="font-heading text-[10px] tracking-widest text-solar-accent mb-2">{item.step}</div>
                <h3 className="font-heading text-sm font-bold text-solar-text mb-2">{item.title}</h3>
                <p className="text-xs text-solar-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Categories ───────────────────────────────────────────────── */}
        <section className="pb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-semibold">Browse by <span className="text-solar-accent">Category</span></h2>
            <Link to="/marketplace" className="btn-ghost text-sm">All products →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {cats.map(cat => (
              <Link key={cat.key} to={`/marketplace?cat=${cat.key}`}
                className="bg-solar-card border border-solar-border rounded-xl p-4 text-center card-hover group">
                <span className="mb-2 flex justify-center group-hover:scale-110 transition-transform">
                  {CAT_SVG[cat.key] || <Zap size={28} className="text-solar-accent" />}
                </span>
                <h3 className="font-heading text-xs font-semibold text-solar-text mb-1">{cat.label}</h3>
                <p className="text-[10px] text-solar-dim leading-snug hidden md:block">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Trust Badges ─────────────────────────────────────────────── */}
        <section className="pb-16">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-2">
              Why Buyers & Sellers <span className="text-solar-accent">Trust Us</span>
            </h2>
            <p className="text-solar-muted text-sm max-w-md mx-auto">
              Built specifically for the African solar market — with the trust and safety features it demands.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {TRUST_BADGES.map((b, i) => (
              <div key={i}
                className="bg-solar-card border border-solar-border rounded-2xl p-6 card-hover group"
                style={{ background: i === 1 ? 'linear-gradient(135deg, rgba(245,158,11,0.05), transparent)' : undefined,
                         borderColor: i === 1 ? 'rgba(245,158,11,0.3)'  : undefined }}>
                <div className="w-11 h-11 rounded-xl bg-solar-surface border border-solar-border flex items-center justify-center mb-4 group-hover:border-solar-accent/50 transition-colors">
                  {b.icon}
                </div>
                <h3 className="font-heading text-sm font-bold text-solar-text mb-2">{b.title}</h3>
                <p className="text-xs text-solar-muted leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Featured Products ─────────────────────────────────────────── */}
        <section className="pb-14">
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
            <div className="text-center py-12 text-solar-dim border border-dashed border-solar-border rounded-2xl">
              <div className="flex justify-center mb-3"><Sun size={40} className="text-solar-accent opacity-60"/></div>
              <p className="text-sm mb-4">Products from verified African sellers will appear here.</p>
              <Link to="/sell" className="btn-primary inline-flex">List Your Products</Link>
            </div>
          )}
        </section>

        {/* ── Testimonials ─────────────────────────────────────────────── */}
        <section className="pb-16">
          <div className="text-center mb-10">
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-2">
              Trusted Across <span className="text-solar-accent">Africa</span>
            </h2>
            <p className="text-solar-muted text-sm max-w-md mx-auto">
              Buyers, sellers and project teams from Lagos to Cairo share their experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-solar-card border border-solar-border rounded-2xl p-6 flex flex-col gap-4 card-hover">
                {/* stars */}
                <div className="flex gap-0.5">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={14} className="text-solar-accent fill-solar-accent" />
                  ))}
                </div>

                <p className="text-solar-muted text-sm leading-relaxed flex-1">"{t.text}"</p>

                <div className="flex items-center gap-3 pt-2 border-t border-solar-border">
                  <div className="w-9 h-9 rounded-full bg-solar-accent/20 border border-solar-accent/40 flex items-center justify-center font-heading text-xs font-bold text-solar-accent flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-solar-text">
                      {t.name} <span className="ml-1">{t.country}</span>
                    </div>
                    <div className="text-xs text-solar-dim truncate">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Sell CTA ─────────────────────────────────────────────────── */}
        <section className="pb-10">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl p-8 flex flex-col gap-4"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.10), rgba(245,158,11,0.03))', border: '1px solid rgba(245,158,11,0.25)' }}>
              <Zap size={32} className="text-solar-accent" />
              <div>
                <h3 className="font-heading text-xl font-bold mb-2">Not sure what system you need?</h3>
                <p className="text-solar-muted text-sm leading-relaxed">
                  Tell our AI your appliances. It designs <strong className="text-solar-text">3 complete system options</strong> — Budget, Performance, All-in-One — with full part lists and cost estimates.
                </p>
              </div>
              <Link to="/advisor" className="btn-primary inline-flex items-center gap-1.5 self-start">
                <Zap size={16}/> Try Solar Advisor
              </Link>
            </div>

            <div className="rounded-2xl p-8 flex flex-col gap-4"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Globe size={32} className="text-solar-green" />
              <div>
                <h3 className="font-heading text-xl font-bold mb-2">Sell to All of Africa</h3>
                <p className="text-solar-muted text-sm leading-relaxed">
                  List your solar products and reach buyers in <strong className="text-solar-text">30+ countries</strong>. Verified seller badge, escrow payments, and logistics support built in.
                </p>
              </div>
              <Link to="/sell" className="btn-outline inline-flex items-center gap-1.5 self-start border-solar-green/40 text-solar-green hover:border-solar-green">
                Start Selling →
              </Link>
            </div>
          </div>
        </section>

      </div>

      {/* ── Footer band ──────────────────────────────────────────────── */}
      <div className="border-t border-solar-border mt-4">
        <div className="max-w-[1200px] mx-auto px-5 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-solar-dim">
          <div className="flex items-center gap-2">
            <Sun size={16} className="text-solar-accent" />
            <span className="font-heading font-bold text-solar-muted">Solar Market</span>
            <span>— Africa's Solar Marketplace</span>
          </div>
          <div className="flex gap-5">
            <Link to="/marketplace"   className="hover:text-solar-text transition-colors">Marketplace</Link>
            <Link to="/engineers"     className="hover:text-solar-text transition-colors">Hire Engineers</Link>
            <Link to="/advisor"       className="hover:text-solar-text transition-colors">AI Advisor</Link>
            <Link to="/sell"          className="hover:text-solar-text transition-colors">Sell</Link>
          </div>
          <span>© {new Date().getFullYear()} Solar Market. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}
