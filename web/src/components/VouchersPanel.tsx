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
    active:  { color: '#1DB814', bg: 'rgba(29,184,20,0.10)',   border: 'rgba(29,184,20,0.28)'  },
    used:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.28)' },
    revoked: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.28)'  },
  }
  const c = cfg[status] ?? cfg.revoked
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, color: c.color,
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 6, padding: '2px 7px', textTransform: 'uppercase',
    }}>{status}</span>
  )
}

const colHdr: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: '#3a3e5a',
  textTransform: 'uppercase', letterSpacing: '0.09em',
}

export function VouchersPanel({ adminKey }: Props) {
  const [vouchers,    setVouchers]    = useState<Voucher[]>([])
  const [filter,      setFilter]      = useState<VFilter>('all')
  const [loading,     setLoading]     = useState(false)
  const [generating,  setGenerating]  = useState(false)
  const [toast,       setToast]       = useState('')
  const [copied,      setCopied]      = useState('')
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
    setToast(msg); setTimeout(() => setToast(''), 3000)
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
      setCopied(code); setTimeout(() => setCopied(''), 2000)
    })
  }

  const filtered = vouchers.filter(v => filter === 'all' || v.status === filter)
  const counts = {
    all:     vouchers.length,
    active:  vouchers.filter(v => v.status === 'active').length,
    used:    vouchers.filter(v => v.status === 'used').length,
    revoked: vouchers.filter(v => v.status === 'revoked').length,
  }

  const filterTabs: { key: VFilter; label: string; color: string }[] = [
    { key: 'all',     label: `All (${counts.all})`,         color: '#7b82a8' },
    { key: 'active',  label: `Active (${counts.active})`,   color: '#1DB814' },
    { key: 'used',    label: `Used (${counts.used})`,       color: '#3b82f6' },
    { key: 'revoked', label: `Revoked (${counts.revoked})`, color: '#ef4444' },
  ]

  const inputStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 8, color: '#e2e5f1', fontSize: 12, padding: '8px 11px',
    outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Panel header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Ticket size={17} color="#f97316" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e5f1', letterSpacing: '-0.02em' }}>Vouchers</div>
            <div style={{ fontSize: 11, color: '#4a4f72', marginTop: 2 }}>Generate and manage access vouchers</div>
          </div>
        </div>
        <button
          onClick={fetchVouchers}
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
          <CheckCircle size={13} />
          {toast}
        </div>
      )}

      {!adminKey ? (
        <div style={{
          padding: '18px 22px', borderRadius: 12,
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)',
          color: '#ef4444', fontSize: 13,
        }}>Enter admin key in the top bar to manage vouchers.</div>
      ) : (
        <>
          {/* ── Generate form ── */}
          <div style={{
            padding: '16px 18px', borderRadius: 14, marginBottom: 16, flexShrink: 0,
            background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.18)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* accent strip */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #f97316, transparent)' }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f97316', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Plus size={13} />Generate Vouchers
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>

              {/* Plan */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, color: '#4a4f72', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Plan</span>
                <div style={{ display: 'flex', gap: 5 }}>
                  {(['6h', '24h'] as const).map(p => (
                    <button key={p} onClick={() => setGenPlan(p)} style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600,
                      background: genPlan === p ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
                      border: genPlan === p ? '1px solid rgba(249,115,22,0.40)' : '1px solid rgba(255,255,255,0.07)',
                      color: genPlan === p ? '#f97316' : '#7b82a8',
                      fontFamily: 'inherit',
                    }}>{p} {p === '6h' ? '(550 UGX)' : '(1,000 UGX)'}</button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, color: '#4a4f72', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Qty</span>
                <input
                  type="number" min={1} max={100} value={genQty}
                  onChange={e => setGenQty(Math.min(100, Math.max(1, Number(e.target.value))))}
                  style={{ ...inputStyle, width: 68 }}
                />
              </div>

              {/* Validity */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, color: '#4a4f72', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em' }}>Valid (hours)</span>
                <input
                  type="number" min={1} max={8760} value={genValidity}
                  onChange={e => setGenValidity(Math.min(8760, Math.max(1, Number(e.target.value))))}
                  style={{ ...inputStyle, width: 78 }}
                />
              </div>

              {/* Generate button */}
              <button
                onClick={generateVouchers}
                disabled={generating}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 18px', borderRadius: 9, fontSize: 13, cursor: 'pointer',
                  fontWeight: 700, fontFamily: 'inherit',
                  background: generating ? 'rgba(249,115,22,0.15)' : '#f97316',
                  border: generating ? '1px solid rgba(249,115,22,0.35)' : 'none',
                  color: generating ? '#f97316' : '#fff',
                  opacity: generating ? 0.75 : 1,
                }}
              >
                <Ticket size={14} />
                {generating ? 'Generating…' : `Generate ${genQty}`}
              </button>
            </div>
          </div>

          {/* ── Filter tabs ── */}
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

          {/* ── Table header ── */}
          <div style={{
            display: 'grid', gridTemplateColumns: '140px 60px 80px 80px 110px 110px 1fr',
            gap: 8, padding: '7px 12px', marginBottom: 3, flexShrink: 0,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 8,
          }}>
            {['Code', 'Plan', 'Amount', 'Status', 'Valid Until', 'Used At', 'Actions'].map(h => (
              <span key={h} style={colHdr}>{h}</span>
            ))}
          </div>

          {/* ── Table body ── */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <Ticket size={28} style={{ display: 'block', margin: '0 auto 10px', color: '#3a3e5a', opacity: 0.4 }} />
                <div style={{ fontSize: 12.5, color: '#4a4f72' }}>
                  {filter === 'all' ? 'No vouchers yet — generate some above' : `No ${filter} vouchers`}
                </div>
              </div>
            ) : filtered.map(v => (
              <div key={v.code} style={{
                display: 'grid', gridTemplateColumns: '140px 60px 80px 80px 110px 110px 1fr',
                gap: 8, padding: '8px 12px', borderRadius: 8, marginBottom: 2, alignItems: 'center',
                background: v.status === 'active' ? 'rgba(29,184,20,0.04)' : 'rgba(255,255,255,0.03)',
                borderLeft: `2px solid ${v.status === 'active' ? '#1DB814' : v.status === 'used' ? '#3b82f6' : 'rgba(255,255,255,0.12)'}`,
              }}>
                <span style={{
                  fontFamily: 'monospace', fontSize: 12.5, fontWeight: 700, letterSpacing: '0.08em',
                  color: v.status === 'active' ? '#e2e5f1' : '#7b82a8',
                }}>{v.code}</span>

                <span style={{
                  fontSize: 10.5, fontWeight: 700,
                  color: v.plan === '24h' ? '#3b82f6' : '#8b5cf6',
                  background: v.plan === '24h' ? 'rgba(59,130,246,0.10)' : 'rgba(139,92,246,0.10)',
                  borderRadius: 5, padding: '2px 7px', textAlign: 'center',
                }}>{v.plan}</span>

                <span style={{ fontSize: 11, color: '#7b82a8' }}>{v.amount} UGX</span>

                <StatusBadge status={v.status} />

                <span style={{ fontSize: 10.5, color: v.status === 'active' ? '#f59e0b' : '#3a3e5a', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {v.status === 'active' && <Clock size={10} />}
                  {v.status === 'active' ? timeLeft(v.validUntil) : ts(v.validUntil)}
                </span>

                <span style={{ fontSize: 10, color: '#3a3e5a' }}>
                  {v.usedAt ? ts(v.usedAt) : '—'}
                  {v.usedByPhone && <span style={{ display: 'block', color: '#4a4f72' }}>{v.usedByPhone}</span>}
                </span>

                <div style={{ display: 'flex', gap: 4 }}>
                  {v.status === 'active' && (
                    <>
                      <button onClick={() => copyCode(v.code)} style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                        background: copied === v.code ? 'rgba(29,184,20,0.14)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${copied === v.code ? 'rgba(29,184,20,0.32)' : 'rgba(255,255,255,0.08)'}`,
                        color: copied === v.code ? '#1DB814' : '#7b82a8', fontWeight: 600,
                        fontFamily: 'inherit',
                      }}>
                        {copied === v.code ? <CheckCircle size={9} /> : <Copy size={9} />}
                        {copied === v.code ? 'Copied' : 'Copy'}
                      </button>
                      <button onClick={() => revokeVoucher(v.code)} style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                        background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.25)',
                        color: '#ef4444', fontWeight: 600, fontFamily: 'inherit',
                      }}><Trash2 size={9} />Revoke</button>
                    </>
                  )}
                  {v.status !== 'active' && (
                    <button onClick={() => copyCode(v.code)} style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                      padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                      color: '#4a4f72', fontFamily: 'inherit',
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
