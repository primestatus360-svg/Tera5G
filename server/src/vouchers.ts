import { Router, Request, Response } from 'express'
import { randomBytes } from 'crypto'
import { store } from './store'

// ── Types ─────────────────────────────────────────────────────────────────────

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

const PLAN_AMOUNTS: Record<string, number> = { '6h': 550, '24h': 1000 }
const PLAN_MS:      Record<string, number> = { '6h': 6 * 3_600_000, '24h': 24 * 3_600_000 }

// ── Store ─────────────────────────────────────────────────────────────────────

export const vouchers = new Map<string, Voucher>()

// ── Code generator ────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(8)
  let raw = ''
  for (let i = 0; i < 8; i++) raw += chars[bytes[i] % chars.length]
  return raw.slice(0, 4) + '-' + raw.slice(4)
}

// ── Redeem helper (called by payment route) ───────────────────────────────────

export function redeemVoucher(
  code: string, phone?: string
): { ok: boolean; sessionId?: string; plan?: string; expiresAt?: number; error?: string } {
  const key = code.replace(/\s/g, '').toUpperCase()
  const v = vouchers.get(key)
  if (!v)                      return { ok: false, error: 'Invalid voucher code' }
  if (v.status === 'used')     return { ok: false, error: 'Voucher already used' }
  if (v.status === 'revoked')  return { ok: false, error: 'Voucher has been revoked' }
  if (v.validUntil < Date.now()) return { ok: false, error: 'Voucher has expired' }

  v.status      = 'used'
  v.usedAt      = Date.now()
  if (phone) v.usedByPhone = phone

  const sessionId = randomBytes(16).toString('hex')
  const expiresAt = Date.now() + PLAN_MS[v.plan]
  return { ok: true, sessionId, plan: v.plan, expiresAt }
}

// ── Admin router ──────────────────────────────────────────────────────────────

export const voucherAdminRouter = Router()

// POST /api/admin/vouchers/generate
voucherAdminRouter.post('/generate', (req: Request, res: Response) => {
  const { adminKey, plan, quantity = 1, validHours = 72 } = req.body as {
    adminKey?: string; plan?: string; quantity?: number; validHours?: number
  }
  if (adminKey !== store.adminKey) return res.status(403).json({ error: 'Invalid admin key' })
  if (!plan || !PLAN_AMOUNTS[plan]) return res.status(400).json({ error: 'plan (6h|24h) required' })

  const qty       = Math.min(Math.max(1, Number(quantity)), 100)
  const validUntil = Date.now() + Number(validHours) * 3_600_000
  const generated: Voucher[] = []

  for (let i = 0; i < qty; i++) {
    let code: string
    do { code = generateCode() } while (vouchers.has(code))
    const v: Voucher = {
      code, plan: plan as '6h' | '24h',
      amount: PLAN_AMOUNTS[plan],
      status: 'active', createdAt: Date.now(), validUntil,
    }
    vouchers.set(code, v)
    generated.push(v)
  }

  return res.json({ generated })
})

// GET /api/admin/vouchers
voucherAdminRouter.get('/', (req: Request, res: Response) => {
  const { adminKey } = req.query as { adminKey?: string }
  if (adminKey !== store.adminKey) return res.status(403).json({ error: 'Invalid admin key' })
  return res.json(
    Array.from(vouchers.values()).sort((a, b) => b.createdAt - a.createdAt)
  )
})

// DELETE /api/admin/vouchers/:code
voucherAdminRouter.delete('/:code', (req: Request, res: Response) => {
  const { adminKey } = req.body as { adminKey?: string }
  if (adminKey !== store.adminKey) return res.status(403).json({ error: 'Invalid admin key' })
  const v = vouchers.get(req.params.code)
  if (!v) return res.status(404).json({ error: 'Voucher not found' })
  v.status = 'revoked'
  return res.json({ ok: true })
})
