import { Router, Request, Response } from 'express';
import { prisma, PLAN_DURATIONS } from '../db';
import { initiateDeposit } from './yo';

const PLAN_AMOUNTS: Record<string, number> = { '5h': 500, '24h': 1000 };
const ALLOWED_PROVIDERS = new Set(['MTN', 'AIRTEL']);
const DEVICE_ID_RE      = /^[0-9a-f]{64}$/;

export const paymentRouter = Router();

// POST /api/pay/initiate
paymentRouter.post('/initiate', async (req: Request, res: Response) => {
    try {
        const { deviceId, plan, phone, provider } = req.body;

        if (!deviceId || !plan || !phone || !provider)
            return res.status(400).json({ ok: false, message: 'Missing required fields' });

        if (!DEVICE_ID_RE.test(String(deviceId)))
            return res.status(400).json({ ok: false, message: 'Invalid device identifier' });

        if (!PLAN_AMOUNTS[plan])
            return res.status(400).json({ ok: false, message: 'Invalid plan. Use 5h or 24h.' });

        if (!ALLOWED_PROVIDERS.has(String(provider)))
            return res.status(400).json({ ok: false, message: 'Invalid provider. Use MTN or AIRTEL.' });

        const digits = String(phone).replace(/\D/g, '');
        if (digits.length < 9 || digits.length > 13)
            return res.status(400).json({ ok: false, message: 'Invalid phone number' });

        const amount     = PLAN_AMOUNTS[plan];
        // Random suffix prevents duplicate txRef if the same device pays twice in the same ms
        const txRef      = `t5g_${deviceId.slice(0, 10)}_${plan}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const now        = Date.now();
        const webhookUrl = `${process.env.PUBLIC_URL}/api/pay/webhook`;

        await prisma.payment.create({
            data: { txRef, deviceId: String(deviceId), plan, amount, provider: String(provider), status: 'pending', createdAt: now, updatedAt: now }
        });

        const yoResult = await initiateDeposit({ phone: String(phone), amount, txRef, plan, webhookUrl, provider: String(provider) });

        if (!yoResult.accepted) {
            await prisma.payment.update({
                where: { txRef },
                data:  { status: 'failed', updatedAt: Date.now() }
            }).catch(err => console.error('[payment/initiate] Failed to mark failed', err));

            return res.status(502).json({
                ok:      false,
                message: yoResult.errorMessage || 'Payment could not be started. Check your number and try again.'
            });
        }

        if (yoResult.internalRef) {
            await prisma.payment.update({
                where: { txRef },
                data:  { flwId: yoResult.internalRef, updatedAt: Date.now() }
            }).catch(err => console.error('[payment/initiate] Failed to store internal ref', err));
        }

        return res.json({ ok: true, txRef, message: 'USSD prompt sent. Approve on your phone.' });
    } catch (err) {
        console.error('[payment/initiate]', err);
        return res.status(500).json({ ok: false, message: 'Internal server error' });
    }
});

// GET /api/pay/status?txRef=...&deviceId=...
paymentRouter.get('/status', async (req: Request, res: Response) => {
    try {
        const txRef    = req.query.txRef    as string;
        const deviceId = req.query.deviceId as string;

        if (!txRef || typeof txRef !== 'string' || txRef.length > 120)
            return res.status(400).json({ status: 'error', message: 'Invalid txRef' });

        if (!deviceId || !DEVICE_ID_RE.test(deviceId))
            return res.status(400).json({ status: 'error', message: 'Invalid deviceId' });

        const payment = await prisma.payment.findFirst({ where: { txRef, deviceId } });
        if (!payment)
            return res.status(404).json({ status: 'error', message: 'Payment not found' });

        if (payment.status === 'active') {
            const access = await prisma.deviceAccess.findUnique({ where: { deviceId } });
            return res.json({
                status:    'active',
                plan:      payment.plan,
                expiresAt: access?.expiresAt ?? (Date.now() + (PLAN_DURATIONS[payment.plan] ?? PLAN_DURATIONS['5h']))
            });
        }

        return res.json({ status: payment.status, plan: payment.plan });
    } catch (err) {
        console.error('[payment/status]', err);
        return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});
