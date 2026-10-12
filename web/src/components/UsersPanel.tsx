import { useEffect, useState, useCallback } from 'react'
import { Users, RefreshCw, ShieldOff, Clock, CheckCircle, XCircle, Loader2, Phone } from 'lucide-react'
import { PaymentSessionInfo } from '../types'

const SERVER = import.meta.env.VITE_SERVER_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '')

interface Props { adminKey: string }

type Filter = 'all' | 'active' | 'pending' | 'failed'

function ts(ms: number) {
  if (!ms) return '—'
  return new Date(ms).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
}

function maskPhone(phone: string) {
  if (phone.length < 6) return phone
  return phone.slice(0, 4) + '****' + phone.slice(-3)
}

function timeLeft(expiresAt: number) {
  const diff = expiresAt - Date.now()
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
    active:  { color: '#1DB814', bg: 'rgba(29,184,20,0.10)',  border: 'rgba(29,184,20,0.30)',  icon: <CheckCircle size={11} /> },
    pending: { color: '#FF9F0A', bg: 'rgba(255,159,10,0.10)', border: 'rgba(255,159,10,0.30)', icon: <Loader2 size={11} /> },
    failed:  { color: '#FF453A', bg: 'rgba(255,69,58,0.10)',  border: 'rgba(255,69,58,0.30)',  icon: <XCircle size={11} /> },
  }
  const c = cfg[status] ?? cfg.failed
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700, color: c.color,
      background: c.bg, border: `0.5px solid ${c.border}`,
      borderRadius: 6, padding: '3px 8px', textTransform: 'uppercase',
    }}>
      {c.icon}{status}
    </span>
  )
}

