import { useEffect, useState, useCallback } from 'react'
import { Ticket, Plus, Trash2, Copy, RefreshCw, CheckCircle, Clock } from 'lucide-react'
import { Voucher } from '../types'

const SERVER = import.meta.env.VITE_SERVER_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '')

interface Props { adminKey: string }

type VFilter = 'all' | 'active' | 'used' | 'revoked'

function ts(ms: number) {
  return new Date(ms).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
}

function timeLeft(ms: number) {
  const diff = ms - Date.now()
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(h / 24)
  return d > 0 ? `${d}d ${h % 24}h` : `${h}h`
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { color: string; bg: string; border: string }> = {
    active:  { color: '#1DB814', bg: 'rgba(29,184,20,0.10)',  border: 'rgba(29,184,20,0.30)'  },
    used:    { color: '#0A84FF', bg: 'rgba(10,132,255,0.10)', border: 'rgba(10,132,255,0.30)' },
    revoked: { color: '#FF453A', bg: 'rgba(255,69,58,0.10)',  border: 'rgba(255,69,58,0.30)'  },
  }
  const c = cfg[status] ?? cfg.revoked
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, color: c.color,
      background: c.bg, border: `0.5px solid ${c.border}`,
      borderRadius: 6, padding: '3px 8px', textTransform: 'uppercase',
    }}>{status}</span>
  )
}

