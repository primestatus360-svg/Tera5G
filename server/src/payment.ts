import { Router, Request, Response } from 'express'
import { randomUUID } from 'crypto'
import { ProxyAgent, fetch as undiciFetch } from 'undici'
import { store } from './store'

// ── Config ────────────────────────────────────────────────────────────────────

const YO_API_URL  = process.env.YO_API_URL  ?? 'https://paymentsapi1.yo.co.ug/ybs/task.php'
const YO_USERNAME = process.env.YO_API_USERNAME ?? ''
const YO_PASSWORD = process.env.YO_API_PASSWORD ?? ''
const PUBLIC_URL  = (process.env.PUBLIC_URL ?? '').replace(/\/$/, '')
const FIXIE_URL   = process.env.FIXIE_URL ?? ''
const WEBHOOK_URL = `${PUBLIC_URL}/api/pay/webhook`

const PLANS = {
  '6h':  { amount: 550,  ms: 6  * 3_600_000, label: '6 Hours Browsing'  },
  '24h': { amount: 1000, ms: 24 * 3_600_000, label: '24 Hours Browsing' },
}

const fixieAgent = FIXIE_URL
  ? new ProxyAgent({ uri: FIXIE_URL, connectTimeout: 15_000, headersTimeout: 30_000, bodyTimeout: 30_000 })
  : undefined

// ── Session store ─────────────────────────────────────────────────────────────

interface PaySession {
  id:            string
  phone:         string
  plan:          '6h' | '24h'
  amount:        number
  provider:      string
  status:        'pending' | 'active' | 'failed'
  expiresAt:     number
  transactionRef:string
  createdAt:     number
}

export const sessions = new Map<string, PaySession>()

// Auto-clean sessions older than 2 hours
setInterval(() => {
  const cutoff = Date.now() - 2 * 3_600_000
  for (const [id, s] of sessions) {
    if (s.createdAt < cutoff && s.status !== 'active') sessions.delete(id)
  }
}, 30 * 60_000)

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-+()\./]/g, '')
  if (cleaned.startsWith('256')) return cleaned
  if (cleaned.startsWith('0'))   return '256' + cleaned.slice(1)
  return '256' + cleaned
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function extractXml(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))
  return m ? m[1].trim() : ''
}

function buildXml(s: PaySession): string {
  const plan  = PLANS[s.plan]
  const ncode = s.provider === 'AIRTEL' ? 'AIRTEL_UGANDA' : 'MTN_UGANDA'
  return `<?xml version="1.0" encoding="UTF-8"?>
<AutoCreate>
  <Request>
    <APIUsername>${escapeXml(YO_USERNAME)}</APIUsername>
    <APIPassword>${escapeXml(YO_PASSWORD)}</APIPassword>
    <Method>AutoCreateRequest</Method>
    <Amount>${s.amount}</Amount>
    <Account>${escapeXml(s.phone)}</Account>
    <ExternalReference>${escapeXml(s.id)}</ExternalReference>
    <Description>Tera5G Browser - ${escapeXml(plan.label)}</Description>
    <ProviderReferenceText>Tera5G</ProviderReferenceText>
    <DepositNotificationURL>${escapeXml(WEBHOOK_URL)}</DepositNotificationURL>
    <InstantNotificationURL>${escapeXml(WEBHOOK_URL)}</InstantNotificationURL>
    <FailureNotificationURL>${escapeXml(WEBHOOK_URL)}</FailureNotificationURL>
    <NetworkCode>${ncode}</NetworkCode>
    <NonBlocking>TRUE</NonBlocking>
  </Request>
</AutoCreate>`
}

async function callYo(xml: string): Promise<string> {
  const headers = {
    'Content-Type':              'text/xml; charset=UTF-8',
    'Content-transfer-encoding': 'text',
    'Accept':                    'application/xml, text/xml, */*',
  }
  if (fixieAgent) {
    const res = await undiciFetch(YO_API_URL, { method: 'POST', headers, body: xml, dispatcher: fixieAgent })
    return res.text()
  }
  const res = await fetch(YO_API_URL, { method: 'POST', headers, body: xml })
  return res.text()
}

// ── Router ────────────────────────────────────────────────────────────────────

export const paymentRouter = Router()

