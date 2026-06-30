import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function AuthModal() {
  const { authModal, dispatch, login, register, loginWithGoogle } = useApp();
  const [mode, setMode] = useState(authModal || 'login');
  const [form, setForm] = useState({ name:'', email:'', pass:'', phone:'' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [otp, setOtp] = useState('');

  if (!authModal) return null;
  const isSignup = mode === 'signup';

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  async function submit() {
    setErr(''); setLoading(true);
    try {
      if (step === 'otp') {
        const { authService } = await import('../services/auth.service');
        await authService.verifyEmail(form.email, otp);
        const r = await login({ email: form.email, password: form.pass });
        if (!r.success) setErr(r.error || 'Login failed');
        return;
      }
      if (isSignup) {
        const r = await register({ firstName: form.name.split(' ')[0], lastName: form.name.split(' ').slice(1).join(' '), email: form.email, password: form.pass, phone: form.phone });
        if (r.success) setStep('otp');
        else setErr(r.error || 'Registration failed');
      } else {
        const r = await login({ email: form.email, password: form.pass });
        if (!r.success) {
          if (r.data?.requiresVerification) {
            setStep('otp');
          } else {
            setErr(r.error || 'Login failed');
          }
        }
      }
    } catch(e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-[300] bg-solar-bg/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={e=>e.target===e.currentTarget&&dispatch({type:'CLOSE_AUTH'})}>
      <div className="bg-solar-card border border-solar-border2 rounded-2xl p-8 w-full max-w-[400px] animate-slide-up">
        <div className="flex justify-between items-start mb-1">
          <h2 className="font-heading text-xl font-bold">
            {step==='otp'?'Verify Email':isSignup?'Create Account':'Welcome Back'}
          </h2>
          <button onClick={()=>dispatch({type:'CLOSE_AUTH'})} className="text-solar-muted hover:text-solar-text bg-solar-surface rounded-lg w-8 h-8 flex items-center justify-center text-lg">✕</button>
        </div>
        <p className="text-solar-muted text-sm mb-5">
          {step==='otp'?`Enter the 6-digit code sent to ${form.email}`:isSignup?'Join thousands of solar buyers & sellers':'Log in to your Solar Maket account'}
        </p>

        {step==='otp'?(
          <div className="flex flex-col gap-4">
            <input className="solar-input text-center text-2xl tracking-widest letter-spacing-8" maxLength={6} placeholder="000000"
              value={otp} onChange={e=>setOtp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/>
            {err&&<div className="text-red-400 text-sm bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">{err}</div>}
            <button onClick={submit} disabled={loading||otp.length<6} className="btn-primary w-full py-3 text-sm">{loading?'Verifying…':'Verify Email'}</button>
            <button onClick={()=>setStep('form')} className="btn-ghost w-full text-sm">← Back</button>
          </div>
        ):(
          <>
            <div className="flex bg-solar-surface rounded-lg p-1 mb-5 gap-1">
              {['login','signup'].map(t=>(
                <button key={t} onClick={()=>{setMode(t);setErr('');}} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode===t?'bg-solar-card2 text-solar-text':'text-solar-muted'}`}>
                  {t==='login'?'Log In':'Sign Up'}
                </button>
              ))}
            </div>
            <button onClick={loginWithGoogle} className="w-full flex items-center justify-center gap-2.5 bg-solar-surface border border-solar-border2 hover:border-solar-blue text-solar-text py-2.5 rounded-lg text-sm font-medium transition-all mb-4">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
            <div className="flex items-center gap-2.5 my-3"><hr className="flex-1 border-solar-border"/><span className="text-solar-dim text-xs">or</span><hr className="flex-1 border-solar-border"/></div>
            <div className="flex flex-col gap-3">
              {isSignup&&<input className="solar-input" placeholder="Full Name" value={form.name} onChange={e=>set('name',e.target.value)}/>}
              <input className="solar-input" type="email" placeholder="Email Address" value={form.email} onChange={e=>set('email',e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/>
              <input className="solar-input" type="password" placeholder="••••••••" value={form.pass} onChange={e=>set('pass',e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/>
              {isSignup&&<input className="solar-input" type="tel" placeholder="+234 xxx xxx xxxx" value={form.phone} onChange={e=>set('phone',e.target.value)}/>}
              {err&&<div className="text-red-400 text-sm bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">{err}</div>}
              <button onClick={submit} disabled={loading} className="btn-primary w-full py-3 text-sm">
                {loading?<span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>Please wait…</span>:isSignup?'Create Account':'Log In'}
              </button>
              <p className="text-center text-xs text-solar-dim">By continuing you agree to Solar Maket's <span className="text-solar-accent cursor-pointer">Terms</span></p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