export function VouchersPanel({ adminKey }: Props) {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [filter,   setFilter]   = useState<VFilter>('all')
  const [loading,  setLoading]  = useState(false)
  const [generating, setGenerating] = useState(false)
  const [toast,    setToast]    = useState('')
  const [copied,   setCopied]   = useState('')

  // Generate form state
  const [genPlan,     setGenPlan]     = useState<'6h' | '24h'>('6h')
  const [genQty,      setGenQty]      = useState(1)
  const [genValidity, setGenValidity] = useState(72)

  const fetchVouchers = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    try {
      const r = await fetch(`${SERVER}/api/admin/vouchers?adminKey=${encodeURIComponent(adminKey)}`)
      if (r.ok) setVouchers(await r.json())
    } finally { setLoading(false) }
  }, [adminKey])

  useEffect(() => { fetchVouchers() }, [fetchVouchers])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function generateVouchers() {
    setGenerating(true)
    try {
      const r = await fetch(`${SERVER}/api/admin/vouchers/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey, plan: genPlan, quantity: genQty, validHours: genValidity }),
      })
      const data = await r.json()
      if (r.ok) { showToast(`Generated ${data.generated?.length ?? 0} voucher(s)`); fetchVouchers() }
      else showToast(data.error ?? 'Failed to generate')
    } finally { setGenerating(false) }
  }

  async function revokeVoucher(code: string) {
    const r = await fetch(`${SERVER}/api/admin/vouchers/${code}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey }),
    })
    if (r.ok) { showToast('Voucher revoked'); fetchVouchers() }
    else showToast('Failed to revoke')
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code)
      setTimeout(() => setCopied(''), 2000)
    })
  }

  const filtered = vouchers.filter(v => filter === 'all' || v.status === filter)
  const counts = {
    all:     vouchers.length,
    active:  vouchers.filter(v => v.status === 'active').length,
    used:    vouchers.filter(v => v.status === 'used').length,
    revoked: vouchers.filter(v => v.status === 'revoked').length,
  }

  const inputStyle: React.CSSProperties = {
    background: '#2C2C2E', border: '0.5px solid rgba(84,84,88,0.65)',
    borderRadius: 8, color: '#fff', fontSize: 13, padding: '9px 12px',
    outline: 'none', fontFamily: 'inherit',
  }

  const col: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: '#636366',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>Vouchers</h2>
          <p style={{ fontSize: 12, color: '#636366', margin: '2px 0 0' }}>Generate and manage access vouchers</p>
        </div>
        <button
          onClick={fetchVouchers}
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
        }}>Enter admin key to manage vouchers.</div>
      ) : (
        <>
          {/* Generate form */}
          <div style={{
            padding: '16px 18px', borderRadius: 12, marginBottom: 16, flexShrink: 0,
            background: 'rgba(29,184,20,0.05)', border: '0.5px solid rgba(29,184,20,0.20)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1DB814', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={13} />Generate Vouchers
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>

              {/* Plan */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#636366', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plan</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['6h', '24h'] as const).map(p => (
                    <button key={p} onClick={() => setGenPlan(p)} style={{
                      padding: '7px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600,
                      background: genPlan === p ? 'rgba(29,184,20,0.15)' : 'rgba(84,84,88,0.12)',
                      border: genPlan === p ? '0.5px solid rgba(29,184,20,0.40)' : '0.5px solid rgba(84,84,88,0.36)',
                      color: genPlan === p ? '#1DB814' : '#8E8E93',
                    }}>{p} {p === '6h' ? '(550 UGX)' : '(1,000 UGX)'}</button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#636366', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quantity</span>
                <input
                  type="number" min={1} max={100} value={genQty}
                  onChange={e => setGenQty(Math.min(100, Math.max(1, Number(e.target.value))))}
                  style={{ ...inputStyle, width: 70 }}
                />
              </div>

              {/* Validity */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#636366', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Valid for (hours)</span>
                <input
                  type="number" min={1} max={8760} value={genValidity}
                  onChange={e => setGenValidity(Math.min(8760, Math.max(1, Number(e.target.value))))}
                  style={{ ...inputStyle, width: 80 }}
                />
              </div>

              {/* Generate button */}
              <button
                onClick={generateVouchers}
                disabled={generating}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 20px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  fontWeight: 700, fontFamily: 'inherit',
                  background: generating ? 'rgba(29,184,20,0.15)' : '#1DB814',
                  border: 'none', color: '#fff',
                  opacity: generating ? 0.7 : 1,
                }}
              >
                <Ticket size={14} />
                {generating ? 'Generating…' : `Generate ${genQty}`}
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexShrink: 0 }}>
            {([
              { key: 'all' as VFilter,     label: `All (${counts.all})`,         color: '#8E8E93' },
              { key: 'active' as VFilter,  label: `Active (${counts.active})`,   color: '#1DB814' },
              { key: 'used' as VFilter,    label: `Used (${counts.used})`,       color: '#0A84FF' },
              { key: 'revoked' as VFilter, label: `Revoked (${counts.revoked})`, color: '#FF453A' },
            ]).map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                fontWeight: filter === f.key ? 600 : 400,
                background: filter === f.key ? 'rgba(84,84,88,0.20)' : 'transparent',
                border: filter === f.key ? '0.5px solid rgba(84,84,88,0.50)' : '0.5px solid transparent',
                color: filter === f.key ? f.color : '#636366',
              }}>{f.label}</button>
            ))}
          </div>

          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '140px 60px 80px 80px 110px 110px 1fr',
            gap: 8, padding: '8px 12px', marginBottom: 4, flexShrink: 0,
            background: 'rgba(84,84,88,0.08)', borderRadius: 8,
          }}>
            {['Code', 'Plan', 'Amount', 'Status', 'Valid Until', 'Used At', 'Actions'].map(h => (
              <span key={h} style={col}>{h}</span>
            ))}
          </div>

          {/* Table body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#636366', fontSize: 13 }}>
                <Ticket size={28} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }} />
                {filter === 'all' ? 'No vouchers yet — generate some above' : `No ${filter} vouchers`}
              </div>
            ) : filtered.map(v => (
              <div key={v.code} style={{
                display: 'grid', gridTemplateColumns: '140px 60px 80px 80px 110px 110px 1fr',
                gap: 8, padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                background: v.status === 'active' ? 'rgba(29,184,20,0.04)' : 'rgba(84,84,88,0.06)',
                borderLeft: `2px solid ${v.status === 'active' ? '#1DB814' : v.status === 'used' ? '#0A84FF' : 'rgba(84,84,88,0.4)'}`,
                alignItems: 'center',
              }}>
                {/* Code */}
                <span style={{
                  fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
                  color: v.status === 'active' ? '#fff' : '#8E8E93',
                  letterSpacing: '0.08em',
                }}>{v.code}</span>

                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: v.plan === '24h' ? '#0A84FF' : '#BF5AF2',
                  background: v.plan === '24h' ? 'rgba(10,132,255,0.10)' : 'rgba(191,90,242,0.10)',
                  borderRadius: 5, padding: '2px 8px', textAlign: 'center',
                }}>{v.plan}</span>

                <span style={{ fontSize: 11, color: '#8E8E93' }}>{v.amount} UGX</span>

                <StatusBadge status={v.status} />

                <span style={{ fontSize: 11, color: v.status === 'active' ? '#FF9F0A' : '#48484A', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {v.status === 'active' && <Clock size={10} />}
                  {v.status === 'active' ? timeLeft(v.validUntil) : ts(v.validUntil)}
                </span>

                <span style={{ fontSize: 10, color: '#48484A' }}>
                  {v.usedAt ? ts(v.usedAt) : '—'}
                  {v.usedByPhone && <span style={{ display: 'block', color: '#636366' }}>{v.usedByPhone}</span>}
                </span>

                <div style={{ display: 'flex', gap: 4 }}>
                  {v.status === 'active' && (
                    <>
                      <button onClick={() => copyCode(v.code)} style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                        background: copied === v.code ? 'rgba(29,184,20,0.15)' : 'rgba(84,84,88,0.14)',
                        border: `0.5px solid ${copied === v.code ? 'rgba(29,184,20,0.35)' : 'rgba(84,84,88,0.36)'}`,
                        color: copied === v.code ? '#1DB814' : '#8E8E93', fontWeight: 600,
                      }}>
                        {copied === v.code ? <CheckCircle size={9} /> : <Copy size={9} />}
                        {copied === v.code ? 'Copied' : 'Copy'}
                      </button>
                      <button onClick={() => revokeVoucher(v.code)} style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                        background: 'rgba(255,69,58,0.10)', border: '0.5px solid rgba(255,69,58,0.30)',
                        color: '#FF453A', fontWeight: 600,
                      }}><Trash2 size={9} />Revoke</button>
                    </>
                  )}
                  {v.status !== 'active' && (
                    <button onClick={() => copyCode(v.code)} style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                      padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                      background: 'rgba(84,84,88,0.10)', border: '0.5px solid rgba(84,84,88,0.25)',
                      color: '#636366',
                    }}><Copy size={9} />Copy</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
