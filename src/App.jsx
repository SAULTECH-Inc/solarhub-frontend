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

  React.useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShow(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] max-w-[90vw] animate-slide-up">
      <div className="bg-solar-card border border-solar-accent/50 shadow-[0_0_20px_rgba(245,158,11,0.2)] rounded-full px-5 py-2.5 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-solar-text whitespace-nowrap">Install SolarHub App</div>
          <div className="text-[10px] text-solar-dim leading-tight">Faster loading & offline access</div>
        </div>
        <button onClick={handleInstall} className="btn-primary text-xs py-1.5 px-4 rounded-full whitespace-nowrap">
          Install Now
        </button>
        <button onClick={() => setShow(false)} className="text-solar-muted hover:text-solar-text text-lg leading-none" aria-label="Close">
          &times;
        </button>
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
