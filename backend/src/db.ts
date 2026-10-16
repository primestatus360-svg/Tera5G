import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
});

export const PLAN_DURATIONS: Record<string, number> = {
    '5h':  5  * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
};
