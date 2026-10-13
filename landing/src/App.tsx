import { useState } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────

const VERSION = '1.0.0'
const GH_RELEASE = `https://github.com/primestatus360-svg/Tera5G/releases/download/v${VERSION}`
const DL = {
  windows: `${GH_RELEASE}/Tera5G-Browser-Setup-${VERSION}.exe`,
  mac:     `${GH_RELEASE}/Tera5G-Browser-${VERSION}-mac.dmg`,
  linux:   `${GH_RELEASE}/Tera5G-Browser-${VERSION}-linux.AppImage`,
  android: `${GH_RELEASE}/Tera5G-${VERSION}.apk`,
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IcoWindows = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.801" />
  </svg>
)

const IcoApple = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
)

const IcoLinux = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.581 19.049c-.55-.446-.336-1.046-.965-1.45-.371-.507-.947-.194-1.45-.373-.711-1.116.979-2.178.694-3.358-.428-1.308-1.278-2.808-1.986-3.87-.531-.789-.471-1.334-.705-2.074-.114-.359-.279-.75-.472-1.047-.192-.296-.465-.578-.644-.73-.682-.564-1.646-.505-2.719-.505-1.071 0-2.042-.059-2.723.505-.179.152-.452.434-.644.73-.194.297-.358.688-.472 1.047-.234.74-.174 1.285-.705 2.074-.708 1.062-1.558 2.562-1.986 3.87-.285 1.18 1.405 2.242.694 3.358-.503.179-1.079-.134-1.45.373-.629.404-.415 1.004-.965 1.45-.507.41-1.071.207-1.415.743-.352.548-.043 1.255.391 1.403.476.16.959-.131 1.426-.074.542.065.884.518 1.399.612.405.074.757-.101.98-.243.226-.144.376-.298.594-.396a.26.26 0 0 1 .163-.01c.103.028.204.127.309.161.224.072.463.019.657-.036.179-.051.384-.127.496-.208.228-.169.293-.382.467-.52.257-.21.693-.06.905-.303.217-.249.183-.571.265-.925.063-.273.17-.617.064-.95-.086-.271-.253-.497-.31-.763-.045-.209.018-.449-.108-.661-.219-.37-.655-.437-.93-.727-.25-.264-.313-.601-.578-.778zm-9.665-.691c-.12-.33.031-.664.327-.743.296-.079.636.126.756.456.12.33-.031.664-.327.743-.296.079-.636-.126-.756-.456zm4.197 0c-.12.33-.46.535-.756.456-.296-.079-.447-.413-.327-.743.12-.33.46-.535.756-.456.296.079.447.413.327.743z" />
  </svg>
)

const IcoAndroid = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.523 15.341a.999.999 0 1 1-.001-1.998.999.999 0 0 1 .001 1.998m-11.046 0a.999.999 0 1 1 0-1.998.999.999 0 0 1 0 1.998m11.4-6.02 2.001-3.463a.416.416 0 1 0-.722-.416l-2.021 3.503A11.946 11.946 0 0 0 12 7.851a11.946 11.946 0 0 0-5.136 1.094L4.841 5.442a.416.416 0 0 0-.721.416l2.001 3.463C2.689 11.187.343 14.659 0 18.761h24c-.344-4.102-2.689-7.574-6.123-9.44" />
  </svg>
)

const IcoDownload = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const IcoShield = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)

const IcoZap = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

const IcoWallet = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
  </svg>
)

const IcoMonitor = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
)

