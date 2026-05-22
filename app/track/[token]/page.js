'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Logo } from '@/lib/Logo'

// Public client-facing deal tracker.
// URL: brikk.store/track/{client_token}
// No authentication — the token IS the auth. Showing minimal-but-useful info
// so buyers/sellers can self-serve "where are we?" instead of texting the agent
// 5x a day.

const c = {
  bg: '#FAFAF9', white: '#FFFFFF',
  border: '#E8E8E4', borderLight: '#F0F0EC',
  text: '#1A1A18', sub: '#6B6B66', dim: '#9C9C96',
  green: '#16803C', greenSoft: 'rgba(22,128,60,0.06)', greenBorder: 'rgba(22,128,60,0.15)',
  amber: '#A16207', amberSoft: 'rgba(161,98,7,0.06)',
}

// Standard real-estate transaction stages. Order matters — index = progress.
const STAGES = [
  { key: 'Contract', label: 'Under Contract', detail: 'Offer accepted, contract signed.' },
  { key: 'Inspection', label: 'Inspection', detail: 'Home inspection scheduled or in progress.' },
  { key: 'Appraisal', label: 'Appraisal', detail: 'Lender ordered appraisal.' },
  { key: 'Financing', label: 'Financing', detail: 'Loan in underwriting.' },
  { key: 'Title', label: 'Title & Insurance', detail: 'Title search and insurance review.' },
  { key: 'Closing', label: 'Closing Prep', detail: 'Final walk-through and paperwork.' },
  { key: 'Closed', label: 'Closed', detail: 'Congratulations! Transaction complete.' },
]

