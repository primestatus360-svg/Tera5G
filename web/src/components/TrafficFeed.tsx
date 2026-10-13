import { CheckCircle, XCircle, AlertTriangle, Radio } from 'lucide-react'
import { TrafficEntry } from '../types'

interface Props { entries: TrafficEntry[] }

function ts(ms: number) {
  return new Date(ms).toLocaleTimeString('en-GB', { hour12: false })
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

const colHdr: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: '#3a3e5a',
  textTransform: 'uppercase', letterSpacing: '0.09em',
}

export function TrafficFeed({ entries }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Radio size={14} color="#06b6d4" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e5f1', letterSpacing: '-0.01em' }}>Live Traffic</div>
            <div style={{ fontSize: 10.5, color: '#4a4f72', marginTop: 1 }}>Real-time relay requests</div>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 7, padding: '3px 9px',
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%', background: '#06b6d4',
            animation: entries.length > 0 ? 'dotPulse 1.8s ease-in-out infinite' : 'none',
          }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#7b82a8' }}>{entries.length}</span>
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '24px 62px 110px 120px 100px 1fr',
        gap: 8, padding: '6px 10px', marginBottom: 3,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 8, flexShrink: 0,
      }}>
        {['', 'Time', 'Team', 'SNI', 'Host', 'Reason'].map(h => (
          <span key={h} style={colHdr}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {entries.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={18} color="#3a3e5a" />
            </div>
            <span style={{ fontSize: 12.5, color: '#4a4f72' }}>Waiting for connection attempts…</span>
          </div>
        )}

        {entries.map(e => {
          const allowed = e.decision.allowed
          const spoofed = e.decision.detectedSpoofing

          const accent = allowed
            ? { border: 'rgba(29,184,20,0.45)', bg: 'rgba(29,184,20,0.04)' }
            : spoofed
              ? { border: 'rgba(245,158,11,0.45)', bg: 'rgba(245,158,11,0.04)' }
              : { border: 'rgba(239,68,68,0.45)', bg: 'rgba(239,68,68,0.04)' }

          return (
            <div
              key={e.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '24px 62px 110px 120px 100px 1fr',
                gap: 8, padding: '7px 10px', borderRadius: 7,
                marginBottom: 2, fontSize: 11,
                borderLeft: `2px solid ${accent.border}`,
                background: accent.bg,
                transition: 'opacity 0.1s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {allowed
                  ? <CheckCircle size={12} color="#1DB814" />
                  : spoofed
                    ? <AlertTriangle size={12} color="#f59e0b" />
                    : <XCircle size={12} color="#ef4444" />
                }
              </div>
              <span style={{ color: '#4a4f72', fontFamily: 'monospace', fontSize: 10.5 }}>{ts(e.timestamp)}</span>
              <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: e.teamColor }}>
                {e.teamName}
              </span>
              <span style={{ color: '#3b82f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.sni}>
                {truncate(e.sni, 20)}
              </span>
              <span style={{
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                color: allowed ? '#1DB814' : '#ef4444',
              }} title={e.hostHeader}>
                {truncate(e.hostHeader, 16)}
              </span>
              <span style={{ color: '#4a4f72', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.decision.reason}>
                {truncate(e.decision.reason, 56)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
