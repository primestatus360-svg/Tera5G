import { useState, useEffect } from 'react'
import {
  Menu, X, Monitor, LayoutDashboard, Radio, Trophy, ShieldAlert,
  Activity, Plug, Users, Ticket, CreditCard, Search as SearchIcon,
  KeyRound, CheckCircle, XCircle, Wifi, WifiOff, Zap,
} from 'lucide-react'
import { useSocket } from './hooks/useSocket'
import { Sidebar } from './components/Header'
import { TrafficFeed } from './components/TrafficFeed'
import { Leaderboard } from './components/Leaderboard'
import { FirewallControl } from './components/FirewallControl'
import { ActiveSessions } from './components/ActiveSessions'
import { JA3Inspector } from './components/JA3Inspector'
import { BrowserGrid } from './components/BrowserGrid'
import { ConnectionsPanel } from './components/ConnectionsPanel'
import { UsersPanel } from './components/UsersPanel'
import { VouchersPanel } from './components/VouchersPanel'
import { SearchPanel } from './components/SearchPanel'
import { PaymentsPanel } from './components/PaymentsPanel'

export type Section =
  | 'browsers' | 'dashboard' | 'traffic' | 'leaderboard' | 'firewall' | 'ja3'
  | 'connections' | 'users' | 'vouchers' | 'search' | 'payments'

const SERVER = import.meta.env.VITE_SERVER_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '')

const SECTION_LABELS: Record<Section, string> = {
  browsers: 'Browsers', dashboard: 'Dashboard', traffic: 'Traffic',
  leaderboard: 'Leaderboard', firewall: 'Firewall', ja3: 'JA3 Inspector',
  connections: 'Connections', users: 'Users', vouchers: 'Vouchers',
  search: 'Search', payments: 'Payments',
}

const SECTION_META: Record<Section, { icon: React.ElementType; accent: string; sub: string }> = {
  browsers:    { icon: Monitor,         accent: '#3b82f6', sub: 'Monitor & control relay-connected clients' },
  dashboard:   { icon: LayoutDashboard, accent: '#8b5cf6', sub: 'Live traffic, sessions and rankings' },
  traffic:     { icon: Radio,           accent: '#06b6d4', sub: 'Real-time relay request stream' },
  leaderboard: { icon: Trophy,          accent: '#f59e0b', sub: 'Team score rankings' },
  firewall:    { icon: ShieldAlert,     accent: '#ef4444', sub: 'JA3 + SNI correlation mode' },
  ja3:         { icon: Activity,        accent: '#ec4899', sub: 'TLS fingerprint analysis' },
  connections: { icon: Plug,            accent: '#a78bfa', sub: 'Browser and relay connections' },
  users:       { icon: Users,           accent: '#1DB814', sub: 'Payment sessions and access' },
  vouchers:    { icon: Ticket,          accent: '#f97316', sub: 'Access voucher management' },
  search:      { icon: SearchIcon,      accent: '#64748b', sub: 'Search across all data' },
  payments:    { icon: CreditCard,      accent: '#10b981', sub: 'Mobile money transactions' },
}

