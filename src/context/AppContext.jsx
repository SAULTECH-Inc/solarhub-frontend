import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { cartService, ordersService } from '../services/commerce.service';
import { favouritesService, notificationsService } from '../services/index';
import { tokenStorage } from '../lib/apiClient';
import { connectSocket, disconnectSocket } from '../lib/socket';

const Ctx = createContext(null);

export const ORDER_STEPS = [
  { status: 'pending',       label: 'Order Placed'      },
  { status: 'confirmed',     label: 'Payment Confirmed' },
  { status: 'processing',    label: 'Processing'        },
  { status: 'dispatched',    label: 'Dispatched'        },
  { status: 'in_transit',    label: 'In Transit'        },
  { status: 'out_delivery',  label: 'Out for Delivery'  },
  { status: 'delivered',     label: 'Delivered'         },
];

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':         return { ...state, user: action.payload, authLoading: false };
    case 'SET_AUTH_LOADING': return { ...state, authLoading: action.payload };
    case 'LOGOUT':           return { ...state, user: null, cart: { items: [], itemCount: 0, subtotal: 0 }, favourites: [], orders: [] };
    case 'SET_CART':         return { ...state, cart: action.payload };
    case 'SET_CART_OPEN':    return { ...state, cartOpen: action.payload };
    case 'TOGGLE_CART':      return { ...state, cartOpen: !state.cartOpen };
    case 'SET_FAVOURITES':   return { ...state, favourites: action.payload };
    case 'TOGGLE_FAV_LOCAL': {
      const has = state.favourites.includes(action.payload);
      return { ...state, favourites: has ? state.favourites.filter(id => id !== action.payload) : [...state.favourites, action.payload] };
    }
    case 'SET_ORDERS':       return { ...state, orders: action.payload };
    case 'ADD_ORDER':        return { ...state, orders: [action.payload, ...state.orders] };
    case 'TOGGLE_CHAT':      return { ...state, chatOpen: !state.chatOpen };
    case 'SET_CHAT':         return { ...state, chatOpen: action.payload };
    case 'OPEN_AUTH':        return { ...state, authModal: action.payload };
    case 'CLOSE_AUTH':       return { ...state, authModal: null };
    case 'SET_TOAST':        return { ...state, toast: action.payload };
    case 'CLEAR_TOAST':      return { ...state, toast: null };
    case 'SET_NOTIF_COUNT':  return { ...state, unreadNotifications: action.payload };
    default: return state;
  }
}