export function UsersPanel({ adminKey }: Props) {
  const [sessions, setSessions] = useState<PaymentSessionInfo[]>([])
  const [filter,   setFilter]   = useState<Filter>('all')
  const [loading,  setLoading]  = useState(false)
  const [action,   setAction]   = useState<{ id: string; type: string } | null>(null)
  const [toast,    setToast]    = useState('')

  const fetchSessions = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    try {
      const r = await fetch(`${SERVER}/api/admin/pay/sessions?adminKey=${encodeURIComponent(adminKey)}`)
      if (r.ok) setSessions(await r.json())
    } finally { setLoading(false) }
  }, [adminKey])

  useEffect(() => { fetchSessions() }, [fetchSessions])
  useEffect(() => {
    const t = setInterval(fetchSessions, 15_000)
    return () => clearInterval(t)
  }, [fetchSessions])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function revokeSession(id: string) {
    setAction({ id, type: 'revoke' })
    try {
      const r = await fetch(`${SERVER}/api/admin/pay/sessions/${id}/revoke`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey }),
      })
      if (r.ok) { showToast('Session revoked'); fetchSessions() }
      else showToast('Failed to revoke')
    } finally { setAction(null) }
  }

  async function extendSession(id: string, hours: number) {
    setAction({ id, type: 'extend' })
    try {
      const r = await fetch(`${SERVER}/api/admin/pay/sessions/${id}/extend`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey, hours }),
      })
      if (r.ok) { showToast(`Session extended by ${hours}h`); fetchSessions() }
      else showToast('Failed to extend')
    } finally { setAction(null) }
  }

  const filtered = sessions.filter(s => filter === 'all' || s.status === filter)

  const counts = {
    all:     sessions.length,
    active:  sessions.filter(s => s.status === 'active').length,
    pending: sessions.filter(s => s.status === 'pending').length,
    failed:  sessions.filter(s => s.status === 'failed').length,
  }

  const filterBtns: { key: Filter; label: string; color: string }[] = [
    { key: 'all',     label: `All (${counts.all})`,         color: '#8E8E93' },
    { key: 'active',  label: `Active (${counts.active})`,   color: '#1DB814' },
    { key: 'pending', label: `Pending (${counts.pending})`, color: '#FF9F0A' },
    { key: 'failed',  label: `Failed (${counts.failed})`,   color: '#FF453A' },
  ]

  const col: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: '#636366',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>Users &amp; Sessions</h2>
          <p style={{ fontSize: 12, color: '#636366', margin: '2px 0 0' }}>Payment sessions and browser access</p>
        </div>
        <button
          onClick={fetchSessions}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(84,84,88,0.12)', border: '0.5px solid rgba(84,84,88,0.36)',
            borderRadius: 8, padding: '6px 12px', color: '#8E8E93', fontSize: 12, cursor: 'pointer',
          }}
        >
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: 12, flexShrink: 0,
          background: 'rgba(29,184,20,0.10)', border: '0.5px solid rgba(29,184,20,0.30)',
          color: '#1DB814', fontSize: 13,
        }}>{toast}</div>
      )}

      {!adminKey ? (
        <div style={{
          padding: '20px 24px', borderRadius: 12,
          background: 'rgba(255,69,58,0.06)', border: '0.5px solid rgba(255,69,58,0.25)',
          color: '#FF453A', fontSize: 13,
        }}>Enter admin key to view sessions.</div>
      ) : (
        <>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexShrink: 0 }}>
            {filterBtns.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                fontWeight: filter === f.key ? 600 : 400,
                background: filter === f.key ? 'rgba(84,84,88,0.20)' : 'transparent',
                border: filter === f.key ? `0.5px solid rgba(84,84,88,0.50)` : '0.5px solid transparent',
                color: filter === f.key ? f.color : '#636366',
              }}>{f.label}</button>
            ))}
          </div>

          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '110px 80px 70px 80px 80px 90px 100px 130px',
            gap: 8, padding: '8px 12px', marginBottom: 4, flexShrink: 0,
            background: 'rgba(84,84,88,0.08)', borderRadius: 8,
          }}>
            {['Phone', 'Plan', 'Amount', 'Provider', 'Status', 'Expires', 'Created', 'Actions'].map(h => (
              <span key={h} style={col}>{h}</span>
            ))}
          </div>

          {/* Table body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#636366', fontSize: 13 }}>
                <Users size={28} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }} />
                No sessions found
              </div>
            ) : filtered.map(s => {
              const isBusy = action?.id === s.id
              return (
                <div key={s.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 80px 70px 80px 80px 90px 100px 130px',
                  gap: 8, padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                  background: s.status === 'active' ? 'rgba(29,184,20,0.04)' : 'rgba(84,84,88,0.06)',
                  borderLeft: `2px solid ${s.status === 'active' ? '#1DB814' : s.status === 'pending' ? '#FF9F0A' : 'rgba(84,84,88,0.4)'}`,
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: 11, color: '#8E8E93', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={10} />{maskPhone(s.phone)}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: s.plan === '24h' ? '#0A84FF' : '#BF5AF2',
                    background: s.plan === '24h' ? 'rgba(10,132,255,0.10)' : 'rgba(191,90,242,0.10)',
                    borderRadius: 5, padding: '2px 8px', textAlign: 'center',
                  }}>{s.plan}</span>
                  <span style={{ fontSize: 11, color: '#8E8E93' }}>{s.amount} UGX</span>
                  <span style={{ fontSize: 11, color: '#8E8E93' }}>{s.provider}</span>
                  <StatusBadge status={s.status} />
                  <span style={{ fontSize: 11, color: s.status === 'active' ? '#1DB814' : '#636366' }}>
                    {s.status === 'active' ? timeLeft(s.expiresAt) : '—'}
                  </span>
                  <span style={{ fontSize: 10, color: '#48484A' }}>{ts(s.createdAt)}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {s.status === 'active' && (
                      <>
                        <button
                          disabled={isBusy}
                          onClick={() => extendSession(s.id, 6)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                            background: 'rgba(10,132,255,0.10)', border: '0.5px solid rgba(10,132,255,0.30)',
                            color: '#0A84FF', fontWeight: 600,
                          }}
                        ><Clock size={9} />+6h</button>
                        <button
                          disabled={isBusy}
                          onClick={() => revokeSession(s.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                            background: 'rgba(255,69,58,0.10)', border: '0.5px solid rgba(255,69,58,0.30)',
                            color: '#FF453A', fontWeight: 600,
                          }}
                        ><ShieldOff size={9} />Revoke</button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
