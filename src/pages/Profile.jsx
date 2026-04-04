import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { usersService, engineersService } from '../services/index';
import MediaUploader from '../components/MediaUploader';

const STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

const TABS = [
  { id: 'profile',       icon: '👤', label: 'My Profile' },
  { id: 'seller',        icon: '🏪', label: 'Seller Profile' },
  { id: 'engineer',      icon: '⚡', label: 'Engineer Profile' },
  { id: 'billing',       icon: '💳', label: 'Billing & Subscriptions' },
  { id: 'notifications', icon: '🔔', label: 'Notifications' },
  { id: 'security',      icon: '🔒', label: 'Security' },
];

function F({ label, req, children, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-solar-muted">
        {label}{req && <span className="text-solar-accent ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-solar-dim">{hint}</p>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="section-card p-6 space-y-5">
      <div className="font-heading text-xs font-semibold text-solar-accent uppercase tracking-widest border-b border-solar-border pb-3">{title}</div>
      {children}
    </div>
  );
}

export default function Profile() {
  const { user, dispatch, toast } = useApp();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [engineerProfile, setEngineerProfile] = useState(null);
  const [engLoading, setEngLoading] = useState(false);

  // Personal profile form
  const [profile, setProfile] = useState({
    firstName: '', lastName: '', phone: '', avatar: '',
  });
  const [notifPrefs, setNotifPrefs] = useState({ email: true, sms: true, push: true });

  // Seller profile form
  const [seller, setSeller] = useState({
    storeName: '', storeDescription: '', storeAddress: '', storeCity: '',
    storeState: '', businessType: '', businessRegNumber: '', taxId: '',
    storeBanner: '', nin: '', govtIdType: 'NIN', govtIdUrl: '',
  });

  // Password change
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });

  // Populate forms from user
  useEffect(() => {
    if (!user) return;
    setProfile({
      firstName: user.firstName || '',
      lastName:  user.lastName  || '',
      phone:     user.phone     || '',
      avatar:    user.avatar    || '',
    });
    setNotifPrefs(user.notificationPrefs || { email: true, sms: true, push: true });
    setSeller({
      storeName:         user.storeName         || '',
      storeDescription:  user.storeDescription  || '',
      storeAddress:      user.storeAddress       || '',
      storeCity:         user.storeCity          || '',
      storeState:        user.storeState         || '',
      businessType:      user.businessType       || '',
      businessRegNumber: user.businessRegNumber  || '',
      taxId:             user.taxId              || '',
      storeBanner:       user.storeBanner        || '',
      nin:               user.nin                || '',
      govtIdType:        user.govtIdType         || 'NIN',
      govtIdUrl:         user.govtIdUrl          || '',
    });
  }, [user]);

  // Load engineer profile when tab is active
  useEffect(() => {
    if (activeTab !== 'engineer' || !user?.isEngineer) return;
    setEngLoading(true);
    engineersService.getMyProfile()
      .then(r => setEngineerProfile(r?.data ?? r))
      .catch(() => {})
      .finally(() => setEngLoading(false));
  }, [activeTab, user]);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center">
        <div className="text-5xl mb-4">👤</div>
        <h1 className="font-heading text-xl font-bold mb-3">Sign in to view your profile</h1>
        <div className="flex gap-3 justify-center">
          <button onClick={() => dispatch({ type:'OPEN_AUTH', payload:'login' })} className="btn-primary">Log In</button>
          <button onClick={() => dispatch({ type:'OPEN_AUTH', payload:'signup' })} className="btn-outline">Sign Up</button>
        </div>
      </div>
    );
  }

  // ── Save handlers ──────────────────────────────────────────
  async function saveProfile() {
    setSaving(true);
    try {
      const res = await usersService.updateProfile(profile);
      dispatch({ type: 'SET_USER', payload: res?.data ?? res });
      toast('Profile updated ✅', 'ok');
    } catch(e) {
      toast(e.response?.data?.message || 'Save failed', 'err');
    } finally { setSaving(false); }
  }

  async function saveNotifications() {
    setSaving(true);
    try {
      const res = await usersService.updateProfile({ notificationPrefs: notifPrefs });
      dispatch({ type: 'SET_USER', payload: res?.data ?? res });
      toast('Notification preferences saved ✅', 'ok');
    } catch(e) {
      toast(e.response?.data?.message || 'Save failed', 'err');
    } finally { setSaving(false); }
  }

  async function saveSellerProfile() {
    setSaving(true);
    try {
      const res = await usersService.updateSeller(seller);
      dispatch({ type: 'SET_USER', payload: res?.data ?? res });
      toast('Seller profile updated ✅', 'ok');
    } catch(e) {
      toast(e.response?.data?.message || 'Save failed', 'err');
    } finally { setSaving(false); }
  }

  async function changePassword() {
    if (pwForm.newPassword !== pwForm.confirm) { toast('Passwords do not match', 'err'); return; }
    if (pwForm.newPassword.length < 8) { toast('Password must be at least 8 characters', 'err'); return; }
    setSaving(true);
    try {
      await usersService.updateProfile({ password: pwForm.newPassword }); // use auth service in real app
      setPwForm({ oldPassword: '', newPassword: '', confirm: '' });
      toast('Password changed successfully ✅', 'ok');
    } catch(e) {
      toast(e.response?.data?.message || 'Failed to change password', 'err');
    } finally { setSaving(false); }
  }

  const avatarInitial = user.firstName?.[0]?.toUpperCase() || 'U';

  return (
    <div className="max-w-[1100px] mx-auto px-5 py-10">
      {/* Header */}
      <div className="flex items-center gap-5 mb-8 section-card p-6">
        {user.avatar ? (
          <img src={user.avatar} alt={user.firstName}
            className="w-16 h-16 rounded-full object-cover border-2 border-solar-accent/30" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-solar-accent to-solar-orange
                          flex items-center justify-center text-2xl font-bold text-black">
            {avatarInitial}
          </div>
        )}
        <div className="flex-1">
          <h1 className="font-heading text-xl font-bold text-solar-text">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-solar-muted text-sm">{user.email}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {user.isSeller    && <span className="bg-solar-accent/10 text-solar-accent text-[10px] font-medium px-2 py-0.5 rounded-full border border-solar-accent/25">🏪 Seller</span>}
            {user.isEngineer  && <span className="bg-blue-500/10 text-blue-400 text-[10px] font-medium px-2 py-0.5 rounded-full border border-blue-500/25">⚡ Engineer</span>}
            <span className="bg-solar-surface text-solar-dim text-[10px] font-medium px-2 py-0.5 rounded-full border border-solar-border capitalize">🛒 {user.role}</span>
          </div>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-xs text-solar-dim">Member since</div>
          <div className="text-sm font-medium text-solar-text">
            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '—'}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        {/* Sidebar tabs */}
        <aside>
          <nav className="section-card p-2 space-y-0.5">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 transition-all ${
                  activeTab === t.id
                    ? 'bg-solar-accent/10 text-solar-accent border border-solar-accent/20'
                    : 'text-solar-muted hover:bg-solar-surface hover:text-solar-text'
                }`}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content panels */}
        <div className="space-y-5">

          {/* ── My Profile ─────────────────────────────────── */}
          {activeTab === 'profile' && (
            <>
              <Section title="Personal Information">
                <div className="grid grid-cols-2 gap-4">
                  <F label="First Name" req>
                    <input className="solar-input" value={profile.firstName}
                      onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} />
                  </F>
                  <F label="Last Name">
                    <input className="solar-input" value={profile.lastName}
                      onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} />
                  </F>
                  <F label="Phone Number">
                    <input className="solar-input" placeholder="+234 800 000 0000"
                      value={profile.phone}
                      onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                  </F>
                  <div className="col-span-2 mt-2 border-t border-solar-border pt-4">
                    <MediaUploader 
                      avatarMode 
                      value={profile.avatar ? [{ url: profile.avatar, resourceType: 'image' }] : []} 
                      onChange={v => setProfile(p => ({ ...p, avatar: v[0]?.url || '' }))} 
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
                    {saving && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </Section>

              <Section title="Account Info">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-solar-muted mb-1">Email</div>
                    <div className="text-sm text-solar-text font-medium">{user.email}</div>
                    <div className={`text-[10px] mt-0.5 ${user.emailVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                      {user.emailVerified ? '✓ Verified' : '⚠ Not verified'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-solar-muted mb-1">Account Status</div>
                    <div className={`text-sm font-medium capitalize ${
                      user.status === 'active' ? 'text-green-400' : 'text-yellow-400'
                    }`}>{user.status}</div>
                  </div>
                </div>
              </Section>
            </>
          )}

          {/* ── Seller Profile ─────────────────────────────── */}
          {activeTab === 'seller' && (
            user.isSeller ? (
              <>
                <Section title="Store & Business Details">
                  <div className="grid grid-cols-2 gap-4">
                    <F label="Store / Company Name" req>
                      <input className="solar-input" value={seller.storeName}
                        onChange={e => setSeller(s => ({ ...s, storeName: e.target.value }))} />
                    </F>
                    <F label="Business Type">
                      <select className="solar-input" value={seller.businessType}
                        onChange={e => setSeller(s => ({ ...s, businessType: e.target.value }))}>
                        <option>Sole Proprietorship</option>
                        <option>Partnership</option>
                        <option>Limited Liability Company (LLC)</option>
                        <option>NGO / Non-Profit</option>
                        <option>Other</option>
                      </select>
                    </F>
                    <F label="Business Registration Number">
                      <input className="solar-input" value={seller.businessRegNumber}
                        onChange={e => setSeller(s => ({ ...s, businessRegNumber: e.target.value }))} />
                    </F>
                    <F label="Tax ID (TIN)">
                      <input className="solar-input" value={seller.taxId}
                        onChange={e => setSeller(s => ({ ...s, taxId: e.target.value }))} />
                    </F>
                    <F label="Store Description">
                      <textarea className="solar-input col-span-2" rows={3} value={seller.storeDescription}
                        onChange={e => setSeller(s => ({ ...s, storeDescription: e.target.value }))} />
                    </F>
                    <div className="col-span-2 mt-2 border-t border-solar-border pt-4">
                      <MediaUploader 
                        label="Store Banner / Logo (Max 1)"
                        maxFiles={1}
                        folder="sellers"
                        value={seller.storeBanner ? [{ url: seller.storeBanner, resourceType: 'image' }] : []} 
                        onChange={v => setSeller(s => ({ ...s, storeBanner: v[0]?.url || '' }))} 
                      />
                    </div>
                  </div>
                </Section>

                <Section title="Business Address">
                  <div className="grid grid-cols-2 gap-4">
                    <F label="Street Address">
                      <input className="solar-input col-span-2" value={seller.storeAddress}
                        onChange={e => setSeller(s => ({ ...s, storeAddress: e.target.value }))} />
                    </F>
                    <F label="City">
                      <input className="solar-input" value={seller.storeCity}
                        onChange={e => setSeller(s => ({ ...s, storeCity: e.target.value }))} />
                    </F>
                    <F label="State">
                      <select className="solar-input" value={seller.storeState}
                        onChange={e => setSeller(s => ({ ...s, storeState: e.target.value }))}>
                        <option value="">Select state…</option>
                        {STATES.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </F>
                  </div>
                </Section>

                <Section title="Identity (KYC)">
                  <div className="bg-solar-accent/5 border border-solar-accent/20 rounded-xl p-3 text-xs text-solar-muted flex gap-2">
                    🔒 Your NIN/ID details are stored securely and never shown publicly.
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <F label="ID Type">
                      <select className="solar-input" value={seller.govtIdType}
                        onChange={e => setSeller(s => ({ ...s, govtIdType: e.target.value }))}>
                        <option value="NIN">NIN</option>
                        <option value="BVN">BVN</option>
                        <option value="Passport">Passport</option>
                        <option value="Driver's Licence">Driver's Licence</option>
                        <option value="Voter Card">Voter's Card</option>
                      </select>
                    </F>
                    <F label="ID Number">
                      <input className="solar-input font-mono" value={seller.nin}
                        onChange={e => setSeller(s => ({ ...s, nin: e.target.value }))} />
                    </F>
                  </div>
                </Section>

                <div className="flex justify-end">
                  <button onClick={saveSellerProfile} disabled={saving} className="btn-primary flex items-center gap-2">
                    {saving && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                    {saving ? 'Saving…' : 'Save Seller Profile'}
                  </button>
                </div>
              </>
            ) : (
              <div className="section-card p-10 text-center">
                <div className="text-5xl mb-4">🏪</div>
                <h2 className="font-heading text-lg font-bold mb-2">You're not a seller yet</h2>
                <p className="text-solar-muted text-sm mb-6">Set up your seller profile to start listing solar products.</p>
                <a href="/sell" className="btn-primary">Set Up Seller Profile →</a>
              </div>
            )
          )}

          {/* ── Engineer Profile ───────────────────────────── */}
          {activeTab === 'engineer' && (
            user.isEngineer ? (
              engLoading ? (
                <div className="section-card p-10 text-center">
                  <div className="w-8 h-8 border-2 border-solar-accent/30 border-t-solar-accent rounded-full animate-spin mx-auto" />
                </div>
              ) : engineerProfile ? (
                <Section title="Your Engineer Profile">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-solar-muted text-xs">Full Name</span><div className="font-medium mt-0.5">{engineerProfile.fullName}</div></div>
                    <div><span className="text-solar-muted text-xs">Location</span><div className="font-medium mt-0.5">{engineerProfile.city}, {engineerProfile.state}</div></div>
                    <div><span className="text-solar-muted text-xs">Experience</span><div className="font-medium mt-0.5">{engineerProfile.yearsOfExperience} years</div></div>
                    <div><span className="text-solar-muted text-xs">Jobs Done</span><div className="font-medium mt-0.5">{engineerProfile.completedJobs}</div></div>
                    <div><span className="text-solar-muted text-xs">Rating</span><div className="font-medium mt-0.5">{'★'.repeat(Math.round(engineerProfile.averageRating || 0))} ({engineerProfile.reviewCount})</div></div>
                    <div><span className="text-solar-muted text-xs">Status</span>
                      <div className={`font-medium mt-0.5 capitalize ${engineerProfile.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                        {engineerProfile.isVerified ? '✓ Verified · ' : ''}{engineerProfile.status}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(engineerProfile.specializations || []).map(s => (
                      <span key={s} className="bg-solar-accent/10 text-solar-accent border border-solar-accent/25 rounded-full px-2.5 py-0.5 text-xs">{s}</span>
                    ))}
                  </div>
                  <a href={`/engineers/${engineerProfile.id}`} className="btn-outline text-sm inline-flex mt-2">View Public Profile →</a>
                </Section>
              ) : null
            ) : (
              <div className="section-card p-10 text-center">
                <div className="text-5xl mb-4">⚡</div>
                <h2 className="font-heading text-lg font-bold mb-2">Register as an Engineer</h2>
                <p className="text-solar-muted text-sm mb-6">Join Nigeria's solar engineer marketplace and get hired for installations.</p>
                <a href="/become-engineer" className="btn-primary">Become an Engineer →</a>
              </div>
            )
          )}

          {/* ── Billing & Subscriptions ────────────────────── */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <Section title="Subscription Plan">
                {user.subscriptionStatus === 'trialing' && (
                  <div className="bg-solar-accent/10 border border-solar-accent/20 rounded-xl p-5 mb-4">
                    <h3 className="font-heading font-bold text-solar-text flex items-center gap-2 text-lg">
                      <span className="text-solar-accent">⚡</span> Free Trial Active
                    </h3>
                    <p className="text-sm text-solar-muted mt-2">
                      You are currently on a 30-day free trial. Your trial expires on{' '}
                      <span className="font-semibold text-solar-text">
                        {new Date(user.trialEndsAt).toLocaleDateString()}
                      </span>.
                    </p>
                    {new Date() > new Date(user.trialEndsAt) && (
                      <div className="mt-3 text-red-400 text-sm font-medium">⚠️ Your trial has expired. Upgrade your plan to continue selling.</div>
                    )}
                  </div>
                )}
                
                {user.subscriptionStatus === 'active' && (
                  <div className="bg-solar-green/10 border border-solar-green/20 rounded-xl p-5 mb-4">
                    <h3 className="font-heading font-bold text-solar-text flex items-center gap-2 text-lg">
                      <span className="text-solar-green">✅</span> Pro {user.subscriptionTier === 'pro_seller' ? 'Seller' : 'Engineer'} Active
                    </h3>
                    <p className="text-sm text-solar-muted mt-2">
                      Your subscription is active and renews automatically.
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-5 mt-5">
                  <div className={`border rounded-xl p-6 transition-all ${user.subscriptionStatus === 'none' ? 'border-solar-accent shadow-[0_0_15px_rgba(245,158,11,0.2)] bg-solar-card2' : 'border-solar-border bg-solar-surface'}`}>
                    <div className="text-sm font-semibold text-solar-muted uppercase tracking-widest mb-2 border-b border-solar-border pb-2">Basic User</div>
                    <div className="text-3xl font-heading font-bold mb-4">Free</div>
                    <ul className="space-y-2 text-sm text-solar-dim mb-6">
                      <li>✓ Browse marketplace</li>
                      <li>✓ Contact sellers & engineers</li>
                      <li>✓ Track orders</li>
                      <li className="opacity-50">✕ List products for sale</li>
                      <li className="opacity-50">✕ Engineer directory listing</li>
                    </ul>
                    <button className="btn-outline w-full cursor-default opacity-50">Current Plan</button>
                  </div>

                  <div className={`border rounded-xl p-6 transition-all relative overflow-hidden ${['trialing','active'].includes(user.subscriptionStatus) ? 'border-solar-accent shadow-[0_0_15px_rgba(245,158,11,0.2)] bg-solar-card2' : 'border-solar-border bg-solar-surface'}`}>
                    <div className="text-sm font-semibold text-solar-accent uppercase tracking-widest mb-2 border-b border-solar-border pb-2">Pro Seller / Engineer</div>
                    <div className="text-3xl font-heading font-bold mb-1">₦5,000 <span className="text-sm text-solar-muted font-normal">/ month</span></div>
                    <div className="text-xs text-solar-green font-medium mb-4">1 Month Free Trial</div>
                    <ul className="space-y-2 text-sm text-solar-dim mb-6">
                      <li className="text-solar-text">✓ Everything in Free</li>
                      <li className="text-solar-text">✓ Unlimited product listings</li>
                      <li className="text-solar-text">✓ Public engineer profile</li>
                      <li className="text-solar-text">✓ Priority support</li>
                    </ul>
                    {user.subscriptionStatus === 'active' ? (
                      <button className="btn-outline text-red-400 border-red-400/30 hover:bg-red-400/10 w-full" onClick={() => toast('Cancel subscription flow mock', 'err')}>Cancel Subscription</button>
                    ) : (
                      <button className="btn-primary w-full" onClick={() => toast('Redirecting to Paystack billing flow...', 'ok')}>Upgrade to Pro</button>
                    )}
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* ── Notifications ──────────────────────────────── */}
          {activeTab === 'notifications' && (
            <Section title="Notification Preferences">
              <div className="space-y-4">
                {[
                  { key: 'email', icon: '📧', label: 'Email Notifications', desc: 'Order updates, price alerts, messages' },
                  { key: 'sms',   icon: '📱', label: 'SMS Notifications',   desc: 'Critical alerts and OTPs only' },
                  { key: 'push',  icon: '🔔', label: 'Push Notifications',  desc: 'In-app alerts and updates' },
                ].map(({ key, icon, label, desc }) => (
                  <label key={key} className="flex items-center justify-between p-4 bg-solar-surface border border-solar-border rounded-xl cursor-pointer hover:border-solar-border2 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{icon}</span>
                      <div>
                        <div className="text-sm font-medium text-solar-text">{label}</div>
                        <div className="text-xs text-solar-muted">{desc}</div>
                      </div>
                    </div>
                    <input type="checkbox" checked={notifPrefs[key]}
                      onChange={e => setNotifPrefs(p => ({ ...p, [key]: e.target.checked }))}
                      className="w-4 h-4 accent-solar-accent" />
                  </label>
                ))}
              </div>
              <div className="flex justify-end">
                <button onClick={saveNotifications} disabled={saving} className="btn-primary flex items-center gap-2">
                  {saving && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                  {saving ? 'Saving…' : 'Save Preferences'}
                </button>
              </div>
            </Section>
          )}

          {/* ── Security ────────────────────────────────────── */}
          {activeTab === 'security' && (
            <Section title="Change Password">
              <div className="space-y-4">
                <F label="Current Password" req>
                  <input type="password" className="solar-input" value={pwForm.oldPassword}
                    onChange={e => setPwForm(p => ({ ...p, oldPassword: e.target.value }))} />
                </F>
                <F label="New Password" req hint="Minimum 8 characters">
                  <input type="password" className="solar-input" value={pwForm.newPassword}
                    onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} />
                </F>
                <F label="Confirm New Password" req>
                  <input type="password" className="solar-input" value={pwForm.confirm}
                    onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
                </F>
              </div>
              <div className="flex justify-end">
                <button onClick={changePassword} disabled={saving} className="btn-primary flex items-center gap-2">
                  {saving && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                  {saving ? 'Updating…' : 'Change Password'}
                </button>
              </div>
            </Section>
          )}

        </div>
      </div>
    </div>
  );
}
