import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, Package, ShoppingCart,
  Activity, Search, Menu, X, LogOut, ChevronRight,
} from 'lucide-react';

const NAV = [
  { to: '/admin',          label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users',    label: 'Users',     icon: Users },
  { to: '/admin/products', label: 'Products',  icon: Package },
  { to: '/admin/orders',   label: 'Orders',    icon: ShoppingCart },
  { to: '/admin/health',   label: 'System',    icon: Activity },
];

export default function AdminLayout() {
  const { user, authLoading } = useApp();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-solar-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-solar-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-solar-bg flex">
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-solar-surface border-r border-solar-border z-30
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-solar-border">
          <div>
            <span className="font-heading font-bold text-solar-accent text-lg">Solar Maket</span>
            <p className="text-[10px] text-solar-dim uppercase tracking-widest mt-0.5">Admin Panel</p>
          </div>
          <button className="lg:hidden text-solar-muted" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-solar-accent/10 text-solar-accent'
                  : 'text-solar-muted hover:bg-solar-card hover:text-solar-text'
                }`
              }
            >
              <Icon size={17} />
              {label}
              <ChevronRight size={13} className="ml-auto opacity-40" />
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-solar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-solar-accent/20 flex items-center justify-center text-solar-accent text-xs font-bold">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-solar-text truncate">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] text-solar-dim truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs text-solar-muted hover:text-solar-red transition-colors w-full"
          >
            <LogOut size={13} /> Back to site
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-solar-surface border-b border-solar-border px-4 py-3 flex items-center gap-3">
          <button
            className="lg:hidden text-solar-muted p-1"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <span className="font-heading text-sm font-bold text-solar-text">Admin</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-solar-dim hidden sm:block">{user.email}</span>
            <span className="px-2 py-0.5 bg-solar-accent/10 text-solar-accent text-[10px] font-bold rounded uppercase tracking-wide">
              Admin
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
