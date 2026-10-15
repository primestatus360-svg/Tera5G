import { ProxyAgent, fetch as undiciFetch } from 'undici';

const YO_API_URL  = process.env.YO_API_URL      || 'https://paymentsapi1.yo.co.ug/ybs/task.php';
const YO_USERNAME = process.env.YO_API_USERNAME || '';
const YO_PASSWORD = process.env.YO_API_PASSWORD || '';
// Some Yo! account tiers require a separate Authorization token; falls back to password
const YO_AUTH     = process.env.YO_AUTHORIZATION || YO_PASSWORD;
// Fixie proxy — routes calls through static IPs whitelisted with Yo! Uganda
const FIXIE_URL   = process.env.FIXIE_URL        || '';

const PROVIDER_CODES: Record<string, string> = {
    MTN:    'MTN_UGANDA',
    AIRTEL: 'AIRTEL_UGANDA',
};

export function normalisePhone(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('256')) return digits;
    if (digits.startsWith('0'))   return '256' + digits.slice(1);
    return '256' + digits;
}

function escapeXml(s: string): string {
    return s
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&apos;');
}

export function xmlValue(xml: string, ...tags: string[]): string {
    for (const tag of tags) {
        const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
        if (m) return m[1].trim();
    }
    return '';
}

function buildDepositXml(params: {
    phone:      string;
    amount:     number;
    txRef:      string;
    narrative:  string;
    webhookUrl: string;
    provider?:  string;
}): string {
    const providerCode = params.provider ? (PROVIDER_CODES[params.provider] ?? '') : '';
    // ProviderReferenceText max 30 chars — Yo! limit
    const providerRef  = `T5G:${params.txRef}`.slice(0, 30);

    const lines: string[] = [
        `<APIUsername>${escapeXml(YO_USERNAME)}</APIUsername>`,
        `<APIPassword>${escapeXml(YO_PASSWORD)}</APIPassword>`,
        ...(YO_AUTH && YO_AUTH !== YO_PASSWORD
            ? [`<Authorization>${escapeXml(YO_AUTH)}</Authorization>`]
            : []),
        `<Method>acdepositfunds</Method>`,
        // NonBlocking=TRUE returns immediately; Yo! calls our webhook when the user approves.
        // Without this the HTTP connection stays open until approval → server timeout.
        `<NonBlocking>TRUE</NonBlocking>`,
        `<Account>${escapeXml(params.phone)}</Account>`,
        `<Amount>${params.amount}</Amount>`,
        `<Currency>UGX</Currency>`,
        `<Narrative>${escapeXml(params.narrative.slice(0, 160))}</Narrative>`,
        `<ExternalReference>${escapeXml(params.txRef.slice(0, 50))}</ExternalReference>`,
        `<DepositNotificationURL>${escapeXml(params.webhookUrl)}</DepositNotificationURL>`,
        `<InstantNotificationURL>${escapeXml(params.webhookUrl)}</InstantNotificationURL>`,
        `<FailureNotificationURL>${escapeXml(params.webhookUrl)}</FailureNotificationURL>`,
        `<ProviderReferenceText>${escapeXml(providerRef)}</ProviderReferenceText>`,
        ...(providerCode ? [`<AccountProviderCode>${escapeXml(providerCode)}</AccountProviderCode>`] : []),
    ];

    return `<?xml version="1.0" encoding="UTF-8"?>\n<AutoCreate><Request>${lines.join('')}</Request></AutoCreate>`;
}

async function callYo(xml: string): Promise<string> {
    const opts = {
        method:  'POST',
        headers: {
            'Content-Type':              'text/xml; charset=UTF-8',
            'Content-transfer-encoding': 'text',
            'Accept':                    'application/xml, text/xml, */*',
        } as Record<string, string>,
        body: xml,
    };

    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15_000);

    try {
        if (FIXIE_URL) {
            const agent = new ProxyAgent({ uri: FIXIE_URL, connectTimeout: 15_000, headersTimeout: 30_000, bodyTimeout: 30_000 });
            const res = await undiciFetch(YO_API_URL, { ...opts, dispatcher: agent, signal: ctrl.signal } as any);
            clearTimeout(timer);
            return res.text();
        }

        const res = await fetch(YO_API_URL, { ...opts, signal: ctrl.signal });
        clearTimeout(timer);
        return res.text();
    } catch (err: any) {
        clearTimeout(timer);
        if (err?.name === 'AbortError') throw new Error('Yo! API timed out after 15s');
        throw err;
    }
}

export interface YoDepositResult {
    accepted:     boolean;
    internalRef:  string;
    txnStatus:    string;
    errorMessage: string;
    statusCode:   string;
}

export interface YoWithdrawResult {
    accepted:     boolean;
    internalRef:  string;
    errorMessage: string;
    statusCode:   string;
}

