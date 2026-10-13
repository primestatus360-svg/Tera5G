import { useState, useEffect, useRef, KeyboardEvent, CSSProperties } from 'react'

// ── Opera design tokens ───────────────────────────────────────────────────────

const T = {
  bg:        '#0b0c18',
  surface:   '#0d0e1c',
  elevated:  '#191b30',
  panel:     'rgba(255,255,255,0.03)',
  text:      '#e2e5f1',
  sub:       '#7b82a8',
  muted:     '#4a4f72',
  veryMuted: '#3a3e5a',
  green:     '#1DB814',
  blue:      '#3b82f6',
  border:    'rgba(255,255,255,0.07)',
  divider:   'rgba(255,255,255,0.05)',
  hover:     'rgba(255,255,255,0.06)',
  activeTab: 'rgba(255,255,255,0.09)',
  font:      "'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
  greenBg:   'rgba(29,184,20,0.10)',
  greenBd:   'rgba(29,184,20,0.28)',
  blueBg:    'rgba(59,130,246,0.10)',
  blueBd:    'rgba(59,130,246,0.28)',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavState  { url?: string; canBack?: boolean; canFwd?: boolean; loading?: boolean }
interface TabItem   { id: string; url: string; title: string; loading: boolean }
interface TabsState { list: TabItem[]; activeId: string }

declare global {
  interface Window {
    browser: {
      platform: string
      go: (url: string) => void; back: () => void; fwd: () => void
      reload: () => void; stop: () => void; home: () => void
      getProxy: () => Promise<string>
      newTab: () => void; closeTab: (id: string) => void; switchTab: (id: string) => void
      onNav:  (cb: (s: NavState)  => void) => void
      onTabs: (cb: (s: TabsState) => void) => void
    }
  }
}

const IS_MAC     = window.browser.platform === 'darwin'
const WIN_CTRL_W = 138

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [nav,   setNav]   = useState<NavState>({ canBack: false, canFwd: false, loading: false, url: '' })
  const [tabs,  setTabs]  = useState<TabsState>({ list: [], activeId: '' })
  const [proxy, setProxy] = useState('')

  useEffect(() => {
    window.browser.getProxy().then(p => setProxy(p.replace(/^https?:\/\//, '')))
    window.browser.onNav(s  => setNav(p => ({ ...p, ...s })))
    window.browser.onTabs(s => setTabs(s))
  }, [])

  return (
    <div style={s.shell}>
      <TabBar tabs={tabs} />
      <NavBar nav={nav} proxy={proxy} />
      <div style={s.noDragFloor} />
    </div>
  )
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

function TabBar({ tabs }: { tabs: TabsState }) {
  return (
    <div style={s.tabBar}>
      <div style={s.trafficSpacer} />
      <div style={s.tabStrip}>
        {tabs.list.map(tab => (
          <TabChip key={tab.id} tab={tab} active={tab.id === tabs.activeId} />
        ))}
        <button
          style={s.newTabBtn}
          title="New Tab"
          onClick={() => window.browser.newTab()}
        >
          <PlusIcon />
        </button>
      </div>
    </div>
  )
}

function TabChip({ tab, active }: { tab: TabItem; active: boolean }) {
  const [hov, setHov] = useState(false)

  const display = tab.title && tab.title !== 'New Tab'
    ? tab.title
    : (() => { try { return new URL(tab.url).hostname || 'New Tab' } catch { return 'New Tab' } })()

  return (
    <div
      style={{
        ...s.tabChip,
        background: active ? T.activeTab : hov ? T.hover : 'transparent',
        borderColor: active ? T.border : 'transparent',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => window.browser.switchTab(tab.id)}
    >
      <div style={s.tabFavicon}>
        {tab.loading ? <div style={s.tabSpin} /> : <GlobeIcon dim={!active} />}
      </div>

      <span style={{
        ...s.tabTitle,
        color:      active ? T.text : T.sub,
        fontWeight: active ? 600 : 400,
      }}>
        {display}
      </span>

      <button
        style={{ ...s.tabClose, opacity: hov || active ? 1 : 0 }}
        onClick={e => { e.stopPropagation(); window.browser.closeTab(tab.id) }}
        title="Close Tab"
      >
        <XSmall />
      </button>
    </div>
  )
}

// ── Nav bar ───────────────────────────────────────────────────────────────────

function NavBar({ nav, proxy }: { nav: NavState; proxy: string }) {
  const [input,   setInput]   = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!focused && nav.url !== undefined) setInput(nav.url)
  }, [nav.url, focused])

  function go(raw: string) {
    const v = raw.trim(); if (!v) return
    window.browser.go(v); inputRef.current?.blur()
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter')  go(input)
    if (e.key === 'Escape') { setInput(nav.url ?? ''); inputRef.current?.blur() }
  }

  const url      = nav.url ?? ''
  const isSecure = url.startsWith('https://')

  return (
    <div style={s.navBar}>
      {/* Back / Forward cluster */}
      <div style={s.navCluster}>
        <NavBtn title="Back"    disabled={!nav.canBack} onClick={() => window.browser.back()}>
          <ChevLeft />
        </NavBtn>
        <NavBtn title="Forward" disabled={!nav.canFwd}  onClick={() => window.browser.fwd()}>
          <ChevRight />
        </NavBtn>
      </div>

      <NavBtn title={nav.loading ? 'Stop' : 'Reload'} onClick={() => nav.loading ? window.browser.stop() : window.browser.reload()}>
        {nav.loading ? <XIcon /> : <ReloadIcon />}
      </NavBtn>

      {/* Address bar */}
      <div style={{
        ...s.bar,
        borderColor: focused ? 'rgba(59,130,246,0.45)' : T.border,
        boxShadow:   focused ? '0 0 0 2px rgba(59,130,246,0.10)' : 'none',
      }}>
        <span style={{ ...s.lockWrap, color: url ? (isSecure ? T.green : T.muted) : T.muted }}>
          {isSecure ? <LockIcon /> : <UnlockIcon />}
        </span>

        <input
          ref={inputRef}
          style={s.urlInput}
          value={focused ? input : url}
          onChange={e => setInput(e.target.value)}
          onFocus={() => { setFocused(true); setInput(nav.url ?? ''); setTimeout(() => inputRef.current?.select(), 0) }}
          onBlur={() => { setFocused(false); setInput(nav.url ?? '') }}
          onKeyDown={onKey}
          placeholder="Search or enter address"
          spellCheck={false}
          autoComplete="off"
        />

        {nav.loading && <Spinner />}

        {focused && input && (
          <button
            style={s.clearBtn}
            onMouseDown={e => { e.preventDefault(); setInput(''); inputRef.current?.focus() }}
          >
            <XSmall />
          </button>
        )}
      </div>

      {/* Relay badge */}
      <div style={s.relay} title={`Proxying via ${proxy}`}>
        <div style={{
          ...s.relayDot,
          background: nav.loading ? T.muted : T.green,
          boxShadow:  nav.loading ? 'none' : `0 0 6px ${T.green}99`,
        }} />
        <span style={s.relayLabel}>RELAY</span>
        {proxy && <span style={s.relayHost}>{proxy}</span>}
      </div>
    </div>
  )
}

// ── Nav button ────────────────────────────────────────────────────────────────

function NavBtn({ children, disabled, onClick, title }: {
  children: React.ReactNode; disabled?: boolean; onClick: () => void; title?: string
}) {
  const [hov,   setHov]   = useState(false)
  const [press, setPress] = useState(false)
  return (
    <button
      title={title} disabled={disabled} onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPress(false) }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        ...s.navBtn,
        opacity:    disabled ? 0.22 : 1,
        background: press ? 'rgba(255,255,255,0.10)' : hov && !disabled ? T.hover : 'transparent',
        transform:  press ? 'scale(0.87)' : 'scale(1)',
      }}
    >
      {children}
    </button>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const Ico = ({ size = 13, children }: { size?: number; children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
    stroke={T.sub} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
)

const ChevLeft   = () => <Ico><polyline points="13 4 7 10 13 16"/></Ico>
const ChevRight  = () => <Ico><polyline points="7 4 13 10 7 16"/></Ico>
const ReloadIcon = () => <Ico><path d="M3.5 10a6.5 6.5 0 1 0 1.2-3.8"/><polyline points="1 4 4 7 7 4"/></Ico>
const XIcon      = () => <Ico><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></Ico>
const PlusIcon   = () => <Ico size={12}><line x1="10" y1="3" x2="10" y2="17"/><line x1="3" y1="10" x2="17" y2="10"/></Ico>

const XSmall = () => (
  <svg width="8" height="8" viewBox="0 0 10 10" fill="none"
    stroke={T.muted} strokeWidth="1.8" strokeLinecap="round">
    <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
  </svg>
)

const GlobeIcon = ({ dim }: { dim: boolean }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
    stroke={dim ? T.muted : T.sub} strokeWidth="1.6" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a14.5 14.5 0 0 1 0 20 14.5 14.5 0 0 1 0-20"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
  </svg>
)

const LockIcon = () => (
  <svg width="10" height="12" viewBox="0 0 12 15" fill="none"
    stroke={T.green} strokeWidth="1.5" strokeLinecap="round">
    <rect x="1.5" y="6.5" width="9" height="7" rx="1.5" fill={T.greenBg}/>
    <path d="M4 6.5V4.5a2 2 0 0 1 4 0v2"/>
  </svg>
)

const UnlockIcon = () => (
  <svg width="10" height="12" viewBox="0 0 12 15" fill="none"
    stroke={T.muted} strokeWidth="1.5" strokeLinecap="round">
    <rect x="1.5" y="6.5" width="9" height="7" rx="1.5" fill="transparent"/>
    <path d="M4 6.5V4.5a2 2 0 0 1 3.8-1"/>
  </svg>
)

const Spinner = () => <div style={s.spinner} />

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {

  shell: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: T.bg,
    WebkitAppRegion: 'drag',
    userSelect: 'none',
    fontFamily: T.font,
  } as CSSProperties,

  noDragFloor: {
    flex: 1,
    WebkitAppRegion: 'no-drag',
    pointerEvents: 'none',
  } as CSSProperties,

  // ── Tab bar ────────────────────────────────────────────────────────────

  tabBar: {
    display: 'flex',
    alignItems: 'center',
    height: 34,
    background: T.bg,
    borderBottom: `1px solid ${T.divider}`,
    paddingRight: IS_MAC ? 8 : WIN_CTRL_W + 8,
    flexShrink: 0,
  } as CSSProperties,

  trafficSpacer: {
    width: IS_MAC ? 72 : 0,
    flexShrink: 0,
  } as CSSProperties,

  tabStrip: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    paddingInline: 4,
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollbarWidth: 'none',
  } as CSSProperties,

  tabChip: {
    WebkitAppRegion: 'no-drag',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    minWidth: 90,
    maxWidth: 180,
    height: 26,
    paddingInline: 9,
    borderRadius: 8,
    border: '1px solid transparent',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background 0.14s ease, border-color 0.14s ease',
  } as CSSProperties,

  tabFavicon: {
    flexShrink: 0,
    width: 11, height: 11,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  tabSpin: {
    width: 10, height: 10,
    border: `1.5px solid ${T.divider}`,
    borderTop: `1.5px solid ${T.sub}`,
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },

  tabTitle: {
    flex: 1,
    fontSize: 11,
    letterSpacing: 0.1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: T.font,
    transition: 'color 0.14s ease',
  },

  tabClose: {
    WebkitAppRegion: 'no-drag',
    background: T.hover,
    border: 'none',
    borderRadius: '50%',
    width: 14, height: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
    transition: 'opacity 0.14s ease',
  } as CSSProperties,

  newTabBtn: {
    WebkitAppRegion: 'no-drag',
    background: 'transparent',
    border: `1px solid ${T.border}`,
    borderRadius: 7,
    width: 24, height: 24,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    color: T.sub,
    marginLeft: 2,
    transition: 'background 0.14s ease, border-color 0.14s ease',
  } as CSSProperties,

  // ── Nav bar ────────────────────────────────────────────────────────────

  navBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    height: 42,
    background: T.surface,
    borderBottom: `1px solid ${T.divider}`,
    paddingInline: 10,
    flexShrink: 0,
  },

  navCluster: { display: 'flex', gap: 2 },

  navBtn: {
    WebkitAppRegion: 'no-drag',
    background: 'transparent',
    border: 'none',
    color: T.sub,
    width: 28, height: 28,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background 0.14s ease, transform 0.08s ease',
  } as CSSProperties,

  bar: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: 30,
    background: T.elevated,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    paddingInline: 11,
    WebkitAppRegion: 'no-drag',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  } as CSSProperties,

  lockWrap: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.15s ease',
  },

  urlInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    color: T.text,
    fontSize: 12,
    fontFamily: T.font,
    letterSpacing: 0.1,
    caretColor: T.blue,
  } as CSSProperties,

  spinner: {
    width: 11, height: 11,
    border: `1.5px solid ${T.divider}`,
    borderTop: `1.5px solid ${T.sub}`,
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    flexShrink: 0,
  },

  clearBtn: {
    WebkitAppRegion: 'no-drag',
    background: T.hover,
    border: 'none',
    borderRadius: '50%',
    width: 15, height: 15,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    cursor: 'pointer',
    padding: 0,
  } as CSSProperties,

  relay: {
    WebkitAppRegion: 'no-drag',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    background: T.greenBg,
    border: `1px solid ${T.greenBd}`,
    borderRadius: 99,
    paddingInline: 10,
    paddingBlock: 4,
    flexShrink: 0,
    cursor: 'default',
  } as CSSProperties,

  relayDot: {
    width: 6, height: 6,
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'background 0.3s ease, box-shadow 0.3s ease',
  },

  relayLabel: {
    color: T.green,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.2,
    fontFamily: T.font,
  },

  relayHost: {
    color: 'rgba(29,184,20,0.55)',
    fontSize: 10,
    fontFamily: "'SF Mono', 'Menlo', 'Cascadia Code', monospace",
    maxWidth: 110,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}