// POST /api/pay/initiate
paymentRouter.post('/initiate', async (req: Request, res: Response) => {
  const { phone, plan, provider } = req.body as Record<string, string>

  if (!phone || !plan || !PLANS[plan as keyof typeof PLANS]) {
    return res.status(400).json({ error: 'phone and plan (6h|24h) are required' })
  }
  if (!YO_USERNAME || !YO_PASSWORD) {
    return res.status(503).json({ error: 'Payment service not configured — set YO_API_USERNAME and YO_API_PASSWORD' })
  }

  const planData = PLANS[plan as keyof typeof PLANS]
  const id       = randomUUID()
  const session: PaySession = {
    id, phone: normalizePhone(phone), plan: plan as '6h' | '24h',
    amount: planData.amount, provider: provider ?? 'MTN',
    status: 'pending', expiresAt: 0, transactionRef: '', createdAt: Date.now(),
  }
  sessions.set(id, session)

  try {
    const xml        = buildXml(session)
    const response   = await callYo(xml)
    const status     = extractXml(response, 'AutoCreateStatus')
    const code       = extractXml(response, 'StatusCode')
    const txnStatus  = extractXml(response, 'TransactionStatus')

    if (status !== 'OK' && code !== '01' && txnStatus.toUpperCase() !== 'PENDING') {
      session.status = 'failed'
      const msg = extractXml(response, 'StatusMessage') || 'Payment initiation failed'
      console.error('[pay] Yo! error:', msg, '\n', response.slice(0, 400))
      return res.status(400).json({ error: msg })
    }

    console.log(`[pay] initiated ${plan} for ${session.phone} (session ${id})`)
    return res.json({ success: true, sessionId: id })
  } catch (err) {
    session.status = 'failed'
    console.error('[pay] network error:', err)
    return res.status(500).json({ error: 'Could not reach payment provider' })
  }
})

