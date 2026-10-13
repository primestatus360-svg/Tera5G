import { useState, useCallback, useRef } from 'react'
import { Search, Radio, Users, Ticket, Globe, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { SearchResults, TrafficEntry, PaymentSessionInfo, Voucher } from '../types'

const SERVER = import.meta.env.VITE_SERVER_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '')

interface Props { adminKey: string }
type SearchType = 'all' | 'traffic' | 'sessions' | 'vouchers' | 'teams'

function ts(ms: number) {
  return new Date(ms).toLocaleTimeString('en-GB', { hour12: false })
}

const rowBase: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '8px 12px', borderRadius: 8, marginBottom: 2, fontSize: 11,
}

function TrafficResult({ e }: { e: TrafficEntry }) {
  const ok = e.decision.allowed
  return (
    <div style={{
      ...rowBase,
      background: ok ? 'rgba(29,184,20,0.04)' : 'rgba(239,68,68,0.04)',
      borderLeft: `2px solid ${ok ? '#1DB814' : '#ef4444'}`,
    }}>
      {ok ? <CheckCircle size={12} color="#1DB814" /> : <XCircle size={12} color="#ef4444" />}
      <span style={{ fontSize: 10.5, color: '#3a3e5a', minWidth: 60, fontFamily: 'monospace' }}>{ts(e.timestamp)}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: e.teamColor, minWidth: 90 }}>{e.teamName}</span>
      <span style={{ fontSize: 11, color: '#3b82f6', minWidth: 120 }}>{e.sni}</span>
      <span style={{ fontSize: 11, color: ok ? '#1DB814' : '#ef4444', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {e.hostHeader}
      </span>
      <span style={{ fontSize: 10, color: '#4a4f72', flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {e.decision.reason}
      </span>
    </div>
  )
}

function SessionResult({ s }: { s: PaymentSessionInfo }) {
  const color = s.status === 'active' ? '#1DB814' : s.status === 'pending' ? '#f59e0b' : '#ef4444'
  return (
    <div style={{
      ...rowBase,
      background: 'rgba(255,255,255,0.03)', borderLeft: `2px solid ${color}`,
    }}>
      <Users size={12} color={color} />
      <span style={{ fontSize: 12, fontWeight: 600, color: '#7b82a8', minWidth: 130, fontFamily: 'monospace' }}>
        {s.phone.slice(0, 4)}****{s.phone.slice(-3)}
      </span>
      <span style={{
        fontSize: 10, fontWeight: 700, color,
        background: s.status === 'active' ? 'rgba(29,184,20,0.12)' : 'rgba(255,255,255,0.07)',
        borderRadius: 5, padding: '2px 7px',
      }}>{s.status}</span>
      <span style={{ fontSize: 11, color: '#7b82a8' }}>{s.plan}</span>
      <span style={{ fontSize: 11, color: '#7b82a8' }}>{s.provider}</span>
      <span style={{ fontSize: 11, color: '#4a4f72', flex: 1 }}>{new Date(s.createdAt).toLocaleString()}</span>
    </div>
  )
}

function VoucherResult({ v }: { v: Voucher }) {
  const color = v.status === 'active' ? '#1DB814' : v.status === 'used' ? '#3b82f6' : '#ef4444'
  return (
    <div style={{
      ...rowBase,
      background: 'rgba(255,255,255,0.03)', borderLeft: `2px solid ${color}`,
    }}>
      <Ticket size={12} color={color} />
      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#e2e5f1', fontFamily: 'monospace', letterSpacing: '0.08em', minWidth: 100 }}>
        {v.code}
      </span>
      <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}1a`, borderRadius: 5, padding: '2px 7px' }}>
        {v.status}
      </span>
      <span style={{ fontSize: 11, color: '#7b82a8' }}>{v.plan}</span>
      <span style={{ fontSize: 11, color: '#4a4f72' }}>{v.amount} UGX</span>
      {v.usedByPhone && <span style={{ fontSize: 11, color: '#3a3e5a', flex: 1 }}>used by {v.usedByPhone}</span>}
    </div>
  )
}

function TeamResult({ t }: { t: { id: string; name: string; color: string; createdAt: number } }) {
  return (
    <div style={{
      ...rowBase,
      background: 'rgba(255,255,255,0.03)', borderLeft: `2px solid ${t.color}`,
    }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
      <span style={{ fontSize: 12.5, fontWeight: 600, color: t.color }}>{t.name}</span>
      <span style={{ fontSize: 10, color: '#3a3e5a', fontFamily: 'monospace' }}>{t.id.slice(0, 8)}</span>
      <span style={{ fontSize: 11, color: '#4a4f72', marginLeft: 'auto' }}>
        joined {new Date(t.createdAt).toLocaleString()}
      </span>
    </div>
  )
}

function ResultSection({ icon, label, count, children }: {
  icon: React.ReactNode; label: string; count: number; children: React.ReactNode
}) {
  if (count === 0) return null
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#e2e5f1' }}>{label}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#7b82a8',
          background: 'rgba(255,255,255,0.07)', borderRadius: 6, padding: '2px 7px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>{count}</span>
      </div>
      {children}
    </div>
  )
}

export function SearchPanel({ adminKey }: Props) {
  const [query,   setQuery]   = useState('')
  const [type,    setType]    = useState<SearchType>('all')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (q: string, t: SearchType) => {
    if (!adminKey || q.trim().length < 2) { setResults(null); return }
    setLoading(true); setError('')
    try {
      const r = await fetch(
        `${SERVER}/api/admin/search?adminKey=${encodeURIComponent(adminKey)}&q=${encodeURIComponent(q)}&type=${t}`
      )
      if (r.ok) setResults(await r.json())
      else setError('Search failed — check admin key')
    } catch { setError('Could not reach server') }
    finally { setLoading(false) }
  }, [adminKey])

  function handleQueryChange(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(val, type), 400)
  }

  function handleTypeChange(t: SearchType) {
    setType(t)
    if (query.trim().length >= 2) doSearch(query, t)
  }

  const total = results
    ? (results.traffic?.length ?? 0) + (results.sessions?.length ?? 0) +
      (results.vouchers?.length ?? 0) + (results.teams?.length ?? 0)
    : 0

  const typeTabs: { key: SearchType; label: string }[] = [
    { key: 'all',      label: 'All'      },
    { key: 'traffic',  label: 'Traffic'  },
    { key: 'sessions', label: 'Sessions' },
    { key: 'vouchers', label: 'Vouchers' },
    { key: 'teams',    label: 'Teams'    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Panel header ── */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(100,116,139,0.12)', border: '1px solid rgba(100,116,139,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Search size={17} color="#64748b" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e5f1', letterSpacing: '-0.02em' }}>Search</div>
            <div style={{ fontSize: 11, color: '#4a4f72', marginTop: 2 }}>Search across traffic, sessions, vouchers and teams</div>
          </div>
        </div>
      </div>

      {!adminKey ? (
        <div style={{
          padding: '18px 22px', borderRadius: 12,
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)',
          color: '#ef4444', fontSize: 13,
        }}>Enter admin key in the top bar to use search.</div>
      ) : (
        <>
          {/* Search input */}
          <div style={{ position: 'relative', marginBottom: 10, flexShrink: 0 }}>
            <Search size={14} style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: '#4a4f72', pointerEvents: 'none',
            }} />
            <input
              type="text" value={query}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder="Search by team, URL, phone, voucher code…"
              style={{
                width: '100%', background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 12, color: '#e2e5f1', fontSize: 13,
                padding: '11px 14px 11px 40px',
                outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => { (e.target as HTMLElement).style.borderColor = 'rgba(59,130,246,0.4)' }}
              onBlur={e => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)' }}
            />
            {loading && (
              <div style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                width: 14, height: 14,
                border: '2px solid rgba(255,255,255,0.10)',
                borderTopColor: '#7b82a8', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            )}
          </div>

          {/* Type filter tabs */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 16, flexShrink: 0, flexWrap: 'wrap' }}>
            {typeTabs.map(t => (
              <button key={t.key} onClick={() => handleTypeChange(t.key)} style={{
                padding: '5px 13px', borderRadius: 99, fontSize: 11.5, cursor: 'pointer',
                fontWeight: type === t.key ? 600 : 400, fontFamily: 'inherit',
                background: type === t.key ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.04)',
                border: type === t.key ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.06)',
                color: type === t.key ? '#e2e5f1' : '#4a4f72',
                transition: 'all 0.12s',
              }}>{t.label}</button>
            ))}
          </div>

          {error && (
            <div style={{
              padding: '9px 13px', borderRadius: 8, marginBottom: 12,
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)',
              color: '#ef4444', fontSize: 12, flexShrink: 0,
            }}>{error}</div>
          )}

          {/* Results */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!results && !loading && (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <Search size={32} style={{ display: 'block', margin: '0 auto 12px', color: '#3a3e5a', opacity: 0.3 }} />
                <div style={{ fontSize: 12.5, color: '#4a4f72' }}>Type at least 2 characters to search</div>
              </div>
            )}

            {results && total === 0 && (
              <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                <AlertTriangle size={28} style={{ display: 'block', margin: '0 auto 10px', color: '#3a3e5a', opacity: 0.3 }} />
                <div style={{ fontSize: 12.5, color: '#4a4f72' }}>No results for "{query}"</div>
              </div>
            )}

            {results && total > 0 && (
              <>
                <ResultSection icon={<Radio size={13} color="#3b82f6" />}  label="Traffic"  count={results.traffic?.length ?? 0}>
                  {results.traffic?.map(e => <TrafficResult key={e.id} e={e} />)}
                </ResultSection>
                <ResultSection icon={<Users size={13} color="#1DB814" />}  label="Sessions" count={results.sessions?.length ?? 0}>
                  {results.sessions?.map(s => <SessionResult key={s.id} s={s} />)}
                </ResultSection>
                <ResultSection icon={<Ticket size={13} color="#8b5cf6" />} label="Vouchers" count={results.vouchers?.length ?? 0}>
                  {results.vouchers?.map(v => <VoucherResult key={v.code} v={v} />)}
                </ResultSection>
                <ResultSection icon={<Globe size={13} color="#f59e0b" />}  label="Teams"    count={results.teams?.length ?? 0}>
                  {results.teams?.map(t => <TeamResult key={t.id} t={t} />)}
                </ResultSection>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
