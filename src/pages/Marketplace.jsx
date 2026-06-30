import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsService } from '../services/products.service';
import ProductCard from '../components/ProductCard';
import SEO, { itemListSchema } from '../components/SEO';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const PRICE_RANGES = [
  { label:'All Prices', val:'' }, { label:'Under ₦100k', val:'0-100000' },
  { label:'₦100k–₦300k', val:'100000-300000' }, { label:'₦300k–₦600k', val:'300000-600000' },
  { label:'Above ₦600k', val:'600000-9999999' },
];
const CATS = [
  { key:'solar-panels', label:'Solar Panels' }, { key:'batteries', label:'Batteries' },
  { key:'inverters', label:'Inverters' }, { key:'charge-controllers', label:'Controllers' },
  { key:'solar-lights', label:'Solar Lights' }, { key:'accessories', label:'Accessories' },
];
const LOCS = ['Lagos','Abuja','Port Harcourt','Enugu','Ibadan','Other'];

export default function Marketplace() {
  const [sp] = useSearchParams();
  const [q,setQ]             = useState('');
  const [cats,setCats]       = useState(sp.get('cat') ? [sp.get('cat')] : []);
  const [price,setPrice]     = useState('');
  const [locs,setLocs]       = useState([]);
  const [sort,setSort]       = useState('def');
  const [page,setPage]       = useState(1);
  const [products,setProducts]= useState([]);
  const [meta,setMeta]       = useState({ total:0, totalPages:1, hasNext:false });
  const [loading,setLoading] = useState(false);
  const [mobile,setMobile]   = useState(false);
  const tmr = useRef(null);

  const doSearch = useCallback(async (pg=1, reset=true) => {
    setLoading(true);
    const params = { page: pg, limit: 20 };
    if (q)           params.search   = q;
    if (cats.length) params.category = cats[0];
    if (price)       { const [mn,mx] = price.split('-'); params.minPrice = mn; params.maxPrice = mx; }
    if (sort === 'pa')  { params.sortBy = 'price'; params.order = 'ASC'; }
    if (sort === 'pd')  { params.sortBy = 'price'; params.order = 'DESC'; }
    if (sort === 'rat') { params.sortBy = 'averageRating'; params.order = 'DESC'; }
    try {
      const res = await productsService.search(params);
      const d = res?.data ?? res;
      const items = d?.data ?? (Array.isArray(d) ? d : []);
      setProducts(reset ? items : prev => [...prev, ...items]);
      setMeta({ total: d?.total||0, totalPages: d?.totalPages||1, hasNext: d?.hasNext||false });
    } catch(e) { console.warn(e.message); }
    finally { setLoading(false); }
  }, [q, cats, price, sort]);

  useEffect(() => {
    if (tmr.current) clearTimeout(tmr.current);
    tmr.current = setTimeout(() => { setPage(1); doSearch(1, true); }, 350);
    return () => clearTimeout(tmr.current);
  }, [q, cats, price, locs, sort]);

  const toggleCat = c => setCats(p => p.includes(c) ? p.filter(x=>x!==c) : [...p,c]);
  const toggleLoc = l => setLocs(p => p.includes(l) ? p.filter(x=>x!==l) : [...p,l]);
  const clearFilters = () => { setCats([]); setPrice(''); setLocs([]); setQ(''); };

  const Filters = (
    <div className="space-y-5">
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-widest text-solar-muted mb-3">Category</h4>
        {CATS.map(({key,label}) => (
          <label key={key} className="flex items-center gap-2.5 mb-2 cursor-pointer">
            <input type="checkbox" checked={cats.includes(key)} onChange={() => toggleCat(key)} className="accent-solar-accent w-3.5 h-3.5"/>
            <span className="text-[13px] text-solar-muted hover:text-solar-text">{label}</span>
          </label>
        ))}
      </div>
      <div className="pt-4 border-t border-solar-border">
        <h4 className="text-[11px] font-semibold uppercase tracking-widest text-solar-muted mb-3">Price</h4>
        <select value={price} onChange={e => setPrice(e.target.value)} className="solar-input text-sm">
          {PRICE_RANGES.map(r => <option key={r.val} value={r.val}>{r.label}</option>)}
        </select>
      </div>
      <div className="pt-4 border-t border-solar-border">
        <h4 className="text-[11px] font-semibold uppercase tracking-widest text-solar-muted mb-3">Location</h4>
        {LOCS.map(l => (
          <label key={l} className="flex items-center gap-2.5 mb-2 cursor-pointer">
            <input type="checkbox" checked={locs.includes(l)} onChange={() => toggleLoc(l)} className="accent-solar-accent w-3.5 h-3.5"/>
            <span className="text-[13px] text-solar-muted hover:text-solar-text">{l}</span>
          </label>
        ))}
      </div>
      <button onClick={clearFilters} className="btn-outline w-full text-xs">Clear Filters</button>
    </div>
  );

  const activeCat = CATS.find(c => cats.includes(c.key));
  const seoTitle = activeCat
    ? `Buy ${activeCat.label.replace(/^\S+\s/,'')} in Nigeria`
    : 'Solar Products Marketplace Nigeria';
  const seoDesc = activeCat
    ? `Shop ${activeCat.label.replace(/^\S+\s/,'')} from verified Nigerian sellers. Compare prices, specs and warranty. Fast delivery across Nigeria.`
    : `Shop ${meta.total || '1,200'}+ solar products: panels, batteries, inverters, charge controllers. Compare prices from verified Nigerian sellers.`;

  return (
    <div className="max-w-[1200px] mx-auto px-5 py-10">
      <SEO
        title={seoTitle}
        description={seoDesc}
        canonical={activeCat ? `/marketplace?cat=${activeCat.key}` : '/marketplace'}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Marketplace', url: '/marketplace' },
          ...(activeCat ? [{ name: activeCat.label.replace(/^\S+\s/,'') }] : []),
        ]}
        jsonLd={products.length ? itemListSchema(products.slice(0, 20), seoTitle) : undefined}
      />
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex flex-1 min-w-[240px]">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search solar products..." className="solar-input rounded-r-none flex-1"/>
          <button className="bg-solar-accent text-black px-4 rounded-r-lg flex items-center justify-center flex-shrink-0"><Search size={18} /></button>
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className="solar-input w-auto text-sm px-3">
          <option value="def">Featured</option><option value="pa">Price: Low→High</option>
          <option value="pd">Price: High→Low</option><option value="rat">Highest Rated</option>
        </select>
        <button onClick={() => setMobile(true)} className="btn-outline text-sm md:hidden flex items-center gap-1.5"><SlidersHorizontal size={15} /> Filters</button>
      </div>
      <div className="flex gap-6">
        <aside className="hidden md:block w-52 flex-shrink-0">
          <div className="bg-solar-card border border-solar-border rounded-xl p-4 sticky top-20">
            <h3 className="font-heading text-sm font-semibold mb-4">Filters</h3>
            {Filters}
          </div>
        </aside>
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <span className="text-sm text-solar-muted">
              {loading && !products.length ? <span className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-solar-accent border-t-transparent rounded-full animate-spin"/>Searching…</span>
                : <><span className="font-semibold text-solar-text">{meta.total.toLocaleString()}</span> product{meta.total!==1?'s':''} found</>}
            </span>
          </div>
          {!loading && !products.length ? (
            <div className="text-center py-20 text-solar-dim">
              <Search size={48} className="mx-auto mb-4 opacity-40" />
              <div className="font-heading text-base mb-2">No products found</div>
              <button onClick={clearFilters} className="btn-outline mt-4">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => <ProductCard key={p.id} product={p}/>)}
                {loading && [...Array(6)].map((_,i) => <div key={i} className="section-card h-72 animate-pulse bg-solar-card2"/>)}
              </div>
              {meta.hasNext && !loading && (
                <div className="text-center mt-8">
                  <button onClick={() => { const np=page+1; setPage(np); doSearch(np,false); }} className="btn-outline px-8">Load More</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      {mobile && (
        <div className="fixed inset-0 z-[200] flex">
          <div className="flex-1 bg-black/60" onClick={() => setMobile(false)}/>
          <div className="w-72 bg-solar-card border-l border-solar-border h-full overflow-y-auto p-5 animate-slide-right">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-sm font-semibold">Filters</h3>
              <button onClick={() => setMobile(false)}><X size={18} className="text-solar-muted" /></button>
            </div>
            {Filters}
          </div>
        </div>
      )}
    </div>
  );
}
