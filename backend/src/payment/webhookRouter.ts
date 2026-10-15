import express, { Router, Request, Response } from 'express';
import { db, PLAN_DURATIONS } from '../db';
import { xmlValue } from './yo';

export const webhookRouter = Router();

webhookRouter.post(
    '/webhook',
    express.text({ type: '*/*', limit: '1mb' }),
    async (req: Request, res: Response) => {
        const rawBody = typeof req.body === 'string' ? req.body : '';

        const txRef     = xmlValue(rawBody, 'ExternalReference');
        const txnStatus = xmlValue(
            rawBody,
            'TransactionStatus', 'YBSTransactionStatus', 'AutoCreateTransactionStatus',
        ).toUpperCase();
        const internalRef = xmlValue(
            rawBody,
            'InternalReference', 'InternalTransactionId',
            'TransactionReference', 'MNOTransactionReferenceId',
        );

        console.log(`[webhook] ref=${txRef} status=${txnStatus}`);

        if (!txRef) return res.status(200).send('SUCCESS');

        const succeeded =
            txnStatus === 'SUCCEEDED'  ||
            txnStatus === 'SUCCESSFUL' ||
            txnStatus === 'COMPLETED'  ||
            txnStatus === 'SUCCESS'    ||
            txnStatus === 'OK';

        if (!succeeded) {
            if (txnStatus === 'FAILED' || txnStatus === 'CANCELLED' || txnStatus === 'TIMEOUT') {
                const { error: failErr } = await db.from('payments')
                    .update({ status: 'failed', updated_at: Date.now() })
                    .eq('tx_ref', txRef)
                    .eq('status', 'pending');
                if (failErr) console.error('[webhook] Failed to mark payment failed', failErr);
            }
            return res.status(200).send('SUCCESS');
        }

        try {
            const { data: paymentRows } = await db
                .from('payments')
                .select('*')
                .eq('tx_ref', txRef)
                .limit(1);

            const payment = paymentRows?.[0];
            if (!payment) {
                console.warn('[webhook] Unknown txRef', txRef);
                return res.status(200).send('SUCCESS');
            }

            // Atomic idempotency gate: only the first webhook delivery transitions pending→active.
            const { data: activated } = await db
                .from('payments')
                .update({
                    status:     'active',
                    flw_id:     internalRef || payment.flw_id || null,
                    updated_at: Date.now(),
                })
                .eq('tx_ref', txRef)
                .eq('status', 'pending')
                .select();

            if (!activated || activated.length === 0) {
                console.log(`[webhook] Already processed ${txRef}`);
                return res.status(200).send('SUCCESS');
            }

            const planMs    = PLAN_DURATIONS[payment.plan] ?? PLAN_DURATIONS['5h'];
            const expiresAt = Date.now() + planMs;
            const now       = Date.now();

            await db.from('device_access').upsert({
                device_id:  payment.device_id,
                plan:       payment.plan,
                expires_at: expiresAt,
                tx_ref:     txRef,
                provider:   payment.provider,
                created_at: now,
                updated_at: now,
            }, { onConflict: 'device_id' });

            console.log(
                `[webhook] Activated ${payment.plan} for ${payment.device_id.slice(0, 8)}… ` +
                `until ${new Date(expiresAt).toISOString()}`
            );
        } catch (err) {
            console.error('[webhook] Error activating payment', err);
        }

        return res.status(200).send('SUCCESS');
    }
);