const INIT = {
  user: null, authLoading: true,
  cart: { items: [], itemCount: 0, subtotal: 0, currency: 'NGN' },
  favourites: [], orders: [],
  cartOpen: false, chatOpen: false,
  authModal: null, toast: null, unreadNotifications: 0,
};

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INIT);

  const toast = useCallback((msg, type = '') => {
    dispatch({ type: 'SET_TOAST', payload: { msg, type } });
    setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 3600);
  }, []);

  const syncCart = useCallback(async () => {
    try { const res = await cartService.get(); dispatch({ type: 'SET_CART', payload: res?.data ?? res }); } catch {}
  }, []);

  const syncFavourites = useCallback(async () => {
    try { const res = await favouritesService.getIds(); dispatch({ type: 'SET_FAVOURITES', payload: res?.data ?? res }); } catch {}
  }, []);

  const syncNotifications = useCallback(async () => {
    try { const res = await notificationsService.getUnread(); dispatch({ type: 'SET_NOTIF_COUNT', payload: (res?.data ?? res)?.count ?? 0 }); } catch {}
  }, []);

  // Decode a JWT and return its payload (no verification — backend does that)
  const decodeToken = (token) => {
    try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
  };

  // Silently expire the session and prompt re-login
  const expireSession = useCallback(() => {
    tokenStorage.clearTokens();
    disconnectSocket();
    dispatch({ type: 'LOGOUT' });
    dispatch({ type: 'OPEN_AUTH', payload: 'login' });
    toast('Your session has expired. Please log in again.', 'err');
  }, [toast]);

  // Validate the current access token; trigger expireSession if it can't be renewed
  const validateSession = useCallback(async () => {
    const token = tokenStorage.getAccess();
    if (!token) return;
    try { await authService.me(); }
    catch { expireSession(); }
  }, [expireSession]);

  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (!token) { dispatch({ type: 'SET_AUTH_LOADING', payload: false }); return; }

    let expiryTimer = null;

    authService.me()
      .then(res => {
        dispatch({ type: 'SET_USER', payload: res?.data ?? res });
        syncCart(); syncFavourites(); syncNotifications(); connectSocket();

        // Schedule a proactive session check ~1 min before the access token expires
        const payload = decodeToken(tokenStorage.getAccess());
        if (payload?.exp) {
          const msUntilExpiry = payload.exp * 1000 - Date.now();
          const delay = msUntilExpiry - 60_000; // 1 min before expiry
          if (delay > 0) expiryTimer = setTimeout(validateSession, delay);
        }
      })
      .catch(() => { tokenStorage.clearTokens(); dispatch({ type: 'SET_AUTH_LOADING', payload: false }); });

    // Listen for forced logout from the axios interceptor (refresh token expired)
    const handleExpired = () => expireSession();
    window.addEventListener('auth:expired', handleExpired);

    // Re-check session when user returns to the tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') validateSession();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(expiryTimer);
      window.removeEventListener('auth:expired', handleExpired);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      const res = await authService.login(credentials);
      const { accessToken, refreshToken, user } = res?.data ?? res;
      tokenStorage.setTokens(accessToken, refreshToken);
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'CLOSE_AUTH' });
      await syncCart(); await syncFavourites(); await syncNotifications(); connectSocket();
      toast('Welcome back, ' + user.firstName + '!', 'ok');
      return { success: true };
    } catch (e) { return { success: false, error: e.message, data: e.data }; }
  }, [toast, syncCart, syncFavourites, syncNotifications]);

  const register = useCallback(async (dto) => {
    try { const res = await authService.register(dto); return { success: true, message: (res?.data ?? res)?.message }; }
    catch (e) { return { success: false, error: e.message }; }
  }, []);

  const loginWithGoogle = useCallback(() => { window.location.href = authService.googleLoginUrl(); }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch {}
    tokenStorage.clearTokens(); disconnectSocket();
    dispatch({ type: 'LOGOUT' }); toast('Logged out successfully');
  }, [toast]);

  const addToCart = useCallback(async (product) => {
    if (!state.user) { dispatch({ type: 'OPEN_AUTH', payload: 'login' }); return; }
    try {
      const res = await cartService.add(product.id, 1);
      dispatch({ type: 'SET_CART', payload: res?.data ?? res });
      dispatch({ type: 'SET_CART_OPEN', payload: true });
      toast(product.name.slice(0, 30) + '... added to cart');
    } catch (e) { toast(e.message, 'err'); }
  }, [state.user, toast]);

  const updateCartQty = useCallback(async (itemId, qty) => {
    try { const res = await cartService.updateQty(itemId, qty); dispatch({ type: 'SET_CART', payload: res?.data ?? res }); }
    catch (e) { toast(e.message, 'err'); }
  }, [toast]);

  const removeFromCart = useCallback(async (itemId) => {
    try { const res = await cartService.remove(itemId); dispatch({ type: 'SET_CART', payload: res?.data ?? res }); }
    catch (e) { toast(e.message, 'err'); }
  }, [toast]);

  const clearCart = useCallback(async () => {
    try { await cartService.clear(); dispatch({ type: 'SET_CART', payload: { items: [], itemCount: 0, subtotal: 0, currency: 'NGN' } }); } catch {}
  }, []);

  const toggleFavourite = useCallback(async (productId) => {
    if (!state.user) { dispatch({ type: 'OPEN_AUTH', payload: 'login' }); return; }
    dispatch({ type: 'TOGGLE_FAV_LOCAL', payload: productId });
    try { await favouritesService.toggle(productId); }
    catch { dispatch({ type: 'TOGGLE_FAV_LOCAL', payload: productId }); }
  }, [state.user]);

  const placeOrder = useCallback(async (dto) => {
    try {
      const res = await ordersService.place(dto);
      const order = res?.data ?? res;
      dispatch({ type: 'ADD_ORDER', payload: order });
      await clearCart();
      toast('Order placed successfully!', 'ok');
      return { success: true, order };
    } catch (e) { toast(e.message, 'err'); return { success: false, error: e.message }; }
  }, [clearCart, toast]);

  const ctx = {
    ...state, dispatch, toast,
    login, register, loginWithGoogle, logout,
    addToCart, updateCartQty, removeFromCart, clearCart,
    toggleFavourite, placeOrder,
    syncCart, syncFavourites, syncNotifications,
    cartTotal: state.cart?.subtotal || 0,
    cartCount: state.cart?.itemCount || 0,
  };

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export const useApp = () => useContext(Ctx);
