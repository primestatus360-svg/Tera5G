import { useEffect, useState, useCallback } from 'react'
import { Monitor, Radio, Lock, Wifi, WifiOff, RefreshCw, Globe, Clock, Plug } from 'lucide-react'
import { ConnectionBrowser, ConnectionRelay, ConnectionStats } from '../types'

const SERVER = import.meta.env.VITE_SERVER_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '')

interface Props { adminKey: string }

function ts(ms: number) {
  return new Date(ms).toLocaleTimeString('en-GB', { hour12: false })
}
function elapsed(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}
function truncUrl(url: string, n = 40) {
  if (!url) return '—'
  try {
    const u = new URL(url)
    const s = u.hostname + (u.pathname === '/' ? '' : u.pathname)
    return s.length > n ? s.slice(0, n) + '…' : s
  } catch { return url.length > n ? url.slice(0, n) + '…' : url }
}

function StatCard({ value, label, color = '#4a4f72', icon }: {
  value: number | string; label: string; color?: string; icon: React.ReactNode
}) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', gap: 12,
      background: `${color}0d`,
      border: `1px solid ${color}28`,
      borderRadius: 12, padding: '13px 15px',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}18`,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 21, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 10.5, color: '#4a4f72', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

const colHdr: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: '#3a3e5a',
  textTransform: 'uppercase', letterSpacing: '0.09em',
}

export function ConnectionsPanel({ adminKey }: Props) {
  const [browsers,   setBrowsers]   = useState<ConnectionBrowser[]>([])
  const [relays,     setRelays]     = useState<ConnectionRelay[]>([])
  const [stats,      setStats]      = useState<ConnectionStats | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [lastFetch,  setLastFetch]  = useState(0)

  const fetchConnections = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    try {
      const r = await fetch(`${SERVER}/api/admin/connections?adminKey=${encodeURIComponent(adminKey)}`)
      if (r.ok) {
        const data = await r.json()
        setBrowsers(data.browsers ?? [])
        setRelays(data.relays ?? [])
        setStats(data.stats ?? null)
        setLastFetch(Date.now())
      }
    } finally { setLoading(false) }
  }, [adminKey])

  useEffect(() => { fetchConnections() }, [fetchConnections])
  useEffect(() => {
    const t = setInterval(fetchConnections, 8000)
    return () => clearInterval(t)
  }, [fetchConnections])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>

      {/* ── Panel header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plug size={17} color="#a78bfa" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e5f1', letterSpacing: '-0.02em' }}>Connections</div>
            <div style={{ fontSize: 11, color: '#4a4f72', marginTop: 2 }}>
              Live browser &amp; relay connections
              {lastFetch > 0 && <span style={{ marginLeft: 8, color: '#3a3e5a' }}>· updated {ts(lastFetch)}</span>}
            </div>
          </div>
        </div>
        <button
          onClick={fetchConnections}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 9, padding: '7px 13px', color: '#7b82a8', fontSize: 12, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <RefreshCw size={12} style={{ opacity: loading ? 1 : 0.6, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {!adminKey && (
        <div style={{
          padding: '18px 22px', borderRadius: 12,
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)',
          color: '#ef4444', fontSize: 13, flexShrink: 0,
        }}>
          Enter admin key in the top bar to view connection data.
        </div>
      )}

      {adminKey && (
        <>
          {/* Stat cards */}
          {stats && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexShrink: 0, flexWrap: 'wrap' }}>
              <StatCard value={stats.totalBrowsers}  label="Total Browsers"  color="#3b82f6" icon={<Monitor size={15} color="#3b82f6" />} />
              <StatCard value={stats.onlineBrowsers} label="Online"          color="#1DB814" icon={<Wifi    size={15} color="#1DB814" />} />
              <StatCard value={stats.lockedBrowsers} label="Locked"          color="#f59e0b" icon={<Lock    size={15} color="#f59e0b" />} />
              <StatCard value={stats.activeRelays}   label="Active Relays"   color="#8b5cf6" icon={<Radio   size={15} color="#8b5cf6" />} />
              <StatCard value={stats.activeSessions} label="Paid Sessions"   color="#1DB814" icon={<Clock   size={15} color="#1DB814" />} />
            </div>
          )}

          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* ── Browser connections ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexShrink: 0 }}>
                <Monitor size={13} color="#3b82f6" />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#e2e5f1' }}>Browser Connections</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#3b82f6',
                  background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.28)',
                  borderRadius: 6, padding: '2px 7px',
                }}>{browsers.length}</span>
              </div>

              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '140px 1fr 90px 90px 80px',
                gap: 8, padding: '6px 12px', marginBottom: 3,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 8, flexShrink: 0,
              }}>
                {['Team', 'Current URL', 'Status', 'Lock', 'Updated'].map(h => (
                  <span key={h} style={colHdr}>{h}</span>
                ))}
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {browsers.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#4a4f72', fontSize: 12.5 }}>
                    No browser connections
                  </div>
                ) : browsers.map(b => (
                  <div key={b.teamId} style={{
                    display: 'grid', gridTemplateColumns: '140px 1fr 90px 90px 80px',
                    gap: 8, padding: '8px 12px', borderRadius: 8, marginBottom: 2, alignItems: 'center',
                    background: b.online ? 'rgba(59,130,246,0.04)' : 'rgba(255,255,255,0.03)',
                    borderLeft: `2px solid ${b.online ? '#3b82f6' : 'rgba(255,255,255,0.10)'}`,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: b.teamColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.teamName}
                    </span>
                    <span style={{ fontSize: 11, color: '#7b82a8', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
                      {b.url && <Globe size={10} style={{ flexShrink: 0 }} />}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {truncUrl(b.url) || <span style={{ color: '#3a3e5a' }}>no page loaded</span>}
                      </span>
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {b.online
                        ? <><Wifi size={11} color="#1DB814" /><span style={{ fontSize: 11, color: '#1DB814' }}>Online</span></>
                        : <><WifiOff size={11} color="#4a4f72" /><span style={{ fontSize: 11, color: '#4a4f72' }}>Offline</span></>
                      }
                    </div>
                    <div>
                      {b.locked
                        ? <span style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', borderRadius: 5, padding: '2px 7px' }}>Locked</span>
                        : <span style={{ fontSize: 10, color: '#3a3e5a' }}>Unlocked</span>
                      }
                    </div>
                    <span style={{ fontSize: 10.5, color: '#3a3e5a' }}>{elapsed(b.lastUpdated)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Active relays ── */}
            <div style={{ flexShrink: 0, maxHeight: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Radio size={13} color="#8b5cf6" />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#e2e5f1' }}>Active Relays</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#8b5cf6',
                  background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.28)',
                  borderRadius: 6, padding: '2px 7px',
                }}>{relays.length}</span>
              </div>

              {relays.length === 0 ? (
                <div style={{ padding: '14px', textAlign: 'center', color: '#4a4f72', fontSize: 12.5,
                  background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                  No active relay sessions
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', maxHeight: 180 }}>
                  {relays.map(r => (
                    <div key={r.teamId} style={{
                      display: 'grid', gridTemplateColumns: '140px 110px 110px 1fr',
                      gap: 8, padding: '8px 12px', borderRadius: 8,
                      background: 'rgba(139,92,246,0.04)', borderLeft: '2px solid rgba(139,92,246,0.4)',
                      alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: r.teamColor }}>{r.teamName}</span>
                      <span style={{ fontSize: 11, color: '#7b82a8' }}>{r.requestCount} requests</span>
                      <span style={{ fontSize: 11, color: '#7b82a8' }}>{r.activeSeconds}s active</span>
                      <span style={{ fontSize: 11, color: '#4a4f72' }}>last seen {elapsed(r.lastSeen)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
