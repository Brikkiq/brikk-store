'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { c, type, card, btn, input, inputLabel } from '@/lib/design'

const TABS = [
  { id: 'profile',    label: 'Profile' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'billing',    label: 'Billing' },
  { id: 'referral',   label: 'Lead capture link' },
  { id: 'privacy',    label: 'Privacy' },
  { id: 'agreement',  label: 'Legal' },
]

export default function SettingsPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editBrokerage, setEditBrokerage] = useState('')
  const [profilePic, setProfilePic] = useState(null)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [darkMode, setDarkMode] = useState(false)
  const [brightness, setBrightness] = useState(100)
  const [blueLight, setBlueLight] = useState(0)
  const [textSize, setTextSize] = useState('medium')
  const fileInputRef = useRef(null)

  const showToast = (msg, kind = 'success') => {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    loadProfile()
    if (typeof window !== 'undefined') {
      try {
        const saved = JSON.parse(localStorage.getItem('brikk-appearance') || '{}')
        if (saved.darkMode !== undefined) setDarkMode(saved.darkMode)
        if (saved.blueLight !== undefined) setBlueLight(saved.blueLight)
        if (saved.brightness !== undefined) setBrightness(saved.brightness)
        if (saved.textSize) setTextSize(saved.textSize)
        const pic = localStorage.getItem('brikk-profile-pic')
        if (pic) setProfilePic(pic)
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('brikk-appearance', JSON.stringify({ darkMode, blueLight, brightness, textSize }))

    const html = document.documentElement
    if (darkMode) html.classList.add('brikk-dark')
    else html.classList.remove('brikk-dark')

    html.classList.remove('brikk-dim-90', 'brikk-dim-80', 'brikk-dim-70', 'brikk-dim-60', 'brikk-dim-50')
    if (brightness <= 55) html.classList.add('brikk-dim-50')
    else if (brightness <= 65) html.classList.add('brikk-dim-60')
    else if (brightness <= 75) html.classList.add('brikk-dim-70')
    else if (brightness <= 85) html.classList.add('brikk-dim-80')
    else if (brightness <= 95) html.classList.add('brikk-dim-90')

    let overlay = document.getElementById('brikk-bluelight')
    if (blueLight > 0) {
      if (!overlay) {
        overlay = document.createElement('div')
        overlay.id = 'brikk-bluelight'
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:99999;transition:background 0.3s ease'
        document.body.appendChild(overlay)
      }
      overlay.style.background = `rgba(255,180,50,${(blueLight / 100) * 0.3})`
    } else if (overlay) {
      overlay.style.background = 'transparent'
    }

    html.classList.remove('brikk-text-small', 'brikk-text-large')
    if (textSize === 'small') html.classList.add('brikk-text-small')
    if (textSize === 'large') html.classList.add('brikk-text-large')
  }, [darkMode, blueLight, brightness, textSize])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUser(user)
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setProfile(data)
      setEditName(data.full_name || '')
      setEditPhone(data.phone || '')
      setEditBrokerage(data.brokerage || '')
    }
    setLoading(false)
  }

  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: editName, phone: editPhone, brokerage: editBrokerage,
    }).eq('id', user.id)
    setSaving(false)
    if (error) showToast(error.message, 'error')
    else {
      showToast('Profile saved')
      if (window.brikk?.haptic) window.brikk.haptic('success')
    }
  }

  const handleProfilePic = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setProfilePic(ev.target.result)
      localStorage.setItem('brikk-profile-pic', ev.target.result)
      showToast('Photo updated')
    }
    reader.readAsDataURL(file)
  }

  const changePassword = async () => {
    if (!oldPassword) return showToast('Enter your current password', 'error')
    if (!newPassword || newPassword.length < 6) return showToast('New password must be at least 6 characters', 'error')
    if (newPassword !== confirmPassword) return showToast("Passwords don't match", 'error')

    setSaving(true)
    // Re-verify current password by attempting a fresh sign-in. This works without
    // disturbing the current session because we don't replace the session afterward.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email, password: oldPassword,
    })
    if (signInError) {
      setSaving(false)
      return showToast('Current password is incorrect', 'error')
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)
    if (error) showToast(error.message, 'error')
    else {
      showToast('Password updated')
      setOldPassword(''); setNewPassword(''); setConfirmPassword('')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: c.dim, fontSize: 13 }}>Loading…</div>

  const initials = (editName || user?.email || '?').split(' ').filter(Boolean).map(s => s[0]).join('').slice(0, 2).toUpperCase()
  const referralLink = `https://brikk.store/refer?agent=${user?.id || ''}`

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 80, right: 24, zIndex: 200,
          background: toast.kind === 'error' ? c.redSoft : c.greenSoft,
          border: `1px solid ${toast.kind === 'error' ? c.redBorder : c.greenBorder}`,
          color: toast.kind === 'error' ? c.red : c.green,
          borderRadius: 6, padding: '10px 16px',
          fontSize: 13, fontWeight: 500,
          boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
        }}>{toast.msg}</div>
      )}

      <div style={{ marginBottom: 18 }}>
        <h1 style={{ ...type.pageTitle, margin: 0 }}>Settings</h1>
        <p style={{ ...type.bodySub, margin: '4px 0 0' }}>{user?.email}</p>
      </div>

      <style>{`
        .brikk-settings-layout { display: block; }
        .brikk-settings-nav { display: none; }
        .brikk-settings-mobile-list { display: block; }
        @media (min-width: 901px) {
          .brikk-settings-layout { display: grid !important; grid-template-columns: 200px 1fr !important; gap: 24px !important; }
          .brikk-settings-nav { display: flex !important; flex-direction: column !important; }
          .brikk-settings-mobile-list { display: none !important; }
        }
      `}</style>

      <div className="brikk-settings-layout">
        {/* Sidebar nav (desktop) */}
        <nav className="brikk-settings-nav" style={{ display: 'none', flexDirection: 'column', gap: 2 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: activeTab === t.id ? c.white : 'transparent',
                border: `1px solid ${activeTab === t.id ? c.border : 'transparent'}`,
                borderRadius: 6,
                padding: '9px 12px',
                fontSize: 13,
                fontWeight: activeTab === t.id ? 600 : 500,
                color: activeTab === t.id ? c.text : c.sub,
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.12s ease, color 0.12s ease',
              }}
            >{t.label}</button>
          ))}
          <button
            onClick={handleLogout}
            style={{
              marginTop: 12, background: 'transparent',
              border: `1px solid ${c.redBorder}`,
              borderRadius: 6,
              padding: '9px 12px',
              fontSize: 13, fontWeight: 500, color: c.red,
              textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >Sign out</button>
        </nav>

        {/* Content */}
        <div>
          {activeTab === 'profile' && (
            <ProfileTab
              user={user}
              editName={editName} setEditName={setEditName}
              editPhone={editPhone} setEditPhone={setEditPhone}
              editBrokerage={editBrokerage} setEditBrokerage={setEditBrokerage}
              profilePic={profilePic}
              initials={initials}
              fileInputRef={fileInputRef}
              onPic={handleProfilePic}
              onSave={saveProfile}
              saving={saving}
              oldPassword={oldPassword} setOldPassword={setOldPassword}
              newPassword={newPassword} setNewPassword={setNewPassword}
              confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
              onChangePassword={changePassword}
            />
          )}

          {activeTab === 'appearance' && (
            <AppearanceTab
              darkMode={darkMode} setDarkMode={setDarkMode}
              brightness={brightness} setBrightness={setBrightness}
              blueLight={blueLight} setBlueLight={setBlueLight}
              textSize={textSize} setTextSize={setTextSize}
            />
          )}

          {activeTab === 'billing' && <BillingTab user={user} saving={saving} setSaving={setSaving} showToast={showToast} />}
          {activeTab === 'referral' && <ReferralTab referralLink={referralLink} showToast={showToast} />}
          {activeTab === 'privacy' && <PrivacyTab />}
          {activeTab === 'agreement' && <AgreementTab />}

          {/* Mobile sign out */}
          <div style={{ marginTop: 24, display: 'block' }} className="brikk-settings-mobile-list">
            <button
              onClick={handleLogout}
              style={{ ...btn.danger, width: '100%' }}
            >Sign out</button>
            <div style={{ textAlign: 'center', marginTop: 12, color: c.dim, fontSize: 11 }}>Brikk v1.3</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Section = ({ title, description, children, footer }) => (
  <div style={{ ...card, marginBottom: 16 }}>
    <div style={{ marginBottom: 16 }}>
      <div style={{ ...type.sectionTitle }}>{title}</div>
      {description && <div style={{ ...type.bodySub, marginTop: 4 }}>{description}</div>}
    </div>
    {children}
    {footer && <div style={{ marginTop: 16 }}>{footer}</div>}
  </div>
)

const Field = ({ label, children }) => (
  <div>
    <label style={inputLabel}>{label}</label>
    {children}
  </div>
)

const ProfileTab = ({
  user, editName, setEditName, editPhone, setEditPhone, editBrokerage, setEditBrokerage,
  profilePic, initials, fileInputRef, onPic, onSave, saving,
  oldPassword, setOldPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword, onChangePassword,
}) => (
  <>
    <Section title="Profile" description="How you appear inside Brikk. This is only visible to you and your team if you have one.">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: 56, height: 56, borderRadius: 8,
            background: profilePic ? 'transparent' : c.bgInset,
            border: `1px solid ${c.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
          }}
        >
          {profilePic
            ? <img src={profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 16, fontWeight: 600, color: c.text }}>{initials}</span>}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={onPic} style={{ display: 'none' }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{editName || 'Add your name'}</div>
          <div style={{ ...type.meta }}>Click photo to change</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <Field label="Full name">
          <input value={editName} onChange={e => setEditName(e.target.value)} style={input} />
        </Field>
        <Field label="Email">
          <input value={user?.email || ''} disabled style={{ ...input, background: c.bgInset, color: c.dim }} />
        </Field>
        <Field label="Phone">
          <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="(801) 555-0142" style={input} />
        </Field>
        <Field label="Brokerage">
          <input value={editBrokerage} onChange={e => setEditBrokerage(e.target.value)} placeholder="Keller Williams, eXp…" style={input} />
        </Field>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button onClick={onSave} disabled={saving} style={{ ...btn.primary, opacity: saving ? 0.5 : 1 }}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </Section>

    <Section title="Password" description="Use at least 6 characters. Updating signs you out of other devices.">
      <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
        <Field label="Current password">
          <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Current password" style={input} />
        </Field>
        <Field label="New password">
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters" style={input} />
        </Field>
        <Field label="Confirm new password">
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm" style={input} />
        </Field>
      </div>
      <div style={{ marginTop: 16 }}>
        <button onClick={onChangePassword} disabled={saving} style={{ ...btn.primary, opacity: saving ? 0.5 : 1 }}>
          {saving ? 'Updating…' : 'Update password'}
        </button>
      </div>
    </Section>
  </>
)

const AppearanceTab = ({ darkMode, setDarkMode, brightness, setBrightness, blueLight, setBlueLight, textSize, setTextSize }) => (
  <Section title="Appearance" description="Tune how Brikk looks on this device. Settings sync across pages.">
    <SettingRow
      label="Dark mode"
      hint="Inverts colors for low-light environments."
      control={<Toggle on={darkMode} onChange={() => setDarkMode(!darkMode)} />}
    />
    <Slider label="Brightness" value={brightness} min={40} max={100} unit="%" onChange={v => setBrightness(v)} />
    <Slider label="Blue light filter" value={blueLight} min={0} max={100} unit="%" onChange={v => setBlueLight(v)} color="#D97706" />
    <div style={{ marginTop: 12 }}>
      <div style={{ ...inputLabel, marginBottom: 8 }}>Text size</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[{ id: 'small', label: 'Small' }, { id: 'medium', label: 'Medium' }, { id: 'large', label: 'Large' }].map(s => (
          <button
            key={s.id}
            onClick={() => setTextSize(s.id)}
            style={{
              flex: 1, height: 36, borderRadius: 6,
              border: `1px solid ${textSize === s.id ? c.text : c.border}`,
              background: textSize === s.id ? c.text : c.white,
              color: textSize === s.id ? c.white : c.sub,
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >{s.label}</button>
        ))}
      </div>
    </div>
  </Section>
)

const SettingRow = ({ label, hint, control }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${c.borderLight}` }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
      {hint && <div style={{ ...type.meta, marginTop: 2 }}>{hint}</div>}
    </div>
    {control}
  </div>
)

const Toggle = ({ on, onChange }) => (
  <button
    onClick={onChange}
    aria-pressed={on}
    style={{
      width: 44, height: 26, borderRadius: 13,
      background: on ? c.green : c.border,
      border: 'none', cursor: 'pointer',
      position: 'relative',
      transition: 'background 0.2s ease',
    }}
  >
    <div style={{
      width: 20, height: 20, borderRadius: 10,
      background: c.white,
      boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
      position: 'absolute',
      top: 3,
      left: on ? 21 : 3,
      transition: 'left 0.2s ease',
    }} />
  </button>
)

const Slider = ({ label, value, min, max, onChange, unit, color }) => (
  <div style={{ padding: '14px 0', borderBottom: `1px solid ${c.borderLight}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
      <span style={{ ...type.meta, fontVariantNumeric: 'tabular-nums' }}>{value}{unit}</span>
    </div>
    <input
      type="range"
      min={min} max={max}
      value={value}
      onChange={e => onChange(parseInt(e.target.value))}
      style={{
        width: '100%', height: 6, borderRadius: 3,
        appearance: 'none', WebkitAppearance: 'none',
        background: `linear-gradient(to right, ${color || c.text} ${((value - min) / (max - min)) * 100}%, ${c.border} ${((value - min) / (max - min)) * 100}%)`,
        outline: 'none', cursor: 'pointer',
      }}
    />
  </div>
)

const BillingTab = ({ user, saving, setSaving, showToast }) => {
  const checkout = async (plan) => {
    setSaving(true)
    try {
      const res = await fetch('/api/stripe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, email: user?.email, userId: user?.id }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else showToast(data.error || 'Something went wrong', 'error')
    } catch {
      showToast('Failed to start checkout', 'error')
    }
    setSaving(false)
  }
  return (
    <>
      <Section title="Trial status">
        <div style={{
          background: c.greenSoft, border: `1px solid ${c.greenBorder}`,
          borderRadius: 6, padding: '14px 16px',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: c.green }}>Free trial active</div>
          <div style={{ ...type.bodySub, marginTop: 2 }}>Full access to every feature for 45 days. No charge until your trial ends.</div>
        </div>
      </Section>

      <Section title="Plans" description="Cancel anytime in Settings.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          <PlanCard
            title="Pro" subtitle="Solo agents"
            price="$75" period="/mo" setup="+$125 setup"
            features="AI Copilot · Pipeline · Deals · Calendar · Marketing · Messages · Voice-to-CRM · Lead capture link"
            primary
            onClick={() => checkout('pro')}
            saving={saving}
          />
          <PlanCard
            title="Team" subtitle="Up to 5 agents"
            price="$200" period="/mo" setup="+$125 setup"
            features="Everything in Pro plus team dashboard, lead routing, and priority support."
            onClick={() => checkout('team')}
            saving={saving}
          />
        </div>
        <div style={{ ...type.meta, marginTop: 14 }}>Payments secured by Stripe. 45-day free trial included. Cancel anytime.</div>
      </Section>
    </>
  )
}

const PlanCard = ({ title, subtitle, price, period, setup, features, primary, onClick, saving }) => (
  <div style={{
    background: c.white,
    border: `1px solid ${primary ? c.text : c.border}`,
    borderRadius: 8,
    padding: '20px 18px',
    display: 'flex', flexDirection: 'column', gap: 12,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
        <div style={{ ...type.meta }}>{subtitle}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
          {price}<span style={{ fontSize: 13, color: c.dim, fontWeight: 400 }}>{period}</span>
        </div>
        <div style={{ ...type.meta }}>{setup}</div>
      </div>
    </div>
    <div style={{ ...type.bodySub, fontSize: 12.5 }}>{features}</div>
    <button
      onClick={onClick}
      disabled={saving}
      style={{ ...(primary ? btn.primary : btn.secondary), opacity: saving ? 0.5 : 1 }}
    >
      {saving ? 'Loading…' : `Subscribe — ${price}${period}`}
    </button>
  </div>
)

const ReferralTab = ({ referralLink, showToast }) => (
  <Section title="Lead capture link" description="Share this on business cards, social media, or email signatures. Submissions arrive in your pipeline tagged 'Referral Link'.">
    <div style={{
      background: c.bgInset, border: `1px solid ${c.border}`,
      borderRadius: 6, padding: '12px 14px',
      fontSize: 13, color: c.text, wordBreak: 'break-all', marginBottom: 12,
      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
    }}>{referralLink}</div>
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={() => { navigator.clipboard?.writeText(referralLink); showToast('Link copied') }}
        style={btn.primary}
      >Copy link</button>
      <a href={referralLink} target="_blank" rel="noreferrer" style={{ ...btn.secondary, textDecoration: 'none' }}>Preview</a>
    </div>
  </Section>
)

const PrivacyTab = () => (
  <>
    <Section title="Data controls">
      <SettingRow
        label="AI data processing"
        hint="Let Copilot analyze each lead's context to draft better follow-ups."
        control={<Toggle on={true} onChange={() => {}} />}
      />
      <SettingRow
        label="SMS messaging"
        hint="Send texts to leads via Twilio."
        control={<Toggle on={true} onChange={() => {}} />}
      />
    </Section>
    <Section title="Account">
      <div style={{ display: 'grid', gap: 8, maxWidth: 320 }}>
        <button style={btn.secondary}>Export all data</button>
        <button style={btn.danger}>Delete account</button>
      </div>
    </Section>
    <Section title="Policy">
      <a href="/privacy" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: c.text }}>Read the full privacy policy →</a>
    </Section>
  </>
)

const AgreementTab = () => (
  <>
    <Section title="Documents">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <a href="/terms" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: c.text }}>Terms of service →</a>
        <a href="/privacy" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: c.text }}>Privacy policy →</a>
      </div>
    </Section>
    <Section title="Acceptable use">
      <div style={{ ...type.bodySub }}>
        By using Brikk you agree to use the service for legitimate real estate business. Review all AI-generated content before sending.
        You are responsible for CAN-SPAM, TCPA, and local real estate compliance.
      </div>
    </Section>
  </>
)
