import { Router, Request, Response } from 'express';
import { prisma, PLAN_DURATIONS } from '../db';

export const adminRouter = Router();

const DEVICE_ID_RE = /^[0-9a-f]{64}$/;

function requireAdmin(req: Request, res: Response, next: () => void) {
    const key = req.headers['x-admin-key'];
    if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

// POST /api/admin/config — upload a new server config JSON (encrypted on delivery)
adminRouter.post('/config', requireAdmin, async (req: Request, res: Response) => {
    try {
        const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        if (!payload || payload === '{}') {
            return res.status(400).json({ error: 'Empty config payload' });
        }
        let parsed: any;
        try { parsed = JSON.parse(payload); } catch {
            return res.status(400).json({ error: 'Invalid JSON payload' });
        }
        if (!Array.isArray(parsed?.servers) || parsed.servers.length === 0) {
            return res.status(400).json({ error: 'Config must have a non-empty servers array' });
        }

        const latest     = await prisma.serverConfig.findFirst({ orderBy: { version: 'desc' } });
        const newVersion = (latest?.version ?? 0) + 1;
        await prisma.serverConfig.create({
            data: { payload, version: newVersion, updatedAt: Date.now() }
        });
        return res.json({ ok: true, version: newVersion, serverCount: parsed.servers.length });
    } catch (err) {
        console.error('[admin/config]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/grant — manually grant or extend access for a device
adminRouter.post('/grant', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { deviceId, plan, hours } = req.body;

        if (!deviceId || typeof deviceId !== 'string' || !DEVICE_ID_RE.test(deviceId)) {
            return res.status(400).json({ error: 'deviceId must be a 64-char hex string' });
        }

        let planMs: number;
        let resolvedPlan: string;

        if (hours !== undefined) {
            const h = Number(hours);
            if (!Number.isFinite(h) || h <= 0 || h > 8760) {
                return res.status(400).json({ error: 'hours must be a positive number ≤ 8760' });
            }
            planMs       = Math.floor(h) * 3_600_000;
            resolvedPlan = `${Math.floor(h)}h`;
        } else {
            resolvedPlan = typeof plan === 'string' && PLAN_DURATIONS[plan] ? plan : '24h';
            planMs       = PLAN_DURATIONS[resolvedPlan];
        }

        const expiresAt = Date.now() + planMs;
        const now       = Date.now();

        await prisma.deviceAccess.upsert({
            where:  { deviceId },
            create: {
                deviceId, plan: resolvedPlan, expiresAt, txRef: 'admin',
                provider: 'admin', createdAt: now, updatedAt: now
            },
            update: { plan: resolvedPlan, expiresAt, txRef: 'admin', provider: 'admin', updatedAt: now }
        });

        return res.json({ ok: true, deviceId, plan: resolvedPlan, expiresAt });
    } catch (err) {
        console.error('[admin/grant]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/admin/revoke — immediately revoke a device's access
adminRouter.post('/revoke', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { deviceId } = req.body;
        if (!deviceId || typeof deviceId !== 'string') {
            return res.status(400).json({ error: 'deviceId required' });
        }
        const deleted = await prisma.deviceAccess.deleteMany({ where: { deviceId } });
        return res.json({ ok: true, removed: deleted.count });
    } catch (err) {
        console.error('[admin/revoke]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/stats — revenue and activity summary
adminRouter.get('/stats', requireAdmin, async (_req: Request, res: Response) => {
    try {
        const now = Date.now();
        const [activeDevices, totalPayments, revenueAgg, paymentsLast24h] = await Promise.all([
            prisma.deviceAccess.count({ where: { expiresAt: { gt: now } } }),
            prisma.payment.count(),
            prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'active' } }),
            prisma.payment.count({ where: { createdAt: { gt: now - 86_400_000 }, status: 'active' } }),
        ]);
        return res.json({
            activeDevices,
            totalPayments,
            revenueUGX:      revenueAgg._sum.amount ?? 0,
            paymentsLast24h,
        });
    } catch (err) {
        console.error('[admin/stats]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/admin/devices?page=1&limit=50 — list active devices
adminRouter.get('/devices', requireAdmin, async (req: Request, res: Response) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page  as string ?? '1',  10));
        const limit = Math.min(100, parseInt(req.query.limit as string ?? '50', 10));
        const now   = Date.now();
        const devices = await prisma.deviceAccess.findMany({
            where:   { expiresAt: { gt: now } },
            orderBy: { expiresAt: 'desc' },
            skip:    (page - 1) * limit,
            take:    limit,
            select:  { deviceId: true, plan: true, expiresAt: true, provider: true, updatedAt: true }
        });
        return res.json({ page, limit, count: devices.length, devices });
    } catch (err) {
        console.error('[admin/devices]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