const IcoCheck = ({ s = 13 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IcoArrow = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

const IcoMenu = ({ s = 20 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const IcoClose = ({ s = 20 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const IcoLock = ({ s = 10 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const IcoGlobe = ({ s = 10 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const IcoRefresh = ({ s = 10 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)

const IcoStar = ({ s = 10 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const IcoHistory = ({ s = 10 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="12 8 12 12 14 14" />
    <path d="M3.05 11a9 9 0 1 0 .5-4H1" />
    <polyline points="1 2 1 7 6 7" />
  </svg>
)

// ─── Browser Mockup ───────────────────────────────────────────────────────────

function BrowserMockup() {
  return (
    <div className="relative w-full animate-float-y" style={{ perspective: '1000px' }}>
      {/* Ambient glow */}
      <div className="absolute pointer-events-none" style={{
        inset: -60, borderRadius: 40,
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(59,130,246,0.14) 0%, rgba(139,92,246,0.06) 50%, transparent 70%)',
        filter: 'blur(20px)',
      }} />

      {/* Browser window */}
      <div className="browser-window relative">

        {/* ── Opera-style sidebar ── */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center gap-1.5 pt-2 pb-3" style={{
          width: 40, background: '#080910', borderRight: '1px solid rgba(255,255,255,0.05)', zIndex: 2,
        }}>
          {/* Brand dot */}
          <div style={{
            width: 22, height: 22, borderRadius: 7, marginBottom: 6,
            background: 'linear-gradient(135deg, #1DB814, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(29,184,20,0.4)',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          {/* Sidebar icons */}
          {[
            { ico: <IcoGlobe s={11} />,   active: true,  color: '#3b82f6' },
            { ico: <IcoStar s={11} />,    active: false, color: '#4a4f72' },
            { ico: <IcoHistory s={11} />, active: false, color: '#4a4f72' },
          ].map((item, i) => (
            <div key={i} style={{
              width: 28, height: 28, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: item.active ? `${item.color}20` : 'transparent',
              border: item.active ? `1px solid ${item.color}35` : '1px solid transparent',
              color: item.active ? item.color : item.color,
            }}>
              {item.ico}
            </div>
          ))}
        </div>

        {/* ── Main browser area (offset for sidebar) ── */}
        <div style={{ marginLeft: 40 }}>

          {/* Tab strip */}
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 2, padding: '6px 10px 0',
            background: '#08090f', borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            {/* Active tab */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#0e0f1d', borderRadius: '8px 8px 0 0',
              padding: '6px 12px', fontSize: 10, color: '#c8ccde',
              borderTop: '2px solid #3b82f6',
              borderLeft: '1px solid rgba(255,255,255,0.07)',
              borderRight: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(29,184,20,0.25)', border: '1px solid rgba(29,184,20,0.5)' }} />
              <span style={{ fontFamily: 'monospace', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                tera5g.app
              </span>
              <span style={{ marginLeft: 4, color: '#3a3e5a', fontSize: 9 }}>×</span>
            </div>
            {/* Inactive tab */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px 7px', fontSize: 10, color: '#3a3e5a',
              borderRadius: '8px 8px 0 0',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1c1e30' }} />
              New Tab
            </div>
            <div style={{
              width: 22, height: 22, borderRadius: 6, marginBottom: 1, marginLeft: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#3a3e5a', fontSize: 14,
            }}>+</div>
          </div>

          {/* Address bar / toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 12px',
            background: '#0e0f1d', borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            {/* Nav buttons */}
            {['‹', '›', '↺'].map((c, i) => (
              <div key={i} style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.04)', color: '#3a3e5a', fontSize: 13,
                fontWeight: 600,
              }}>{c}</div>
            ))}

            {/* Address bar */}
            <div className="address-bar-pill">
              <span style={{ color: '#1DB814', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <IcoLock s={9} />
              </span>
              <span style={{ fontSize: 10, color: '#7b82a8', fontFamily: 'monospace', flex: 1 }}>
                tera5g-production.up.railway.app
              </span>
              <span style={{ display: 'flex', alignItems: 'center', color: '#3a3e5a', flexShrink: 0 }}>
                <IcoRefresh s={9} />
              </span>
            </div>

            {/* RELAY badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700,
              fontFamily: 'monospace', letterSpacing: '0.08em',
              background: 'rgba(29,184,20,0.1)', border: '1px solid rgba(29,184,20,0.3)',
              color: '#1DB814', flexShrink: 0,
            }}>
              <span className="animate-dot-pulse" style={{
                width: 5, height: 5, borderRadius: '50%', background: '#1DB814',
                display: 'inline-block',
              }} />
              RELAY
            </div>
          </div>

          {/* Content */}
          <div className="relative overflow-hidden" style={{ background: '#050b14', height: 188 }}>
            {/* Grid */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage:
                'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }} />

            {/* Scan line */}
            <div className="absolute left-0 right-0 h-px animate-scan-line pointer-events-none" style={{
              background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), rgba(29,184,20,0.4), transparent)',
            }} />

            {/* Center relay node */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  {/* Pulse rings */}
                  <div className="absolute animate-pulse-ring" style={{
                    width: 64, height: 64, borderRadius: '50%',
                    border: '1px solid rgba(59,130,246,0.3)',
                  }} />
                  <div className="absolute animate-pulse-ring" style={{
                    width: 64, height: 64, borderRadius: '50%',
                    border: '1px solid rgba(29,184,20,0.2)',
                    animationDelay: '0.8s',
                  }} />
                  {/* Core */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: 'rgba(29,184,20,0.2)', border: '1px solid rgba(29,184,20,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1DB814' }} />
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.15em', color: '#1DB814' }}>
                  RELAY ACTIVE
                </p>
                <p style={{ fontSize: 8, fontFamily: 'monospace', marginTop: 2, color: 'rgba(255,255,255,0.2)' }}>
                  domain-fronting · internet-free
                </p>
              </div>
            </div>

            {/* Network arcs */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 440 188" preserveAspectRatio="none">
              <path d="M0,94 Q110,40 220,94 Q330,148 440,94" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.1" fill="none" />
              <path d="M0,94 Q110,148 220,94 Q330,40 440,94" stroke="#1DB814" strokeWidth="1" strokeOpacity="0.07" fill="none" />
              <path d="M0,60 Q220,20 440,60" stroke="#8b5cf6" strokeWidth="0.8" strokeOpacity="0.07" fill="none" />
            </svg>

            {/* Status bar */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2" style={{
              background: 'rgba(0,0,0,0.6)', borderTop: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="animate-dot-pulse" style={{
                  width: 5, height: 5, borderRadius: '50%', background: '#1DB814', display: 'inline-block',
                }} />
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.28)' }}>
                  Connected · 0 ms latency
                </span>
              </div>
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.14)' }}>
                v{VERSION}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Phone Mockup ─────────────────────────────────────────────────────────────

function PhoneMockup() {
  return (
    <div className="relative flex-shrink-0" style={{ width: 144 }}>
      {/* Glow */}
      <div className="absolute -inset-8 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 50%, rgba(59,130,246,0.14) 0%, transparent 70%)',
        filter: 'blur(16px)',
      }} />

      {/* Phone shell */}
      <div style={{
        borderRadius: 32, padding: 5,
        background: 'linear-gradient(145deg, #1a1c35, #0e0f1d)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 32px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)',
        position: 'relative',
      }}>
        <div style={{ borderRadius: 27, overflow: 'hidden', background: '#050b14', height: 290 }}>

          {/* Status bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 6px' }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>9:41</span>
            <div style={{ width: 48, height: 12, borderRadius: 99, background: '#000' }} />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              {[4,6,9,11].map((h, i) => (
                <div key={i} style={{
                  width: 3, height: h, borderRadius: 1,
                  background: i < 3 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)',
                }} />
              ))}
            </div>
          </div>

          {/* App header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 14px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                background: 'linear-gradient(135deg, #1DB814, #0ea5e9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#e2e5f1', letterSpacing: '-0.5px' }}>
                Tera<span style={{ color: '#1DB814' }}>5G</span>
              </span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(29,184,20,0.1)', border: '1px solid rgba(29,184,20,0.3)',
              borderRadius: 6, padding: '2px 7px',
            }}>
              <span className="animate-dot-pulse" style={{ width: 4, height: 4, borderRadius: '50%', background: '#1DB814', display: 'inline-block' }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: '#1DB814', fontFamily: 'monospace' }}>LIVE</span>
            </div>
          </div>

          {/* Address bar */}
          <div style={{ margin: '0 10px 8px', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, padding: '5px 10px' }}>
            <IcoLock s={8} />
            <span style={{ flex: 1, fontSize: 8, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>httpbin.org/get</span>
            <IcoRefresh s={8} />
          </div>

          {/* Session timer card */}
          <div style={{
            margin: '0 10px 8px', borderRadius: 14,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            padding: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Session</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#1DB814', background: 'rgba(29,184,20,0.1)', border: '1px solid rgba(29,184,20,0.3)', borderRadius: 4, padding: '1px 5px' }}>ACTIVE</span>
            </div>
            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 18, color: '#e2e5f1', letterSpacing: '-0.5px', lineHeight: 1.1 }}>05:47:23</div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', marginTop: 2, marginBottom: 6 }}>remaining</div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
              <div style={{ height: '100%', width: '74%', borderRadius: 99, background: 'linear-gradient(90deg, #1DB814, #0ea5e9)' }} />
            </div>
          </div>

          {/* Plan tiles */}
          <div style={{ margin: '0 10px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { label: '6H', price: 'UGX 500', color: '#1DB814' },
              { label: '24H', price: 'UGX 1500', color: '#3b82f6' },
            ].map(p => (
              <div key={p.label} style={{
                borderRadius: 10, padding: '8px 6px', textAlign: 'center',
                background: `${p.color}12`, border: `1px solid ${p.color}28`,
              }}>
                <div style={{ fontWeight: 800, fontSize: 12, color: p.color }}>{p.label}</div>
                <div style={{ fontSize: 8, marginTop: 2, color: 'rgba(255,255,255,0.25)' }}>{p.price}</div>
              </div>
            ))}
          </div>

          {/* Bottom tab bar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            display: 'flex', justifyContent: 'space-around', alignItems: 'center',
            padding: '8px 10px 10px',
            background: 'rgba(8,9,15,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            {[
              { ico: <IcoGlobe s={13} />, color: '#3b82f6', active: true },
              { ico: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, color: '#4a4f72', active: false },
              { ico: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>, color: '#4a4f72', active: false },
            ].map((item, i) => (
              <div key={i} style={{
                width: 32, height: 28, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: item.active ? item.color : item.color,
                background: item.active ? `${item.color}18` : 'transparent',
              }}>
                {item.ico}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass" style={{
      background: 'rgba(7,8,15,0.82)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        {/* Brand */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'linear-gradient(135deg, #1DB814 0%, #0ea5e9 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(29,184,20,0.35)',
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>
            <span style={{ color: '#e2e5f1' }}>Tera</span>
            <span className="text-gradient">5G</span>
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center" style={{ gap: 32 }}>
          {[['Features', '#features'], ['Downloads', '#downloads'], ['How It Works', '#how-it-works']].map(([label, href]) => (
            <a key={label} href={href} className="nav-link">{label}</a>
          ))}
        </div>

        {/* Download CTA */}
        <a href="#downloads" className="hidden md:inline-flex items-center gap-2 text-sm font-semibold transition-all active:scale-95" style={{
          background: 'linear-gradient(135deg, #1DB814, #0ea5e9)',
          color: '#000', padding: '8px 18px', borderRadius: 10,
          boxShadow: '0 0 20px rgba(29,184,20,0.25)',
          textDecoration: 'none',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
        >
          <IcoDownload s={13} />
          Download
        </a>

        {/* Mobile menu button */}
        <button onClick={() => setOpen(o => !o)} className="md:hidden" style={{ color: '#7b82a8', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          {open ? <IcoClose /> : <IcoMenu />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden" style={{ padding: '8px 24px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {[['Features', '#features'], ['Downloads', '#downloads'], ['How It Works', '#how-it-works']].map(([label, href]) => (
            <a key={label} href={href} onClick={() => setOpen(false)} style={{
              display: 'block', padding: '12px 0', fontSize: 15, fontWeight: 500,
              color: '#7b82a8', textDecoration: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              {label}
            </a>
          ))}
          <a href="#downloads" onClick={() => setOpen(false)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 16, padding: '10px 22px', borderRadius: 10, fontSize: 14,
            fontWeight: 700, color: '#000',
            background: 'linear-gradient(135deg, #1DB814, #0ea5e9)',
            textDecoration: 'none',
          }}>
            <IcoDownload s={14} />
            Download
          </a>
        </div>
      )}
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 96, paddingBottom: 80, overflow: 'hidden' }}>

      {/* Background gradient mesh */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute animate-orb-drift" style={{
          width: 900, height: 700, borderRadius: '50%', top: '-20%', left: '30%',
          background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.07) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }} />
        <div className="absolute animate-orb-drift" style={{
          width: 700, height: 600, borderRadius: '50%', top: '20%', right: '-10%',
          background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.06) 0%, transparent 65%)',
          filter: 'blur(60px)',
          animationDelay: '-7s',
        }} />
        <div className="absolute animate-orb-drift" style={{
          width: 600, height: 500, borderRadius: '50%', bottom: '-10%', left: '-5%',
          background: 'radial-gradient(ellipse at center, rgba(29,184,20,0.06) 0%, transparent 65%)',
          filter: 'blur(60px)',
          animationDelay: '-13s',
        }} />
      </div>

      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      <div style={{ position: 'relative', maxWidth: 1152, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 64, alignItems: 'center', width: '100%' }}
        className="lg:grid-cols-2 grid-cols-1"
      >
        {/* Left: copy */}
        <div className="animate-fade-up">
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '5px 14px 5px 8px', borderRadius: 99, marginBottom: 28,
            background: 'rgba(29,184,20,0.08)', border: '1px solid rgba(29,184,20,0.22)',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              background: 'rgba(29,184,20,0.15)', border: '1px solid rgba(29,184,20,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="animate-dot-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#1DB814', display: 'inline-block' }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1DB814' }}>Available for Android &amp; Desktop</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(3rem, 6.5vw, 5.4rem)', fontWeight: 900, lineHeight: 1.02, letterSpacing: '-0.04em', marginBottom: 24 }}>
            Browse<br />
            <span className="text-gradient">Without</span><br />
            Limits.
          </h1>

          {/* Sub */}
          <p style={{ fontSize: 17, lineHeight: 1.7, marginBottom: 36, maxWidth: 420, color: 'rgba(226,229,241,0.52)' }}>
            Tera5G is a relay-powered browser and Android app that gives you unrestricted internet access. Pay with MTN or Airtel mobile money and get online instantly.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 36 }}>
            <a href="#downloads" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 26px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              color: '#000', textDecoration: 'none',
              background: 'linear-gradient(135deg, #1DB814, #0ea5e9)',
              boxShadow: '0 0 32px rgba(29,184,20,0.25)',
              transition: 'opacity 0.15s, transform 0.1s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
            >
              <IcoDownload s={16} />
              Download Browser
            </a>
            <a href={DL.android} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 22px', borderRadius: 12, fontSize: 14, fontWeight: 600,
              color: '#e2e5f1', textDecoration: 'none',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
              transition: 'background 0.15s, border-color 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
            >
              <IcoAndroid s={16} />
              Get Android App
              <IcoArrow s={13} />
            </a>
          </div>

          {/* Platform chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: '#4a4f72', fontWeight: 500 }}>Available on</span>
            {[
              { ico: <IcoWindows s={14} />, label: 'Windows' },
              { ico: <IcoApple s={14} />, label: 'macOS' },
              { ico: <IcoLinux s={14} />, label: 'Linux' },
              { ico: <IcoAndroid s={14} />, label: 'Android' },
            ].map(p => (
              <div key={p.label} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 99, padding: '4px 10px',
                fontSize: 11, color: '#7b82a8',
              }}>
                <span style={{ color: '#4a4f72', display: 'flex' }}>{p.ico}</span>
                {p.label}
              </div>
            ))}
          </div>
        </div>

        {/* Right: mockup (hidden on mobile) */}
        <div className="hidden lg:block">
          <BrowserMockup />
        </div>
      </div>
    </section>
  )
}

// ─── Downloads ────────────────────────────────────────────────────────────────

function Downloads() {
  return (
    <section id="downloads" style={{ padding: '112px 0' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className="section-label" style={{ justifyContent: 'center', marginBottom: 14 }}>
            <IcoDownload s={11} />
            Downloads
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 14 }}>
            Get Tera5G
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(226,229,241,0.42)' }}>
            Choose your platform and start browsing freely.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>

          {/* Browser card */}
          <div className="card-glass" style={{ borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden' }}>
            {/* Top accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #1DB814, #0ea5e9 60%, transparent)' }} />
            {/* Glow */}
            <div className="absolute pointer-events-none" style={{ top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(29,184,20,0.05)', filter: 'blur(40px)' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 13,
                  background: 'rgba(29,184,20,0.1)', border: '1px solid rgba(29,184,20,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1DB814',
                }}>
                  <IcoMonitor s={20} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e5f1', letterSpacing: '-0.02em' }}>Tera5G Browser</div>
                  <div style={{ fontSize: 11.5, color: '#4a4f72', marginTop: 1 }}>Desktop Application</div>
                </div>
              </div>
              <span style={{
                fontSize: 10, fontFamily: 'monospace', padding: '3px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                color: '#4a4f72',
              }}>
                v{VERSION}
              </span>
            </div>

            <p style={{ fontSize: 13.5, lineHeight: 1.65, marginBottom: 20, color: 'rgba(226,229,241,0.42)' }}>
              A full-featured browser with a built-in relay proxy. Powered by Electron — runs natively on Windows, macOS, and Linux.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Built-in domain relay proxy', 'Real-time connection status', 'Multi-tab browsing', 'Auto-connects to relay'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'rgba(226,229,241,0.48)' }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 99, flexShrink: 0,
                    background: 'rgba(29,184,20,0.12)', border: '1px solid rgba(29,184,20,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1DB814',
                  }}>
                    <IcoCheck s={10} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { ico: <IcoWindows />, label: 'Windows',  href: DL.windows, sub: 'x64 · .exe installer' },
                { ico: <IcoApple />,   label: 'macOS',    href: DL.mac,     sub: 'Intel + Apple Silicon' },
                { ico: <IcoLinux />,   label: 'Linux',    href: DL.linux,   sub: 'x64 · .AppImage' },
              ].map(p => (
                <a key={p.label} href={p.href} className="dl-btn">
                  <span style={{ color: '#7b82a8', display: 'flex', flexShrink: 0 }}>{p.ico}</span>
                  <span style={{ flex: 1, fontWeight: 600 }}>{p.label}</span>
                  <span style={{ fontSize: 11, color: '#4a4f72', fontFamily: 'monospace' }}>{p.sub}</span>
                  <span style={{ color: '#4a4f72', display: 'flex', flexShrink: 0 }}><IcoDownload s={13} /></span>
                </a>
              ))}
            </div>
          </div>

          {/* Android card */}
          <div className="card-glass" style={{ borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden' }}>
            {/* Top accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6 60%, transparent)' }} />
            {/* Glow */}
            <div className="absolute pointer-events-none" style={{ top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(59,130,246,0.05)', filter: 'blur(40px)' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 13,
                  background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6',
                }}>
                  <IcoAndroid s={20} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e5f1', letterSpacing: '-0.02em' }}>Tera5G Android</div>
                  <div style={{ fontSize: 11.5, color: '#4a4f72', marginTop: 1 }}>Mobile App · APK</div>
                </div>
              </div>
              <PhoneMockup />
            </div>

            <p style={{ fontSize: 13.5, lineHeight: 1.65, marginBottom: 20, color: 'rgba(226,229,241,0.42)' }}>
              Browse freely on Android. Choose a 6-hour or 24-hour plan and pay instantly with MTN or Airtel mobile money — no card needed.
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Pay with MTN or Airtel Money', '6-hour & 24-hour plans', 'Instant activation', 'Requires Android 8.0+'].map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'rgba(226,229,241,0.48)' }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 99, flexShrink: 0,
                    background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6',
                  }}>
                    <IcoCheck s={10} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <a href={DL.android} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              color: '#fff', textDecoration: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              boxShadow: '0 0 24px rgba(59,130,246,0.2)',
              transition: 'opacity 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
            >
              <IcoDownload s={16} />
              Download APK
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: IcoShield, color: '#1DB814', title: 'Domain Relay Technology',   desc: 'Traffic is securely proxied through trusted relay endpoints — bypassing network blocks without exposing your device.' },
  { icon: IcoZap,    color: '#f59e0b', title: 'High-Speed Relay',           desc: 'Our relay infrastructure is built for speed. Stream, download, and browse with minimal latency.' },
  { icon: IcoWallet, color: '#3b82f6', title: 'Mobile Money Payments',      desc: 'Activate sessions instantly with MTN Mobile Money or Airtel Money. No bank card required.' },
  { icon: IcoMonitor,color: '#8b5cf6', title: 'Cross-Platform',             desc: 'Native browser for Windows, macOS, and Linux. Android app for mobile. One relay, every device.' },
]

function Features() {
  return (
    <section id="features" style={{ padding: '112px 0', position: 'relative' }}>
      {/* Subtle section bg */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 1000px 600px at 50% 50%, rgba(139,92,246,0.04), transparent 70%)',
      }} />

      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className="section-label" style={{ justifyContent: 'center', color: '#8b5cf6' }}>
            <IcoZap s={11} />
            Features
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 14 }}>
            Why Tera5G?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(226,229,241,0.42)', maxWidth: 480, margin: '0 auto' }}>
            Everything you need for unrestricted internet access — in one product.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="card-glass feature-card" style={{ borderRadius: 18, padding: 24 }}>
              {/* Colored top strip */}
              <div style={{ height: 2, background: `linear-gradient(90deg, ${f.color}, transparent)`, marginBottom: 20, borderRadius: 1 }} />

              <div style={{
                width: 44, height: 44, borderRadius: 13, marginBottom: 18,
                background: `${f.color}12`, border: `1px solid ${f.color}28`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color,
              }}>
                <f.icon s={20} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 9, letterSpacing: '-0.02em', color: '#e2e5f1' }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.65, color: 'rgba(226,229,241,0.38)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEPS = [
  { n: '01', color: '#3b82f6',  title: 'Download',  desc: 'Get the Tera5G browser for your desktop (Windows, macOS, Linux) or download the Android APK. Free to download.', icon: IcoDownload },
  { n: '02', color: '#8b5cf6',  title: 'Activate',  desc: 'Open the app and choose a 6-hour or 24-hour browsing plan. Pay instantly using MTN or Airtel mobile money.', icon: IcoWallet },
  { n: '03', color: '#1DB814',  title: 'Browse',    desc: 'Your session is live. The app connects through the Tera5G relay — browse the full internet without restrictions.', icon: IcoGlobe },
]

function HowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: '112px 0', position: 'relative' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 800px 500px at 50% 50%, rgba(29,184,20,0.04), transparent 70%)',
      }} />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className="section-label" style={{ justifyContent: 'center', color: '#1DB814' }}>
            <IcoZap s={11} />
            How It Works
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 14 }}>
            Up and running in three steps.
          </h2>
        </div>

        {/* Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ position: 'relative', display: 'flex', gap: 20, padding: 24, borderRadius: 18 }}
              className="card-glass"
            >
              {/* Vertical connector (not on last) */}
              {i < STEPS.length - 1 && (
                <div style={{
                  position: 'absolute', left: 43, top: '100%', width: 1, height: 12,
                  background: `linear-gradient(to bottom, ${step.color}40, ${STEPS[i+1].color}20)`,
                  zIndex: 1,
                }} />
              )}

              {/* Step number */}
              <div style={{
                flexShrink: 0, width: 44, height: 44, borderRadius: 13,
                background: `${step.color}14`, border: `1px solid ${step.color}30`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: step.color,
              }}>
                <step.icon s={18} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.1em',
                    color: step.color, background: `${step.color}12`, border: `1px solid ${step.color}25`,
                    padding: '2px 7px', borderRadius: 4,
                  }}>
                    STEP {step.n}
                  </span>
                  <h3 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em', color: '#e2e5f1' }}>
                    {step.title}
                  </h3>
                </div>
                <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'rgba(226,229,241,0.42)' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <a href="#downloads" style={{
            display: 'inline-flex', alignItems: 'center', gap: 9,
            padding: '13px 32px', borderRadius: 13, fontSize: 14, fontWeight: 700,
            color: '#000', textDecoration: 'none',
            background: 'linear-gradient(135deg, #1DB814, #0ea5e9)',
            boxShadow: '0 0 36px rgba(29,184,20,0.22)',
            transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
          >
            <IcoDownload s={16} />
            Get Started Now
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function Banner() {
  return (
    <section style={{ padding: '80px 0' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
        <div style={{
          position: 'relative', borderRadius: 28, padding: '64px 48px', textAlign: 'center', overflow: 'hidden',
          background: 'rgba(20,22,40,0.8)', border: '1px solid rgba(255,255,255,0.09)',
        }}>
          {/* Gradient mesh background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="animate-glow-pulse" style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(29,184,20,0.06), rgba(59,130,246,0.04), transparent 70%)',
            }} />
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }} />
          </div>

          <div style={{ position: 'relative' }}>
            <div className="section-label" style={{ justifyContent: 'center' }}>
              <IcoZap s={11} />
              Start Today
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 14 }}>
              Ready to browse without limits?
            </h2>
            <p style={{ fontSize: 16, marginBottom: 36, maxWidth: 400, margin: '0 auto 36px', color: 'rgba(226,229,241,0.42)' }}>
              Download Tera5G and get unrestricted access in minutes.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {[
                { ico: <IcoWindows s={14} />, label: 'Windows', href: DL.windows, primary: true },
                { ico: <IcoApple s={14} />,   label: 'macOS',   href: DL.mac,     primary: false },
                { ico: <IcoLinux s={14} />,   label: 'Linux',   href: DL.linux,   primary: false },
                { ico: <IcoAndroid s={14} />, label: 'Android', href: DL.android, primary: false },
              ].map(p => (
                <a key={p.label} href={p.href} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '10px 20px', borderRadius: 11, fontSize: 13, fontWeight: 700,
                  textDecoration: 'none',
                  color: p.primary ? '#000' : '#e2e5f1',
                  background: p.primary ? 'linear-gradient(135deg, #1DB814, #0ea5e9)' : 'rgba(255,255,255,0.06)',
                  border: p.primary ? 'none' : '1px solid rgba(255,255,255,0.09)',
                  boxShadow: p.primary ? '0 0 24px rgba(29,184,20,0.22)' : 'none',
                  transition: 'opacity 0.15s, transform 0.1s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                >
                  {p.ico}
                  {p.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 0' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #1DB814, #0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.04em' }}>
              <span style={{ color: '#e2e5f1' }}>Tera</span>
              <span className="text-gradient">5G</span>
            </span>
            <span style={{ fontSize: 11, color: '#4a4f72', marginLeft: 4 }}>by PENTAGHOST</span>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {[['Downloads', '#downloads'], ['Features', '#features'], ['How It Works', '#how-it-works']].map(([label, href]) => (
              <a key={label} href={href} className="nav-link" style={{ fontSize: 13 }}>{label}</a>
            ))}
          </div>

          <p style={{ fontSize: 12, color: '#4a4f72' }}>
            © {new Date().getFullYear()} PENTAGHOST
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div style={{ background: '#07080f', color: '#e2e5f1', minHeight: '100vh', overflowX: 'hidden' }}>
      <Nav />
      <Hero />
      <Downloads />
      <Features />
      <HowItWorks />
      <Banner />
      <Footer />
    </div>
  )
}
