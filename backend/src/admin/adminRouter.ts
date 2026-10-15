import { Router, Request, Response } from 'express';
import { db, PLAN_DURATIONS } from '../db';
import { initiateWithdrawal } from '../payment/yo';

export const adminRouter = Router();

const DEVICE_ID_RE = /^[0-9a-f]{64}$/;

function requireAdmin(req: Request, res: Response, next: () => void) {
    const key = req.headers['x-admin-key'];
    if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

adminRouter.post('/config', requireAdmin, async (req: Request, res: Response) => {
    try {
        const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        if (!payload || payload === '{}')
            return res.status(400).json({ error: 'Empty config payload' });

        let parsed: any;
        try { parsed = JSON.parse(payload); } catch {
            return res.status(400).json({ error: 'Invalid JSON payload' });
        }
        if (!Array.isArray(parsed?.servers) || parsed.servers.length === 0)
            return res.status(400).json({ error: 'Config must have a non-empty servers array' });

        const { data: latestRows } = await db.from('server_configs')
            .select('version')
            .order('version', { ascending: false })
            .limit(1);

        const newVersion = ((latestRows?.[0]?.version) ?? 0) + 1;

        const { error } = await db.from('server_configs')
            .insert({ payload, version: newVersion, updated_at: Date.now() });
        if (error) throw new Error(error.message);

        return res.json({ ok: true, version: newVersion, serverCount: parsed.servers.length });
    } catch (err) {
        console.error('[admin/config]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

adminRouter.post('/grant', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { deviceId, plan, hours } = req.body;

        if (!deviceId || typeof deviceId !== 'string' || !DEVICE_ID_RE.test(deviceId))
            return res.status(400).json({ error: 'deviceId must be a 64-char hex string' });

        let planMs: number;
        let resolvedPlan: string;

        if (hours !== undefined) {
            const h = Number(hours);
            if (!Number.isFinite(h) || h <= 0 || h > 8760)
                return res.status(400).json({ error: 'hours must be a positive number ≤ 8760' });
            planMs       = Math.floor(h) * 3_600_000;
            resolvedPlan = `${Math.floor(h)}h`;
        } else {
            resolvedPlan = typeof plan === 'string' && PLAN_DURATIONS[plan] ? plan : '24h';
            planMs       = PLAN_DURATIONS[resolvedPlan];
        }

        const expiresAt = Date.now() + planMs;
        const now       = Date.now();

        const { error } = await db.from('device_access').upsert({
            device_id:  deviceId,
            plan:       resolvedPlan,
            expires_at: expiresAt,
            tx_ref:     'admin',
            provider:   'admin',
            created_at: now,
            updated_at: now,
        }, { onConflict: 'device_id' });
        if (error) throw new Error(error.message);

        return res.json({ ok: true, deviceId, plan: resolvedPlan, expiresAt });
    } catch (err) {
        console.error('[admin/grant]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

adminRouter.post('/revoke', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { deviceId } = req.body;
        if (!deviceId || typeof deviceId !== 'string')
            return res.status(400).json({ error: 'deviceId required' });

        const { error, count } = await db.from('device_access')
            .delete()
            .eq('device_id', deviceId);
        if (error) throw new Error(error.message);

        return res.json({ ok: true, removed: count ?? 0 });
    } catch (err) {
        console.error('[admin/revoke]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

adminRouter.get('/stats', requireAdmin, async (_req: Request, res: Response) => {
    try {
        const now = Date.now();

        const [activeResult, totalResult, revenueResult, last24hResult] = await Promise.all([
            db.from('device_access').select('*', { count: 'exact', head: true }).gt('expires_at', now),
            db.from('payments').select('*', { count: 'exact', head: true }),
            db.from('payments').select('amount').eq('status', 'active'),
            db.from('payments').select('*', { count: 'exact', head: true })
                .eq('status', 'active').gt('created_at', now - 86_400_000),
        ]);

        const revenueUGX = (revenueResult.data ?? []).reduce((s: number, r: any) => s + (r.amount ?? 0), 0);

        return res.json({
            activeDevices:   activeResult.count   ?? 0,
            totalPayments:   totalResult.count     ?? 0,
            revenueUGX,
            paymentsLast24h: last24hResult.count   ?? 0,
        });
    } catch (err) {
        console.error('[admin/stats]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

adminRouter.get('/devices', requireAdmin, async (req: Request, res: Response) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page  as string ?? '1',  10));
        const limit = Math.min(100, parseInt(req.query.limit as string ?? '50', 10));
        const now   = Date.now();
        const from  = (page - 1) * limit;

        const { data: devices, error } = await db.from('device_access')
            .select('device_id, plan, expires_at, provider, updated_at')
            .gt('expires_at', now)
            .order('expires_at', { ascending: false })
            .range(from, from + limit - 1);

        if (error) throw new Error(error.message);

        return res.json({ page, limit, count: devices?.length ?? 0, devices: devices ?? [] });
    } catch (err) {
        console.error('[admin/devices]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

adminRouter.get('/payments', requireAdmin, async (req: Request, res: Response) => {
    try {
        const page   = Math.max(1, parseInt(req.query.page   as string ?? '1',  10));
        const limit  = Math.min(100, parseInt(req.query.limit as string ?? '50', 10));
        const status = req.query.status as string;
        const from   = (page - 1) * limit;

        let query = db.from('payments')
            .select('tx_ref, device_id, plan, amount, provider, status, flw_id, created_at, updated_at')
            .order('created_at', { ascending: false })
            .range(from, from + limit - 1);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data: payments, error } = await query;
        if (error) throw new Error(error.message);

        return res.json({ page, limit, count: payments?.length ?? 0, payments: payments ?? [] });
    } catch (err) {
        console.error('[admin/payments]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

adminRouter.post('/settings', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { paywallEnabled } = req.body;

        if (typeof paywallEnabled !== 'boolean')
            return res.status(400).json({ error: 'paywallEnabled must be a boolean' });

        const { error } = await db.from('app_settings').upsert({
            key:        'paywall_enabled',
            value:      paywallEnabled ? 'true' : 'false',
            updated_at: Date.now(),
        }, { onConflict: 'key' });
        if (error) throw new Error(error.message);

        return res.json({ ok: true, paywallEnabled });
    } catch (err) {
        console.error('[admin/settings]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

adminRouter.post('/withdraw', requireAdmin, async (req: Request, res: Response) => {
    try {
        const { phone, amount, provider } = req.body;

        if (!phone || !amount || !provider)
            return res.status(400).json({ error: 'phone, amount, and provider are required' });

        const numAmount = Number(amount);
        if (!Number.isFinite(numAmount) || numAmount < 500 || numAmount > 5_000_000)
            return res.status(400).json({ error: 'amount must be between 500 and 5,000,000 UGX' });

        if (!['MTN', 'AIRTEL'].includes(String(provider)))
            return res.status(400).json({ error: 'provider must be MTN or AIRTEL' });

        const result = await initiateWithdrawal({
            phone:    String(phone),
            amount:   numAmount,
            provider: String(provider),
        });

        if (!result.accepted) {
            return res.status(502).json({
                ok:      false,
                message: result.errorMessage || 'Withdrawal could not be started. Check the number and try again.',
            });
        }

        return res.json({ ok: true, internalRef: result.internalRef, message: 'Withdrawal initiated. Approve on the phone.' });
    } catch (err) {
        console.error('[admin/withdraw]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
