import { Router, Request, Response } from 'express'
import { randomUUID } from 'crypto'
import https from 'https'
import http  from 'http'
import { URL } from 'url'
import { store } from './store'

// ── Config ────────────────────────────────────────────────────────────────────

const YO_API_URL  = process.env.YO_API_URL  ?? 'https://paymentsapi1.yo.co.ug/ybs/task.php'
const YO_USERNAME = process.env.YO_API_USERNAME ?? ''
const YO_PASSWORD = process.env.YO_API_PASSWORD ?? ''
const PUBLIC_URL  = (process.env.PUBLIC_URL ?? '').replace(/\/$/, '')
const WEBHOOK_URL = `${PUBLIC_URL}/api/pay/webhook`

const PLANS = {
  '6h':  { amount: 550,  ms: 6  * 3_600_000, label: '6 Hours Browsing'  },
  '24h': { amount: 1000, ms: 24 * 3_600_000, label: '24 Hours Browsing' },
}

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
    <APIUsername>${YO_USERNAME}</APIUsername>
    <APIPassword>${YO_PASSWORD}</APIPassword>
    <Method>AutoCreateRequest</Method>
    <Amount>${s.amount}</Amount>
    <Account>${s.phone}</Account>
    <ExternalReference>${s.id}</ExternalReference>
    <Description>Tera5G Browser - ${plan.label}</Description>
    <ProviderReferenceText>Tera5G</ProviderReferenceText>
    <DepositNotificationURL>${WEBHOOK_URL}</DepositNotificationURL>
    <InstantNotificationURL>${WEBHOOK_URL}</InstantNotificationURL>
    <FailureNotificationURL>${WEBHOOK_URL}</FailureNotificationURL>
    <NetworkCode>${ncode}</NetworkCode>
    <NonBlocking>TRUE</NonBlocking>
  </Request>
</AutoCreate>`
}

function postXml(xml: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const u    = new URL(YO_API_URL)
    const mod  = u.protocol === 'https:' ? https : http
    const body = Buffer.from(xml, 'utf8')
    const req  = mod.request({
      hostname: u.hostname,
      port:     u.port || (u.protocol === 'https:' ? 443 : 80),
      path:     u.pathname + u.search,
      method:   'POST',
      headers:  { 'Content-Type': 'application/xml', 'Content-Length': body.length },
    }, res => {
      let out = ''
      res.on('data', c => { out += c })
      res.on('end',  () => resolve(out))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
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
    const xml      = buildXml(session)
    const response = await postXml(xml)
    const status   = extractXml(response, 'AutoCreateStatus')
    const code     = extractXml(response, 'StatusCode')

    if (status !== 'OK' && code !== '01') {
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
    session.status        = 'active'
    session.expiresAt     = Date.now() + plan.ms
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
    <APIUsername>${YO_USERNAME}</APIUsername>
    <APIPassword>${YO_PASSWORD}</APIPassword>
    <Method>WithdrawFunds</Method>
    <Amount>${amount}</Amount>
    <Account>${phone}</Account>
    <ExternalReference>${id}</ExternalReference>
    <Description>${note || 'Tera5G Admin Withdrawal'}</Description>
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
    const response = await postXml(xml)
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
