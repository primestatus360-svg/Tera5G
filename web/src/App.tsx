import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
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
  const padded = 'h-full bg-tera-bg overflow-hidden flex flex-col'
  const paddedP = isMobile ? 'p-3' : 'p-6'

  return (
    <div className="flex h-screen bg-tera-bg overflow-hidden">

      {/* ── Sidebar (desktop always visible, mobile overlay drawer) ── */}
      {isMobile ? (
        <>
          {/* Backdrop */}
          {drawerOpen && (
            <div
              onClick={() => setDrawerOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 40,
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
              }}
            />
          )}
          {/* Drawer */}
          <div style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
            transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <Sidebar
              firewallMode={firewallMode}
              connected={connected}
              activeSessions={activeSessions.length}
              onlineBrowsers={onlineBrowsers}
              activeSection={section}
              onNavigate={navigate}
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        </>
      ) : (
        <Sidebar
          firewallMode={firewallMode}
          connected={connected}
          activeSessions={activeSessions.length}
          onlineBrowsers={onlineBrowsers}
          activeSection={section}
          onNavigate={navigate}
        />
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile top bar */}
        {isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px', flexShrink: 0,
            backgroundColor: '#000',
            borderBottom: '0.5px solid rgba(84,84,88,0.36)',
          }}>
            <button
              onClick={() => setDrawerOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
                background: 'rgba(84,84,88,0.14)', border: '0.5px solid rgba(84,84,88,0.36)',
              }}
            >
              <Menu size={16} color="#fff" />
            </button>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', flex: 1 }}>
              Tera<span style={{ color: '#1DB814' }}>5G</span>
              <span style={{ fontSize: 12, fontWeight: 400, color: '#636366', marginLeft: 8 }}>
                {SECTION_LABELS[section]}
              </span>
            </span>
          </div>
        )}

        {/* Admin key bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          padding: isMobile ? '8px 14px' : '8px 20px',
          borderBottom: '0.5px solid rgba(84,84,88,0.36)',
          backgroundColor: '#000', flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, color: '#636366', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            Admin Key
          </span>
          <input
            type="password"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyKey()}
            placeholder="Enter admin key…"
            style={{
              flex: 1, minWidth: 120, maxWidth: 260, background: '#1C1C1E',
              border: `0.5px solid ${keyVerified ? 'rgba(29,184,20,0.50)' : 'rgba(84,84,88,0.50)'}`,
              borderRadius: 8, color: '#fff', fontSize: 12,
              padding: '5px 10px', outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            onClick={applyKey}
            style={{
              padding: '5px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              fontWeight: 600, fontFamily: 'inherit',
              background: 'rgba(84,84,88,0.18)', border: '0.5px solid rgba(84,84,88,0.36)',
              color: '#8E8E93', whiteSpace: 'nowrap',
            }}
          >Apply</button>
          {keyVerified && (
            <span style={{ fontSize: 11, color: '#1DB814', fontWeight: 600, whiteSpace: 'nowrap' }}>✓ Verified</span>
          )}
          {adminKey && !keyVerified && (
            <span style={{ fontSize: 11, color: '#FF453A', fontWeight: 600, whiteSpace: 'nowrap' }}>✗ Invalid</span>
          )}
        </div>

        {/* Alert banner */}
        {alert && (
          <div className={`px-4 py-3 text-sm font-medium flex items-center justify-between border-b flex-shrink-0
            ${alert.type === 'patched'
              ? 'bg-tera-green/10 border-tera-green/30 text-tera-green'
              : 'bg-tera-red/10 border-tera-red/30 text-tera-red'
            }`}
          >
            <span className="text-xs">{alert.message}</span>
            <button onClick={clearAlert} className="text-xs opacity-60 hover:opacity-100 transition-opacity ml-4">✕</button>
          </div>
        )}

        {/* Section content */}
        <div className="flex-1 overflow-hidden">

          {section === 'browsers' && (
            <div className="h-full overflow-hidden">
              <BrowserGrid browserStates={browserStates} scores={scores} />
            </div>
          )}

          {section === 'dashboard' && (
            <div
              className="h-full gap-px"
              style={{
                display: isMobile ? 'flex' : 'grid',
                flexDirection: isMobile ? 'column' : undefined,
                gridTemplateColumns: isMobile ? undefined : '1fr 320px',
                background: 'rgba(84,84,88,0.36)',
                overflowY: isMobile ? 'auto' : undefined,
              }}
            >
              <div className="bg-tera-bg p-4 overflow-hidden flex flex-col" style={{ minHeight: isMobile ? 320 : undefined }}>
                <TrafficFeed entries={traffic} />
              </div>
              <div className="bg-tera-bg flex flex-col overflow-hidden">
                <div className="flex-1 p-4 overflow-hidden flex flex-col border-b" style={{ borderColor: 'rgba(84,84,88,0.36)', minHeight: isMobile ? 240 : undefined }}>
                  <ActiveSessions sessions={activeSessions} />
                </div>
                <div className="flex-1 p-4 overflow-hidden flex flex-col" style={{ minHeight: isMobile ? 240 : undefined }}>
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
            <div className={`h-full bg-tera-bg ${paddedP} overflow-y-auto`}>
              <div className="max-w-xl mx-auto">
                <Leaderboard scores={scores} />
              </div>
            </div>
          )}

          {section === 'firewall' && (
            <div className={`h-full bg-tera-bg ${paddedP} overflow-y-auto`}>
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
