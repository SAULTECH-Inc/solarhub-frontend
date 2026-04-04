import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { tokenStorage } from '../lib/apiClient';
import { authService } from '../services/auth.service';

export default function AuthCallback() {
  const [sp]  = useSearchParams();
  const nav   = useNavigate();
  const { dispatch, syncCart, syncFavourites, toast } = useApp();

  useEffect(() => {
    const token   = sp.get('token');
    const refresh = sp.get('refreshToken');
    const error   = sp.get('error');

    if (error) { toast('Google login failed: ' + error, 'err'); nav('/'); return; }
    if (!token) { nav('/'); return; }

    tokenStorage.setTokens(token, refresh);
    authService.me()
      .then(res => {
        const user = res?.data ?? res;
        dispatch({ type: 'SET_USER', payload: user });
        syncCart(); syncFavourites();
        toast('Welcome, ' + user.firstName + '! 🎉', 'ok');
        nav('/');
      })
      .catch(() => { tokenStorage.clearTokens(); nav('/'); });
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-solar-accent border-t-transparent rounded-full animate-spin mx-auto"/>
        <div className="font-heading text-sm text-solar-muted">Completing sign in…</div>
      </div>
    </div>
  );
}
