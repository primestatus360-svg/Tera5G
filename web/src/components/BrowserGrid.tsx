import { useState, useEffect, useRef, CSSProperties } from 'react'
import {
  Globe, Lock, Unlock, X, Send, KeyRound, Monitor,
  Loader2, Megaphone, ArrowUpRight, CheckCircle,
  RefreshCw, AlertTriangle, ChevronLeft, ChevronRight,
  MoreHorizontal, Zap, Shield,
} from 'lucide-react'
import { BrowserState, ScoreEntry } from '../types'

const SERVER = import.meta.env.VITE_SERVER_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '')

interface Props {
  browserStates: BrowserState[]
  scores: ScoreEntry[]
}

interface ActionModal {
  teamId: string | null
  teamName: string
  value: string
}

function formatDuration(s: number): string {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

function displayUrl(url: string): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    const path = u.pathname === '/' ? '' : u.pathname
    const display = u.hostname + path
    return display.length > 38 ? display.slice(0, 38) + '…' : display
  } catch {
    return url.length > 38 ? url.slice(0, 38) + '…' : url
  }
}

function getProtocol(url: string): 'https' | 'http' | null {
  try {
    return new URL(url).protocol === 'https:' ? 'https' : 'http'
  } catch { return null }
}

// ── Chip ──────────────────────────────────────────────────────────────────────

function StatChip({ value, label, accent = '#4a4f72' }: { value: number | string; label?: string; accent?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 4,
      background: `${accent}12`,
      border: `1px solid ${accent}28`,
      borderRadius: 7, padding: '3px 9px',
    }}>
      <span style={{ color: accent, fontSize: 12.5, fontWeight: 700, lineHeight: 1 }}>{value}</span>
      {label && <span style={{ color: '#4a4f72', fontSize: 10 }}>{label}</span>}
    </div>
  )
}

// ── Card action button ────────────────────────────────────────────────────────

function CardAction({
  icon, label, accent, disabled = false, loading = false, onClick,
}: {
  icon: React.ReactNode
  label: string
  accent: string
  disabled?: boolean
  loading?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="card-action"
      style={{
        background: disabled ? 'rgba(255,255,255,0.03)' : `${accent}14`,
        borderColor: disabled ? 'rgba(255,255,255,0.05)' : `${accent}30`,
        color: disabled ? '#363a56' : accent,
      }}
    >
      {loading
        ? <Loader2 size={11} style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
        : icon
      }
      {label}
    </button>
  )
}

// ── Command button (in toolbar) ───────────────────────────────────────────────

function CmdBtn({
  icon, label, accent = '#4a4f72', disabled = false, loading = false, onClick,
}: {
  icon: React.ReactNode; label: string; accent?: string
  disabled?: boolean; loading?: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: disabled ? 'rgba(255,255,255,0.03)' : `${accent}14`,
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.06)' : accent + '30'}`,
        borderRadius: 8, padding: '7px 13px',
        color: disabled ? '#363a56' : accent,
        fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.12s, border-color 0.12s, transform 0.1s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = '' }}
    >
      {loading ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : icon}
      {label}
    </button>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div
      className="opera-modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="opera-modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ color: '#e2e5f1', fontSize: 15, fontWeight: 700 }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
            }}
          >
            <X size={13} color="#7b82a8" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inputStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 10, padding: '11px 14px',
  color: '#e2e5f1', fontSize: 13, outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s',
}

