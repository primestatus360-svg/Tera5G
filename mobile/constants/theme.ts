import { Platform } from 'react-native'

// ── Opera-class palette ──────────────────────────────────────────────────────
export const C = {
  bg:        '#0b0c18',
  surface:   '#141628',
  elevated:  '#1a1c35',
  header:    '#0e0f1d',

  border:    'rgba(255,255,255,0.08)',
  divider:   'rgba(255,255,255,0.05)',

  text:      '#e2e5f1',
  sub:       '#7b82a8',
  muted:     '#4a4f72',

  green:     '#1DB814',
  greenBg:   'rgba(29,184,20,0.10)',
  greenBd:   'rgba(29,184,20,0.25)',
  greenGlow: 'rgba(29,184,20,0.35)',

  red:       '#ef4444',
  redBg:     'rgba(239,68,68,0.10)',
  redBd:     'rgba(239,68,68,0.25)',

  blue:      '#3b82f6',
  blueBg:    'rgba(59,130,246,0.10)',
  blueBd:    'rgba(59,130,246,0.25)',

  yellow:    '#f59e0b',
  yellowBg:  'rgba(245,158,11,0.10)',
  yellowBd:  'rgba(245,158,11,0.25)',

  purple:    '#8b5cf6',
  purpleBg:  'rgba(139,92,246,0.10)',
  purpleBd:  'rgba(139,92,246,0.25)',

  cyan:      '#06b6d4',
  cyanBg:    'rgba(6,182,212,0.10)',
  cyanBd:    'rgba(6,182,212,0.25)',
} as const

// ── Radii ────────────────────────────────────────────────────────────────────
export const R = {
  card:   20,
  button: 14,
  chip:   22,
  input:  12,
  badge:  22,
  icon:   12,
  sm:     8,
} as const

// ── Spacing ──────────────────────────────────────────────────────────────────
export const S = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const

// ── Font family ──────────────────────────────────────────────────────────────
export const F = Platform.OS === 'ios' ? 'SF Pro Text' : undefined

// ── Card shadows ─────────────────────────────────────────────────────────────
export function cardShadow() {
  return Platform.OS === 'ios'
    ? { shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } }
    : { elevation: 6 }
}

export function glowShadow(color: string) {
  return Platform.OS === 'ios'
    ? { shadowColor: color, shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } }
    : { elevation: 8 }
}

// ── Reusable style objects ────────────────────────────────────────────────────
export const surfaceCard = {
  backgroundColor: C.surface,
  borderWidth: 1,
  borderColor: C.border,
  borderRadius: R.card,
  padding: 18,
}

export const surfaceCardActive = {
  ...surfaceCard,
  borderColor: `${C.green}40`,
}

export const surfaceCardDanger = {
  ...surfaceCard,
  borderColor: `${C.red}40`,
}

export function iconBox(accentColor: string) {
  return {
    width: 40,
    height: 40,
    borderRadius: R.icon,
    backgroundColor: accentColor + '18',
    borderWidth: 1,
    borderColor: accentColor + '30',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 14,
  }
}
