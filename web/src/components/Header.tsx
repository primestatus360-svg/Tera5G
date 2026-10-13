import {
  Wifi, WifiOff, ShieldCheck, ShieldAlert, Radio, Trophy,
  LayoutDashboard, Monitor, Plug, Users, Ticket, Search,
  CreditCard, X, Activity, Zap,
} from 'lucide-react'
import { FirewallMode } from '../types'
import { Section } from '../App'

interface Props {
  firewallMode: FirewallMode
  connected: boolean
  activeSessions: number
  onlineBrowsers: number
  activeSection: Section
  onNavigate: (s: Section) => void
  onClose?: () => void
}

const NAV_GROUPS: {
  label: string
  items: { icon: React.ElementType; label: string; section: Section; accent: string }[]
}[] = [
  {
    label: 'Control',
    items: [
      { icon: Monitor,         label: 'Browsers',    section: 'browsers',    accent: '#3b82f6' },
      { icon: LayoutDashboard, label: 'Dashboard',   section: 'dashboard',   accent: '#8b5cf6' },
    ],
  },
  {
    label: 'Monitor',
    items: [
      { icon: Plug,            label: 'Connections', section: 'connections', accent: '#a78bfa' },
      { icon: Radio,           label: 'Traffic',     section: 'traffic',     accent: '#06b6d4' },
      { icon: Trophy,          label: 'Leaderboard', section: 'leaderboard', accent: '#f59e0b' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { icon: Users,           label: 'Users',       section: 'users',       accent: '#1DB814' },
      { icon: Ticket,          label: 'Vouchers',    section: 'vouchers',    accent: '#f97316' },
      { icon: CreditCard,      label: 'Payments',    section: 'payments',    accent: '#10b981' },
      { icon: Search,          label: 'Search',      section: 'search',      accent: '#64748b' },
    ],
  },
  {
    label: 'Security',
    items: [
      { icon: ShieldAlert,     label: 'Firewall',    section: 'firewall',    accent: '#ef4444' },
      { icon: Activity,        label: 'JA3',         section: 'ja3',         accent: '#ec4899' },
    ],
  },
]

export function Sidebar({
  firewallMode, connected, activeSessions, onlineBrowsers,
  activeSection, onNavigate, onClose,
}: Props) {
  const isVulnerable = firewallMode === 'vulnerable'

  return (
    <aside
      style={{
        width: 228,
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#0e0f1d',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        position: 'relative',
      }}
    >
      {/* Subtle gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 200% 60% at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 60%)',
      }} />

      {/* ── Brand ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 18px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0, position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Logo mark */}
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #1DB814 0%, #0ea5e9 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(29,184,20,0.35)',
          }}>
            <Zap size={16} color="#fff" fill="#fff" />
          </div>
          <div>
            <div style={{
              fontSize: 15, fontWeight: 800, lineHeight: 1,
              background: 'linear-gradient(90deg, #e2e5f1 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}>
              Tera<span style={{
                background: 'linear-gradient(90deg, #1DB814, #0ea5e9)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>5G</span>
            </div>
            <div style={{ fontSize: 10, color: '#4a4f72', marginTop: 2, fontWeight: 500, letterSpacing: '0.04em' }}>
              Admin Console
            </div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 8, cursor: 'pointer',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <X size={13} color="#7b82a8" />
          </button>
        )}
      </div>

      {/* ── Status cards ── */}
      <div style={{ padding: '12px 12px 6px', flexShrink: 0 }}>
        {/* Firewall status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          borderRadius: 10, padding: '9px 11px', marginBottom: 8,
          background: isVulnerable
            ? 'rgba(239,68,68,0.08)'
            : 'rgba(29,184,20,0.08)',
          border: `1px solid ${isVulnerable
            ? 'rgba(239,68,68,0.22)'
            : 'rgba(29,184,20,0.22)'}`,
        }}>
          {isVulnerable
            ? <ShieldAlert size={13} color="#ef4444" style={{ flexShrink: 0 }} />
            : <ShieldCheck size={13} color="#1DB814" style={{ flexShrink: 0 }} />
          }
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700,
              color: isVulnerable ? '#ef4444' : '#1DB814',
              letterSpacing: '0.01em',
            }}>
              {isVulnerable ? 'Bypass Active' : 'Firewall Patched'}
            </div>
            <div style={{ fontSize: 9.5, color: '#4a4f72', marginTop: 1 }}>
              {isVulnerable ? 'Domain fronting open' : 'JA3 + SNI correlation on'}
            </div>
          </div>
        </div>

        {/* Stats mini-grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
          {[
            { value: activeSessions, label: 'relaying', accent: '#06b6d4', glow: onlineBrowsers > 0 },
            { value: onlineBrowsers, label: 'browsers', accent: '#3b82f6', glow: onlineBrowsers > 0 },
            { value: null, label: connected ? 'Live' : 'Off', accent: connected ? '#1DB814' : '#ef4444', isConn: true },
          ].map((stat, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: stat.glow ? `${stat.accent}10` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${stat.glow ? `${stat.accent}28` : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 8, padding: '7px 4px',
              transition: 'background 0.2s, border-color 0.2s',
            }}>
              {stat.isConn ? (
                <>
                  {connected
                    ? <Wifi size={11} color="#1DB814" />
                    : <WifiOff size={11} color="#ef4444" />
                  }
                  <span style={{ fontSize: 9, fontWeight: 700, color: stat.accent, marginTop: 2 }}>
                    {stat.label}
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 14, fontWeight: 800, color: stat.glow ? stat.accent : '#7b82a8', lineHeight: 1 }}>
                    {stat.value}
                  </span>
                  <span style={{ fontSize: 9, color: '#4a4f72', marginTop: 2 }}>{stat.label}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: '6px 8px 8px', overflowY: 'auto', position: 'relative' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 6 }}>
            <div style={{
              fontSize: 9.5, fontWeight: 700, color: '#363a56',
              textTransform: 'uppercase', letterSpacing: '0.12em',
              padding: '8px 12px 4px',
            }}>
              {group.label}
            </div>
            {group.items.map(item => {
              const Icon = item.icon
              const active = activeSection === item.section
              return (
                <button
                  key={item.section}
                  onClick={() => onNavigate(item.section)}
                  className="nav-item"
                  style={{
                    background: active ? `${item.accent}14` : undefined,
                    borderColor: active ? `${item.accent}28` : undefined,
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = ''
                  }}
                >
                  {/* Active indicator */}
                  <div
                    className="nav-indicator"
                    style={{ background: item.accent, opacity: active ? 1 : 0 }}
                  />
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: active ? `${item.accent}20` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? `${item.accent}30` : 'rgba(255,255,255,0.05)'}`,
                    transition: 'background 0.15s, border-color 0.15s',
                  }}>
                    <Icon size={14} color={active ? item.accent : '#4a4f72'} style={{ flexShrink: 0 }} />
                  </div>
                  <span style={{
                    fontSize: 12.5, color: active ? item.accent : '#7b82a8',
                    fontWeight: active ? 600 : 400,
                    transition: 'color 0.12s',
                  }}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        padding: '10px 12px 14px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0, position: 'relative',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10, padding: '8px 10px',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(29,184,20,0.2), rgba(59,130,246,0.2))',
            border: '1px solid rgba(29,184,20,0.2)',
          }}>
            <ShieldCheck size={13} color="#1DB814" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#e2e5f1' }}>Admin</div>
            <div style={{ fontSize: 10, color: '#4a4f72' }}>Master Console</div>
          </div>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: connected ? '#1DB814' : '#ef4444',
            boxShadow: connected ? '0 0 6px #1DB814' : 'none',
            flexShrink: 0,
            animation: connected ? 'glowPulse 2s ease-in-out infinite' : 'none',
          }} />
        </div>
      </div>
    </aside>
  )
}
