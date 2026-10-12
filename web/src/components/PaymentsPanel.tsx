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
  icon, label, value, sub, color = '#8E8E93',
}: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      flex: 1, padding: '16px 18px', borderRadius: 14,
      background: '#1C1C1E', border: '0.5px solid rgba(84,84,88,0.50)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: `${color}1A`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: '#636366', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#48484A', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
    active:  { color: '#1DB814', bg: 'rgba(29,184,20,0.10)',  border: 'rgba(29,184,20,0.30)',  icon: <CheckCircle size={10} /> },
    success: { color: '#1DB814', bg: 'rgba(29,184,20,0.10)',  border: 'rgba(29,184,20,0.30)',  icon: <CheckCircle size={10} /> },
    pending: { color: '#FF9F0A', bg: 'rgba(255,159,10,0.10)', border: 'rgba(255,159,10,0.30)', icon: <Loader2 size={10} /> },
    failed:  { color: '#FF453A', bg: 'rgba(255,69,58,0.10)',  border: 'rgba(255,69,58,0.30)',  icon: <XCircle size={10} /> },
  }
  const c = cfg[status] ?? cfg.failed
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700, color: c.color,
      background: c.bg, border: `0.5px solid ${c.border}`,
      borderRadius: 6, padding: '3px 8px', textTransform: 'uppercase', whiteSpace: 'nowrap',
    }}>
      {c.icon}{status}
    </span>
  )
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
    setBusy(true)
    setResult(null)
    try {
      const r = await fetch(`${SERVER}/api/admin/pay/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey, phone: p, amount: a, provider, note: note.trim() }),
      })
      const data = await r.json() as { ok?: boolean; txRef?: string; error?: string }
      if (data.ok) {
        setResult({ ok: true, msg: `Sent ${fmt(a)} UGX to ${p} via ${provider}${data.txRef ? ` — ref: ${data.txRef}` : ''}` })
        setPhone('')
        setAmount('')
        setNote('')
        fetchHistory()
        setShowHistory(true)
      } else {
        setResult({ ok: false, msg: data.error ?? 'Withdrawal failed.' })
      }
    } catch {
      setResult({ ok: false, msg: 'Network error — could not reach server.' })
    } finally {
      setBusy(false)
    }
  }

  const mtn    = provider === 'MTN'
  const airtel = provider === 'AIRTEL'

  return (
    <div style={{
      background: '#1C1C1E', border: '0.5px solid rgba(84,84,88,0.50)',
      borderRadius: 14, padding: '18px 20px', marginBottom: 18, flexShrink: 0,
    }}>
      {/* Section title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, background: 'rgba(48,209,88,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ArrowDownLeft size={14} color="#30D158" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Withdraw Funds</div>
          <div style={{ fontSize: 11, color: '#636366' }}>Send money from your Yo! account to any mobile number</div>
        </div>
      </div>

      {/* Provider selector */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#636366', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>
          Provider
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setProvider('MTN')}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontWeight: 700,
              fontSize: 13, transition: 'all 0.12s',
              background: mtn ? 'rgba(255,204,0,0.14)' : 'rgba(84,84,88,0.10)',
              border: `1.5px solid ${mtn ? '#FFCC00' : 'rgba(84,84,88,0.30)'}`,
              color: mtn ? '#FFCC00' : '#636366',
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 2 }}>●</div>
            MTN Mobile Money
          </button>
          <button
            onClick={() => setProvider('AIRTEL')}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontWeight: 700,
              fontSize: 13, transition: 'all 0.12s',
              background: airtel ? 'rgba(239,68,68,0.14)' : 'rgba(84,84,88,0.10)',
              border: `1.5px solid ${airtel ? '#EF4444' : 'rgba(84,84,88,0.30)'}`,
              color: airtel ? '#EF4444' : '#636366',
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 2 }}>●</div>
            Airtel Money
          </button>
        </div>
      </div>

      {/* Inputs row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: '0 0 180px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#636366', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
            Recipient Phone
          </div>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="07XXXXXXXX or 256…"
            style={{
              width: '100%', background: '#2C2C2E',
              border: '0.5px solid rgba(84,84,88,0.50)', borderRadius: 8,
              color: '#fff', fontSize: 13, padding: '9px 12px', outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ flex: '0 0 130px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#636366', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
            Amount (UGX)
          </div>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="e.g. 5000"
            min={1}
            style={{
              width: '100%', background: '#2C2C2E',
              border: '0.5px solid rgba(84,84,88,0.50)', borderRadius: 8,
              color: '#fff', fontSize: 13, padding: '9px 12px', outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#636366', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
            Note (optional)
          </div>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. Refund for session #123"
            style={{
              width: '100%', background: '#2C2C2E',
              border: '0.5px solid rgba(84,84,88,0.50)', borderRadius: 8,
              color: '#fff', fontSize: 13, padding: '9px 12px', outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={submit}
          disabled={busy}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 22px', borderRadius: 10, fontSize: 13, cursor: busy ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontFamily: 'inherit', opacity: busy ? 0.6 : 1,
            background: provider === 'MTN' ? 'rgba(255,204,0,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${provider === 'MTN' ? 'rgba(255,204,0,0.50)' : 'rgba(239,68,68,0.50)'}`,
            color: provider === 'MTN' ? '#FFCC00' : '#EF4444',
          }}
        >
          {busy
            ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            : <Send size={14} />
          }
          {busy ? 'Sending…' : `Send via ${provider}`}
        </button>

        {/* Withdrawal history toggle */}
        {history.length > 0 && (
          <button
            onClick={() => setShowHistory(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '10px 14px', borderRadius: 10, fontSize: 12, cursor: 'pointer',
              background: 'rgba(84,84,88,0.12)', border: '0.5px solid rgba(84,84,88,0.36)',
              color: '#8E8E93', fontFamily: 'inherit',
            }}
          >
            {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            History ({history.length})
          </button>
        )}
      </div>

      {/* Result message */}
      {result && (
        <div style={{
          marginTop: 12,
          padding: '9px 14px', borderRadius: 8,
          background: result.ok ? 'rgba(29,184,20,0.08)' : 'rgba(255,69,58,0.08)',
          border: `0.5px solid ${result.ok ? 'rgba(29,184,20,0.30)' : 'rgba(255,69,58,0.30)'}`,
          color: result.ok ? '#1DB814' : '#FF453A', fontSize: 12,
        }}>{result.msg}</div>
      )}

      {/* Withdrawal history table */}
      {showHistory && history.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#48484A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Recent Withdrawals
          </div>

          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '80px 120px 100px 80px 70px 130px',
            gap: 8, padding: '5px 10px', marginBottom: 3,
            background: 'rgba(84,84,88,0.08)', borderRadius: 6,
          }}>
            {['Provider', 'Phone', 'Amount', 'Status', 'Tx Ref', 'Date'].map(h => (
              <span key={h} style={{ fontSize: 9, fontWeight: 600, color: '#48484A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>

          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {history.map(w => (
              <div key={w.id} style={{
                display: 'grid', gridTemplateColumns: '80px 120px 100px 80px 70px 130px',
                gap: 8, padding: '7px 10px', borderRadius: 6, marginBottom: 2,
                background: w.status === 'success'
                  ? 'rgba(29,184,20,0.04)'
                  : w.status === 'failed' ? 'rgba(255,69,58,0.04)' : 'rgba(84,84,88,0.06)',
                borderLeft: `2px solid ${w.status === 'success' ? '#1DB814' : w.status === 'failed' ? '#FF453A' : '#FF9F0A'}`,
                alignItems: 'center',
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: w.provider === 'MTN' ? '#FFCC00' : '#EF4444',
                }}>{w.provider}</span>
                <span style={{ fontSize: 11, color: '#8E8E93', fontFamily: 'monospace' }}>{maskPhone(w.phone)}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
                  {fmt(w.amount)} <span style={{ fontSize: 9, color: '#636366' }}>UGX</span>
                </span>
                <StatusBadge status={w.status} />
                <span style={{ fontSize: 10, color: '#48484A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {w.txRef || (w.error ? '✗ err' : '—')}
                </span>
                <span style={{ fontSize: 10, color: '#48484A' }}>{ts(w.createdAt)}</span>
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
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
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

  const active  = sessions.filter(s => s.status === 'active')
  const pending = sessions.filter(s => s.status === 'pending')
  const failed  = sessions.filter(s => s.status === 'failed')
  const revenue = active.reduce((sum, s) => sum + s.amount, 0)
  const totalRevenue = sessions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.amount, 0)
    + sessions.filter(s => s.status === 'failed' && s.transactionRef).reduce((sum, s) => sum + s.amount, 0)

  const filtered = sessions.filter(s => filter === 'all' || s.status === filter)

  const filterBtns: { key: Filter; label: string; color: string; count: number }[] = [
    { key: 'all',     label: 'All',     color: '#8E8E93', count: sessions.length },
    { key: 'active',  label: 'Active',  color: '#1DB814', count: active.length   },
    { key: 'pending', label: 'Pending', color: '#FF9F0A', count: pending.length  },
    { key: 'failed',  label: 'Failed',  color: '#FF453A', count: failed.length   },
  ]

  const col: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, color: '#636366',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>Payments</h2>
          <p style={{ fontSize: 12, color: '#636366', margin: '2px 0 0' }}>
            Mobile money transactions, session management, and fund withdrawals
          </p>
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
          padding: '10px 16px', borderRadius: 8, marginBottom: 14, flexShrink: 0,
          background: toast.ok ? 'rgba(29,184,20,0.10)' : 'rgba(255,69,58,0.10)',
          border: `0.5px solid ${toast.ok ? 'rgba(29,184,20,0.30)' : 'rgba(255,69,58,0.30)'}`,
          color: toast.ok ? '#1DB814' : '#FF453A', fontSize: 13,
        }}>{toast.msg}</div>
      )}

      {!adminKey ? (
        <div style={{
          padding: '20px 24px', borderRadius: 12,
          background: 'rgba(255,69,58,0.06)', border: '0.5px solid rgba(255,69,58,0.25)',
          color: '#FF453A', fontSize: 13,
        }}>Enter admin key to view payment data.</div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Withdraw panel */}
          <WithdrawPanel adminKey={adminKey} />

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexShrink: 0 }}>
            <StatCard
              icon={<TrendingUp size={16} color="#1DB814" />}
              label="Total Revenue (active)"
              value={`${fmt(revenue)} UGX`}
              color="#1DB814"
            />
            <StatCard
              icon={<CheckCircle size={16} color="#1DB814" />}
              label="Active Sessions"
              value={active.length}
              sub={`${active.filter(s => s.expiresAt > Date.now()).length} not yet expired`}
              color="#1DB814"
            />
            <StatCard
              icon={<Loader2 size={16} color="#FF9F0A" />}
              label="Pending"
              value={pending.length}
              sub="awaiting payment"
              color="#FF9F0A"
            />
            <StatCard
              icon={<XCircle size={16} color="#FF453A" />}
              label="Failed / Revoked"
              value={failed.length}
              color="#FF453A"
            />
            <StatCard
              icon={<CreditCard size={16} color="#0A84FF" />}
              label="Total Transactions"
              value={sessions.length}
              sub={`${fmt(totalRevenue)} UGX collected`}
              color="#0A84FF"
            />
          </div>

          {/* Plan + provider breakdown */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexShrink: 0 }}>
            {(['6h', '24h'] as const).map(plan => {
              const planSessions = active.filter(s => s.plan === plan)
              const planRevenue  = planSessions.reduce((sum, s) => sum + s.amount, 0)
              return (
                <div key={plan} style={{
                  flex: 1, padding: '12px 16px', borderRadius: 12,
                  background: plan === '6h' ? 'rgba(191,90,242,0.06)' : 'rgba(10,132,255,0.06)',
                  border: `0.5px solid ${plan === '6h' ? 'rgba(191,90,242,0.25)' : 'rgba(10,132,255,0.25)'}`,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: plan === '6h' ? 'rgba(191,90,242,0.15)' : 'rgba(10,132,255,0.15)',
                  }}>
                    <Ticket size={15} color={plan === '6h' ? '#BF5AF2' : '#0A84FF'} />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: plan === '6h' ? '#BF5AF2' : '#0A84FF', lineHeight: 1 }}>
                      {planSessions.length}
                    </div>
                    <div style={{ fontSize: 11, color: '#636366', marginTop: 2 }}>
                      {plan} plan · {fmt(planRevenue)} UGX
                    </div>
                  </div>
                </div>
              )
            })}

            {['MTN', 'AIRTEL'].map(prov => {
              const ps    = active.filter(s => s.provider === prov)
              const color = prov === 'MTN' ? '#FFCC00' : '#EF4444'
              return (
                <div key={prov} style={{
                  flex: 1, padding: '12px 16px', borderRadius: 12,
                  background: `${color}0D`, border: `0.5px solid ${color}40`,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${color}20`,
                  }}>
                    <Phone size={14} color={color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{ps.length}</div>
                    <div style={{ fontSize: 11, color: '#636366', marginTop: 2 }}>
                      {prov} · {fmt(ps.reduce((s, x) => s + x.amount, 0))} UGX
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexShrink: 0 }}>
            {filterBtns.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                fontWeight: filter === f.key ? 600 : 400,
                background: filter === f.key ? 'rgba(84,84,88,0.20)' : 'transparent',
                border: filter === f.key ? '0.5px solid rgba(84,84,88,0.50)' : '0.5px solid transparent',
                color: filter === f.key ? f.color : '#636366',
              }}>{f.label} ({f.count})</button>
            ))}
          </div>

          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '36px 110px 70px 70px 80px 80px 90px 110px 140px',
            gap: 8, padding: '7px 12px', marginBottom: 4, flexShrink: 0,
            background: 'rgba(84,84,88,0.08)', borderRadius: 8,
          }}>
            {['', 'Phone', 'Plan', 'Amount', 'Provider', 'Status', 'Time Left', 'Created', 'Actions'].map(h => (
              <span key={h} style={col}>{h}</span>
            ))}
          </div>

          {/* Table body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <CreditCard size={30} style={{ display: 'block', margin: '0 auto 12px', color: '#48484A' }} />
                <div style={{ fontSize: 13, color: '#636366' }}>No transactions found</div>
              </div>
            ) : filtered.map(s => {
              const isBusy   = action?.id === s.id
              const isActive = s.status === 'active'
              const expired  = isActive && s.expiresAt < Date.now()
              const accent   = s.status === 'active' ? (expired ? '#FF9F0A' : '#1DB814')
                : s.status === 'pending' ? '#FF9F0A' : 'rgba(84,84,88,0.4)'

              return (
                <div key={s.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 110px 70px 70px 80px 80px 90px 110px 140px',
                  gap: 8, padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                  background: isActive && !expired ? 'rgba(29,184,20,0.04)' : 'rgba(84,84,88,0.06)',
                  borderLeft: `2px solid ${accent}`,
                  alignItems: 'center',
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: s.provider === 'MTN' ? 'rgba(255,204,0,0.12)' : 'rgba(239,68,68,0.12)',
                  }}>
                    <Phone size={12} color={s.provider === 'MTN' ? '#FFCC00' : '#EF4444'} />
                  </div>

                  <span style={{ fontSize: 12, color: '#8E8E93', fontFamily: 'monospace' }}>
                    {maskPhone(s.phone)}
                  </span>

                  <span style={{
                    fontSize: 11, fontWeight: 700, textAlign: 'center',
                    color: s.plan === '24h' ? '#0A84FF' : '#BF5AF2',
                    background: s.plan === '24h' ? 'rgba(10,132,255,0.10)' : 'rgba(191,90,242,0.10)',
                    borderRadius: 5, padding: '2px 7px',
                  }}>{s.plan}</span>

                  <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
                    {fmt(s.amount)}
                    <span style={{ fontSize: 9, color: '#636366', marginLeft: 2 }}>UGX</span>
                  </span>

                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: s.provider === 'MTN' ? '#FFCC00' : '#EF4444',
                  }}>{s.provider}</span>

                  <StatusBadge status={expired ? 'failed' : s.status} />

                  <span style={{
                    fontSize: 11,
                    color: isActive && !expired ? '#1DB814' : '#636366',
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    {isActive && <Clock size={10} />}
                    {isActive ? timeLeft(s.expiresAt) : '—'}
                  </span>

                  <span style={{ fontSize: 10, color: '#48484A' }}>{ts(s.createdAt)}</span>

                  <div style={{ display: 'flex', gap: 4 }}>
                    {isActive && !expired && (
                      <>
                        <button
                          disabled={isBusy}
                          onClick={() => extendSession(s.id, 6)}
                          title="Extend by 6 hours"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                            background: 'rgba(10,132,255,0.10)', border: '0.5px solid rgba(10,132,255,0.30)',
                            color: '#0A84FF', fontWeight: 600, whiteSpace: 'nowrap',
                          }}
                        ><Clock size={9} />+6h</button>
                        <button
                          disabled={isBusy}
                          onClick={() => extendSession(s.id, 24)}
                          title="Extend by 24 hours"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                            background: 'rgba(10,132,255,0.08)', border: '0.5px solid rgba(10,132,255,0.20)',
                            color: '#0A84FF', fontWeight: 600, whiteSpace: 'nowrap',
                          }}
                        ><Clock size={9} />+24h</button>
                        <button
                          disabled={isBusy}
                          onClick={() => revokeSession(s.id)}
                          title="Revoke session"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                            background: 'rgba(255,69,58,0.10)', border: '0.5px solid rgba(255,69,58,0.30)',
                            color: '#FF453A', fontWeight: 600,
                          }}
                        ><ShieldOff size={9} /></button>
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
