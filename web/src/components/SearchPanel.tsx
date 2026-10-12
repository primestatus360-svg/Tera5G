import { useState, useCallback, useRef } from 'react'
import { Search, Radio, Users, Ticket, Globe, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { SearchResults, TrafficEntry, PaymentSessionInfo, Voucher } from '../types'

const SERVER = import.meta.env.VITE_SERVER_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '')

interface Props { adminKey: string }

type SearchType = 'all' | 'traffic' | 'sessions' | 'vouchers' | 'teams'

function ts(ms: number) {
  return new Date(ms).toLocaleTimeString('en-GB', { hour12: false })
}

function TrafficResult({ e }: { e: TrafficEntry }) {
  const ok = e.decision.allowed
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 8,
      background: ok ? 'rgba(29,184,20,0.04)' : 'rgba(255,69,58,0.04)',
      borderLeft: `2px solid ${ok ? '#1DB814' : '#FF453A'}`,
      marginBottom: 2,
    }}>
      {ok ? <CheckCircle size={13} color="#1DB814" /> : <XCircle size={13} color="#FF453A" />}
      <span style={{ fontSize: 11, color: '#48484A', minWidth: 60 }}>{ts(e.timestamp)}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: e.teamColor, minWidth: 90 }}>{e.teamName}</span>
      <span style={{ fontSize: 11, color: '#0A84FF', minWidth: 120 }}>{e.sni}</span>
      <span style={{ fontSize: 11, color: ok ? '#1DB814' : '#FF453A', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {e.hostHeader}
      </span>
      <span style={{ fontSize: 10, color: '#636366', flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {e.decision.reason}
      </span>
    </div>
  )
}

function SessionResult({ s }: { s: PaymentSessionInfo }) {
  const color = s.status === 'active' ? '#1DB814' : s.status === 'pending' ? '#FF9F0A' : '#FF453A'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 8,
      background: 'rgba(84,84,88,0.06)', borderLeft: `2px solid ${color}`,
      marginBottom: 2,
    }}>
      <Users size={13} color={color} />
      <span style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', minWidth: 130, fontFamily: 'monospace' }}>
        {s.phone.slice(0, 4)}****{s.phone.slice(-3)}
      </span>
      <span style={{
        fontSize: 10, fontWeight: 700, color,
        background: s.status === 'active' ? 'rgba(29,184,20,0.12)' : 'rgba(84,84,88,0.12)',
        borderRadius: 5, padding: '2px 7px',
      }}>{s.status}</span>
      <span style={{ fontSize: 11, color: '#8E8E93' }}>{s.plan}</span>
      <span style={{ fontSize: 11, color: '#8E8E93' }}>{s.provider}</span>
      <span style={{ fontSize: 11, color: '#636366', flex: 1 }}>{new Date(s.createdAt).toLocaleString()}</span>
    </div>
  )
}

