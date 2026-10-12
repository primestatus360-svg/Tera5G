export type FirewallMode = 'vulnerable' | 'patched'

export interface Team {
  id: string
  name: string
  color: string
  createdAt: number
}

export interface FirewallDecision {
  allowed: boolean
  reason: string
  mode: FirewallMode
  detectedSpoofing?: boolean
  sniMismatch?: boolean
  ja3Hash?: string
  ja3String?: string
  ja3Blocked?: boolean
}

export interface TrafficEntry {
  id: string
  timestamp: number
  teamId: string
  teamName: string
  teamColor: string
  sni: string
  hostHeader: string
  ja3Hash: string
  decision: FirewallDecision
  bytes?: number
}

export interface ScoreEntry {
  teamId: string
  teamName: string
  color: string
  totalPoints: number
  activeSeconds: number
  connectionsAttempted: number
  connectionsAllowed: number
  longestSession: number
  firstConnectBonus: boolean
}

export interface ActiveTeamInfo {
  teamId: string
  teamName: string
  teamColor: string
  lastSeen: number
  activeSeconds: number
  requestCount: number
}

export interface BrowserState {
  teamId: string
  teamName: string
  teamColor: string
  url: string
  title: string
  loading: boolean
  lastUpdated: number
  locked: boolean
  online: boolean
}

export interface Voucher {
  code:         string
  plan:         '6h' | '24h'
  amount:       number
  status:       'active' | 'used' | 'revoked'
  createdAt:    number
  validUntil:   number
  usedAt?:      number
  usedByPhone?: string
}

export interface PaymentSessionInfo {
  id:             string
  phone:          string
  plan:           '6h' | '24h'
  amount:         number
  provider:       string
  status:         'pending' | 'active' | 'failed'
  expiresAt:      number
  createdAt:      number
  transactionRef: string
}

export interface ConnectionBrowser {
  type:        'browser'
  teamId:      string
  teamName:    string
  teamColor:   string
  url:         string
  title:       string
  locked:      boolean
  online:      boolean
  lastUpdated: number
}

export interface ConnectionRelay {
  type:          'relay'
  teamId:        string
  teamName:      string
  teamColor:     string
  lastSeen:      number
  requestCount:  number
  activeSeconds: number
}

export interface ConnectionStats {
  totalBrowsers:  number
  onlineBrowsers: number
  lockedBrowsers: number
  activeRelays:   number
  totalSessions:  number
  activeSessions: number
}

export interface WithdrawalRecord {
  id:        string
  provider:  string
  phone:     string
  amount:    number
  note:      string
  status:    'pending' | 'success' | 'failed'
  txRef:     string
  error:     string
  createdAt: number
}

export interface SearchResults {
  traffic:  TrafficEntry[]
  sessions: PaymentSessionInfo[]
  vouchers: Voucher[]
  teams:    { id: string; name: string; color: string; createdAt: number }[]
}
