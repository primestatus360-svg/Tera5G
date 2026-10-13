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
    active:  { color: '#1DB814', bg: 'rgba(29,184,20,0.10)',  border: 'rgba(29,184,20,0.28)',  icon: <CheckCircle size={10} /> },
    pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.28)', icon: <Loader2 size={10} /> },
    failed:  { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.28)',  icon: <XCircle size={10} /> },
  }
  const c = cfg[status] ?? cfg.failed
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700, color: c.color,
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 6, padding: '2px 7px', textTransform: 'uppercase',
    }}>
      {c.icon}{status}
    </span>
  )
}

const colHdr: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: '#3a3e5a',
  textTransform: 'uppercase', letterSpacing: '0.09em',
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
    setToast(msg); setTimeout(() => setToast(''), 3000)
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

  const filterTabs: { key: Filter; label: string; color: string }[] = [
    { key: 'all',     label: `All (${counts.all})`,             color: '#7b82a8' },
    { key: 'active',  label: `Active (${counts.active})`,       color: '#1DB814' },
    { key: 'pending', label: `Pending (${counts.pending})`,     color: '#f59e0b' },
    { key: 'failed',  label: `Failed (${counts.failed})`,       color: '#ef4444' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Panel header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(29,184,20,0.12)', border: '1px solid rgba(29,184,20,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Users size={17} color="#1DB814" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e5f1', letterSpacing: '-0.02em' }}>Users &amp; Sessions</div>
            <div style={{ fontSize: 11, color: '#4a4f72', marginTop: 2 }}>Payment sessions and browser access</div>
          </div>
        </div>
        <button
          onClick={fetchSessions}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 9, padding: '7px 13px', color: '#7b82a8', fontSize: 12, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          padding: '9px 14px', borderRadius: 9, marginBottom: 12, flexShrink: 0,
          background: 'rgba(29,184,20,0.08)', border: '1px solid rgba(29,184,20,0.25)',
          color: '#1DB814', fontSize: 12, display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <CheckCircle size={13} />{toast}
        </div>
      )}

      {!adminKey ? (
        <div style={{
          padding: '18px 22px', borderRadius: 12,
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)',
          color: '#ef4444', fontSize: 13,
        }}>Enter admin key in the top bar to view sessions.</div>
      ) : (
        <>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 12, flexShrink: 0, flexWrap: 'wrap' }}>
            {filterTabs.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '5px 13px', borderRadius: 99, fontSize: 11.5, cursor: 'pointer',
                fontWeight: filter === f.key ? 600 : 400, fontFamily: 'inherit',
                background: filter === f.key ? `${f.color}14` : 'rgba(255,255,255,0.04)',
                border: filter === f.key ? `1px solid ${f.color}35` : '1px solid rgba(255,255,255,0.06)',
                color: filter === f.key ? f.color : '#4a4f72',
                transition: 'all 0.12s',
              }}>{f.label}</button>
            ))}
          </div>

          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '110px 80px 70px 80px 80px 90px 100px 130px',
            gap: 8, padding: '6px 12px', marginBottom: 3, flexShrink: 0,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 8,
          }}>
            {['Phone', 'Plan', 'Amount', 'Provider', 'Status', 'Expires', 'Created', 'Actions'].map(h => (
              <span key={h} style={colHdr}>{h}</span>
            ))}
          </div>

          {/* Table body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Users size={28} style={{ display: 'block', margin: '0 auto 10px', color: '#3a3e5a', opacity: 0.4 }} />
                <div style={{ fontSize: 12.5, color: '#4a4f72' }}>No sessions found</div>
              </div>
            ) : filtered.map(s => {
              const isBusy = action?.id === s.id
              return (
                <div key={s.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 80px 70px 80px 80px 90px 100px 130px',
                  gap: 8, padding: '8px 12px', borderRadius: 8, marginBottom: 2, alignItems: 'center',
                  background: s.status === 'active' ? 'rgba(29,184,20,0.04)' : 'rgba(255,255,255,0.03)',
                  borderLeft: `2px solid ${s.status === 'active' ? '#1DB814' : s.status === 'pending' ? '#f59e0b' : 'rgba(255,255,255,0.10)'}`,
                }}>
                  <span style={{ fontSize: 11, color: '#7b82a8', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={10} />{maskPhone(s.phone)}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: s.plan === '24h' ? '#3b82f6' : '#8b5cf6',
                    background: s.plan === '24h' ? 'rgba(59,130,246,0.10)' : 'rgba(139,92,246,0.10)',
                    borderRadius: 5, padding: '2px 7px', textAlign: 'center',
                  }}>{s.plan}</span>
                  <span style={{ fontSize: 11, color: '#7b82a8' }}>{s.amount} UGX</span>
                  <span style={{ fontSize: 11, color: '#7b82a8' }}>{s.provider}</span>
                  <StatusBadge status={s.status} />
                  <span style={{ fontSize: 11, color: s.status === 'active' ? '#1DB814' : '#4a4f72' }}>
                    {s.status === 'active' ? timeLeft(s.expiresAt) : '—'}
                  </span>
                  <span style={{ fontSize: 10, color: '#3a3e5a' }}>{ts(s.createdAt)}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {s.status === 'active' && (
                      <>
                        <button
                          disabled={isBusy}
                          onClick={() => extendSession(s.id, 6)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                            background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.28)',
                            color: '#3b82f6', fontWeight: 600, fontFamily: 'inherit',
                          }}
                        ><Clock size={9} />+6h</button>
                        <button
                          disabled={isBusy}
                          onClick={() => revokeSession(s.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                            background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)',
                            color: '#ef4444', fontWeight: 600, fontFamily: 'inherit',
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
