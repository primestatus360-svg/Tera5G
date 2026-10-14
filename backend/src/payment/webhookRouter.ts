import express, { Router, Request, Response } from 'express';
import { prisma, PLAN_DURATIONS } from '../db';
import { xmlValue } from './yo';

export const webhookRouter = Router();

// POST /api/pay/webhook — Yo! Uganda calls this when payment succeeds/fails.
// Yo! sends XML (or occasionally form-encoded); responds with plain-text "SUCCESS".
// Security: whitelist your VPS static IP with Yo! Uganda so only their servers call this.
webhookRouter.post(
    '/webhook',
    express.text({ type: '*/*', limit: '1mb' }),
    async (req: Request, res: Response) => {
        const rawBody = typeof req.body === 'string' ? req.body : '';

        const txRef     = xmlValue(rawBody, 'ExternalReference');
        const txnStatus = xmlValue(
            rawBody,
            'TransactionStatus',
            'YBSTransactionStatus',
            'AutoCreateTransactionStatus',
        ).toUpperCase();
        const internalRef = xmlValue(
            rawBody,
            'InternalReference',
            'InternalTransactionId',
            'TransactionReference',
            'MNOTransactionReferenceId',
        );

        console.log(`[webhook] ref=${txRef} status=${txnStatus}`);

        // Always respond SUCCESS — Yo! retries on non-200 responses.
        if (!txRef) return res.status(200).send('SUCCESS');

        const succeeded =
            txnStatus === 'SUCCEEDED'  ||
            txnStatus === 'SUCCESSFUL' ||
            txnStatus === 'COMPLETED'  ||
            txnStatus === 'OK';

        if (!succeeded) {
            if (txnStatus === 'FAILED' || txnStatus === 'CANCELLED' || txnStatus === 'TIMEOUT') {
                await prisma.payment.updateMany({
                    where: { txRef, status: 'pending' },
                    data:  { status: 'failed', updatedAt: Date.now() }
                }).catch(err => console.error('[webhook] Failed to mark payment failed', err));
            }
            return res.status(200).send('SUCCESS');
        }

        try {
            // Read payment record first to get deviceId/plan/provider for the access grant.
            const payment = await prisma.payment.findUnique({ where: { txRef } });
            if (!payment) {
                console.warn('[webhook] Unknown txRef', txRef);
                return res.status(200).send('SUCCESS');
            }

            // Atomic idempotency gate: transition pending→active exactly once.
            // If two webhook deliveries race, only one will update count=1; the other sees count=0.
            const activated = await prisma.payment.updateMany({
                where: { txRef, status: 'pending' },
                data:  {
                    status:    'active',
                    flwId:     internalRef || payment.flwId || null,
                    updatedAt: Date.now(),
                }
            });

            if (activated.count === 0) {
                // Either already activated or already failed — idempotent, just ack.
                console.log(`[webhook] Already processed ${txRef}`);
                return res.status(200).send('SUCCESS');
            }

            const planMs    = PLAN_DURATIONS[payment.plan] ?? PLAN_DURATIONS['5h'];
            const expiresAt = Date.now() + planMs;
            const now       = Date.now();

            await prisma.deviceAccess.upsert({
                where:  { deviceId: payment.deviceId },
                create: {
                    deviceId:  payment.deviceId,
                    plan:      payment.plan,
                    expiresAt,
                    txRef,
                    provider:  payment.provider,
                    createdAt: now,
                    updatedAt: now,
                },
                update: {
                    plan:      payment.plan,
                    expiresAt,
                    txRef,
                    provider:  payment.provider,
                    updatedAt: now,
                }
            });

            console.log(
                `[webhook] Activated ${payment.plan} for ${payment.deviceId.slice(0, 8)}… ` +
                `until ${new Date(expiresAt).toISOString()}`
            );
        } catch (err) {
            console.error('[webhook] Error activating payment', err);
            // Return SUCCESS so Yo! stops retrying — investigate logs manually.
        }

        return res.status(200).send('SUCCESS');
    }
);
