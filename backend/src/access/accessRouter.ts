import { Router, Request, Response } from 'express';
import { prisma } from '../db';

export const accessRouter = Router();

// GET /api/access/check?deviceId=...
accessRouter.get('/check', async (req: Request, res: Response) => {
    const deviceId = (req.query.deviceId as string) ?? (req.headers['x-device-id'] as string);
    if (!deviceId) return res.status(400).json({ active: false, message: 'deviceId required' });

    const access = await prisma.deviceAccess.findUnique({ where: { deviceId } });

    if (!access || access.expiresAt <= Date.now()) {
        return res.json({ active: false, expiresAt: 0, plan: '' });
    }

    return res.json({ active: true, plan: access.plan, expiresAt: access.expiresAt });
});
