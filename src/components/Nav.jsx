import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const LINKS = [
  { to:'/', label:'Home' },
  { to:'/marketplace', label:'Marketplace' },
  { to:'/advisor', label:'⚡ Solar Advisor' },
  { to:'/engineers', label:'🔧 Hire Engineer' },
  { to:'/projects', label:'📋 Job Board' },
  { to:'/sell', label:'Sell' },
];

export default function Nav() {
  const loc = useLocation();
  const { user, cartCount, dispatch, favourites, unreadNotifications, logout } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="glass-nav sticky top-0 z-[100] border-b border-solar-border">
      <div className="max-w-[1200px] mx-auto px-5 h-[60px] flex items-center gap-3">
        <Link to="/" className="font-heading font-bold text-[17px] text-solar-accent tracking-wider flex-shrink-0 flex items-center gap-2 mr-3">
          ☀️ <span className="text-solar-text">Solar</span>Hub
        </Link>
        <div className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar">
          {LINKS.map(l => (
            <Link key={l.to} to={l.to}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap transition-all border
                ${loc.pathname === l.to
                  ? 'text-solar-accent bg-solar-accent/10 border-solar-accent/20'
                  : 'text-solar-muted border-transparent hover:bg-solar-surface hover:text-solar-text'}`}>
              {l.label}
            </Link>
          ))}
          {/* Become an Engineer — distinct CTA style */}
          <Link to="/become-engineer"
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap transition-all border flex items-center gap-1.5
              ${loc.pathname === '/become-engineer'
                ? 'text-solar-accent bg-solar-accent/10 border-solar-accent/20'
                : 'text-solar-orange border-solar-orange/30 hover:bg-solar-orange/10'}`}>
            <span className="text-xs">⚡</span>Become Engineer
          </Link>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {user&&(
            <Link to="/messages" title="Messages"
              className={`relative w-9 h-9 rounded-lg flex items-center justify-center text-xl transition-all
                ${loc.pathname==='/messages'?'bg-solar-accent/20 text-solar-accent':'text-solar-muted hover:bg-solar-surface hover:text-solar-text'}`}>
              💬
            </Link>
          )}
          {user&&unreadNotifications>0&&(
            <div className="relative w-9 h-9 rounded-lg flex items-center justify-center text-lg text-solar-muted hover:bg-solar-surface hover:text-solar-text transition-all cursor-default">
              🔔
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-solar-green rounded-full text-[10px] font-bold text-white flex items-center justify-center">{unreadNotifications>9?'9+':unreadNotifications}</span>
            </div>
          )}
          <button onClick={()=>dispatch({type:'TOGGLE_CART'})} className="relative w-9 h-9 rounded-lg flex items-center justify-center text-lg text-solar-muted hover:bg-solar-surface hover:text-solar-text transition-all">
            🛒
            {cartCount>0&&<span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-solar-accent rounded-full text-[10px] font-bold text-black flex items-center justify-center">{cartCount}</span>}
          </button>
          
          {user?(
            <div className="relative ml-1 z-[150]">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)} 
                className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none pl-2 border-l border-solar-border"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-solar-accent to-solar-orange flex items-center justify-center text-sm font-bold text-black">
                  {user.firstName?.[0]?.toUpperCase()||'U'}
                </div>
                <span className="text-sm text-solar-text font-medium hidden md:block max-w-[80px] truncate">{user.firstName}</span>
                <span className="text-solar-dim text-xs hidden md:block">▼</span>
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-56 bg-solar-card border border-solar-border2 rounded-xl shadow-2xl py-2 z-50 animate-slide-up origin-top-right">
                    <div className="px-4 py-2.5 border-b border-solar-border mb-1 bg-solar-surface/30">
                      <div className="font-heading font-semibold text-sm truncate text-solar-text">{user.firstName} {user.lastName}</div>
                      <div className="text-[11px] text-solar-dim truncate">{user.email}</div>
                    </div>
                    
                    <Link to="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-solar-text hover:bg-solar-surface transition-colors flex items-center gap-2">
                      <span className="opacity-70 text-lg">👤</span> Profile & Settings
                    </Link>
                    <Link to="/orders" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-solar-text hover:bg-solar-surface transition-colors flex items-center gap-2">
                      <span className="opacity-70 text-lg">📦</span> My Orders
                    </Link>
                    <Link to="/my-projects" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-solar-text hover:bg-solar-surface transition-colors flex items-center gap-2">
                      <span className="opacity-70 text-lg">📝</span> My Projects
                    </Link>
                    <Link to="/favourites" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-solar-text hover:bg-solar-surface transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="opacity-70 text-lg">♥</span> Favourites</div>
                      {favourites.length > 0 && <span className="bg-red-500/20 text-red-500 border border-red-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{favourites.length}</span>}
                    </Link>
                    
                    <div className="h-px bg-solar-border my-1.5"></div>
                    
                    <button onClick={() => { logout(); setDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 font-medium">
                      <span className="opacity-70 text-lg">🚪</span> Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ):(
            <div className="flex gap-2 ml-1 border-l border-solar-border pl-3">
              <button onClick={()=>dispatch({type:'OPEN_AUTH',payload:'login'})}  className="btn-outline text-xs py-1.5 px-3">Log In</button>
              <button onClick={()=>dispatch({type:'OPEN_AUTH',payload:'signup'})} className="btn-primary text-xs py-1.5 px-3">Sign Up</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
