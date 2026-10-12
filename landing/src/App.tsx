import { useState } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────

const VERSION = '1.0.0'

const GH_RELEASE = `https://github.com/primestatus360-svg/Tera5G/releases/download/v${VERSION}`

const DL = {
  windows: `${GH_RELEASE}/Tera5G-Browser-Setup-${VERSION}.exe`,
  mac:     `${GH_RELEASE}/Tera5G-Browser-${VERSION}-mac.dmg`,
  linux:   `${GH_RELEASE}/Tera5G-Browser-${VERSION}-linux.AppImage`,
  android: `/downloads/Tera5G-${VERSION}.apk`,
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IcoWindows({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.801" />
    </svg>
  )
}

function IcoApple({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  )
}

function IcoLinux({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.581 19.049c-.55-.446-.336-1.046-.965-1.45-.371-.507-.947-.194-1.45-.373-.711-1.116.979-2.178.694-3.358-.428-1.308-1.278-2.808-1.986-3.87-.531-.789-.471-1.334-.705-2.074-.114-.359-.279-.75-.472-1.047-.192-.296-.465-.578-.644-.73-.682-.564-1.646-.505-2.719-.505-1.071 0-2.042-.059-2.723.505-.179.152-.452.434-.644.73-.194.297-.358.688-.472 1.047-.234.74-.174 1.285-.705 2.074-.708 1.062-1.558 2.562-1.986 3.87-.285 1.18 1.405 2.242.694 3.358-.503.179-1.079-.134-1.45.373-.629.404-.415 1.004-.965 1.45-.507.41-1.071.207-1.415.743-.352.548-.043 1.255.391 1.403.476.16.959-.131 1.426-.074.542.065.884.518 1.399.612.405.074.757-.101.98-.243.226-.144.376-.298.594-.396a.26.26 0 0 1 .163-.01c.103.028.204.127.309.161.224.072.463.019.657-.036.179-.051.384-.127.496-.208.228-.169.293-.382.467-.52.257-.21.693-.06.905-.303.217-.249.183-.571.265-.925.063-.273.17-.617.064-.95-.086-.271-.253-.497-.31-.763-.045-.209.018-.449-.108-.661-.219-.37-.655-.437-.93-.727-.25-.264-.313-.601-.578-.778zm-9.665-.691c-.12-.33.031-.664.327-.743.296-.079.636.126.756.456.12.33-.031.664-.327.743-.296.079-.636-.126-.756-.456zm4.197 0c-.12.33-.46.535-.756.456-.296-.079-.447-.413-.327-.743.12-.33.46-.535.756-.456.296.079.447.413.327.743z" />
    </svg>
  )
}

function IcoAndroid({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.523 15.341a.999.999 0 1 1-.001-1.998.999.999 0 0 1 .001 1.998m-11.046 0a.999.999 0 1 1 0-1.998.999.999 0 0 1 0 1.998m11.4-6.02 2.001-3.463a.416.416 0 1 0-.722-.416l-2.021 3.503A11.946 11.946 0 0 0 12 7.851a11.946 11.946 0 0 0-5.136 1.094L4.841 5.442a.416.416 0 0 0-.721.416l2.001 3.463C2.689 11.187.343 14.659 0 18.761h24c-.344-4.102-2.689-7.574-6.123-9.44" />
    </svg>
  )
}

function IcoDownload({ s = 18 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function IcoShield({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function IcoZap({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function IcoWallet({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  )
}

function IcoMonitor({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

function IcoCheck({ s = 13 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IcoArrow({ s = 15 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function IcoMenu({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function IcoClose({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ─── Browser Mockup ───────────────────────────────────────────────────────────

function BrowserMockup() {
  return (
    <div className="relative w-full animate-float-y">
      <div
        className="absolute -inset-10 rounded-3xl animate-glow-pulse pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(29,184,20,0.2) 0%, transparent 70%)' }}
      />
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          border: '1px solid rgba(84,84,88,0.45)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
        }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#1C1C1E' }}>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#FF453A' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#FF9F0A' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#1DB814' }} />
          </div>
          <div
            className="flex-1 flex items-center gap-2 rounded-md px-3 py-1.5"
            style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1DB814" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
              tera5g-production.up.railway.app
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold font-mono"
            style={{
              color: '#1DB814',
              background: 'rgba(29,184,20,0.12)',
              border: '1px solid rgba(29,184,20,0.35)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#1DB814] animate-pulse" />
            RELAY
          </div>
        </div>

        {/* Content */}
        <div className="relative overflow-hidden" style={{ background: '#050b14', height: 220 }}>
          {/* Grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(29,184,20,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(29,184,20,0.045) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />

          {/* Scan line */}
          <div
            className="absolute left-0 right-0 h-px animate-scan-line pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(29,184,20,0.6), transparent)' }}
          />

          {/* Center node */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center mb-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(29,184,20,0.08)', border: '1px solid rgba(29,184,20,0.25)' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(29,184,20,0.15)', border: '1px solid rgba(29,184,20,0.5)' }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ background: '#1DB814' }} />
                  </div>
                </div>
                <div
                  className="absolute inset-0 rounded-full animate-pulse-ring"
                  style={{ border: '1px solid rgba(29,184,20,0.35)' }}
                />
              </div>
              <p className="text-xs font-mono font-bold tracking-widest" style={{ color: '#1DB814' }}>
                RELAY ACTIVE
              </p>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                domain-fronting enabled
              </p>
            </div>
          </div>

          {/* Network arcs */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 480 220" preserveAspectRatio="none">
            <path d="M0,110 Q120,50 240,110 Q360,170 480,110" stroke="#1DB814" strokeWidth="1" strokeOpacity="0.12" fill="none" />
            <path d="M0,110 Q120,170 240,110 Q360,50 480,110" stroke="#1DB814" strokeWidth="1" strokeOpacity="0.07" fill="none" />
          </svg>

          {/* Status bar */}
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2"
            style={{ background: 'rgba(0,0,0,0.55)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#1DB814' }} />
              <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Connected · 0 ms latency
              </span>
            </div>
            <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.15)' }}>
              v{VERSION}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Phone Mockup ─────────────────────────────────────────────────────────────

function PhoneMockup() {
  return (
    <div className="relative mx-auto flex-shrink-0" style={{ width: 148 }}>
      <div
        className="absolute -inset-6 rounded-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(10,132,255,0.12) 0%, transparent 70%)' }}
      />
      <div
        className="relative rounded-[30px] p-[5px]"
        style={{
          background: '#1C1C1E',
          border: '1px solid rgba(84,84,88,0.5)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.7)',
        }}
      >
        <div className="rounded-[25px] overflow-hidden" style={{ background: '#050b14', height: 280 }}>
          {/* Status bar */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <span className="text-[9px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>9:41</span>
            <div className="w-14 h-3.5 rounded-full" style={{ background: '#000' }} />
            <div className="flex items-end gap-px h-3">
              {[1, 1.5, 2, 2.5].map((h, i) => (
                <div
                  key={i}
                  className="w-[3px] rounded-sm"
                  style={{ height: `${h * 4}px`, background: i < 3 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}
                />
              ))}
            </div>
          </div>

          {/* App name */}
          <div className="flex items-center gap-1 px-4 pb-3">
            <span className="text-sm font-bold text-white">Tera</span>
            <span className="text-sm font-bold" style={{ color: '#1DB814' }}>5G</span>
          </div>

          {/* Session card */}
          <div
            className="mx-3 mb-2 rounded-2xl p-3"
            style={{ background: 'rgba(28,28,30,0.8)', border: '1px solid rgba(84,84,88,0.3)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Session
              </span>
              <span
                className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                style={{ color: '#1DB814', background: 'rgba(29,184,20,0.1)', border: '1px solid rgba(29,184,20,0.3)' }}
              >
                ACTIVE
              </span>
            </div>
            <div className="text-white font-mono font-bold" style={{ fontSize: 18 }}>05:47:23</div>
            <div className="text-[8px] mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>remaining</div>
            <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full w-3/4 rounded-full" style={{ background: '#1DB814' }} />
            </div>
          </div>

          {/* Plan buttons */}
          <div className="mx-3 mb-2 grid grid-cols-2 gap-2">
            {[
              { label: '6H', price: 'UGX 500', color: '#1DB814' },
              { label: '24H', price: 'UGX 1500', color: '#0A84FF' },
            ].map(p => (
              <div
                key={p.label}
                className="rounded-xl p-2 text-center"
                style={{ background: `${p.color}15`, border: `1px solid ${p.color}30` }}
              >
                <div className="font-bold text-[11px]" style={{ color: p.color }}>{p.label}</div>
                <div className="text-[8px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{p.price}</div>
              </div>
            ))}
          </div>

          {/* Relay status */}
          <div className="mx-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#1DB814' }} />
              <span className="font-mono text-[8px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Relay active
              </span>
            </div>
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
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        background: 'rgba(0,0,0,0.72)',
        borderBottom: '1px solid rgba(84,84,88,0.2)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center font-bold text-xl tracking-tight">
          <span className="text-white">Tera</span>
          <span style={{ color: '#1DB814' }}>5G</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {[['Features', '#features'], ['Downloads', '#downloads'], ['How It Works', '#how-it-works']].map(
            ([label, href]) => (
              <a
                key={label}
                href={href}
                className="text-sm transition-colors hover:text-white"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                {label}
              </a>
            )
          )}
        </div>

        <a
          href="#downloads"
          className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-black transition-all hover:opacity-90 active:scale-95"
          style={{ background: '#1DB814', boxShadow: '0 0 20px rgba(29,184,20,0.3)' }}
        >
          <IcoDownload s={14} />
          Download
        </a>

        <button
          onClick={() => setOpen(o => !o)}
          className="md:hidden p-1 transition-colors hover:text-white"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          aria-label="Toggle menu"
        >
          {open ? <IcoClose /> : <IcoMenu />}
        </button>
      </div>

      {open && (
        <div
          className="md:hidden px-6 pb-5 space-y-1"
          style={{ borderTop: '1px solid rgba(84,84,88,0.2)' }}
        >
          {[['Features', '#features'], ['Downloads', '#downloads'], ['How It Works', '#how-it-works']].map(
            ([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="block py-2.5 text-sm"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                {label}
              </a>
            )
          )}
          <a
            href="#downloads"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-black"
            style={{ background: '#1DB814' }}
          >
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
    <section className="relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: 0,
          background:
            'radial-gradient(ellipse 1000px 700px at 50% -80px, rgba(29,184,20,0.1) 0%, transparent 65%)',
        }}
      />
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center w-full">
        {/* Text */}
        <div>
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-7"
            style={{
              background: 'rgba(29,184,20,0.1)',
              border: '1px solid rgba(29,184,20,0.25)',
              color: '#1DB814',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#1DB814' }} />
            Available for Android & Desktop
          </div>

          <h1 className="font-black leading-[1.04] tracking-tight mb-6" style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)' }}>
            Browse<br />
            <span style={{ color: '#1DB814' }}>Without</span><br />
            Limits.
          </h1>

          <p className="text-lg leading-relaxed mb-9 max-w-md" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Tera5G is a relay-powered browser and Android app that gives you unrestricted internet access. Pay with MTN or Airtel mobile money and get online instantly.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <a
              href="#downloads"
              className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm text-black transition-all hover:opacity-90 active:scale-95"
              style={{ background: '#1DB814', boxShadow: '0 0 30px rgba(29,184,20,0.28)' }}
            >
              <IcoDownload s={16} />
              Download Browser
            </a>
            <a
              href={DL.android}
              className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:bg-white/10 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(84,84,88,0.4)' }}
            >
              <IcoAndroid s={16} />
              Get Android App
              <IcoArrow s={14} />
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.22)' }}>Available on</span>
            {[
              { icon: <IcoWindows />, label: 'Windows' },
              { icon: <IcoApple />, label: 'macOS' },
              { icon: <IcoLinux />, label: 'Linux' },
              { icon: <IcoAndroid />, label: 'Android' },
            ].map(p => (
              <div
                key={p.label}
                className="flex items-center gap-1.5 text-xs"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>{p.icon}</span>
                {p.label}
              </div>
            ))}
          </div>
        </div>

        {/* Mockup */}
        <div className="hidden lg:block">
          <BrowserMockup />
        </div>
      </div>
    </section>
  )
}

// ─── Downloads Section ────────────────────────────────────────────────────────

function Downloads() {
  return (
    <section id="downloads" className="py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight">Get Tera5G</h2>
          <p className="text-lg" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Choose your platform and start browsing freely.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Browser Card */}
          <div
            className="relative rounded-2xl p-8 overflow-hidden"
            style={{
              background: 'rgba(28,28,30,0.55)',
              border: '1px solid rgba(84,84,88,0.3)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div
              className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
              style={{ background: 'rgba(29,184,20,0.06)', filter: 'blur(40px)' }}
            />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(29,184,20,0.12)', border: '1px solid rgba(29,184,20,0.28)' }}
                >
                  <span style={{ color: '#1DB814' }}>
                    <IcoMonitor s={20} />
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Tera5G Browser</h3>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Desktop Application</span>
                </div>
              </div>
              <span
                className="text-[10px] font-mono px-2 py-1 rounded-lg"
                style={{
                  color: 'rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                v{VERSION}
              </span>
            </div>

            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
              A full-featured browser with a built-in relay proxy. Powered by Electron — runs natively on Windows, macOS, and Linux.
            </p>

            <ul className="space-y-2.5 mb-8">
              {['Built-in domain relay proxy', 'Real-time connection status', 'Multi-tab browsing', 'Auto-connects to relay'].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <span style={{ color: '#1DB814' }}><IcoCheck /></span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="space-y-2.5">
              {[
                { icon: <IcoWindows />, label: 'Download for Windows', href: DL.windows, ext: 'x64 .exe installer' },
                { icon: <IcoApple />,   label: 'Download for macOS',   href: DL.mac,     ext: 'Intel + Apple Silicon .dmg' },
                { icon: <IcoLinux />,   label: 'Download for Linux',   href: DL.linux,   ext: 'x64 .AppImage' },
              ].map(p => (
                <a
                  key={p.ext}
                  href={p.href}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-white transition-all hover:bg-white/[0.06] active:scale-[0.99]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(84,84,88,0.22)' }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>{p.icon}</span>
                  <span className="flex-1">{p.label}</span>
                  <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>{p.ext}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}><IcoDownload s={14} /></span>
                </a>
              ))}
            </div>
          </div>

          {/* Android Card */}
          <div
            className="relative rounded-2xl p-8 overflow-hidden"
            style={{
              background: 'rgba(28,28,30,0.55)',
              border: '1px solid rgba(84,84,88,0.3)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div
              className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
              style={{ background: 'rgba(10,132,255,0.06)', filter: 'blur(40px)' }}
            />

            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(10,132,255,0.12)', border: '1px solid rgba(10,132,255,0.28)' }}
                >
                  <span style={{ color: '#0A84FF' }}>
                    <IcoAndroid s={20} />
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Tera5G Android</h3>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Mobile App · APK</span>
                </div>
              </div>
              <PhoneMockup />
            </div>

            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Browse freely on Android. Choose a 6-hour or 24-hour plan and pay instantly with MTN or Airtel mobile money — no card needed.
            </p>

            <ul className="space-y-2.5 mb-8">
              {['Pay with MTN or Airtel Money', '6-hour & 24-hour plans', 'Instant activation', 'Requires Android 8.0+'].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <span style={{ color: '#0A84FF' }}><IcoCheck /></span>
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={DL.android}
              className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-[0.99]"
              style={{ background: '#0A84FF', boxShadow: '0 0 24px rgba(10,132,255,0.22)' }}
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
  {
    icon: IcoShield,
    color: '#1DB814',
    title: 'Domain Relay Technology',
    desc: 'Traffic is securely proxied through trusted relay endpoints — bypassing network blocks without exposing your device.',
  },
  {
    icon: IcoZap,
    color: '#FF9F0A',
    title: 'High-Speed Relay',
    desc: 'Our relay infrastructure is built for speed. Stream, download, and browse with minimal latency.',
  },
  {
    icon: IcoWallet,
    color: '#0A84FF',
    title: 'Mobile Money Payments',
    desc: 'Activate sessions instantly with MTN Mobile Money or Airtel Money. No bank card required.',
  },
  {
    icon: IcoMonitor,
    color: '#BF5AF2',
    title: 'Cross-Platform',
    desc: 'Native browser for Windows, macOS, and Linux. Android app for mobile. One relay, every device.',
  },
]

function Features() {
  return (
    <section id="features" className="py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight">Why Tera5G?</h2>
          <p className="text-lg max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Everything you need for unrestricted internet access — in one product.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl transition-transform duration-200 hover:scale-[1.02]"
              style={{
                background: 'rgba(28,28,30,0.5)',
                border: '1px solid rgba(84,84,88,0.25)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${f.color}14`, border: `1px solid ${f.color}30` }}
              >
                <span style={{ color: f.color }}>
                  <f.icon s={20} />
                </span>
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: '01',
    title: 'Download',
    desc: 'Get the Tera5G browser for your desktop (Windows, macOS, Linux) or download the Android APK. Free to download.',
  },
  {
    n: '02',
    title: 'Activate',
    desc: 'Open the app and choose a 6-hour or 24-hour browsing plan. Pay instantly using MTN or Airtel mobile money.',
  },
  {
    n: '03',
    title: 'Browse',
    desc: 'Your session is live. The app connects through the Tera5G relay — browse the full internet without restrictions.',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 900px 500px at 50% 50%, rgba(29,184,20,0.05) 0%, transparent 70%)',
        }}
      />
      <div className="relative max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight">How It Works</h2>
          <p className="text-lg" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Up and running in three steps.
          </p>
        </div>

        <div className="space-y-6">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="flex gap-6 p-6 rounded-2xl"
              style={{
                background: 'rgba(28,28,30,0.45)',
                border: '1px solid rgba(84,84,88,0.22)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div
                className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-sm"
                style={{
                  background: 'rgba(29,184,20,0.1)',
                  border: '1px solid rgba(29,184,20,0.28)',
                  color: '#1DB814',
                }}
              >
                {step.n}
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1.5">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.42)' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <a
            href="#downloads"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-black text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: '#1DB814', boxShadow: '0 0 32px rgba(29,184,20,0.25)' }}
          >
            <IcoDownload s={16} />
            Get Started Now
          </a>
        </div>
      </div>
    </section>
  )
}

// ─── Banner ───────────────────────────────────────────────────────────────────

function Banner() {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div
          className="relative rounded-3xl px-10 py-14 text-center overflow-hidden"
          style={{
            background: 'rgba(28,28,30,0.6)',
            border: '1px solid rgba(29,184,20,0.2)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none animate-glow-pulse"
            style={{
              background: 'radial-gradient(ellipse 800px 400px at 50% 50%, rgba(29,184,20,0.07) 0%, transparent 70%)',
            }}
          />
          <div className="relative">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 tracking-tight">
              Ready to browse without limits?
            </h2>
            <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.42)' }}>
              Download Tera5G and get unrestricted access in minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={DL.windows}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-black transition-all hover:opacity-90 active:scale-95"
                style={{ background: '#1DB814' }}
              >
                <IcoWindows s={15} />
                Windows
              </a>
              <a
                href={DL.mac}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:bg-white/10 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(84,84,88,0.35)' }}
              >
                <IcoApple s={15} />
                macOS
              </a>
              <a
                href={DL.linux}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:bg-white/10 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(84,84,88,0.35)' }}
              >
                <IcoLinux s={15} />
                Linux
              </a>
              <a
                href={DL.android}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:bg-white/10 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(84,84,88,0.35)' }}
              >
                <IcoAndroid s={15} />
                Android
              </a>
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
    <footer className="py-12" style={{ borderTop: '1px solid rgba(84,84,88,0.18)' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="text-white">Tera</span>
            <span style={{ color: '#1DB814' }}>5G</span>
            <span className="font-normal text-xs ml-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
              by PENTAGHOST
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            {[
              ['Downloads', '#downloads'],
              ['Features', '#features'],
              ['How It Works', '#how-it-works'],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="transition-colors hover:text-white"
                style={{ color: 'rgba(255,255,255,0.28)' }}
              >
                {label}
              </a>
            ))}
          </div>

          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
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
    <div className="bg-black text-white min-h-screen overflow-x-hidden">
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
