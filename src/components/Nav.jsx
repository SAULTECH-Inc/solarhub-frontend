import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const LINKS = [
  { to:'/', label:'Home' },
  { to:'/marketplace', label:'Marketplace' },
  { to:'/advisor', label:'⚡ Solar Advisor' },
  { to:'/engineers', label:'🔧 Hire Engineer' },
  { to:'/sell', label:'Sell' },
];

export default function Nav() {
  const loc = useLocation();
  const { user, cartCount, dispatch, favourites, unreadNotifications, logout } = useApp();
  const [engOpen, setEngOpen] = useState(false);

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
          <Link to="/favourites" title="Favourites"
            className={`relative w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all
              ${loc.pathname==='/favourites'?'bg-red-500/20 text-red-400':'text-solar-muted hover:bg-solar-surface hover:text-solar-text'}`}>
            ♥
            {favourites.length>0&&<span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">{favourites.length}</span>}
          </Link>
          {user&&(
            <Link to="/orders" title="My Orders"
              className={`relative w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all
                ${loc.pathname==='/orders'?'bg-solar-blue/20 text-solar-blue':'text-solar-muted hover:bg-solar-surface hover:text-solar-text'}`}>
              📦
            </Link>
          )}
          {user&&(
            <Link to="/messages" title="My Messages"
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
            <div className="flex items-center gap-2">
              <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-solar-accent to-solar-orange flex items-center justify-center text-sm font-bold text-black">{user.firstName?.[0]?.toUpperCase()||'U'}</div>
                <span className="text-sm text-solar-muted hidden md:block max-w-[80px] truncate">{user.firstName}</span>
              </Link>
              <button onClick={logout} className="btn-ghost text-xs px-2 py-1.5">Logout</button>
            </div>
          ):(
            <div className="flex gap-2">
              <button onClick={()=>dispatch({type:'OPEN_AUTH',payload:'login'})}  className="btn-outline text-xs py-1.5 px-3">Log In</button>
              <button onClick={()=>dispatch({type:'OPEN_AUTH',payload:'signup'})} className="btn-primary text-xs py-1.5 px-3">Sign Up</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
