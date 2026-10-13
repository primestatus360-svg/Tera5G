import { useEffect, useState, useCallback } from 'react'
import {
  CreditCard, RefreshCw, TrendingUp, CheckCircle,
  XCircle, Loader2, ShieldOff, Clock, Phone, Ticket,
  ArrowDownLeft, Send, ChevronDown, ChevronUp,
} from 'lucide-react'
import { PaymentSessionInfo, WithdrawalRecord } from '../types'

const SERVER = import.meta.env.VITE_SERVER_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '')

interface Props { adminKey: string }
type Filter = 'all' | 'active' | 'pending' | 'failed'

function ts(ms: number) {
  if (!ms) return '—'
  return new Date(ms).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
}
function maskPhone(p: string) {
  if (p.length < 6) return p
  return p.slice(0, 4) + '****' + p.slice(-3)
}
function timeLeft(expiresAt: number) {
  const diff = expiresAt - Date.now()
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
function fmt(n: number) { return n.toLocaleString() }

function StatCard({
  icon, label, value, sub, color = '#7b82a8',
}: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      flex: 1, padding: '14px 16px', borderRadius: 13,
      background: `${color}0d`, border: `1px solid ${color}28`,
      display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1, wordBreak: 'break-all' }}>{value}</div>
        <div style={{ fontSize: 10.5, color: '#4a4f72', marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: '#3a3e5a', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
    active:  { color: '#1DB814', bg: 'rgba(29,184,20,0.10)',  border: 'rgba(29,184,20,0.28)',  icon: <CheckCircle size={10} /> },
    success: { color: '#1DB814', bg: 'rgba(29,184,20,0.10)',  border: 'rgba(29,184,20,0.28)',  icon: <CheckCircle size={10} /> },
    pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.28)', icon: <Loader2 size={10} /> },
    failed:  { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.28)',  icon: <XCircle size={10} /> },
  }
  const c = cfg[status] ?? cfg.failed
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700, color: c.color,
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 6, padding: '2px 7px', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {c.icon}{status}
    </span>
  )
}

const colHdr: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: '#3a3e5a',
  textTransform: 'uppercase', letterSpacing: '0.09em',
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8,
  color: '#e2e5f1', fontSize: 12, padding: '8px 11px',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
}

// ── Withdraw Form ─────────────────────────────────────────────────────────────

