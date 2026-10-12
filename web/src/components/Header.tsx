import {
  Wifi, WifiOff, ShieldCheck, ShieldAlert, Radio, Trophy, Info,
  LayoutDashboard, Monitor, Plug, Users, Ticket, Search, CreditCard, X,
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

const NAV_GROUPS: { label: string; items: { icon: React.ElementType; label: string; section: Section; accent?: string }[] }[] = [
  {
    label: 'Control',
    items: [
      { icon: Monitor,         label: 'Browsers',    section: 'browsers',    accent: '#0A84FF' },
      { icon: LayoutDashboard, label: 'Dashboard',   section: 'dashboard'   },
    ],
  },
  {
    label: 'Monitor',
    items: [
      { icon: Plug,            label: 'Connections', section: 'connections', accent: '#BF5AF2' },
      { icon: Radio,           label: 'Traffic',     section: 'traffic'     },
      { icon: Trophy,          label: 'Leaderboard', section: 'leaderboard' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { icon: Users,           label: 'Users',       section: 'users',      accent: '#1DB814' },
      { icon: Ticket,          label: 'Vouchers',    section: 'vouchers',   accent: '#FF9F0A' },
      { icon: CreditCard,      label: 'Payments',    section: 'payments',   accent: '#30D158' },
      { icon: Search,          label: 'Search',      section: 'search'      },
    ],
  },
  {
    label: 'Security',
    items: [
      { icon: ShieldAlert,     label: 'Firewall',    section: 'firewall'    },
      { icon: Info,            label: 'JA3',         section: 'ja3'         },
    ],
  },
]

export function Sidebar({ firewallMode, connected, activeSessions, onlineBrowsers, activeSection, onNavigate, onClose }: Props) {
  const isVulnerable = firewallMode === 'vulnerable'

  return (
    <aside
      className="flex flex-col flex-shrink-0 overflow-hidden overflow-y-auto"
      style={{
        width: 220,
        backgroundColor: '#1C1C1E',
        borderRight: '0.5px solid rgba(84,84,88,0.50)',
        height: '100%',
      }}
    >
      {/* Brand */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingInline: 18, paddingTop: 20, paddingBottom: 14,
        borderBottom: '0.5px solid rgba(84,84,88,0.50)', flexShrink: 0,
      }}>
        <div>
          <span className="text-xl font-bold text-tera-text tracking-tight leading-none">
            Tera<span className="text-tera-green">5G</span>
          </span>
          <div className="text-xs text-tera-muted mt-1">Admin Console</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 7, cursor: 'pointer',
              background: 'rgba(84,84,88,0.18)', border: '0.5px solid rgba(84,84,88,0.36)',
            }}
          >
            <X size={14} color="#8E8E93" />
          </button>
        )}
      </div>

      {/* Status */}
      <div style={{ padding: '12px 12px 6px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, borderRadius: 10,
          padding: '8px 10px', marginBottom: 8,
          backgroundColor: isVulnerable ? 'rgba(255,69,58,0.10)' : 'rgba(29,184,20,0.10)',
          border: `0.5px solid ${isVulnerable ? 'rgba(255,69,58,0.35)' : 'rgba(29,184,20,0.35)'}`,
        }}>
          {isVulnerable
            ? <ShieldAlert size={13} className="text-tera-red flex-shrink-0" />
            : <ShieldCheck size={13} className="text-tera-green flex-shrink-0" />
          }
          <div className="min-w-0">
            <div className={`text-xs font-semibold ${isVulnerable ? 'text-tera-red' : 'text-tera-green'}`}>
              {isVulnerable ? 'Bypass Active' : 'Firewall Patched'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: 'rgba(84,84,88,0.12)', border: '0.5px solid rgba(84,84,88,0.36)',
            borderRadius: 8, padding: '6px 4px',
          }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{activeSessions}</span>
            <span style={{ fontSize: 9, color: '#636366', marginTop: 2 }}>relaying</span>
          </div>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: onlineBrowsers > 0 ? 'rgba(10,132,255,0.08)' : 'rgba(84,84,88,0.12)',
            border: `0.5px solid ${onlineBrowsers > 0 ? 'rgba(10,132,255,0.36)' : 'rgba(84,84,88,0.36)'}`,
            borderRadius: 8, padding: '6px 4px',
          }}>
            <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1, color: onlineBrowsers > 0 ? '#0A84FF' : '#636366' }}>
              {onlineBrowsers}
            </span>
            <span style={{ fontSize: 9, color: '#636366', marginTop: 2 }}>browsers</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
            background: 'rgba(84,84,88,0.12)', border: '0.5px solid rgba(84,84,88,0.36)',
            borderRadius: 8, padding: '6px 4px',
          }}>
            {connected
              ? <Wifi size={10} className="text-tera-green" />
              : <WifiOff size={10} className="text-tera-red" />
            }
            <span style={{ fontSize: 9, fontWeight: 600, color: connected ? '#1DB814' : '#FF453A' }}>
              {connected ? 'Live' : 'Off'}
            </span>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, padding: '4px 8px 8px', overflowY: 'auto' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: '#48484A',
              textTransform: 'uppercase', letterSpacing: '0.10em',
              paddingInline: 10, paddingBlock: '8px 4px',
            }}>{group.label}</div>

            {group.items.map(item => {
              const Icon = item.icon
              const active = activeSection === item.section
              const accent = item.accent ?? '#FFFFFF'
              return (
                <button
                  key={item.section}
                  onClick={() => onNavigate(item.section)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    borderRadius: 8, padding: '8px 10px', marginBottom: 1,
                    backgroundColor: active ? `${accent}1A` : 'transparent',
                    border: active ? `0.5px solid ${accent}40` : '0.5px solid transparent',
                    cursor: 'pointer', outline: 'none', textAlign: 'left',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.04)'
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                  }}
                >
                  <Icon size={15} style={{ color: active ? accent : '#636366', flexShrink: 0 }} />
                  <span style={{
                    fontSize: 13, color: active ? accent : '#8E8E93',
                    fontWeight: active ? 600 : 400,
                  }}>{item.label}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        paddingInline: 12, paddingBlock: 12,
        borderTop: '0.5px solid rgba(84,84,88,0.50)', flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8,
          padding: '7px 10px', background: 'rgba(29,184,20,0.08)',
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(29,184,20,0.18)',
          }}>
            <ShieldCheck size={12} className="text-tera-green" />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Admin</div>
            <div style={{ fontSize: 10, color: '#636366' }}>Master Console</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
