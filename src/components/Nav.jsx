import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { notificationsService } from '../services';
import {
  ShoppingCart, MessageCircle, Bell, User, Package,
  ClipboardList, Store, Star, LogOut, Heart, ChevronDown,
  Menu, X, Sun, Zap, Wrench, Truck, CheckCheck, Circle,
} from 'lucide-react';

const CORE_LINKS = [
  { to:'/marketplace',         label:'Marketplace' },
  { to:'/advisor',             label:'Advisor',       icon: <Zap size={13} /> },
  { to:'/engineers',           label:'Hire Engineer', icon: <Wrench size={13} /> },
  { to:'/logistics/providers', label:'Logistics',     icon: <Truck size={13} /> },
];

// Shown inline at xl+; at lg they go into the "More" dropdown
const WIDE_LINKS = [
  { to:'/projects', label:'Job Board', icon: <ClipboardList size={13} /> },
  { to:'/sell',     label:'Sell' },
];

const MOBILE_LINKS = [
  { to:'/',                    label:'Home' },
  { to:'/marketplace',         label:'Marketplace' },
  { to:'/advisor',             label:'Solar Advisor',   icon: <Zap size={13} /> },
  { to:'/engineers',           label:'Hire Engineer',   icon: <Wrench size={13} /> },
  { to:'/logistics/providers', label:'Logistics',       icon: <Truck size={13} /> },
  { to:'/projects',            label:'Job Board',       icon: <ClipboardList size={13} /> },
  { to:'/sell',                label:'Sell' },
  { to:'/become-engineer',     label:'Become Engineer', icon: <Zap size={13} />, orange: true },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NavLink({ to, label, icon, isActive }) {
  return (
    <Link to={to}
      className={`px-2.5 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap transition-all border inline-flex items-center gap-1.5
        ${isActive
          ? 'text-solar-accent bg-solar-accent/10 border-solar-accent/20'
          : 'text-solar-muted border-transparent hover:bg-solar-surface hover:text-solar-text'}`}>
      {icon && icon}{label}
    </Link>
  );
}

export default function Nav() {
  const loc = useLocation();
  const nav = useNavigate();
  const { user, cartCount, dispatch, favourites, unreadNotifications, logout } = useApp();

  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [moreOpen,     setMoreOpen]       = useState(false);
  const [notifOpen,    setNotifOpen]      = useState(false);
  const [menuOpen,     setMenuOpen]       = useState(false);
  const [notifs,       setNotifs]         = useState([]);
  const [notifLoading, setNotifLoading]   = useState(false);

  const dropdownRef = useRef(null);
  const moreRef     = useRef(null);
  const notifRef    = useRef(null);

  const close = () => { setMenuOpen(false); setDropdownOpen(false); setMoreOpen(false); setNotifOpen(false); };
  const active = (to) => loc.pathname === to;

  // Universal outside-click handler for all three dropdowns
  useEffect(() => {
    if (!dropdownOpen && !moreOpen && !notifOpen) return;
    function onDown(e) {
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (moreOpen     && moreRef.current     && !moreRef.current.contains(e.target))     setMoreOpen(false);
      if (notifOpen    && notifRef.current    && !notifRef.current.contains(e.target))    setNotifOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [dropdownOpen, moreOpen, notifOpen]);

  // Fetch notifications when panel opens
  useEffect(() => {
    if (!notifOpen || !user) return;
    setNotifLoading(true);
    notificationsService.getAll(1, 10)
      .then(res => setNotifs(res.data?.data || []))
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  }, [notifOpen]);

  const handleMarkAllRead = useCallback(async () => {
    await notificationsService.markAllRead().catch(() => {});
    setNotifs(n => n.map(x => ({ ...x, read: true })));
    dispatch({ type: 'SET_UNREAD', payload: 0 });
  }, [dispatch]);

  return (
    <>
      <nav className="glass-nav sticky top-0 z-[100] border-b border-solar-border"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-[1400px] mx-auto px-4 h-[60px] flex items-center gap-2">

          {/* Logo */}
          <Link to="/" onClick={close}
            className="font-heading font-bold text-[17px] text-solar-accent tracking-wider flex-shrink-0 flex items-center gap-2 mr-2">
            <Sun size={18} className="text-solar-accent" />
            <span className="text-solar-text">Solar</span> Maket
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5 flex-shrink-0">
            {CORE_LINKS.map(l => (
              <NavLink key={l.to} {...l} isActive={active(l.to)} />
            ))}
            {/* Wide only — inline at xl+ */}
            {WIDE_LINKS.map(l => (
              <span key={l.to} className="hidden xl:inline-flex">
                <NavLink {...l} isActive={active(l.to)} />
              </span>
            ))}
            {/* "More" dropdown — visible lg → xl only */}
            <div ref={moreRef} className="relative hidden lg:inline-flex xl:hidden">
              <button onClick={() => setMoreOpen(v => !v)}
                className={`px-2.5 py-1.5 rounded-md text-[13px] font-medium border inline-flex items-center gap-1 transition-all
                  ${moreOpen ? 'text-solar-accent bg-solar-accent/10 border-solar-accent/20' : 'text-solar-muted border-transparent hover:bg-solar-surface hover:text-solar-text'}`}>
                More <ChevronDown size={12} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen && (
                <div className="absolute left-0 top-full mt-2 w-44 bg-solar-card border border-solar-border2 rounded-xl shadow-2xl py-1.5 z-50 animate-slide-up">
                  {WIDE_LINKS.map(l => (
                    <Link key={l.to} to={l.to} onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors
                        ${active(l.to) ? 'text-solar-accent bg-solar-accent/10' : 'text-solar-text hover:bg-solar-surface'}`}>
                      {l.icon && <span className="opacity-60">{l.icon}</span>}{l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1" />

          {/* Right icons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {user && (
              <Link to="/messages" title="Messages" onClick={close}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all
                  ${active('/messages') ? 'bg-solar-accent/20 text-solar-accent' : 'text-solar-muted hover:bg-solar-surface hover:text-solar-text'}`}>
                <MessageCircle size={20} />
              </Link>
            )}

            {/* Notifications bell */}
            {user && (
              <div ref={notifRef} className="relative">
                <button onClick={() => setNotifOpen(v => !v)}
                  className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-all
                    ${notifOpen ? 'bg-solar-accent/20 text-solar-accent' : 'text-solar-muted hover:bg-solar-surface hover:text-solar-text'}`}>
                  <Bell size={20} />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-solar-green rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-solar-card border border-solar-border2 rounded-xl shadow-2xl z-50 animate-slide-up origin-top-right overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-solar-border">
                      <span className="font-heading font-semibold text-sm">Notifications</span>
                      {notifs.some(n => !n.read) && (
                        <button onClick={handleMarkAllRead}
                          className="flex items-center gap-1 text-[11px] text-solar-accent hover:opacity-70 transition-opacity">
                          <CheckCheck size={12} /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[340px] overflow-y-auto">
                      {notifLoading ? (
                        <div className="flex items-center justify-center py-10">
                          <div className="w-5 h-5 border-2 border-solar-accent border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : notifs.length === 0 ? (
                        <div className="text-center py-10 text-solar-dim">
                          <Bell size={28} className="mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      ) : notifs.map(n => (
                        <button key={n.id} onClick={() => {
                          if (!n.read) notificationsService.markRead([n.id]).catch(() => {});
                          setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                          if (n.data?.orderId) { nav(`/orders/${n.data.orderId}`); setNotifOpen(false); }
                          else if (n.data?.productId) { nav(`/product/${n.data.productId}`); setNotifOpen(false); }
                        }}
                          className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-solar-surface border-b border-solar-border/40 last:border-0
                            ${!n.read ? 'bg-solar-accent/5' : ''}`}>
                          <div className="mt-1 flex-shrink-0">
                            {n.read
                              ? <Circle size={7} className="text-solar-border fill-solar-border" />
                              : <Circle size={7} className="text-solar-accent fill-solar-accent" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] font-medium leading-snug truncate ${n.read ? 'text-solar-muted' : 'text-solar-text'}`}>
                              {n.title}
                            </p>
                            <p className="text-[11px] text-solar-dim mt-0.5 line-clamp-2 leading-snug">{n.body}</p>
                            <p className="text-[10px] text-solar-dim/60 mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    {notifs.length > 0 && (
                      <div className="px-4 py-2.5 border-t border-solar-border">
                        <Link to="/profile" onClick={() => setNotifOpen(false)}
                          className="text-[12px] text-solar-accent hover:opacity-70 transition-opacity">
                          View all notifications →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Cart */}
            <button onClick={() => dispatch({ type: 'TOGGLE_CART' })}
              className="relative w-9 h-9 rounded-lg flex items-center justify-center text-solar-muted hover:bg-solar-surface hover:text-solar-text transition-all">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-solar-accent rounded-full text-[10px] font-bold text-black flex items-center justify-center">{cartCount}</span>
              )}
            </button>

            {/* Desktop user dropdown (lg+) */}
            {user ? (
              <div ref={dropdownRef} className="relative ml-0.5 z-[150] hidden lg:block">
                <button onClick={() => setDropdownOpen(v => !v)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none pl-2 border-l border-solar-border">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-solar-accent to-solar-orange flex items-center justify-center text-sm font-bold text-black flex-shrink-0">
                    {user.firstName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm text-solar-text font-medium max-w-[72px] truncate hidden xl:block">{user.firstName}</span>
                  <ChevronDown size={12} className={`text-solar-dim transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-solar-card border border-solar-border2 rounded-xl shadow-2xl py-2 z-50 animate-slide-up origin-top-right">
                    <div className="px-4 py-2.5 border-b border-solar-border mb-1 bg-solar-surface/30">
                      <div className="font-heading font-semibold text-sm truncate">{user.firstName} {user.lastName}</div>
                      <div className="text-[11px] text-solar-dim truncate">{user.email}</div>
                    </div>
                    {[
                      { to:'/profile',        icon:<User size={16}/>,          label:'Profile & Settings' },
                      { to:'/orders',         icon:<Package size={16}/>,       label:'My Orders' },
                      { to:'/my-projects',    icon:<ClipboardList size={16}/>, label:'My Projects' },
                    ].map(item => (
                      <Link key={item.to} to={item.to} onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2.5 text-sm text-solar-text hover:bg-solar-surface transition-colors flex items-center gap-2">
                        <span className="opacity-70">{item.icon}</span> {item.label}
                      </Link>
                    ))}

                    {user.isSeller && (
                      <>
                        <div className="h-px bg-solar-border my-1.5" />
                        <Link to="/seller/products" onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm text-solar-text hover:bg-solar-surface transition-colors flex items-center gap-2">
                          <span className="opacity-70"><Store size={16}/></span> My Listings
                        </Link>
                        <Link to="/subscription" onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm text-solar-text hover:bg-solar-surface transition-colors flex items-center gap-2">
                          <span className="opacity-70"><Star size={16}/></span> Subscription
                        </Link>
                      </>
                    )}

                    <div className="h-px bg-solar-border my-1.5" />
                    {!user.isSeller && (
                      <Link to="/sell" onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2.5 text-sm text-solar-text hover:bg-solar-surface transition-colors flex items-center gap-2">
                        <span className="opacity-70"><Store size={16}/></span> Sell on Solar Maket
                      </Link>
                    )}
                    <Link to="/become-engineer" onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 text-sm text-solar-orange hover:bg-solar-surface transition-colors flex items-center gap-2">
                      <span className="opacity-70"><Zap size={16}/></span> Become an Engineer
                    </Link>
                    {user.isLogistics ? (
                      <Link to="/logistics/dashboard" onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2.5 text-sm text-solar-text hover:bg-solar-surface transition-colors flex items-center gap-2">
                        <span className="opacity-70"><Truck size={16}/></span> Logistics Dashboard
                      </Link>
                    ) : (
                      <Link to="/become-logistics" onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2.5 text-sm text-solar-text hover:bg-solar-surface transition-colors flex items-center gap-2">
                        <span className="opacity-70"><Truck size={16}/></span> Become a Dispatcher
                      </Link>
                    )}

                    <div className="h-px bg-solar-border my-1.5" />
                    <Link to="/favourites" onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 text-sm text-solar-text hover:bg-solar-surface transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="opacity-70"><Heart size={16}/></span> Favourites</div>
                      {favourites.length > 0 && (
                        <span className="bg-red-500/20 text-red-500 border border-red-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{favourites.length}</span>
                      )}
                    </Link>
                    <div className="h-px bg-solar-border my-1.5" />
                    <button onClick={() => { logout(); setDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 font-medium">
                      <span className="opacity-70"><LogOut size={16}/></span> Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex gap-2 ml-1 border-l border-solar-border pl-3">
                <button onClick={() => dispatch({ type: 'OPEN_AUTH', payload: 'login' })} className="btn-outline text-xs py-1.5 px-3">Log In</button>
                <button onClick={() => dispatch({ type: 'OPEN_AUTH', payload: 'signup' })} className="btn-primary text-xs py-1.5 px-3">Sign Up</button>
              </div>
            )}

            {/* Hamburger — only below lg */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-solar-muted hover:bg-solar-surface hover:text-solar-text transition-all ml-1"
              aria-label="Toggle menu">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-[90] bg-black/50 lg:hidden"
            style={{ top: 'calc(60px + env(safe-area-inset-top))' }}
            onClick={() => setMenuOpen(false)} />
          <div className="fixed left-0 right-0 z-[95] lg:hidden bg-solar-card border-b border-solar-border shadow-2xl animate-slide-down overflow-y-auto"
            style={{ top: 'calc(60px + env(safe-area-inset-top))', maxHeight: 'calc(100vh - 60px - env(safe-area-inset-top))' }}>
            <div className="p-3 space-y-0.5">
              {MOBILE_LINKS.map(l => (
                <Link key={l.to} to={l.to} onClick={close}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                    ${active(l.to) ? 'text-solar-accent bg-solar-accent/10' : l.orange ? 'text-solar-orange hover:bg-solar-surface' : 'text-solar-text hover:bg-solar-surface'}`}>
                  {l.icon && <span className="opacity-70">{l.icon}</span>}{l.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-solar-border p-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 mb-1">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-solar-accent to-solar-orange flex items-center justify-center text-sm font-bold text-black flex-shrink-0">
                      {user.firstName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{user.firstName} {user.lastName}</div>
                      <div className="text-[11px] text-solar-dim truncate">{user.email}</div>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    {[
                      { to:'/profile',     icon:<User size={16}/>,          label:'Profile & Settings' },
                      { to:'/orders',      icon:<Package size={16}/>,       label:'My Orders' },
                      { to:'/my-projects', icon:<ClipboardList size={16}/>, label:'My Projects' },
                    ].map(item => (
                      <Link key={item.to} to={item.to} onClick={close}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-solar-text hover:bg-solar-surface transition-colors">
                        <span className="text-solar-muted">{item.icon}</span> {item.label}
                      </Link>
                    ))}
                    <Link to="/favourites" onClick={close}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-solar-text hover:bg-solar-surface transition-colors">
                      <span className="text-solar-muted"><Heart size={16}/></span> Favourites
                      {favourites.length > 0 && (
                        <span className="ml-auto bg-red-500/20 text-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{favourites.length}</span>
                      )}
                    </Link>
                    {user.isSeller && (
                      <>
                        <Link to="/seller/products" onClick={close}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-solar-text hover:bg-solar-surface transition-colors">
                          <span className="text-solar-muted"><Store size={16}/></span> My Listings
                        </Link>
                        <Link to="/subscription" onClick={close}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-solar-text hover:bg-solar-surface transition-colors">
                          <span className="text-solar-muted"><Star size={16}/></span> Subscription
                        </Link>
                      </>
                    )}
                    {user.isLogistics ? (
                      <Link to="/logistics/dashboard" onClick={close}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-solar-text hover:bg-solar-surface transition-colors">
                        <span className="text-solar-muted"><Truck size={16}/></span> Logistics Dashboard
                      </Link>
                    ) : (
                      <Link to="/become-logistics" onClick={close}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-solar-text hover:bg-solar-surface transition-colors">
                        <span className="text-solar-muted"><Truck size={16}/></span> Become a Dispatcher
                      </Link>
                    )}
                    <button onClick={() => { logout(); close(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors font-medium mt-1">
                      <LogOut size={16}/> Log Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex gap-3 px-1">
                  <button onClick={() => { dispatch({ type: 'OPEN_AUTH', payload: 'login' }); close(); }}
                    className="btn-outline flex-1 py-2.5 text-sm">Log In</button>
                  <button onClick={() => { dispatch({ type: 'OPEN_AUTH', payload: 'signup' }); close(); }}
                    className="btn-primary flex-1 py-2.5 text-sm">Sign Up</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
