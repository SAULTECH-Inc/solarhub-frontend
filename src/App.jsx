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
      </div>
    </AppProvider>
  );
}
