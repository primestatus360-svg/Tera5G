import { useEffect, useState, useCallback } from 'react'
import { Monitor, Radio, Lock, Wifi, WifiOff, RefreshCw, Globe, Clock } from 'lucide-react'
import { ConnectionBrowser, ConnectionRelay, ConnectionStats } from '../types'

const SERVER = import.meta.env.VITE_SERVER_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '')

interface Props { adminKey: string }

function ts(ms: number) {
  return new Date(ms).toLocaleTimeString('en-GB', { hour12: false })
}

function elapsed(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60)  return `${s}s ago`
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

function StatCard({ value, label, color = '#636366', icon }: {
  value: number | string; label: string; color?: string; icon: React.ReactNode
}) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', gap: 12,
      backgroundColor: 'rgba(84,84,88,0.10)',
      border: '0.5px solid rgba(84,84,88,0.36)',
      borderRadius: 12, padding: '14px 16px',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(84,84,88,0.14)',
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: '#636366', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

export function ConnectionsPanel({ adminKey }: Props) {
  const [browsers, setBrowsers] = useState<ConnectionBrowser[]>([])
  const [relays,   setRelays]   = useState<ConnectionRelay[]>([])
  const [stats,    setStats]    = useState<ConnectionStats | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [lastFetch, setLastFetch] = useState(0)

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

  const col: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: '#636366',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0 }}>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>Connections</h2>
          <p style={{ fontSize: 12, color: '#636366', margin: '2px 0 0' }}>
            Live browser &amp; relay connections
            {lastFetch > 0 && <span style={{ marginLeft: 8 }}>· updated {ts(lastFetch)}</span>}
          </p>
        </div>
        <button
          onClick={fetchConnections}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(84,84,88,0.12)', border: '0.5px solid rgba(84,84,88,0.36)',
            borderRadius: 8, padding: '6px 12px', color: '#8E8E93',
            fontSize: 12, cursor: 'pointer',
          }}
        >
          <RefreshCw size={12} style={{ opacity: loading ? 1 : 0.6, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {!adminKey && (
        <div style={{
          padding: '20px 24px', borderRadius: 12,
          background: 'rgba(255,69,58,0.06)', border: '0.5px solid rgba(255,69,58,0.25)',
          color: '#FF453A', fontSize: 13, flexShrink: 0,
        }}>
          Enter admin key in the top bar to view connection data.
        </div>
      )}

      {adminKey && (
        <>
          {/* Stats row */}
          {stats && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexShrink: 0 }}>
              <StatCard value={stats.totalBrowsers}  label="Total Browsers"  color="#0A84FF" icon={<Monitor size={16} color="#0A84FF" />} />
              <StatCard value={stats.onlineBrowsers} label="Online"          color="#1DB814" icon={<Wifi size={16} color="#1DB814" />} />
              <StatCard value={stats.lockedBrowsers} label="Locked"          color="#FF9F0A" icon={<Lock size={16} color="#FF9F0A" />} />
              <StatCard value={stats.activeRelays}   label="Active Relays"   color="#BF5AF2" icon={<Radio size={16} color="#BF5AF2" />} />
              <StatCard value={stats.activeSessions} label="Paid Sessions"   color="#1DB814" icon={<Clock size={16} color="#1DB814" />} />
            </div>
          )}

          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Browser connections */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexShrink: 0,
              }}>
                <Monitor size={14} color="#0A84FF" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Browser Connections</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#0A84FF', marginLeft: 4,
                  background: 'rgba(10,132,255,0.12)', border: '0.5px solid rgba(10,132,255,0.3)',
                  borderRadius: 6, padding: '2px 7px',
                }}>{browsers.length}</span>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '140px 1fr 90px 90px 80px',
                gap: 8, padding: '8px 12px', marginBottom: 4,
                background: 'rgba(84,84,88,0.08)', borderRadius: 8,
              }}>
                {['Team', 'Current URL', 'Status', 'Lock', 'Updated'].map(h => (
                  <span key={h} style={col}>{h}</span>
                ))}
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {browsers.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#636366', fontSize: 13 }}>
                    No browser connections
                  </div>
                ) : browsers.map(b => (
                  <div key={b.teamId} style={{
                    display: 'grid', gridTemplateColumns: '140px 1fr 90px 90px 80px',
                    gap: 8, padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                    background: b.online ? 'rgba(10,132,255,0.04)' : 'rgba(84,84,88,0.06)',
                    borderLeft: `2px solid ${b.online ? '#0A84FF' : 'rgba(84,84,88,0.4)'}`,
                    alignItems: 'center',
                  }}>
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: b.teamColor,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{b.teamName}</span>
                    <span style={{
                      fontSize: 11, color: '#8E8E93', display: 'flex', alignItems: 'center', gap: 4,
                      overflow: 'hidden',
                    }}>
                      {b.url && <Globe size={10} style={{ flexShrink: 0 }} />}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {truncUrl(b.url) || <span style={{ color: '#48484A' }}>no page loaded</span>}
                      </span>
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {b.online
                        ? <><Wifi size={11} color="#1DB814" /><span style={{ fontSize: 11, color: '#1DB814' }}>Online</span></>
                        : <><WifiOff size={11} color="#636366" /><span style={{ fontSize: 11, color: '#636366' }}>Offline</span></>
                      }
                    </div>
                    <div>
                      {b.locked
                        ? <span style={{
                            fontSize: 10, fontWeight: 600, color: '#FF9F0A',
                            background: 'rgba(255,159,10,0.12)', borderRadius: 5, padding: '2px 7px',
                          }}>Locked</span>
                        : <span style={{ fontSize: 10, color: '#48484A' }}>Unlocked</span>
                      }
                    </div>
                    <span style={{ fontSize: 11, color: '#48484A' }}>{elapsed(b.lastUpdated)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active relays */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
              }}>
                <Radio size={14} color="#BF5AF2" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Active Relays</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#BF5AF2', marginLeft: 4,
                  background: 'rgba(191,90,242,0.12)', border: '0.5px solid rgba(191,90,242,0.3)',
                  borderRadius: 6, padding: '2px 7px',
                }}>{relays.length}</span>
              </div>

              {relays.length === 0 ? (
                <div style={{ padding: '14px', textAlign: 'center', color: '#636366', fontSize: 13,
                  background: 'rgba(84,84,88,0.06)', borderRadius: 8 }}>
                  No active relay sessions
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {relays.map(r => (
                    <div key={r.teamId} style={{
                      display: 'grid', gridTemplateColumns: '140px 100px 100px 1fr',
                      gap: 8, padding: '9px 12px', borderRadius: 8,
                      background: 'rgba(191,90,242,0.04)',
                      borderLeft: '2px solid rgba(191,90,242,0.5)',
                      alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: r.teamColor }}>{r.teamName}</span>
                      <span style={{ fontSize: 11, color: '#8E8E93' }}>{r.requestCount} requests</span>
                      <span style={{ fontSize: 11, color: '#8E8E93' }}>{r.activeSeconds}s active</span>
                      <span style={{ fontSize: 11, color: '#636366' }}>last seen {elapsed(r.lastSeen)}</span>
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
