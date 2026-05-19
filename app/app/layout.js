'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { c } from '@/lib/design'

const navItems = [
  { label: 'Today',     href: '/app',           key: 'home' },
  { label: 'Copilot',   href: '/app/copilot',   key: 'copilot' },
  { label: 'Leads',     href: '/app/leads',     key: 'leads' },
  { label: 'Deals',     href: '/app/deals',     key: 'deals' },
  { label: 'Calendar',  href: '/app/calendar',  key: 'calendar' },
  { label: 'Messages',  href: '/app/messages',  key: 'messages' },
  { label: 'Marketing', href: '/app/marketing', key: 'marketing' },
]

// Mobile bottom-bar tabs. Calendar and Marketing are reachable from the Today dashboard.
const mobileNavItems = [
  { label: 'Today',    href: '/app',           key: 'home' },
  { label: 'Copilot',  href: '/app/copilot',   key: 'copilot' },
  { label: 'Leads',    href: '/app/leads',     key: 'leads' },
  { label: 'Deals',    href: '/app/deals',     key: 'deals' },
  { label: 'Messages', href: '/app/messages',  key: 'messages' },
  { label: 'Settings', href: '/app/settings',  key: 'settings' },
]

const Icon = ({ name, size = 18 }) => {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  switch (name) {
    case 'home':      return <svg {...props}><path d="M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/></svg>
    case 'copilot':   return <svg {...props}><path d="M12 3v3"/><path d="M5 12H3"/><path d="M21 12h-2"/><path d="M5.6 5.6 7 7"/><path d="m17 7 1.4-1.4"/><circle cx="12" cy="13" r="6"/></svg>
    case 'leads':     return <svg {...props}><circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-3.6 3-6 7-6s7 2.4 7 6"/><path d="M17 11a3 3 0 0 0 0-6"/><path d="M22 21c0-2.8-1.6-5-4-5.7"/></svg>
    case 'deals':     return <svg {...props}><path d="M4 7h16v12H4z"/><path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2"/><path d="M9 12h6"/></svg>
    case 'calendar':  return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/></svg>
    case 'messages':  return <svg {...props}><path d="M21 12a8 8 0 0 1-11.4 7.3L3 21l1.7-6.6A8 8 0 1 1 21 12z"/></svg>
    case 'marketing': return <svg {...props}><path d="M3 20V10"/><path d="M9 20V4"/><path d="M15 20v-7"/><path d="M21 20v-12"/></svg>
    case 'settings':  return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    case 'logout':    return <svg {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
    default: return null
  }
}

export default function AppLayout({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPath, setCurrentPath] = useState('/app')
  const [banner, setBanner] = useState(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const touchStartY = useRef(0)
  const isPulling = useRef(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (cancelled) return
      if (!user) { window.location.href = '/login'; return }
      setUser(user)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (cancelled) return
      setProfile(prof || null)
      setLoading(false)
      checkBanner(user.id).catch(err => console.warn('banner check failed', err?.message))
    })
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname)
      try {
        const saved = JSON.parse(localStorage.getItem('brikk-appearance') || '{}')
        const html = document.documentElement
        if (saved.darkMode) html.classList.add('brikk-dark')
        html.classList.remove('brikk-dim-90', 'brikk-dim-80', 'brikk-dim-70', 'brikk-dim-60', 'brikk-dim-50')
        if (saved.brightness) {
          const b = saved.brightness
          if (b <= 55) html.classList.add('brikk-dim-50')
          else if (b <= 65) html.classList.add('brikk-dim-60')
          else if (b <= 75) html.classList.add('brikk-dim-70')
          else if (b <= 85) html.classList.add('brikk-dim-80')
          else if (b <= 95) html.classList.add('brikk-dim-90')
        }
        html.classList.remove('brikk-text-small', 'brikk-text-large')
        if (saved.textSize === 'small') html.classList.add('brikk-text-small')
        if (saved.textSize === 'large') html.classList.add('brikk-text-large')
      } catch {}
    }
    const t = setTimeout(() => {
      if (window.brikk?.requestPushPermission) window.brikk.requestPushPermission()
    }, 15000)
    return () => { cancelled = true; clearTimeout(t) }
  }, [])

  const checkBanner = async (userId) => {
    const [leadsRes, dealsRes] = await Promise.all([
      supabase.from('leads').select('id,name,temperature,last_contact_date').eq('user_id', userId),
      supabase.from('deals').select('id,address,close_date').eq('user_id', userId),
    ])
    const leads = leadsRes.data || []
    const deals = dealsRes.data || []
    const daysSince = (d) => d ? Math.floor((new Date() - new Date(d)) / 86400000) : 999
    const daysUntil = (d) => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null

    const hotOverdue = leads.filter(l => l.temperature === 'hot' && daysSince(l.last_contact_date) >= 2)
    const closingSoon = deals.filter(d => d.close_date && daysUntil(d.close_date) <= 3 && daysUntil(d.close_date) >= 0)

    if (hotOverdue.length) {
      setBanner({
        tone: 'urgent',
        msg: `${hotOverdue.length} hot lead${hotOverdue.length > 1 ? 's' : ''} overdue — ${hotOverdue[0].name}${hotOverdue.length > 1 ? ' and others' : ''}`,
        link: '/app/copilot',
        linkLabel: 'Draft follow-ups',
      })
    } else if (closingSoon.length) {
      const d = closingSoon[0]
      const days = daysUntil(d.close_date)
      setBanner({
        tone: 'warn',
        msg: `${d.address} closes in ${days} day${days === 1 ? '' : 's'}`,
        link: '/app/deals',
        linkLabel: 'Open deal',
      })
    }
  }

  // Pull-to-refresh on mobile
  const handleTouchStart = (e) => {
    touchStartY.current = e.changedTouches[0].screenY
    if (window.scrollY === 0) isPulling.current = true
  }
  const handleTouchMove = (e) => {
    if (!isPulling.current) return
    const dy = e.changedTouches[0].screenY - touchStartY.current
    if (dy > 0 && window.scrollY === 0) setPullDistance(Math.min(dy * 0.4, 80))
  }
  const handleTouchEnd = () => {
    if (pullDistance > 50 && !refreshing) {
      setRefreshing(true)
      setPullDistance(0)
      setTimeout(() => window.location.reload(), 600)
    } else {
      setPullDistance(0)
    }
    isPulling.current = false
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.bg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: c.text, opacity: 0.7 }}>Brikk</div>
          <div style={{ fontSize: 12, color: c.dim, marginTop: 6 }}>Loading workspace…</div>
        </div>
      </div>
    )
  }

  const initials = (profile?.full_name || user?.email || '?').split(' ').filter(Boolean).map(s => s[0]).join('').slice(0, 2).toUpperCase()
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : (user?.email || '').split('@')[0]
  const bannerColor = banner?.tone === 'urgent' ? c.red : banner?.tone === 'warn' ? c.amber : c.indigo
  const bannerBg = banner?.tone === 'urgent' ? c.redSoft : banner?.tone === 'warn' ? c.amberSoft : c.indigoSoft

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: c.bg,
        fontFamily: "'Instrument Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        WebkitFontSmoothing: 'antialiased',
        color: c.text,
      }}
    >
      <style>{`
        @media (min-width: 901px) {
          .brikk-sidebar { display: flex !important; }
          .brikk-mobile-top { display: none !important; }
          .brikk-mobile-tabbar { display: none !important; }
          .brikk-main { margin-left: 220px; }
        }
        @media (max-width: 900px) {
          .brikk-sidebar { display: none !important; }
          .brikk-mobile-top { display: flex !important; }
          .brikk-mobile-tabbar { display: flex !important; }
          .brikk-main { margin-left: 0; padding-bottom: 80px !important; }
        }
        .brikk-nav-link {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; border-radius: 6px;
          font-size: 13px; font-weight: 500;
          color: ${c.sub}; text-decoration: none;
          transition: background 0.12s ease, color 0.12s ease;
        }
        .brikk-nav-link:hover { background: ${c.bgInset}; color: ${c.text}; }
        .brikk-nav-link.active { background: ${c.text}; color: #fff; }
        .brikk-nav-link.active svg { stroke: #fff; }
        @keyframes brikkFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        .brikk-page-enter { animation: brikkFade 0.22s ease-out; }
        @keyframes brikkSpin { to { transform: rotate(360deg); } }
        .brikk-spinner { animation: brikkSpin 0.8s linear infinite; }
      `}</style>

      {/* Sidebar (desktop) */}
      <aside
        className="brikk-sidebar"
        style={{
          display: 'none',
          position: 'fixed',
          left: 0, top: 0, bottom: 0,
          width: 220,
          background: c.white,
          borderRight: `1px solid ${c.border}`,
          flexDirection: 'column',
          zIndex: 30,
        }}
      >
        <div style={{ padding: '20px 20px 16px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.025em', color: c.text }}>Brikk</div>
          <div style={{ fontSize: 11, color: c.dim, marginTop: 2, letterSpacing: '0.04em' }}>COMMAND CENTER</div>
        </div>

        <nav style={{ flex: 1, padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(n => (
            <a
              key={n.href}
              href={n.href}
              className={`brikk-nav-link ${currentPath === n.href ? 'active' : ''}`}
            >
              <Icon name={n.key} size={17} />
              <span>{n.label}</span>
            </a>
          ))}
        </nav>

        <div style={{ padding: 12, borderTop: `1px solid ${c.border}` }}>
          <a
            href="/app/settings"
            className={`brikk-nav-link ${currentPath === '/app/settings' ? 'active' : ''}`}
          >
            <Icon name="settings" size={17} />
            <span>Settings</span>
          </a>
          <div style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 4px',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 6,
              background: c.bgInset,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600, color: c.text,
              border: `1px solid ${c.border}`,
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: c.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.full_name || firstName}
              </div>
              <div style={{ fontSize: 11, color: c.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header
        className="brikk-mobile-top"
        style={{
          display: 'none',
          position: 'sticky', top: 0, zIndex: 40,
          alignItems: 'center', justifyContent: 'center',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${c.border}`,
          width: '100%',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.025em' }}>Brikk</div>
      </header>

      {/* Main */}
      <div className="brikk-main" style={{ flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {(pullDistance > 0 || refreshing) && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: `${refreshing ? 16 : pullDistance * 0.3}px 0`, transition: refreshing ? 'none' : 'padding 0.1s ease' }}>
            <div className={refreshing ? 'brikk-spinner' : ''} style={{
              width: 22, height: 22, borderRadius: '50%',
              border: `2px solid ${c.border}`, borderTopColor: c.text,
              opacity: refreshing ? 1 : Math.min(pullDistance / 50, 1),
              transform: `rotate(${pullDistance * 4}deg)`,
            }} />
          </div>
        )}

        {banner && !bannerDismissed && (
          <div style={{
            background: bannerBg,
            borderBottom: `1px solid ${bannerColor}33`,
            padding: '10px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: bannerColor, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {banner.msg}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <a href={banner.link} style={{ fontSize: 12, fontWeight: 600, color: bannerColor, textDecoration: 'none' }}>
                {banner.linkLabel} →
              </a>
              <button
                onClick={() => setBannerDismissed(true)}
                aria-label="Dismiss"
                style={{ background: 'none', border: 'none', fontSize: 16, color: c.dim, cursor: 'pointer', padding: 4, lineHeight: 1 }}
              >×</button>
            </div>
          </div>
        )}

        <main
          className="brikk-page-enter"
          style={{
            flex: 1,
            padding: '28px 32px 48px',
            maxWidth: 1240,
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="brikk-mobile-tabbar"
        style={{
          display: 'none',
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderTop: `1px solid ${c.border}`,
          padding: '6px 4px calc(6px + env(safe-area-inset-bottom, 0px))',
          zIndex: 100,
          justifyContent: 'space-around',
          alignItems: 'center',
        }}
      >
        {mobileNavItems.map(n => {
          const active = currentPath === n.href
          return (
            <a
              key={n.href}
              href={n.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '6px 0',
                textDecoration: 'none',
                color: active ? c.text : c.dim,
                minWidth: 0,
              }}
            >
              <Icon name={n.key} size={18} />
              <span style={{
                fontSize: 9.5,
                fontWeight: active ? 600 : 500,
                letterSpacing: '0.005em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}>
                {n.label}
              </span>
            </a>
          )
        })}
      </nav>
    </div>
  )
}
