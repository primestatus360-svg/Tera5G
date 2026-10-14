import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { encryptConfig } from './configEncryption';

export const configRouter = Router();

// GET /api/config — returns encrypted server config for active devices
configRouter.get('/', async (req: Request, res: Response) => {
    const deviceId = req.headers['x-device-id'] as string;
    if (!deviceId) return res.status(401).json({ error: 'Device ID required' });

    const access = await prisma.deviceAccess.findUnique({ where: { deviceId } });
    if (!access || access.expiresAt <= Date.now()) {
        return res.status(403).json({ error: 'No active access. Please purchase a plan.' });
    }

    const config = await prisma.serverConfig.findFirst({ orderBy: { version: 'desc' } });
    if (!config) return res.status(503).json({ error: 'No server config available yet' });

    const encrypted = encryptConfig(config.payload);
    return res.json(encrypted);
});