export default function App() {
  const [section,     setSection]     = useState<Section>('browsers')
  const [adminKey,    setAdminKey]    = useState(() => localStorage.getItem('tera5g_admin_key') ?? '')
  const [keyVerified, setKeyVerified] = useState(false)
  const [keyInput,    setKeyInput]    = useState(adminKey)
  const [isMobile,    setIsMobile]    = useState(() => window.innerWidth < 768)
  const [drawerOpen,  setDrawerOpen]  = useState(false)

  const {
    firewallMode, scores, traffic, activeSessions,
    browserStates, alert, connected, clearAlert,
  } = useSocket()

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
      if (!e.matches) setDrawerOpen(false)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (alert) {
      const t = setTimeout(clearAlert, 6000)
      return () => clearTimeout(t)
    }
  }, [alert])

  useEffect(() => {
    if (!adminKey) { setKeyVerified(false); return }
    fetch(`${SERVER}/api/admin/connections?adminKey=${encodeURIComponent(adminKey)}`)
      .then(r => setKeyVerified(r.ok))
      .catch(() => setKeyVerified(false))
  }, [adminKey])

  function applyKey() {
    const k = keyInput.trim()
    setAdminKey(k)
    localStorage.setItem('tera5g_admin_key', k)
  }

  function navigate(s: Section) {
    setSection(s)
    setDrawerOpen(false)
  }

  const onlineBrowsers = browserStates.filter(b => b.online).length
  const meta = SECTION_META[section]
  const Meta = meta.icon
  const padded = 'h-full overflow-hidden flex flex-col'
  const paddedP = isMobile ? 'p-3' : 'p-6'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0b0c18' }}>

      {/* ── Sidebar ── */}
      {isMobile ? (
        <>
          {drawerOpen && (
            <div
              onClick={() => setDrawerOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 40,
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
              }}
            />
          )}
          <div style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
            transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <Sidebar
              firewallMode={firewallMode} connected={connected}
              activeSessions={activeSessions.length} onlineBrowsers={onlineBrowsers}
              activeSection={section} onNavigate={navigate}
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        </>
      ) : (
        <Sidebar
          firewallMode={firewallMode} connected={connected}
          activeSessions={activeSessions.length} onlineBrowsers={onlineBrowsers}
          activeSection={section} onNavigate={navigate}
        />
      )}

      {/* ── Main pane ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile hamburger bar */}
        {isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px', flexShrink: 0,
            background: '#0e0f1d', borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <button
              onClick={() => setDrawerOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, borderRadius: 9, cursor: 'pointer',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
              }}
            >
              <Menu size={15} color="#7b82a8" />
            </button>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#e2e5f1', flex: 1, letterSpacing: '-0.02em' }}>
              Tera<span style={{
                background: 'linear-gradient(90deg,#1DB814,#0ea5e9)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>5G</span>
              <span style={{ fontSize: 11.5, fontWeight: 400, color: '#4a4f72', marginLeft: 8 }}>
                {SECTION_LABELS[section]}
              </span>
            </span>
          </div>
        )}

        {/* ── Opera-class page top bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: isMobile ? '7px 14px' : '0 18px',
          height: isMobile ? 'auto' : 46,
          minHeight: isMobile ? 44 : 46,
          background: '#0d0e1c',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0, flexWrap: 'wrap', rowGap: 6,
        }}>

          {/* Left – breadcrumb (desktop only) */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, overflow: 'hidden' }}>
              {/* Section icon */}
              <div style={{
                width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                background: `${meta.accent}18`, border: `1px solid ${meta.accent}28`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Meta size={12} color={meta.accent} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e5f1', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                {SECTION_LABELS[section]}
              </span>
              <span style={{ fontSize: 9, color: '#2e3155', fontWeight: 400, marginTop: 1 }}>·</span>
              <span style={{
                fontSize: 11, color: '#3a3e5a', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {meta.sub}
              </span>
            </div>
          )}

          {/* Right – admin key pill + connection */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginLeft: isMobile ? 0 : 'auto', flexShrink: 0, flexWrap: 'wrap', rowGap: 6,
          }}>

            {/* Admin key pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(0,0,0,0.36)',
              border: `1px solid ${keyVerified ? 'rgba(29,184,20,0.32)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 99, padding: '4px 10px 4px 9px',
              transition: 'border-color 0.2s',
            }}>
              <KeyRound size={10} color={keyVerified ? '#1DB814' : '#4a4f72'} style={{ flexShrink: 0 }} />
              <input
                type="password"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyKey()}
                placeholder="Admin key…"
                style={{
                  width: 120, background: 'transparent', border: 'none',
                  outline: 'none', color: '#e2e5f1', fontSize: 11.5,
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={applyKey}
                style={{
                  padding: '2px 9px', borderRadius: 99, fontSize: 10.5, cursor: 'pointer',
                  fontWeight: 600, fontFamily: 'inherit',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
                  color: '#7b82a8', whiteSpace: 'nowrap',
                }}
              >Apply</button>
              {keyVerified && <CheckCircle size={11} color="#1DB814" style={{ flexShrink: 0 }} />}
              {adminKey && !keyVerified && <XCircle size={11} color="#ef4444" style={{ flexShrink: 0 }} />}
            </div>

            {/* Connection status pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: connected ? 'rgba(29,184,20,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${connected ? 'rgba(29,184,20,0.22)' : 'rgba(239,68,68,0.22)'}`,
              borderRadius: 99, padding: '4px 10px', flexShrink: 0,
            }}>
              {connected
                ? <Wifi size={10} color="#1DB814" />
                : <WifiOff size={10} color="#ef4444" />
              }
              <span style={{ fontSize: 10.5, fontWeight: 600, color: connected ? '#1DB814' : '#ef4444' }}>
                {connected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Alert banner ── */}
        {alert && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 18px', flexShrink: 0,
            background: alert.type === 'patched' ? 'rgba(29,184,20,0.07)' : 'rgba(239,68,68,0.07)',
            borderBottom: `1px solid ${alert.type === 'patched' ? 'rgba(29,184,20,0.20)' : 'rgba(239,68,68,0.20)'}`,
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={12} color={alert.type === 'patched' ? '#1DB814' : '#ef4444'} />
              <span style={{ fontSize: 12, color: alert.type === 'patched' ? '#1DB814' : '#ef4444', fontWeight: 500 }}>
                {alert.message}
              </span>
            </div>
            <button
              onClick={clearAlert}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 22, height: 22, borderRadius: 6, cursor: 'pointer',
                background: 'rgba(255,255,255,0.05)', border: 'none',
                color: alert.type === 'patched' ? '#1DB814' : '#ef4444',
              }}
            ><X size={11} /></button>
          </div>
        )}

        {/* ── Section content ── */}
        <div className="flex-1 overflow-hidden">

          {section === 'browsers' && (
            <div className="h-full overflow-hidden">
              <BrowserGrid browserStates={browserStates} scores={scores} />
            </div>
          )}

          {section === 'dashboard' && (
            <div
              className="h-full"
              style={{
                display: isMobile ? 'flex' : 'grid',
                flexDirection: isMobile ? 'column' : undefined,
                gridTemplateColumns: isMobile ? undefined : '1fr 296px',
                gap: 0, background: '#0b0c18',
                overflowY: isMobile ? 'auto' : undefined,
                overflow: isMobile ? undefined : 'hidden',
              }}
            >
              <div style={{
                background: '#0b0c18', padding: 16,
                borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                minHeight: isMobile ? 320 : undefined,
              }}>
                <TrafficFeed entries={traffic} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                  flex: 1, padding: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  minHeight: isMobile ? 240 : undefined,
                }}>
                  <ActiveSessions sessions={activeSessions} />
                </div>
                <div style={{
                  flex: 1, padding: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  minHeight: isMobile ? 240 : undefined,
                }}>
                  <Leaderboard scores={scores} />
                </div>
              </div>
            </div>
          )}

          {section === 'connections' && (
            <div className={`${padded} ${paddedP}`}>
              <ConnectionsPanel adminKey={adminKey} />
            </div>
          )}

          {section === 'users' && (
            <div className={`${padded} ${paddedP}`}>
              <UsersPanel adminKey={adminKey} />
            </div>
          )}

          {section === 'vouchers' && (
            <div className={`${padded} ${paddedP}`}>
              <VouchersPanel adminKey={adminKey} />
            </div>
          )}

          {section === 'search' && (
            <div className={`${padded} ${paddedP}`}>
              <SearchPanel adminKey={adminKey} />
            </div>
          )}

          {section === 'payments' && (
            <div className={`${padded} ${paddedP}`}>
              <PaymentsPanel adminKey={adminKey} />
            </div>
          )}

          {section === 'traffic' && (
            <div className={`${padded} ${paddedP}`}>
              <TrafficFeed entries={traffic} />
            </div>
          )}

          {section === 'leaderboard' && (
            <div className={`h-full ${paddedP} overflow-y-auto`} style={{ background: '#0b0c18' }}>
              <div className="max-w-xl mx-auto">
                <Leaderboard scores={scores} />
              </div>
            </div>
          )}

          {section === 'firewall' && (
            <div className={`h-full ${paddedP} overflow-y-auto`} style={{ background: '#0b0c18' }}>
              <div className="max-w-md mx-auto">
                <FirewallControl mode={firewallMode} />
              </div>
            </div>
          )}

          {section === 'ja3' && (
            <div className={`${padded} ${paddedP}`}>
              <JA3Inspector entries={traffic} />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
