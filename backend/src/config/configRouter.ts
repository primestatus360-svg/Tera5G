import { Router, Request, Response } from 'express';
import { db } from '../db';
import { encryptConfig } from './configEncryption';

export const configRouter = Router();

configRouter.get('/', async (req: Request, res: Response) => {
    const deviceId = req.headers['x-device-id'] as string;
    if (!deviceId) return res.status(401).json({ error: 'Device ID required' });

    const { data: accessRows } = await db.from('device_access')
        .select('expires_at')
        .eq('device_id', deviceId)
        .limit(1);

    const access = accessRows?.[0];
    if (!access || access.expires_at <= Date.now()) {
        return res.status(403).json({ error: 'No active access. Please purchase a plan.' });
    }

    const { data: configRows } = await db.from('server_configs')
        .select('payload')
        .order('version', { ascending: false })
        .limit(1);

    const config = configRows?.[0];
    if (!config) return res.status(503).json({ error: 'No server config available yet' });

    const encrypted = encryptConfig(config.payload);
    return res.json(encrypted);
});