// GET /api/pay/status/:id
paymentRouter.get('/status/:id', (req: Request, res: Response) => {
  const session = sessions.get(req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  if (session.status === 'active' && session.expiresAt < Date.now()) {
    session.status = 'failed'
  }

  return res.json({
    status:    session.status,
    plan:      session.plan,
    amount:    session.amount,
    expiresAt: session.expiresAt,
  })
})

// POST /api/pay/webhook  — Yo! callback
paymentRouter.post('/webhook', (req: Request, res: Response) => {
  const body = req.body as Record<string, string>
  let externalRef = '', txnStatus = '', internalRef = ''

  if (body.ExternalReference) {
    externalRef = body.ExternalReference
    txnStatus   = body.TransactionStatus   ?? ''
    internalRef = body.InternalReference   ?? body.InternalTransactionId ?? ''
  } else {
    const raw   = typeof body === 'string' ? body : JSON.stringify(body)
    externalRef = extractXml(raw, 'ExternalReference')
    txnStatus   = extractXml(raw, 'TransactionStatus')
    internalRef = extractXml(raw, 'InternalReference') || extractXml(raw, 'InternalTransactionId')
  }

  const session = sessions.get(externalRef)
  if (!session) return res.send('OK')

  const ok = ['SUCCEEDED','SUCCESSFUL','COMPLETED','OK'].includes(txnStatus.toUpperCase())

  if (ok) {
    const plan = PLANS[session.plan]
    session.status         = 'active'
    session.expiresAt      = Date.now() + plan.ms
    session.transactionRef = internalRef
    console.log(`[pay] ✓ ${session.plan} activated for ${session.phone} — expires ${new Date(session.expiresAt).toISOString()}`)
  } else {
    session.status = 'failed'
    console.log(`[pay] ✗ ${txnStatus} for session ${externalRef}`)
  }

  res.send('SUCCESS')
})

// ── Withdrawal store ──────────────────────────────────────────────────────────

export interface WithdrawalRecord {
  id:         string
  provider:   string
  phone:      string
  amount:     number
  note:       string
  status:     'pending' | 'success' | 'failed'
  txRef:      string
  error:      string
  createdAt:  number
}

export const withdrawals = new Map<string, WithdrawalRecord>()

function buildWithdrawXml(id: string, phone: string, amount: number, provider: string, note: string): string {
  const ncode = provider === 'AIRTEL' ? 'AIRTEL_UGANDA' : 'MTN_UGANDA'
  return `<?xml version="1.0" encoding="UTF-8"?>
<AutoCreate>
  <Request>
    <APIUsername>${escapeXml(YO_USERNAME)}</APIUsername>
    <APIPassword>${escapeXml(YO_PASSWORD)}</APIPassword>
    <Method>WithdrawFunds</Method>
    <Amount>${amount}</Amount>
    <Account>${escapeXml(phone)}</Account>
    <ExternalReference>${escapeXml(id)}</ExternalReference>
    <Description>${escapeXml(note || 'Tera5G Admin Withdrawal')}</Description>
    <ProviderReferenceText>Tera5G</ProviderReferenceText>
    <NetworkCode>${ncode}</NetworkCode>
    <NonBlocking>FALSE</NonBlocking>
  </Request>
</AutoCreate>`
}

// ── Admin session management ──────────────────────────────────────────────────

export const adminPaymentRouter = Router()

// GET /api/admin/pay/sessions
adminPaymentRouter.get('/sessions', (req: Request, res: Response) => {
  const { adminKey } = req.query as { adminKey?: string }
  if (adminKey !== store.adminKey) return res.status(403).json({ error: 'Invalid admin key' })
  const list = Array.from(sessions.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(s => ({
      id:             s.id,
      phone:          s.phone,
      plan:           s.plan,
      amount:         s.amount,
      provider:       s.provider,
      status:         s.status,
      expiresAt:      s.expiresAt,
      createdAt:      s.createdAt,
      transactionRef: s.transactionRef,
    }))
  return res.json(list)
})

// POST /api/admin/pay/sessions/:id/revoke
adminPaymentRouter.post('/sessions/:id/revoke', (req: Request, res: Response) => {
  const { adminKey } = req.body as { adminKey?: string }
  if (adminKey !== store.adminKey) return res.status(403).json({ error: 'Invalid admin key' })
  const s = sessions.get(req.params.id)
  if (!s) return res.status(404).json({ error: 'Session not found' })
  s.status = 'failed'
  return res.json({ ok: true })
})

// POST /api/admin/pay/sessions/:id/extend
adminPaymentRouter.post('/sessions/:id/extend', (req: Request, res: Response) => {
  const { adminKey, hours = 6 } = req.body as { adminKey?: string; hours?: number }
  if (adminKey !== store.adminKey) return res.status(403).json({ error: 'Invalid admin key' })
  const s = sessions.get(req.params.id)
  if (!s) return res.status(404).json({ error: 'Session not found' })
  const base = Math.max(s.expiresAt, Date.now())
  s.expiresAt = base + Number(hours) * 3_600_000
  if (s.status !== 'active') s.status = 'active'
  return res.json({ ok: true, expiresAt: s.expiresAt })
})

// POST /api/admin/pay/withdraw
adminPaymentRouter.post('/withdraw', async (req: Request, res: Response) => {
  const { adminKey, phone, amount, provider, note } =
    req.body as { adminKey?: string; phone?: string; amount?: number; provider?: string; note?: string }

  if (adminKey !== store.adminKey) return res.status(403).json({ error: 'Invalid admin key' })
  if (!phone || !amount || amount <= 0) return res.status(400).json({ error: 'phone and amount are required' })
  if (!YO_USERNAME || !YO_PASSWORD) {
    return res.status(503).json({ error: 'Payment service not configured' })
  }

  const id = randomUUID()
  const rec: WithdrawalRecord = {
    id, provider: provider ?? 'MTN',
    phone: normalizePhone(phone), amount: Number(amount),
    note: note ?? '', status: 'pending', txRef: '', error: '', createdAt: Date.now(),
  }
  withdrawals.set(id, rec)

  try {
    const xml      = buildWithdrawXml(id, rec.phone, rec.amount, rec.provider, rec.note)
    const response = await callYo(xml)
    const status   = extractXml(response, 'AutoWithdrawStatus') || extractXml(response, 'AutoCreateStatus')
    const code     = extractXml(response, 'StatusCode')
    const txRef    = extractXml(response, 'TransactionReference') || extractXml(response, 'InternalTransactionId')
    const message  = extractXml(response, 'StatusMessage')

    const ok = status === 'OK' || code === '01'
    rec.status = ok ? 'success' : 'failed'
    rec.txRef  = txRef
    rec.error  = ok ? '' : (message || 'Withdrawal failed')

    if (!ok) {
      console.error('[withdraw] Yo! error:', message, '\n', response.slice(0, 400))
      return res.status(400).json({ ok: false, error: rec.error })
    }

    console.log(`[withdraw] ✓ ${rec.amount} UGX → ${rec.phone} via ${rec.provider} (${id})`)
    return res.json({ ok: true, txRef: rec.txRef })
  } catch (err) {
    rec.status = 'failed'
    rec.error  = 'Network error reaching payment provider'
    console.error('[withdraw] network error:', err)
    return res.status(500).json({ ok: false, error: rec.error })
  }
})

// GET /api/admin/pay/withdrawals
adminPaymentRouter.get('/withdrawals', (req: Request, res: Response) => {
  const { adminKey } = req.query as { adminKey?: string }
  if (adminKey !== store.adminKey) return res.status(403).json({ error: 'Invalid admin key' })
  const list = Array.from(withdrawals.values()).sort((a, b) => b.createdAt - a.createdAt)
  return res.json(list)
})
