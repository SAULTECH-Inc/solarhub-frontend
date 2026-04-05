import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Nav from './components/Nav';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';
import ChatWidget from './components/ChatWidget';
import Toast from './components/Toast';

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

function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = React.useState(null);
  const [show, setShow] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);

  React.useEffect(() => {
    // Hide if already running as a PWA
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      return;
    }
    // Hide if user explicitly dismissed it before
    if (localStorage.getItem('pwa_prompt_dismissed') === 'true') {
      return;
    }

    // iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    if (ios) {
      // iOS doesn't support the event, so we show our manual instructions after 3 seconds
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    } else {
      // Android / Desktop - wait for the native browser permission
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShow(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      alert("To install on iOS: Tap the 'Share' icon at the bottom of Safari, then scroll down and tap 'Add to Home Screen'.");
      return;
    }
    
    if (!deferredPrompt) {
       alert("Your browser is still preparing the app install, please wait a moment or install via your browser's menu (Add to Home screen).");
       return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShow(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] max-w-[95vw] md:max-w-[400px] w-full animate-slide-up">
      <div className="bg-solar-card border border-solar-accent/50 shadow-[0_0_30px_rgba(245,158,11,0.25)] rounded-2xl px-5 py-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-solar-surface rounded-xl flex items-center justify-center flex-shrink-0 text-3xl shadow-inner border border-solar-border2">
          ⚡
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold text-solar-text tracking-wide whitespace-nowrap">Install SolarHub App</div>
          <div className="text-[11px] text-solar-muted leading-relaxed mt-0.5">
            {isIOS ? "Tap Share ↗ then 'Add to Home Screen' to install" : "Install for faster loading & offline marketplace access!"}
          </div>
        </div>
        <div className="flex flex-col gap-2">
           {!isIOS && (
             <button onClick={handleInstall} className="btn-primary text-[11px] py-1.5 px-3 rounded-lg font-bold shadow-md">
               INSTALL
             </button>
           )}
           <button onClick={handleDismiss} className="text-solar-dim hover:text-solar-text text-[10px] uppercase font-semibold tracking-wider">
             Dismiss
           </button>
        </div>
      </div>
    </div>
  );
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
            <Route path="/projects"        element={<JobBoard />} />
            <Route path="/my-projects"     element={<MyProjects />} />
            <Route path="*" element={
              <div className="text-center py-24 text-solar-dim">
                <div className="text-5xl mb-4">🌞</div>
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
      </div>
    </AppProvider>
  );
}