function VoucherResult({ v }: { v: Voucher }) {
  const color = v.status === 'active' ? '#1DB814' : v.status === 'used' ? '#0A84FF' : '#FF453A'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 8,
      background: 'rgba(84,84,88,0.06)', borderLeft: `2px solid ${color}`,
      marginBottom: 2,
    }}>
      <Ticket size={13} color={color} />
      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'monospace', letterSpacing: '0.08em', minWidth: 100 }}>
        {v.code}
      </span>
      <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}1A`, borderRadius: 5, padding: '2px 7px' }}>
        {v.status}
      </span>
      <span style={{ fontSize: 11, color: '#8E8E93' }}>{v.plan}</span>
      <span style={{ fontSize: 11, color: '#636366' }}>{v.amount} UGX</span>
      {v.usedByPhone && (
        <span style={{ fontSize: 11, color: '#48484A', flex: 1 }}>used by {v.usedByPhone}</span>
      )}
    </div>
  )
}

function TeamResult({ t }: { t: { id: string; name: string; color: string; createdAt: number } }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 8,
      background: 'rgba(84,84,88,0.06)', borderLeft: `2px solid ${t.color}`,
      marginBottom: 2,
    }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: t.color }}>{t.name}</span>
      <span style={{ fontSize: 10, color: '#48484A', fontFamily: 'monospace' }}>{t.id.slice(0, 8)}</span>
      <span style={{ fontSize: 11, color: '#636366', marginLeft: 'auto' }}>
        joined {new Date(t.createdAt).toLocaleString()}
      </span>
    </div>
  )
}

function Section({ icon, label, count, children }: {
  icon: React.ReactNode; label: string; count: number; children: React.ReactNode
}) {
  if (count === 0) return null
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{label}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#8E8E93',
          background: 'rgba(84,84,88,0.20)', borderRadius: 6, padding: '2px 7px',
        }}>{count}</span>
      </div>
      {children}
    </div>
  )
}

export function SearchPanel({ adminKey }: Props) {
  const [query,    setQuery]    = useState('')
  const [type,     setType]     = useState<SearchType>('all')
  const [results,  setResults]  = useState<SearchResults | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
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

  const types: { key: SearchType; label: string }[] = [
    { key: 'all',      label: 'All'      },
    { key: 'traffic',  label: 'Traffic'  },
    { key: 'sessions', label: 'Sessions' },
    { key: 'vouchers', label: 'Vouchers' },
    { key: 'teams',    label: 'Teams'    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '0 0 2px' }}>Search</h2>
        <p style={{ fontSize: 12, color: '#636366', margin: 0 }}>Search across traffic, sessions, vouchers and teams</p>
      </div>

      {!adminKey ? (
        <div style={{
          padding: '20px 24px', borderRadius: 12,
          background: 'rgba(255,69,58,0.06)', border: '0.5px solid rgba(255,69,58,0.25)',
          color: '#FF453A', fontSize: 13,
        }}>Enter admin key to use search.</div>
      ) : (
        <>
          {/* Search input */}
          <div style={{ position: 'relative', marginBottom: 12, flexShrink: 0 }}>
            <Search size={15} style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: '#636366', pointerEvents: 'none',
            }} />
            <input
              type="text" value={query}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder="Search by team, URL, phone, voucher code…"
              style={{
                width: '100%', background: '#1C1C1E',
                border: '0.5px solid rgba(84,84,88,0.65)',
                borderRadius: 12, color: '#fff', fontSize: 14,
                padding: '12px 14px 12px 40px',
                outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            {loading && (
              <div style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                width: 14, height: 14, border: '2px solid rgba(84,84,88,0.4)',
                borderTopColor: '#8E8E93', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            )}
          </div>

          {/* Type filter */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexShrink: 0, flexWrap: 'wrap' }}>
            {types.map(t => (
              <button key={t.key} onClick={() => handleTypeChange(t.key)} style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                fontWeight: type === t.key ? 600 : 400,
                background: type === t.key ? 'rgba(84,84,88,0.20)' : 'transparent',
                border: type === t.key ? '0.5px solid rgba(84,84,88,0.50)' : '0.5px solid transparent',
                color: type === t.key ? '#fff' : '#636366',
              }}>{t.label}</button>
            ))}
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 12,
              background: 'rgba(255,69,58,0.08)', border: '0.5px solid rgba(255,69,58,0.25)',
              color: '#FF453A', fontSize: 12, flexShrink: 0,
            }}>{error}</div>
          )}

          {/* Results */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!results && !loading && (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#48484A' }}>
                <Search size={32} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.2 }} />
                <div style={{ fontSize: 13 }}>Type at least 2 characters to search</div>
              </div>
            )}

            {results && total === 0 && (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: '#48484A' }}>
                <AlertTriangle size={28} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }} />
                <div style={{ fontSize: 13 }}>No results for "{query}"</div>
              </div>
            )}

            {results && total > 0 && (
              <>
                <Section icon={<Radio size={13} color="#0A84FF" />} label="Traffic" count={results.traffic?.length ?? 0}>
                  {results.traffic?.map(e => <TrafficResult key={e.id} e={e} />)}
                </Section>
                <Section icon={<Users size={13} color="#1DB814" />} label="Sessions" count={results.sessions?.length ?? 0}>
                  {results.sessions?.map(s => <SessionResult key={s.id} s={s} />)}
                </Section>
                <Section icon={<Ticket size={13} color="#BF5AF2" />} label="Vouchers" count={results.vouchers?.length ?? 0}>
                  {results.vouchers?.map(v => <VoucherResult key={v.code} v={v} />)}
                </Section>
                <Section icon={<Globe size={13} color="#FF9F0A" />} label="Teams" count={results.teams?.length ?? 0}>
                  {results.teams?.map(t => <TeamResult key={t.id} t={t} />)}
                </Section>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
