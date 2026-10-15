import { Router, Request, Response } from 'express';
import { db } from '../db';

export const accessRouter = Router();

accessRouter.get('/check', async (req: Request, res: Response) => {
    const deviceId = (req.query.deviceId as string) ?? (req.headers['x-device-id'] as string);
    if (!deviceId) return res.status(400).json({ active: false, message: 'deviceId required' });

    const { data: settingRows } = await db.from('app_settings')
        .select('value')
        .eq('key', 'paywall_enabled')
        .limit(1);

    const paywallEnabled = settingRows?.[0]?.value !== 'false';

    if (!paywallEnabled) {
        return res.json({ active: true, plan: 'free', expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
    }

    const { data: rows } = await db.from('device_access')
        .select('plan, expires_at')
        .eq('device_id', deviceId)
        .limit(1);

    const access = rows?.[0];
    if (!access || access.expires_at <= Date.now()) {
        return res.json({ active: false, expiresAt: 0, plan: '' });
    }

    return res.json({ active: true, plan: access.plan, expiresAt: access.expires_at });
});