function buildWithdrawXml(params: {
    phone:    string;
    amount:   number;
    txRef:    string;
    provider?: string;
}): string {
    const providerCode = params.provider ? (PROVIDER_CODES[params.provider] ?? '') : '';
    const providerRef  = `T5G:${params.txRef}`.slice(0, 30);

    const lines: string[] = [
        `<APIUsername>${escapeXml(YO_USERNAME)}</APIUsername>`,
        `<APIPassword>${escapeXml(YO_PASSWORD)}</APIPassword>`,
        ...(YO_AUTH && YO_AUTH !== YO_PASSWORD
            ? [`<Authorization>${escapeXml(YO_AUTH)}</Authorization>`]
            : []),
        `<Method>acwithdrawfunds</Method>`,
        `<Account>${escapeXml(params.phone)}</Account>`,
        `<Amount>${params.amount}</Amount>`,
        `<Currency>UGX</Currency>`,
        `<Narrative>Tera5G Admin Withdrawal</Narrative>`,
        `<ExternalReference>${escapeXml(params.txRef.slice(0, 50))}</ExternalReference>`,
        `<ProviderReferenceText>${escapeXml(providerRef)}</ProviderReferenceText>`,
        ...(providerCode ? [`<AccountProviderCode>${escapeXml(providerCode)}</AccountProviderCode>`] : []),
    ];

    return `<?xml version="1.0" encoding="UTF-8"?>\n<AutoCreate><Request>${lines.join('')}</Request></AutoCreate>`;
}

export async function initiateWithdrawal(params: {
    phone:    string;
    amount:   number;
    provider: string;
}): Promise<YoWithdrawResult> {
    if (!YO_USERNAME || !YO_PASSWORD) {
        throw new Error('Yo! Uganda API credentials not configured.');
    }
    const txRef = `wdl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const xml   = buildWithdrawXml({
        phone:    normalisePhone(params.phone),
        amount:   params.amount,
        txRef,
        provider: params.provider,
    });

    const responseXml = await callYo(xml);
    const autoStatus  = xmlValue(responseXml, 'AutoCreateStatus', 'Status').toUpperCase();
    const statusCode  = xmlValue(responseXml, 'AutoCreateReturnCode', 'StatusCode', 'ReturnCode');
    const internalRef = xmlValue(responseXml, 'InternalReference', 'InternalTransactionId');
    const errorMessage = xmlValue(responseXml, 'StatusMessage', 'ErrorDescription', 'ErrorMessage');

    const accepted = autoStatus === 'OK' || statusCode === '01';
    if (!accepted) console.error('[yo/withdraw] Rejected:', responseXml.slice(0, 500));

    return { accepted, internalRef, errorMessage, statusCode };
}

export async function queryTransaction(txRef: string): Promise<{
    status:      string;
    internalRef: string;
}> {
    if (!YO_USERNAME || !YO_PASSWORD) return { status: 'unknown', internalRef: '' };

    const xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n<AutoCreate><Request>` +
        `<APIUsername>${escapeXml(YO_USERNAME)}</APIUsername>` +
        `<APIPassword>${escapeXml(YO_PASSWORD)}</APIPassword>` +
        (YO_AUTH && YO_AUTH !== YO_PASSWORD ? `<Authorization>${escapeXml(YO_AUTH)}</Authorization>` : '') +
        `<Method>acquerypayment</Method>` +
        `<ExternalReference>${escapeXml(txRef.slice(0, 50))}</ExternalReference>` +
        `</Request></AutoCreate>`;

    try {
        const responseXml = await callYo(xml);
        const txnStatus   = xmlValue(
            responseXml,
            'TransactionStatus', 'YBSTransactionStatus', 'AutoCreateTransactionStatus',
        ).toUpperCase();
        const internalRef = xmlValue(responseXml, 'InternalReference', 'InternalTransactionId');
        console.log(`[yo/query] txRef=${txRef} → ${txnStatus}`);
        return { status: txnStatus, internalRef };
    } catch (e) {
        console.error('[yo/query] Error querying transaction', e);
        return { status: 'unknown', internalRef: '' };
    }
}

export async function initiateDeposit(params: {
    phone:      string;
    amount:     number;
    txRef:      string;
    plan:       string;
    webhookUrl: string;
    provider?:  string;
}): Promise<YoDepositResult> {
    if (!YO_USERNAME || !YO_PASSWORD) {
        throw new Error(
            'Yo! Uganda API credentials not configured. ' +
            'Set YO_API_USERNAME and YO_API_PASSWORD in your .env file.'
        );
    }
    const narrative = params.plan === '5h' ? 'Tera5G: 5 Hour Access' : 'Tera5G: 24 Hour Access';
    const xml = buildDepositXml({
        phone:      normalisePhone(params.phone),
        amount:     params.amount,
        txRef:      params.txRef,
        narrative,
        webhookUrl: params.webhookUrl,
        provider:   params.provider,
    });

    const responseXml  = await callYo(xml);
    const autoStatus   = xmlValue(responseXml, 'AutoCreateStatus', 'Status').toUpperCase();
    const statusCode   = xmlValue(responseXml, 'AutoCreateReturnCode', 'StatusCode', 'ReturnCode');
    const txnStatus    = xmlValue(responseXml, 'TransactionStatus').toUpperCase();
    const internalRef  = xmlValue(responseXml, 'InternalReference', 'InternalTransactionId');
    const errorMessage = xmlValue(responseXml, 'StatusMessage', 'ErrorDescription', 'ErrorMessage');

    const accepted = autoStatus === 'OK' || statusCode === '01' || txnStatus === 'PENDING';
    if (!accepted) console.error('[yo] Rejected:', responseXml.slice(0, 500));

    return { accepted, internalRef, txnStatus: txnStatus || 'PENDING', errorMessage, statusCode };
}
