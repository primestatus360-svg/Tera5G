import { Router, Request, Response } from 'express';
import { db } from '../db';

export const contactRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

contactRouter.post('/', async (req: Request, res: Response) => {
    try {
        const { name, email, country, device, message } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length < 2)
            return res.status(400).json({ error: 'Name is required (minimum 2 characters).' });

        if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim()))
            return res.status(400).json({ error: 'A valid email address is required.' });

        if (!country || typeof country !== 'string' || country.trim().length < 2)
            return res.status(400).json({ error: 'Country is required.' });

        const { error } = await db.from('contact_applications').insert({
            name:       name.trim().slice(0, 120),
            email:      email.trim().toLowerCase().slice(0, 200),
            country:    country.trim().slice(0, 80),
            device:     (device ?? '').toString().trim().slice(0, 200) || null,
            message:    (message ?? '').toString().trim().slice(0, 1000) || null,
            status:     'pending',
            created_at: Date.now(),
        });

        if (error) throw new Error(error.message);

        return res.json({ ok: true });
    } catch (err) {
        console.error('[contact]', err);
        return res.status(500).json({ error: 'Could not save your application. Please try again.' });
    }
});
