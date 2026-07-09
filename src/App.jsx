import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Nav from './components/Nav';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';
import ChatWidget from './components/ChatWidget';
import Toast from './components/Toast';
import { useApp } from './context/AppContext';
import { initPushNotifications, deregisterPushToken } from './lib/notifications';
import { Zap, Sun } from 'lucide-react';

// Capture beforeinstallprompt before React mounts — event fires early in page lifecycle
let _pwaInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _pwaInstallPrompt = e;
});

import Home           from './pages/Home';
import Marketplace    from './pages/Marketplace';
import ProductDetail  from './pages/ProductDetail';
import Advisor        from './pages/Advisor';
import Sell           from './pages/Sell';
import Cart           from './pages/Cart';
import Checkout       from './pages/Checkout';
import Orders         from './pages/Orders';
import Favourites     from './pages/Favourites';
import AuthCallback   from './pages/AuthCallback';
import Engineers      from './pages/Engineers';
import EngineerProfile from './pages/EngineerProfile';
import BecomeEngineer from './pages/BecomeEngineer';
import Profile        from './pages/Profile';
import Messages       from './pages/Messages';
import RequestQuote   from './pages/RequestQuote';
import JobBoard       from './pages/JobBoard';
import MyProjects     from './pages/MyProjects';
import Subscription   from './pages/Subscription';
import TrackingPage   from './pages/TrackingPage';
import SellerProducts     from './pages/SellerProducts';
import BecomeLogistics    from './pages/BecomeLogistics';
import LogisticsDashboard from './pages/LogisticsDashboard';
import LogisticsProviders from './pages/LogisticsProviders';
import Escrow             from './pages/Escrow';

function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = React.useState(null);
  const [show, setShow] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);

  React.useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) return;

    const dismissed = localStorage.getItem('solarhub_install_dismissed_at');
    if (dismissed && Date.now() - Number(dismissed) < 30 * 24 * 60 * 60 * 1000) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    setIsIOS(ios);

    if (ios) {
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }

    // Use prompt captured before React mounted, or wait for it
    if (_pwaInstallPrompt) {
      setDeferredPrompt(_pwaInstallPrompt);
      setShow(true);
      return;
    }

    const handler = (e) => { e.preventDefault(); _pwaInstallPrompt = e; setDeferredPrompt(e); setShow(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') { setDeferredPrompt(null); setShow(false); }
  };

  const handleDismiss = () => {
    localStorage.setItem('solarhub_install_dismissed_at', String(Date.now()));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] max-w-[95vw] md:max-w-[400px] w-full">
      <div className="bg-solar-card border border-solar-accent/50 shadow-[0_0_30px_rgba(245,158,11,0.25)] rounded-2xl px-5 py-4 flex items-center gap-4">
        <div className="w-11 h-11 bg-solar-surface rounded-xl flex items-center justify-center flex-shrink-0 border border-solar-border text-solar-accent">
          <Zap size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-solar-text">Install Solar Maket</div>
          <div className="text-[11px] text-solar-muted mt-0.5 leading-snug">
            {isIOS ? "Tap Share → 'Add to Home Screen'" : 'Faster loads & offline access'}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isIOS && (
            <button onClick={handleInstall} className="btn-primary text-xs py-1.5 px-3 rounded-lg font-bold">
              Install
            </button>
          )}
          <button onClick={handleDismiss} className="text-solar-dim hover:text-solar-text text-xl leading-none px-1">
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

function PushNotificationManager() {
  const { user, toast } = useApp();

  React.useEffect(() => {
    if (!user) return;
    // Small delay so login animation finishes before requesting permission
    const t = setTimeout(() => initPushNotifications(), 2000);
    return () => clearTimeout(t);
  }, [user?.id]);

  // Show in-app toast for foreground push notifications
  React.useEffect(() => {
    function handle(e) {
      const n = e.detail?.notification || e.detail;
      const title = n?.title || n?.data?.title;
      const body  = n?.body  || n?.data?.body;
      if (title || body) toast(`${title ? title + ': ' : ''}${body || ''}`, 'ok');
    }
    window.addEventListener('solarhub:push', handle);
    return () => window.removeEventListener('solarhub:push', handle);
  }, []);

  return null;
}

export default function App() {

  return (
    <AppProvider>
      <div className="min-h-screen bg-solar-bg text-solar-text font-body bg-grid">
        <Nav />
        <main>
          <Routes>
            <Route path="/"                element={<Home />} />
            <Route path="/marketplace"     element={<Marketplace />} />
            <Route path="/product/:id"     element={<ProductDetail />} />
            <Route path="/advisor"         element={<Advisor />} />
            <Route path="/sell"            element={<Sell />} />
            <Route path="/cart"            element={<Cart />} />
            <Route path="/checkout"        element={<Checkout />} />
            <Route path="/orders"          element={<Orders />} />
            <Route path="/orders/:orderId" element={<Orders />} />
            <Route path="/favourites"      element={<Favourites />} />
            <Route path="/auth/callback"   element={<AuthCallback />} />
            <Route path="/engineers"       element={<Engineers />} />
            <Route path="/engineers/:id"   element={<EngineerProfile />} />
            <Route path="/become-engineer" element={<BecomeEngineer />} />
            <Route path="/profile"         element={<Profile />} />
            <Route path="/messages"        element={<Messages />} />
            <Route path="/request-quote"   element={<RequestQuote />} />
            <Route path="/projects"          element={<JobBoard />} />
            <Route path="/my-projects"       element={<MyProjects />} />
            <Route path="/subscription"      element={<Subscription />} />
            <Route path="/subscription/callback" element={<Subscription />} />
            <Route path="/track"             element={<TrackingPage />} />
            <Route path="/track/:code"       element={<TrackingPage />} />
            <Route path="/seller/products"     element={<SellerProducts />} />
            <Route path="/become-logistics"   element={<BecomeLogistics />} />
            <Route path="/logistics/dashboard" element={<LogisticsDashboard />} />
            <Route path="/logistics/providers" element={<LogisticsProviders />} />
            <Route path="/escrow"              element={<Escrow />} />
            <Route path="/escrow/:escrowId"    element={<Escrow />} />
            <Route path="*" element={
              <div className="text-center py-24 text-solar-dim">
                <div className="flex justify-center mb-4"><Sun size={56} className="text-solar-accent opacity-50"/></div>
                <h2 className="font-heading text-lg mb-4">Page not found</h2>
                <a href="/" className="btn-primary">Go Home</a>
              </div>
            } />
          </Routes>
        </main>
        <CartDrawer />
        <AuthModal />
        <ChatWidget />
        <Toast />
        <InstallPwaPrompt />
        <PushNotificationManager />
      </div>
    </AppProvider>
  );
}
