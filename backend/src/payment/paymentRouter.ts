import { Router, Request, Response } from 'express';
import { db, PLAN_DURATIONS } from '../db';
import { initiateDeposit } from './yo';

const PLAN_AMOUNTS: Record<string, number> = { '5h': 500, '24h': 1000 };
const ALLOWED_PROVIDERS = new Set(['MTN', 'AIRTEL']);
const DEVICE_ID_RE      = /^[0-9a-f]{64}$/;

export const paymentRouter = Router();

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
        const txRef      = `t5g_${String(deviceId).slice(0, 10)}_${plan}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const now        = Date.now();
        const webhookUrl = `${process.env.PUBLIC_URL}/api/pay/webhook`;

        const { error: insertErr } = await db.from('payments').insert({
            tx_ref:     txRef,
            device_id:  String(deviceId),
            plan,
            amount,
            provider:   String(provider),
            status:     'pending',
            created_at: now,
            updated_at: now,
        });
        if (insertErr) throw new Error(insertErr.message);

        const yoResult = await initiateDeposit({
            phone: String(phone), amount, txRef, plan,
            webhookUrl, provider: String(provider),
        });

        if (!yoResult.accepted) {
            const { error: failErr } = await db.from('payments')
                .update({ status: 'failed', updated_at: Date.now() })
                .eq('tx_ref', txRef);
            if (failErr) console.error('[payment/initiate] Failed to mark failed', failErr);

            return res.status(502).json({
                ok:      false,
                message: yoResult.errorMessage || 'Payment could not be started. Check your number and try again.',
            });
        }

        if (yoResult.internalRef) {
            const { error: refErr } = await db.from('payments')
                .update({ flw_id: yoResult.internalRef, updated_at: Date.now() })
                .eq('tx_ref', txRef);
            if (refErr) console.error('[payment/initiate] Failed to store internal ref', refErr);
        }

        return res.json({ ok: true, txRef, message: 'USSD prompt sent. Approve on your phone.' });
    } catch (err) {
        console.error('[payment/initiate]', err);
        return res.status(500).json({ ok: false, message: 'Internal server error' });
    }
});

paymentRouter.get('/status', async (req: Request, res: Response) => {
    try {
        const txRef    = req.query.txRef    as string;
        const deviceId = req.query.deviceId as string;

        if (!txRef || typeof txRef !== 'string' || txRef.length > 120)
            return res.status(400).json({ status: 'error', message: 'Invalid txRef' });

        if (!deviceId || !DEVICE_ID_RE.test(deviceId))
            return res.status(400).json({ status: 'error', message: 'Invalid deviceId' });

        const { data: rows } = await db.from('payments')
            .select('*')
            .eq('tx_ref', txRef)
            .eq('device_id', deviceId)
            .limit(1);

        const payment = rows?.[0];
        if (!payment)
            return res.status(404).json({ status: 'error', message: 'Payment not found' });

        if (payment.status === 'active') {
            const { data: accessRows } = await db.from('device_access')
                .select('expires_at')
                .eq('device_id', deviceId)
                .limit(1);
            const access = accessRows?.[0];
            return res.json({
                status:    'active',
                plan:      payment.plan,
                expiresAt: access?.expires_at ?? (Date.now() + (PLAN_DURATIONS[payment.plan] ?? PLAN_DURATIONS['5h'])),
            });
        }

        return res.json({ status: payment.status, plan: payment.plan });
    } catch (err) {
        console.error('[payment/status]', err);
        return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});
