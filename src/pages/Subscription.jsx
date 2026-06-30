import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { subscriptionsService } from '../services/index';
import { sellerProductsService } from '../services/commerce.service';
import { useApp } from '../context/AppContext';

const CURRENCY_OPTIONS = [
  { value: 'NGN', label: '₦ NGN' },
  { value: 'USD', label: '$ USD' },
];

const TIER_ORDER = ['free', 'basic', 'pro', 'pro_engineer', 'enterprise'];

export default function Subscription() {
  const { user, toast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [plans, setPlans] = useState([]);
  const [quota, setQuota] = useState(null);
  const [currency, setCurrency] = useState('NGN');
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null); // plan key being processed

  // Verify callback after Paystack redirects back
  useEffect(() => {
    const ref = searchParams.get('reference') || searchParams.get('trxref');
    if (!ref) return;
    subscriptionsService.verifyPaystack(ref)
      .then(() => { toast('Subscription activated! Welcome to your new plan.', 'ok'); navigate('/subscription', { replace: true }); })
      .catch(() => toast('Payment verification failed. Contact support if you were charged.', 'err'));
  }, []);

  useEffect(() => {
    Promise.all([
      subscriptionsService.getPlans(),
      user?.isSeller ? sellerProductsService.getQuota() : Promise.resolve(null),
    ])
      .then(([p, q]) => {
        const plansArr = Array.isArray(p) ? p : (p?.data ?? []);
        const sorted = plansArr.sort((a, b) => TIER_ORDER.indexOf(a.key) - TIER_ORDER.indexOf(b.key));
        setPlans(sorted);
        setQuota(q?.data ?? q);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSubscribe = async (plan) => {
    if (!user) { toast('Please log in to subscribe', 'err'); return; }
    setSubscribing(plan);
    try {
      const res = await subscriptionsService.subscribe(plan, currency);
      const payload = res?.data ?? res;
      if (payload.paymentUrl) window.location.href = payload.paymentUrl;
    } catch (e) {
      toast(e.message, 'err');
    } finally {
      setSubscribing(null);
    }
  };

  const currentTier = user?.subscriptionTier || 'free';
  const currentStatus = user?.subscriptionStatus || 'none';

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#888' }}>Loading plans…</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Choose Your Plan</h1>
        <p style={{ color: '#666', fontSize: 16 }}>
          List your solar products and reach thousands of buyers across Nigeria
        </p>

        {/* Currency toggle */}
        <div style={{ display: 'inline-flex', gap: 4, background: '#f1f5f9', borderRadius: 8, padding: 4, marginTop: 20 }}>
          {CURRENCY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setCurrency(opt.value)}
              style={{
                padding: '6px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: currency === opt.value ? '#16a34a' : 'transparent',
                color: currency === opt.value ? '#fff' : '#444',
                fontWeight: 600, fontSize: 14, transition: 'all .15s',
              }}
            >{opt.label}</button>
          ))}
        </div>
      </div>

      {/* Current plan banner */}
      {user?.isSeller && quota && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
          padding: '16px 20px', marginBottom: 32, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <span style={{ fontWeight: 600, color: '#15803d' }}>Current plan: </span>
            <span style={{ textTransform: 'capitalize' }}>{currentTier}</span>
            {currentStatus === 'trialing' && <span style={{ marginLeft: 8, background: '#fef08a', color: '#854d0e', borderRadius: 4, padding: '2px 8px', fontSize: 12 }}>Trial</span>}
            {currentStatus === 'canceled' && <span style={{ marginLeft: 8, background: '#fee2e2', color: '#991b1b', borderRadius: 4, padding: '2px 8px', fontSize: 12 }}>Cancelled</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#555', fontSize: 14 }}>
              {quota.used} / {quota.limit ?? '∞'} listings used
            </span>
            {quota.limit && (
              <div style={{ width: 120, height: 8, background: '#dcfce7', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${Math.min(100, (quota.used / quota.limit) * 100)}%`,
                  background: quota.used >= quota.limit ? '#ef4444' : '#16a34a',
                }} />
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/subscription/invoices')}
            style={{ fontSize: 13, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >View invoices</button>
        </div>
      )}

      {/* Plans grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 20 }}>
        {plans.map(plan => {
          const isCurrent = plan.key === currentTier;
          const isPopular = plan.key === 'pro';
          const price = currency === 'NGN' ? plan.priceNGN : plan.priceUSD;
          const symbol = currency === 'NGN' ? '₦' : '$';
          const isProcessing = subscribing === plan.key;

          return (
            <div key={plan.key} style={{
              border: isCurrent ? '2px solid #16a34a' : isPopular ? '2px solid #f59e0b' : '1px solid #e2e8f0',
              borderRadius: 16, padding: 24, position: 'relative',
              background: isCurrent ? '#f0fdf4' : '#fff',
              boxShadow: isPopular ? '0 4px 20px rgba(245,158,11,.15)' : '0 1px 4px rgba(0,0,0,.05)',
            }}>
              {isPopular && (
                <span style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: '#f59e0b', color: '#fff', borderRadius: 20, padding: '3px 14px', fontSize: 12, fontWeight: 700,
                }}>Most Popular</span>
              )}
              {isCurrent && (
                <span style={{
                  position: 'absolute', top: -12, right: 16,
                  background: '#16a34a', color: '#fff', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700,
                }}>Current</span>
              )}

              <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{plan.name}</h3>
              <div style={{ marginBottom: 16 }}>
                {price === 0 ? (
                  <span style={{ fontSize: 28, fontWeight: 800 }}>Free</span>
                ) : (
                  <>
                    <span style={{ fontSize: 28, fontWeight: 800 }}>{symbol}{price.toLocaleString()}</span>
                    <span style={{ color: '#888', fontSize: 13 }}>/mo</span>
                  </>
                )}
              </div>

              <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  {plan.listingLimit === null ? 'Unlimited' : plan.listingLimit} listings
                </span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', fontSize: 13, color: '#444' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ marginBottom: 6, display: 'flex', gap: 6 }}>
                    <span style={{ color: '#16a34a', flexShrink: 0 }}>✓</span> {f}
                  </li>
                ))}
              </ul>

              {plan.key === 'free' ? (
                <button disabled style={{
                  width: '100%', padding: '10px 0', borderRadius: 8, border: '1px solid #e2e8f0',
                  background: '#f8fafc', color: '#aaa', cursor: 'not-allowed', fontWeight: 600,
                }}>Free forever</button>
              ) : isCurrent ? (
                <button disabled style={{
                  width: '100%', padding: '10px 0', borderRadius: 8, border: '2px solid #16a34a',
                  background: '#f0fdf4', color: '#16a34a', cursor: 'not-allowed', fontWeight: 600,
                }}>Active plan</button>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={!!subscribing}
                  style={{
                    width: '100%', padding: '10px 0', borderRadius: 8, border: 'none',
                    background: isPopular ? '#f59e0b' : '#16a34a',
                    color: '#fff', cursor: subscribing ? 'not-allowed' : 'pointer',
                    fontWeight: 700, fontSize: 14, opacity: subscribing && !isProcessing ? .6 : 1,
                  }}
                >
                  {isProcessing ? 'Redirecting…' : `Subscribe — ${symbol}${price.toLocaleString()}/mo`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ textAlign: 'center', color: '#888', fontSize: 13, marginTop: 32 }}>
        Payments are processed securely via Paystack (NGN) or Stripe (USD). Cancel anytime.
      </p>
    </div>
  );
}