function ModalBtn({
  accent, loading, onClick, children,
}: { accent: string; loading: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        flex: 1, background: `${accent}1a`,
        border: `1px solid ${accent}50`,
        borderRadius: 10, padding: '10px',
        color: accent, fontWeight: 600, fontSize: 13,
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        transition: 'background 0.12s, border-color 0.12s',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = `${accent}28` }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${accent}1a` }}
    >
      {loading && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
      {children}
    </button>
  )
}

function ModalCancel({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 10, padding: '10px',
        color: '#7b82a8', fontSize: 13, cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      Cancel
    </button>
  )
}

// ── Loading progress bar ───────────────────────────────────────────────────────

function LoadingBar({ color }: { color: string }) {
  return (
    <div className="progress-bar-track">
      <div
        className="progress-bar-fill"
        style={{
          width: '65%',
          background: `linear-gradient(90deg, transparent 0%, ${color} 30%, ${color} 70%, transparent 100%)`,
          backgroundSize: '200% 100%',
          animation: 'progressShimmer 1.4s ease-in-out infinite',
        }}
      />
    </div>
  )
}

// ── Browser card ──────────────────────────────────────────────────────────────

interface CardProps {
  score: ScoreEntry
  browser: BrowserState | null
  onPushUrl: () => void
  onAnnounce: () => void
  onLock: () => void
  onKick: () => void
  onResetScore: () => void
  actionPending: boolean
}

function BrowserCard({
  score, browser, onPushUrl, onAnnounce, onLock, onKick, onResetScore, actionPending,
}: CardProps) {
  const online  = browser?.online  ?? false
  const locked  = browser?.locked  ?? false
  const url     = browser?.url     ?? ''
  const title   = browser?.title   ?? ''
  const loading = browser?.loading ?? false
  const proto   = getProtocol(url)
  const color   = score.color

  const cardRef = useRef<HTMLDivElement>(null)

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width)  * 100
    const y = ((e.clientY - rect.top)  / rect.height) * 100
    el.style.setProperty('--mx', `${x}%`)
    el.style.setProperty('--my', `${y}%`)
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      style={{
        display: 'flex', flexDirection: 'column',
        borderRadius: 16, overflow: 'hidden',
        background: '#141628',
        border: `1px solid ${online ? `${color}28` : 'rgba(255,255,255,0.06)'}`,
        boxShadow: online
          ? `0 2px 20px rgba(0,0,0,0.5), 0 0 0 1px ${color}14`
          : '0 2px 12px rgba(0,0,0,0.4)',
        opacity: online ? 1 : 0.6,
        transition: 'opacity 0.2s, border-color 0.2s, box-shadow 0.2s',
        position: 'relative',
      }}
    >
      {/* Top color stripe */}
      <div style={{
        height: 3, flexShrink: 0, background: online
          ? `linear-gradient(90deg, ${color}, ${color}80)`
          : 'rgba(255,255,255,0.06)',
        transition: 'background 0.3s',
      }} />

      {/* Window title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px 8px', flexShrink: 0,
        background: '#1a1c2e',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* macOS traffic lights — functional */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          <button
            title="Remove team"
            onClick={onKick}
            disabled={actionPending}
            className={`traffic-light ${online ? 'tl-red' : 'tl-dead'}`}
            style={{ opacity: actionPending ? 0.5 : 1 }}
          />
          <button
            title={locked ? 'Unlock browser' : 'Lock browser'}
            onClick={onLock}
            disabled={actionPending}
            className={`traffic-light ${online ? 'tl-yellow' : 'tl-dead'}`}
            style={{ opacity: actionPending ? 0.5 : 1 }}
          />
          <button
            title="Push URL"
            onClick={onPushUrl}
            disabled={actionPending}
            className={`traffic-light ${online ? 'tl-green' : 'tl-dead'}`}
            style={{ opacity: actionPending ? 0.5 : 1 }}
          />
        </div>

        {/* Tab label / title */}
        <div style={{
          flex: 1, overflow: 'hidden',
          display: 'flex', alignItems: 'center', gap: 7, minWidth: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '3px 10px 3px 8px',
            flex: 1, minWidth: 0, overflow: 'hidden',
          }}>
            {loading
              ? <Loader2 size={11} color="#3b82f6" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              : <div style={{
                  width: 11, height: 11, borderRadius: 2, flexShrink: 0,
                  background: online ? `${color}60` : 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Globe size={7} color={online ? color : '#4a4f72'} />
                </div>
            }
            <span style={{
              fontSize: 11.5, color: online ? '#c8ccde' : '#4a4f72',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              flex: 1,
            }}>
              {title || score.teamName}
            </span>
          </div>
        </div>

        {/* Status badge */}
        {locked && (
          <div className="status-badge" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}>
            <Lock size={9} />
            Locked
          </div>
        )}
        {!online && !locked && (
          <div className="status-badge" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#4a4f72' }}>
            Offline
          </div>
        )}
        {online && !locked && (
          <div className="status-badge" style={{ background: 'rgba(29,184,20,0.1)', border: '1px solid rgba(29,184,20,0.25)', color: '#1DB814' }}>
            <div className="live-dot" />
            Live
          </div>
        )}
      </div>

      {/* Browser toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '8px 12px', flexShrink: 0,
        background: '#141628',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        {/* Nav buttons */}
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {[ChevronLeft, ChevronRight].map((Icon, i) => (
            <div key={i} style={{
              width: 22, height: 22, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.04)',
            }}>
              <Icon size={11} color="#3a3e5a" />
            </div>
          ))}
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.04)',
          }}>
            <RefreshCw size={10} color={loading ? '#3b82f6' : '#3a3e5a'}
              style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
          </div>
        </div>

        {/* Address bar */}
        <div className="address-bar">
          {proto === 'https'
            ? <Lock size={9} color="#1DB814" style={{ flexShrink: 0 }} />
            : proto === 'http'
            ? <Globe size={9} color="#f59e0b" style={{ flexShrink: 0 }} />
            : <Globe size={9} color="#3a3e5a" style={{ flexShrink: 0 }} />
          }
          <span style={{
            fontSize: 11, color: url ? '#7b82a8' : '#2e3155',
            fontFamily: url ? 'inherit' : 'inherit',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flex: 1,
            letterSpacing: url ? '-0.01em' : undefined,
          }}>
            {url ? displayUrl(url) : 'Awaiting relay…'}
          </span>
          {url && (
            <ArrowUpRight size={9} color="#3a3e5a" style={{ flexShrink: 0 }} />
          )}
        </div>

        {/* More menu indicator */}
        <div style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.04)',
        }}>
          <MoreHorizontal size={11} color="#3a3e5a" />
        </div>
      </div>

      {/* Loading progress bar */}
      <div className="progress-bar-track" style={{ height: loading ? 2 : 1, transition: 'height 0.2s' }}>
        {loading ? (
          <div
            className="progress-bar-fill"
            style={{
              width: '60%',
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
              backgroundSize: '200% 100%',
              animation: 'progressShimmer 1.4s ease-in-out infinite',
            }}
          />
        ) : (
          <div style={{ height: '100%', background: 'rgba(255,255,255,0.03)' }} />
        )}
      </div>

      {/* Stats row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '10px 14px 8px', flexShrink: 0,
        flexWrap: 'wrap', rowGap: 5,
      }}>
        <StatChip value={score.totalPoints} label="pts" accent={color} />
        <StatChip value={score.connectionsAllowed} label="req" accent="#3b82f6" />
        <StatChip value={formatDuration(score.activeSeconds)} accent="#8b5cf6" />
        {score.firstConnectBonus && (
          <StatChip value="1st" accent="#f59e0b" />
        )}
      </div>

      {/* Action toolbar */}
      <div style={{
        display: 'flex', gap: 5, flexWrap: 'wrap', rowGap: 5,
        padding: '8px 10px 10px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        background: '#0f1020',
        marginTop: 'auto',
      }}>
        <CardAction icon={<ArrowUpRight size={11} />} label="Push URL"  accent="#3b82f6"  onClick={onPushUrl}    disabled={actionPending} />
        <CardAction icon={<Megaphone   size={11} />} label="Announce" accent="#f59e0b"  onClick={onAnnounce}   disabled={actionPending} />
        <CardAction
          icon={locked ? <Unlock size={11} /> : <Lock size={11} />}
          label={locked ? 'Unlock' : 'Lock'}
          accent={locked ? '#1DB814' : '#f59e0b'}
          onClick={onLock}
          disabled={actionPending}
        />
        <CardAction icon={<RefreshCw size={11} />} label="Reset"    accent="#4a4f72"  onClick={onResetScore}  disabled={actionPending} />
        <CardAction icon={<X         size={11} />} label="Kick"     accent="#ef4444"  onClick={onKick}        disabled={actionPending} />
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: 16,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}>
        <Monitor size={32} color="#3a3e5a" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#7b82a8', fontSize: 15, fontWeight: 600 }}>No browsers connected</div>
        <div style={{ color: '#2e3155', fontSize: 13, marginTop: 5, lineHeight: 1.5, maxWidth: 260 }}>
          Waiting for relay clients to join via the domain-fronting tunnel
        </div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: 10, padding: '8px 14px',
      }}>
        <Zap size={12} color="#3b82f6" />
        <span style={{ fontSize: 11.5, color: '#3b82f6', fontWeight: 500 }}>
          Internet-free · Domain fronting active
        </span>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function BrowserGrid({ browserStates, scores }: Props) {
  const [adminKey,      setAdminKey]      = useState(() => localStorage.getItem('tera5g-admin-key') ?? '')
  const [keyVerified,   setKeyVerified]   = useState(false)
  const [broadcastUrl,  setBroadcastUrl]  = useState('')
  const [announceMsg,   setAnnounceMsg]   = useState('')
  const [pushModal,     setPushModal]     = useState<ActionModal | null>(null)
  const [announceModal, setAnnounceModal] = useState<ActionModal | null>(null)
  const [confirmKick,   setConfirmKick]   = useState<{ teamId: string; teamName: string } | null>(null)
  const [toast,         setToast]         = useState<{ message: string; ok: boolean } | null>(null)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem('tera5g-admin-key', adminKey)
  }, [adminKey])

  function showToast(message: string, ok = true) {
    setToast({ message, ok })
    setTimeout(() => setToast(null), 3200)
  }

  async function adminPost(path: string, body: Record<string, unknown>, actionId: string) {
    setPendingAction(actionId)
    try {
      const res = await fetch(`${SERVER}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, adminKey }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 403) setKeyVerified(false)
        throw new Error(data.error ?? 'Request failed')
      }
      setKeyVerified(true)
      return data
    } finally {
      setPendingAction(null)
    }
  }

  async function doPushUrl(teamId: string | null, url: string, teamName?: string) {
    if (!url.trim()) return
    const full = url.startsWith('http') ? url : `https://${url}`
    try {
      await adminPost('/api/admin/push-url', teamId ? { teamId, url: full } : { url: full }, `push-${teamId}`)
      showToast(teamId ? `URL pushed to ${teamName}` : 'URL pushed to all browsers')
      setPushModal(null)
      if (!teamId) setBroadcastUrl('')
    } catch (e: unknown) { showToast((e as Error).message, false) }
  }

  async function doAnnounce(teamId: string | null, message: string, teamName?: string) {
    if (!message.trim()) return
    try {
      await adminPost('/api/admin/announce', teamId ? { teamId, message } : { message }, `announce-${teamId}`)
      showToast(teamId ? `Announced to ${teamName}` : 'Announced to all')
      setAnnounceModal(null)
      if (!teamId) setAnnounceMsg('')
    } catch (e: unknown) { showToast((e as Error).message, false) }
  }

  async function doLock(teamId: string | null, locked: boolean) {
    try {
      await adminPost('/api/admin/lock', teamId ? { teamId, locked } : { locked }, `lock-${teamId}`)
      showToast(locked
        ? (teamId ? 'Browser locked' : 'All browsers locked')
        : (teamId ? 'Browser unlocked' : 'All browsers unlocked'))
    } catch (e: unknown) { showToast((e as Error).message, false) }
  }

  async function doKick(teamId: string) {
    try {
      await adminPost('/api/admin/kick', { teamId }, `kick-${teamId}`)
      showToast('Team removed')
      setConfirmKick(null)
    } catch (e: unknown) { showToast((e as Error).message, false) }
  }

  async function doResetScores(teamId: string | null) {
    try {
      await adminPost('/api/admin/reset-scores', teamId ? { teamId } : {}, `reset-${teamId}`)
      showToast(teamId ? 'Score reset' : 'All scores reset')
    } catch (e: unknown) { showToast((e as Error).message, false) }
  }

  // Merge scores + browser states
  const displayItems = scores.map(score => ({
    score,
    browser: browserStates.find(b => b.teamId === score.teamId) ?? null,
  }))
  for (const b of browserStates) {
    if (!displayItems.some(d => d.score.teamId === b.teamId)) {
      displayItems.push({
        score: {
          teamId: b.teamId, teamName: b.teamName, color: b.teamColor,
          totalPoints: 0, activeSeconds: 0, connectionsAttempted: 0,
          connectionsAllowed: 0, longestSession: 0, firstConnectBonus: false,
        },
        browser: b,
      })
    }
  }

  const onlineCount  = browserStates.filter(b => b.online).length
  const lockedCount  = browserStates.filter(b => b.locked).length
  const loadingCount = browserStates.filter(b => b.loading).length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0b0c18' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 20px',
        background: '#0f1020',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0, flexWrap: 'wrap', rowGap: 8,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
          border: '1px solid rgba(59,130,246,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Monitor size={15} color="#3b82f6" />
        </div>

        <div style={{ flex: '1 1 auto' }}>
          <div style={{ color: '#e2e5f1', fontSize: 13.5, fontWeight: 700, lineHeight: 1.2 }}>
            Browser Command Center
          </div>
          <div style={{ color: '#4a4f72', fontSize: 11, marginTop: 2 }}>
            Monitor &amp; control all relay-connected browsers in real-time
          </div>
        </div>

        {/* Stats chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <StatChip value={displayItems.length} label="total" accent="#4a4f72" />
          <StatChip value={onlineCount}  label="online"  accent="#1DB814" />
          {lockedCount  > 0 && <StatChip value={lockedCount}  label="locked"  accent="#f59e0b" />}
          {loadingCount > 0 && <StatChip value={loadingCount} label="loading" accent="#3b82f6" />}

          {/* Admin key field */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: '#13142a',
            border: `1px solid ${keyVerified ? 'rgba(29,184,20,0.35)' : 'rgba(255,255,255,0.09)'}`,
            borderRadius: 9, padding: '5px 11px',
            transition: 'border-color 0.2s',
          }}>
            <KeyRound size={11} color={keyVerified ? '#1DB814' : '#4a4f72'} style={{ flexShrink: 0 }} />
            <input
              type="password"
              placeholder="Admin key"
              value={adminKey}
              onChange={e => { setAdminKey(e.target.value); setKeyVerified(false) }}
              style={{
                width: 104, background: 'transparent', border: 'none',
                outline: 'none', color: '#e2e5f1', fontSize: 12,
              }}
            />
            {keyVerified && <CheckCircle size={11} color="#1DB814" style={{ flexShrink: 0 }} />}
          </div>
        </div>
      </div>

      {/* ── Command toolbar ── */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
        padding: '9px 16px',
        background: '#0d0e1e',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        flexShrink: 0,
      }}>
        {/* Broadcast URL */}
        <div style={{ display: 'flex', gap: 6, flex: '1 1 240px', minWidth: 0 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 7, minWidth: 0,
            background: '#13142a',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 9, padding: '6px 10px',
          }}>
            <Globe size={11} color="#4a4f72" style={{ flexShrink: 0 }} />
            <input
              type="url"
              placeholder="Broadcast URL to all browsers…"
              value={broadcastUrl}
              onChange={e => setBroadcastUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') doPushUrl(null, broadcastUrl) }}
              style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#e2e5f1', fontSize: 12 }}
            />
          </div>
          <CmdBtn
            icon={<ArrowUpRight size={12} />} label="Push All" accent="#3b82f6"
            disabled={!broadcastUrl.trim()} loading={pendingAction === 'push-null'}
            onClick={() => doPushUrl(null, broadcastUrl)}
          />
        </div>

        {/* Broadcast message */}
        <div style={{ display: 'flex', gap: 6, flex: '1 1 220px', minWidth: 0 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 7, minWidth: 0,
            background: '#13142a',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 9, padding: '6px 10px',
          }}>
            <Megaphone size={11} color="#4a4f72" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Broadcast message to all users…"
              value={announceMsg}
              onChange={e => setAnnounceMsg(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') doAnnounce(null, announceMsg) }}
              style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#e2e5f1', fontSize: 12 }}
            />
          </div>
          <CmdBtn
            icon={<Send size={12} />} label="Send All" accent="#f59e0b"
            disabled={!announceMsg.trim()} loading={pendingAction === 'announce-null'}
            onClick={() => doAnnounce(null, announceMsg)}
          />
        </div>

        {/* Global controls */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
          <CmdBtn icon={<Lock size={12} />}     label="Lock All"     accent="#f59e0b" loading={pendingAction === 'lock-null'}  onClick={() => doLock(null, true)} />
          <CmdBtn icon={<Unlock size={12} />}   label="Unlock All"   accent="#1DB814" loading={pendingAction === 'lock-null'}  onClick={() => doLock(null, false)} />
          <CmdBtn icon={<RefreshCw size={12} />} label="Reset Scores" accent="#ef4444" loading={pendingAction === 'reset-null'} onClick={() => doResetScores(null)} />
        </div>
      </div>

      {/* ── Browser grid ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {displayItems.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 14, alignContent: 'start',
          }}>
            {displayItems.map(({ score, browser }) => (
              <BrowserCard
                key={score.teamId}
                score={score}
                browser={browser}
                onPushUrl={()    => setPushModal({ teamId: score.teamId, teamName: score.teamName, value: '' })}
                onAnnounce={()   => setAnnounceModal({ teamId: score.teamId, teamName: score.teamName, value: '' })}
                onLock={()       => doLock(score.teamId, !(browser?.locked ?? false))}
                onKick={()       => setConfirmKick({ teamId: score.teamId, teamName: score.teamName })}
                onResetScore={()  => doResetScores(score.teamId)}
                actionPending={pendingAction !== null}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div
          className="opera-toast"
          style={{
            background:   toast.ok ? 'rgba(29,184,20,0.1)'   : 'rgba(239,68,68,0.1)',
            border:       `1px solid ${toast.ok ? 'rgba(29,184,20,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color:        toast.ok ? '#1DB814' : '#ef4444',
          }}
        >
          {toast.ok
            ? <CheckCircle size={14} color="#1DB814" style={{ flexShrink: 0 }} />
            : <AlertTriangle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
          }
          {toast.message}
        </div>
      )}

      {/* ── Push URL modal ── */}
      {pushModal && (
        <Modal title={`Push URL → ${pushModal.teamName}`} onClose={() => setPushModal(null)}>
          <input
            type="url"
            placeholder="https://example.com"
            value={pushModal.value}
            onChange={e => setPushModal({ ...pushModal, value: e.target.value })}
            onKeyDown={e => { if (e.key === 'Enter') doPushUrl(pushModal.teamId, pushModal.value, pushModal.teamName) }}
            autoFocus
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <ModalBtn accent="#3b82f6" loading={pendingAction !== null}
              onClick={() => doPushUrl(pushModal.teamId, pushModal.value, pushModal.teamName)}>
              Push URL
            </ModalBtn>
            <ModalCancel onClick={() => setPushModal(null)} />
          </div>
        </Modal>
      )}

      {/* ── Announce modal ── */}
      {announceModal && (
        <Modal title={`Announce → ${announceModal.teamName}`} onClose={() => setAnnounceModal(null)}>
          <input
            type="text"
            placeholder="Message to display in user's browser…"
            value={announceModal.value}
            onChange={e => setAnnounceModal({ ...announceModal, value: e.target.value })}
            onKeyDown={e => { if (e.key === 'Enter') doAnnounce(announceModal.teamId, announceModal.value, announceModal.teamName) }}
            autoFocus
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <ModalBtn accent="#f59e0b" loading={pendingAction !== null}
              onClick={() => doAnnounce(announceModal.teamId, announceModal.value, announceModal.teamName)}>
              Send Announcement
            </ModalBtn>
            <ModalCancel onClick={() => setAnnounceModal(null)} />
          </div>
        </Modal>
      )}

      {/* ── Confirm kick ── */}
      {confirmKick && (
        <Modal title="Remove Team?" onClose={() => setConfirmKick(null)}>
          <div style={{
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 12, padding: '14px 16px', marginBottom: 18,
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <AlertTriangle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
                Remove <strong>{confirmKick.teamName}</strong>?
              </div>
              <div style={{ color: '#7b82a8', fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
                This disconnects their browser and removes all session data.
                This action cannot be undone.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <ModalBtn accent="#ef4444" loading={pendingAction !== null}
              onClick={() => doKick(confirmKick.teamId)}>
              Remove Team
            </ModalBtn>
            <ModalCancel onClick={() => setConfirmKick(null)} />
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes progressShimmer { 0% { background-position: -200% center } 100% { background-position: 200% center } }
        @keyframes slideUp { from { opacity:0; transform:translateY(8px) scale(0.98) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes glowPulse { 0%,100% { box-shadow:0 0 4px currentColor } 50% { box-shadow:0 0 10px currentColor } }
      `}</style>
    </div>
  )
}