export default function TrackPage() {
  const params = useParams()
  const token = (params?.token || '').toString().trim().toLowerCase()
  const [deal, setDeal] = useState(null)
  const [agent, setAgent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return }
    ;(async () => {
      const { data: d, error } = await supabase
        .from('deals')
        .select('*')
        .eq('client_token', token)
        .maybeSingle()
      if (error || !d) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setDeal(d)
      // Fetch the agent's profile for contact info
      const { data: p } = await supabase
        .from('profiles')
        .select('full_name, brokerage, phone, avatar_url')
        .eq('id', d.user_id)
        .maybeSingle()
      setAgent(p)
      setLoading(false)
    })()
  }, [token])

  if (loading) return <Shell><Loading /></Shell>
  if (notFound) return <Shell><NotFound /></Shell>

  const stageIdx = Math.max(0, STAGES.findIndex(s => s.key === (deal.stage || 'Contract')))
  const isClosed = deal.stage === 'Closed'
  const daysToClose = deal.close_date
    ? Math.ceil((new Date(deal.close_date) - new Date()) / 86400000)
    : null

  return (
    <Shell>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px 80px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Logo size={20} />
          <div style={{ fontSize: 11, color: c.dim, marginTop: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Your transaction
          </div>
        </div>

        {/* Address + status banner */}
        <div style={{
          background: c.white,
          border: `1px solid ${c.border}`,
          borderRadius: 12,
          padding: '24px 24px 20px',
          marginBottom: 16,
        }}>
          <h1 style={{
            fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em',
            margin: 0, color: c.text, lineHeight: 1.25,
          }}>
            {deal.address}
          </h1>
          {deal.client_name && (
            <div style={{ fontSize: 14, color: c.sub, marginTop: 6 }}>
              For {deal.client_name}
            </div>
          )}

          {/* Status pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: isClosed ? c.greenSoft : c.amberSoft,
            border: `1px solid ${isClosed ? c.greenBorder : 'rgba(161,98,7,0.15)'}`,
            padding: '5px 12px', borderRadius: 20,
            marginTop: 16,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: isClosed ? c.green : c.amber,
            }} />
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: isClosed ? c.green : c.amber,
            }}>
              {isClosed ? 'Closed' : STAGES[stageIdx]?.label || 'In Progress'}
            </span>
          </div>

          {/* Days to close */}
          {!isClosed && daysToClose !== null && (
            <div style={{ marginTop: 16, fontSize: 13, color: c.sub }}>
              {daysToClose > 0
                ? <span><strong style={{ color: c.text }}>{daysToClose}</strong> day{daysToClose === 1 ? '' : 's'} until expected close
                    {deal.close_date && <span style={{ color: c.dim }}> · {new Date(deal.close_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
                  </span>
                : daysToClose === 0 ? 'Closes today.'
                : `Past expected close date by ${-daysToClose} day${-daysToClose === 1 ? '' : 's'} — your agent will reach out with an update.`
              }
            </div>
          )}
        </div>

        {/* Stage progress */}
        <div style={{
          background: c.white,
          border: `1px solid ${c.border}`,
          borderRadius: 12,
          padding: '24px',
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: c.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            Where things stand
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {STAGES.map((stage, i) => {
              const isDone = i < stageIdx || isClosed
              const isCurrent = i === stageIdx && !isClosed
              const isFuture = i > stageIdx && !isClosed
              return (
                <div key={stage.key} style={{
                  display: 'flex', gap: 12,
                  paddingBottom: i === STAGES.length - 1 ? 0 : 14,
                  position: 'relative',
                }}>
                  {/* Vertical connector line */}
                  {i < STAGES.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      left: 13, top: 28, bottom: -2,
                      width: 2,
                      background: isDone ? c.green : c.borderLight,
                    }} />
                  )}
                  {/* Stage dot */}
                  <div style={{
                    width: 28, height: 28,
                    borderRadius: '50%',
                    background: isDone ? c.green : isCurrent ? c.amber : c.white,
                    border: `2px solid ${isDone ? c.green : isCurrent ? c.amber : c.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 12, fontWeight: 700,
                    flexShrink: 0, zIndex: 1,
                  }}>
                    {isDone ? '✓' : isCurrent ? '•' : ''}
                  </div>
                  <div style={{ flex: 1, paddingTop: 3 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: isCurrent ? 600 : isFuture ? 400 : 500,
                      color: isFuture ? c.dim : c.text,
                    }}>
                      {stage.label}
                    </div>
                    <div style={{
                      fontSize: 12.5,
                      color: isFuture ? c.dim : c.sub,
                      marginTop: 2,
                      lineHeight: 1.45,
                    }}>
                      {stage.detail}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Agent contact card */}
        {agent && (
          <div style={{
            background: c.white,
            border: `1px solid ${c.border}`,
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: c.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Your agent
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: c.text }}>
              {agent.full_name || 'Your agent'}
            </div>
            {agent.brokerage && (
              <div style={{ fontSize: 13, color: c.sub, marginTop: 2 }}>
                {agent.brokerage}
              </div>
            )}
            {agent.phone && (
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <a href={`tel:${String(agent.phone).replace(/[^0-9+]/g, '')}`} style={{
                  display: 'inline-block',
                  background: c.text, color: c.white,
                  padding: '10px 18px', borderRadius: 6,
                  textDecoration: 'none', fontSize: 13, fontWeight: 600,
                }}>
                  Call
                </a>
                <a href={`sms:${String(agent.phone).replace(/[^0-9+]/g, '')}`} style={{
                  display: 'inline-block',
                  background: c.white, color: c.text,
                  border: `1px solid ${c.border}`,
                  padding: '10px 18px', borderRadius: 6,
                  textDecoration: 'none', fontSize: 13, fontWeight: 600,
                }}>
                  Text
                </a>
              </div>
            )}
          </div>
        )}

        {/* Notes if any */}
        {deal.notes && (
          <div style={{
            background: c.white,
            border: `1px solid ${c.border}`,
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: c.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Latest from your agent
            </div>
            <div style={{ fontSize: 14, color: c.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {deal.notes}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <div style={{ fontSize: 11, color: c.dim }}>
            This page updates in real-time when your agent updates the deal.
          </div>
          <div style={{ fontSize: 11, color: c.dim, marginTop: 4 }}>
            Powered by <a href="/" style={{ color: c.dim, textDecoration: 'underline' }}>Brikk</a>
          </div>
        </div>
      </div>
    </Shell>
  )
}

const Shell = ({ children }) => (
  <div style={{
    background: c.bg, minHeight: '100vh', color: c.text,
    fontFamily: "'Instrument Sans',-apple-system,BlinkMacSystemFont,sans-serif",
  }}>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
    {children}
  </div>
)

const Loading = () => (
  <div style={{ padding: 80, textAlign: 'center', color: c.dim, fontSize: 13 }}>
    Loading your transaction…
  </div>
)

const NotFound = () => (
  <div style={{ maxWidth: 400, margin: '60px auto', textAlign: 'center', padding: 24 }}>
    <Logo size={22} />
    <div style={{ fontSize: 18, fontWeight: 600, marginTop: 18, marginBottom: 6 }}>
      Transaction not found
    </div>
    <div style={{ fontSize: 13, color: c.sub, marginBottom: 20, lineHeight: 1.6 }}>
      This link may have expired or been mistyped. Reach out to your agent for an updated link.
    </div>
    <a href="/" style={{
      display: 'inline-block',
      background: c.text, color: '#fff',
      padding: '10px 22px', borderRadius: 6,
      textDecoration: 'none', fontSize: 13, fontWeight: 600,
    }}>
      Visit brikk.store
    </a>
  </div>
)
