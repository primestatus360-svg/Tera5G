import dotenv from 'dotenv';
dotenv.config();

validateEnv();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { db } from './db';
import { paymentRouter }  from './payment/paymentRouter';
import { webhookRouter }  from './payment/webhookRouter';
import { accessRouter  }  from './access/accessRouter';
import { configRouter  }  from './config/configRouter';
import { adminRouter   }  from './admin/adminRouter';
import { settingsRouter } from './settings/settingsRouter';

function validateEnv(): void {
    const required: { key: string; hint: string }[] = [
        { key: 'SUPABASE_URL',              hint: 'https://your-project.supabase.co' },
        { key: 'SUPABASE_SERVICE_ROLE_KEY', hint: 'Service role JWT from Supabase → Settings → API' },
        { key: 'CONFIG_AES_KEY',            hint: '64-char hex key — generate: openssl rand -hex 32' },
        { key: 'ADMIN_KEY',                 hint: 'Any strong random string for admin API auth' },
        { key: 'PUBLIC_URL',                hint: 'Publicly reachable backend URL (for Yo! webhooks)' },
    ];

    const missing = required.filter(({ key }) => !process.env[key]);
    if (missing.length > 0) {
        const list = missing.map(({ key, hint }) => `  ${key.padEnd(18)} — ${hint}`).join('\n');
        console.error(`\n❌  Missing required environment variables:\n${list}\n`);
        console.error('Copy backend/.env.example to backend/.env and fill in the values.\n');
        process.exit(1);
    }

    const aesKey = process.env.CONFIG_AES_KEY!;
    if (!/^[0-9a-fA-F]{64}$/.test(aesKey)) {
        console.error('\n❌  CONFIG_AES_KEY must be exactly 64 hexadecimal characters.');
        console.error('Generate with: openssl rand -hex 32\n');
        process.exit(1);
    }
}

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc:  ["'self'"],
            scriptSrc:   ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'cdn.tailwindcss.com', 'unpkg.com'],
            styleSrc:    ["'self'", "'unsafe-inline'", 'cdn.tailwindcss.com', 'fonts.googleapis.com'],
            fontSrc:     ["'self'", 'fonts.gstatic.com'],
            connectSrc:  ["'self'"],
            imgSrc:      ["'self'", 'data:'],
        },
    },
}));

const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : [];

app.use(cors({
    origin: process.env.NODE_ENV === 'development'
        ? '*'
        : (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
            callback(new Error('Not allowed by CORS'));
        },
    methods: ['GET', 'POST'],
}));

app.use(express.json({ limit: '1mb' }));

// ── Admin panel ──────────────────────────────────────────────────────────────
const publicDir = path.join(__dirname, '..', 'public');   // /app/public
app.use(express.static(publicDir));
app.get('/admin',      (_req, res) => res.sendFile(path.join(publicDir, 'admin.html')));
app.get('/admin.html', (_req, res) => res.sendFile(path.join(publicDir, 'admin.html')));

// ── Rate limiters ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
    windowMs: 60_000, max: 60,
    message: { error: 'Too many requests.' },
    standardHeaders: true, legacyHeaders: false,
});
const payLimiter = rateLimit({
    windowMs: 60_000, max: 5,
    message: { error: 'Too many payment requests. Please wait a minute.' },
    standardHeaders: true, legacyHeaders: false,
});
const adminLimiter = rateLimit({
    windowMs: 60_000, max: 30,
    message: { error: 'Too many admin requests.' },
    standardHeaders: true, legacyHeaders: false,
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/pay',      payLimiter,   paymentRouter);
app.use('/api/pay',                    webhookRouter);
app.use('/api/access',  limiter,      accessRouter);
app.use('/api/config',  limiter,      configRouter);
app.use('/api/admin',   adminLimiter, adminRouter);
app.use('/api/settings', limiter,     settingsRouter);

app.get('/health', (_req, res) => res.json({ ok: true, version: '1.0.0', ts: Date.now() }));

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅  Tera5G backend running on port ${PORT}`);
    console.log(`    Environment : ${process.env.NODE_ENV ?? 'development'}`);
    console.log(`    Public URL  : ${process.env.PUBLIC_URL}`);
    console.log(`    Supabase    : ${process.env.SUPABASE_URL}`);
});

process.on('SIGINT',  () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
