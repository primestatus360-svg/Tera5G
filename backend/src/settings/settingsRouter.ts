import { Router, Request, Response } from 'express';
import { db } from '../db';

export const settingsRouter = Router();

settingsRouter.get('/', async (_req: Request, res: Response) => {
    try {
        const { data: rows } = await db.from('app_settings')
            .select('key, value')
            .in('key', ['paywall_enabled']);

        const map: Record<string, string> = {};
        for (const row of rows ?? []) map[row.key] = row.value;

        return res.json({ paywallEnabled: map['paywall_enabled'] !== 'false' });
    } catch (err) {
        console.error('[settings/get]', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
