import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error']
});

export const PLAN_DURATIONS: Record<string, number> = {
    '5h':  5  * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
};