function WithdrawPanel({ adminKey }: { adminKey: string }) {
  const [provider,    setProvider]    = useState<'MTN' | 'AIRTEL'>('MTN')
  const [phone,       setPhone]       = useState('')
  const [amount,      setAmount]      = useState('')
  const [note,        setNote]        = useState('')
  const [busy,        setBusy]        = useState(false)
  const [result,      setResult]      = useState<{ ok: boolean; msg: string } | null>(null)
  const [history,     setHistory]     = useState<WithdrawalRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const fetchHistory = useCallback(async () => {
    if (!adminKey) return
    try {
      const r = await fetch(`${SERVER}/api/admin/pay/withdrawals?adminKey=${encodeURIComponent(adminKey)}`)
      if (r.ok) setHistory(await r.json())
    } catch { /* ignore */ }
  }, [adminKey])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  async function submit() {
    const p = phone.trim()
    const a = parseFloat(amount)
    if (!p || isNaN(a) || a <= 0) {
      setResult({ ok: false, msg: 'Enter a valid phone number and amount.' })
      return
    }
    setBusy(true); setResult(null)
    try {
      const r = await fetch(`${SERVER}/api/admin/pay/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey, phone: p, amount: a, provider, note: note.trim() }),
      })
      const data = await r.json() as { ok?: boolean; txRef?: string; error?: string }
      if (data.ok) {
        setResult({ ok: true, msg: `Sent ${fmt(a)} UGX to ${p} via ${provider}${data.txRef ? ` — ref: ${data.txRef}` : ''}` })
        setPhone(''); setAmount(''); setNote('')
        fetchHistory(); setShowHistory(true)
      } else {
        setResult({ ok: false, msg: data.error ?? 'Withdrawal failed.' })
      }
    } catch {
      setResult({ ok: false, msg: 'Network error — could not reach server.' })
    } finally { setBusy(false) }
  }

  const mtn    = provider === 'MTN'
  const airtel = provider === 'AIRTEL'

  return (
    <div style={{
      background: '#191b30', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '18px 20px', marginBottom: 16, flexShrink: 0,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #10b981, transparent)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ArrowDownLeft size={14} color="#10b981" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e5f1', letterSpacing: '-0.01em' }}>Withdraw Funds</div>
          <div style={{ fontSize: 11, color: '#4a4f72' }}>Send money from Yo! account to any mobile number</div>
        </div>
      </div>

      {/* Provider selector */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#4a4f72', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7 }}>Provider</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setProvider('MTN')} style={{
            flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer', fontWeight: 700,
            fontSize: 12, transition: 'all 0.12s', fontFamily: 'inherit',
            background: mtn ? 'rgba(255,204,0,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${mtn ? '#FFCC00' : 'rgba(255,255,255,0.08)'}`,
            color: mtn ? '#FFCC00' : '#4a4f72',
          }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>●</div>
            MTN Mobile Money
          </button>
          <button onClick={() => setProvider('AIRTEL')} style={{
            flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer', fontWeight: 700,
            fontSize: 12, transition: 'all 0.12s', fontFamily: 'inherit',
            background: airtel ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${airtel ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
            color: airtel ? '#ef4444' : '#4a4f72',
          }}>
            <div style={{ fontSize: 16, marginBottom: 2 }}>●</div>
            Airtel Money
          </button>
        </div>
      </div>

      {/* Inputs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 180px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#4a4f72', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 5 }}>Recipient Phone</div>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="07XXXXXXXX or 256…" style={inputStyle} />
        </div>
        <div style={{ flex: '0 0 130px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#4a4f72', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 5 }}>Amount (UGX)</div>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="e.g. 5000" min={1} style={inputStyle} />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#4a4f72', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 5 }}>Note (optional)</div>
          <input type="text" value={note} onChange={e => setNote(e.target.value)}
            placeholder="e.g. Refund for session #123" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={submit} disabled={busy} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 20px', borderRadius: 10, fontSize: 13, cursor: busy ? 'not-allowed' : 'pointer',
          fontWeight: 700, fontFamily: 'inherit', opacity: busy ? 0.6 : 1,
          background: provider === 'MTN' ? 'rgba(255,204,0,0.14)' : 'rgba(239,68,68,0.14)',
          border: `1px solid ${provider === 'MTN' ? 'rgba(255,204,0,0.45)' : 'rgba(239,68,68,0.45)'}`,
          color: provider === 'MTN' ? '#FFCC00' : '#ef4444',
        }}>
          {busy ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
          {busy ? 'Sending…' : `Send via ${provider}`}
        </button>

        {history.length > 0 && (
          <button onClick={() => setShowHistory(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '9px 13px', borderRadius: 10, fontSize: 12, cursor: 'pointer',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#7b82a8', fontFamily: 'inherit',
          }}>
            {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            History ({history.length})
          </button>
        )}
      </div>

      {result && (
        <div style={{
          marginTop: 11, padding: '8px 13px', borderRadius: 8,
          background: result.ok ? 'rgba(29,184,20,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${result.ok ? 'rgba(29,184,20,0.25)' : 'rgba(239,68,68,0.25)'}`,
          color: result.ok ? '#1DB814' : '#ef4444', fontSize: 12,
        }}>{result.msg}</div>
      )}

      {showHistory && history.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#3a3e5a', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7 }}>
            Recent Withdrawals
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: '80px 120px 100px 80px 70px 130px',
            gap: 8, padding: '5px 10px', marginBottom: 3,
            background: 'rgba(255,255,255,0.03)', borderRadius: 6,
          }}>
            {['Provider', 'Phone', 'Amount', 'Status', 'Tx Ref', 'Date'].map(h => (
              <span key={h} style={colHdr}>{h}</span>
            ))}
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {history.map(w => (
              <div key={w.id} style={{
                display: 'grid', gridTemplateColumns: '80px 120px 100px 80px 70px 130px',
                gap: 8, padding: '7px 10px', borderRadius: 7, marginBottom: 2,
                background: w.status === 'success' ? 'rgba(29,184,20,0.04)' : w.status === 'failed' ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.03)',
                borderLeft: `2px solid ${w.status === 'success' ? '#1DB814' : w.status === 'failed' ? '#ef4444' : '#f59e0b'}`,
                alignItems: 'center',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: w.provider === 'MTN' ? '#FFCC00' : '#ef4444' }}>{w.provider}</span>
                <span style={{ fontSize: 11, color: '#7b82a8', fontFamily: 'monospace' }}>{maskPhone(w.phone)}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e5f1' }}>
                  {fmt(w.amount)} <span style={{ fontSize: 9, color: '#4a4f72' }}>UGX</span>
                </span>
                <StatusBadge status={w.status} />
                <span style={{ fontSize: 10, color: '#3a3e5a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {w.txRef || (w.error ? '✗ err' : '—')}
                </span>
                <span style={{ fontSize: 10, color: '#3a3e5a' }}>{ts(w.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function PaymentsPanel({ adminKey }: Props) {
  const [sessions, setSessions] = useState<PaymentSessionInfo[]>([])
  const [filter,   setFilter]   = useState<Filter>('all')
  const [loading,  setLoading]  = useState(false)
  const [action,   setAction]   = useState<{ id: string; type: string } | null>(null)
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null)

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

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 3000)
  }

  async function revokeSession(id: string) {
    setAction({ id, type: 'revoke' })
    try {
      const r = await fetch(`${SERVER}/api/admin/pay/sessions/${id}/revoke`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey }),
      })
      if (r.ok) { showToast('Session revoked'); fetchSessions() }
      else showToast('Failed to revoke', false)
    } finally { setAction(null) }
  }

  async function extendSession(id: string, hours: number) {
    setAction({ id, type: 'extend' })
    try {
      const r = await fetch(`${SERVER}/api/admin/pay/sessions/${id}/extend`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey, hours }),
      })
      if (r.ok) { showToast(`Extended by ${hours}h`); fetchSessions() }
      else showToast('Failed to extend', false)
    } finally { setAction(null) }
  }

  const active   = sessions.filter(s => s.status === 'active')
  const pending  = sessions.filter(s => s.status === 'pending')
  const failed   = sessions.filter(s => s.status === 'failed')
  const revenue  = active.reduce((sum, s) => sum + s.amount, 0)
  const totalRevenue = sessions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0)
    + sessions.filter(s => s.status === 'failed' && s.transactionRef).reduce((sum, s) => sum + s.amount, 0)
  const filtered = sessions.filter(s => filter === 'all' || s.status === filter)

  const filterTabs: { key: Filter; label: string; color: string; count: number }[] = [
    { key: 'all',     label: 'All',     color: '#7b82a8', count: sessions.length },
    { key: 'active',  label: 'Active',  color: '#1DB814', count: active.length   },
    { key: 'pending', label: 'Pending', color: '#f59e0b', count: pending.length  },
    { key: 'failed',  label: 'Failed',  color: '#ef4444', count: failed.length   },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Panel header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CreditCard size={17} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e5f1', letterSpacing: '-0.02em' }}>Payments</div>
            <div style={{ fontSize: 11, color: '#4a4f72', marginTop: 2 }}>Mobile money transactions and session management</div>
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
          background: toast.ok ? 'rgba(29,184,20,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${toast.ok ? 'rgba(29,184,20,0.25)' : 'rgba(239,68,68,0.25)'}`,
          color: toast.ok ? '#1DB814' : '#ef4444', fontSize: 12,
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          {toast.ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
          {toast.msg}
        </div>
      )}

      {!adminKey ? (
        <div style={{
          padding: '18px 22px', borderRadius: 12,
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)',
          color: '#ef4444', fontSize: 13,
        }}>Enter admin key in the top bar to view payment data.</div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Withdraw panel */}
          <WithdrawPanel adminKey={adminKey} />

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexShrink: 0, flexWrap: 'wrap' }}>
            <StatCard icon={<TrendingUp size={15} color="#1DB814" />} label="Revenue (active)"    value={`${fmt(revenue)} UGX`} color="#1DB814" />
            <StatCard icon={<CheckCircle size={15} color="#1DB814" />} label="Active Sessions"    value={active.length} sub={`${active.filter(s => s.expiresAt > Date.now()).length} not expired`} color="#1DB814" />
            <StatCard icon={<Loader2 size={15} color="#f59e0b" />}    label="Pending"             value={pending.length} sub="awaiting payment" color="#f59e0b" />
            <StatCard icon={<XCircle size={15} color="#ef4444" />}    label="Failed / Revoked"    value={failed.length} color="#ef4444" />
            <StatCard icon={<CreditCard size={15} color="#3b82f6" />} label="Total Transactions"  value={sessions.length} sub={`${fmt(totalRevenue)} UGX`} color="#3b82f6" />
          </div>

          {/* Plan + provider breakdown */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexShrink: 0, flexWrap: 'wrap' }}>
            {(['6h', '24h'] as const).map(plan => {
              const ps  = active.filter(s => s.plan === plan)
              const rev = ps.reduce((sum, s) => sum + s.amount, 0)
              const color = plan === '6h' ? '#8b5cf6' : '#3b82f6'
              return (
                <div key={plan} style={{
                  flex: 1, padding: '12px 14px', borderRadius: 12, minWidth: 120,
                  background: `${color}0d`, border: `1px solid ${color}28`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Ticket size={14} color={color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color, lineHeight: 1 }}>{ps.length}</div>
                    <div style={{ fontSize: 10.5, color: '#4a4f72', marginTop: 2 }}>{plan} plan · {fmt(rev)} UGX</div>
                  </div>
                </div>
              )
            })}
            {['MTN', 'AIRTEL'].map(prov => {
              const ps    = active.filter(s => s.provider === prov)
              const color = prov === 'MTN' ? '#FFCC00' : '#ef4444'
              return (
                <div key={prov} style={{
                  flex: 1, padding: '12px 14px', borderRadius: 12, minWidth: 120,
                  background: `${color}0d`, border: `1px solid ${color}28`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Phone size={13} color={color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800, color, lineHeight: 1 }}>{ps.length}</div>
                    <div style={{ fontSize: 10.5, color: '#4a4f72', marginTop: 2 }}>{prov} · {fmt(ps.reduce((s, x) => s + x.amount, 0))} UGX</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexShrink: 0, flexWrap: 'wrap' }}>
            {filterTabs.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '5px 13px', borderRadius: 99, fontSize: 11.5, cursor: 'pointer',
                fontWeight: filter === f.key ? 600 : 400, fontFamily: 'inherit',
                background: filter === f.key ? `${f.color}14` : 'rgba(255,255,255,0.04)',
                border: filter === f.key ? `1px solid ${f.color}35` : '1px solid rgba(255,255,255,0.06)',
                color: filter === f.key ? f.color : '#4a4f72',
              }}>{f.label} ({f.count})</button>
            ))}
          </div>

          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '36px 110px 70px 70px 80px 80px 90px 110px 140px',
            gap: 8, padding: '6px 12px', marginBottom: 3, flexShrink: 0,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 8,
          }}>
            {['', 'Phone', 'Plan', 'Amount', 'Provider', 'Status', 'Time Left', 'Created', 'Actions'].map(h => (
              <span key={h} style={colHdr}>{h}</span>
            ))}
          </div>

          {/* Table body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <CreditCard size={28} style={{ display: 'block', margin: '0 auto 12px', color: '#3a3e5a', opacity: 0.4 }} />
                <div style={{ fontSize: 12.5, color: '#4a4f72' }}>No transactions found</div>
              </div>
            ) : filtered.map(s => {
              const isBusy   = action?.id === s.id
              const isActive = s.status === 'active'
              const expired  = isActive && s.expiresAt < Date.now()
              const accent   = s.status === 'active' ? (expired ? '#f59e0b' : '#1DB814')
                : s.status === 'pending' ? '#f59e0b' : 'rgba(255,255,255,0.10)'

              return (
                <div key={s.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 110px 70px 70px 80px 80px 90px 110px 140px',
                  gap: 8, padding: '8px 12px', borderRadius: 8, marginBottom: 2, alignItems: 'center',
                  background: isActive && !expired ? 'rgba(29,184,20,0.04)' : 'rgba(255,255,255,0.03)',
                  borderLeft: `2px solid ${accent}`,
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: s.provider === 'MTN' ? 'rgba(255,204,0,0.12)' : 'rgba(239,68,68,0.12)',
                  }}>
                    <Phone size={12} color={s.provider === 'MTN' ? '#FFCC00' : '#ef4444'} />
                  </div>
                  <span style={{ fontSize: 12, color: '#7b82a8', fontFamily: 'monospace' }}>{maskPhone(s.phone)}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, textAlign: 'center',
                    color: s.plan === '24h' ? '#3b82f6' : '#8b5cf6',
                    background: s.plan === '24h' ? 'rgba(59,130,246,0.10)' : 'rgba(139,92,246,0.10)',
                    borderRadius: 5, padding: '2px 7px',
                  }}>{s.plan}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e5f1' }}>
                    {fmt(s.amount)}<span style={{ fontSize: 9, color: '#4a4f72', marginLeft: 2 }}>UGX</span>
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.provider === 'MTN' ? '#FFCC00' : '#ef4444' }}>{s.provider}</span>
                  <StatusBadge status={expired ? 'failed' : s.status} />
                  <span style={{ fontSize: 11, color: isActive && !expired ? '#1DB814' : '#4a4f72', display: 'flex', alignItems: 'center', gap: 3 }}>
                    {isActive && <Clock size={10} />}
                    {isActive ? timeLeft(s.expiresAt) : '—'}
                  </span>
                  <span style={{ fontSize: 10, color: '#3a3e5a' }}>{ts(s.createdAt)}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {isActive && !expired && (
                      <>
                        <button disabled={isBusy} onClick={() => extendSession(s.id, 6)} title="+6h" style={{
                          display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 6,
                          fontSize: 10, cursor: 'pointer', background: 'rgba(59,130,246,0.10)',
                          border: '1px solid rgba(59,130,246,0.28)', color: '#3b82f6', fontWeight: 600,
                          whiteSpace: 'nowrap', fontFamily: 'inherit',
                        }}><Clock size={9} />+6h</button>
                        <button disabled={isBusy} onClick={() => extendSession(s.id, 24)} title="+24h" style={{
                          display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 6,
                          fontSize: 10, cursor: 'pointer', background: 'rgba(59,130,246,0.06)',
                          border: '1px solid rgba(59,130,246,0.18)', color: '#3b82f6', fontWeight: 600,
                          whiteSpace: 'nowrap', fontFamily: 'inherit',
                        }}><Clock size={9} />+24h</button>
                        <button disabled={isBusy} onClick={() => revokeSession(s.id)} title="Revoke" style={{
                          display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 6,
                          fontSize: 10, cursor: 'pointer', background: 'rgba(239,68,68,0.10)',
                          border: '1px solid rgba(239,68,68,0.28)', color: '#ef4444', fontWeight: 600,
                          fontFamily: 'inherit',
                        }}><ShieldOff size={9} /></button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
