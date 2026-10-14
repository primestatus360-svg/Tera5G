import crypto from 'crypto';

const AES_KEY_HEX = process.env.CONFIG_AES_KEY ?? '';

function getKey(): Buffer {
    if (AES_KEY_HEX.length !== 64) throw new Error('CONFIG_AES_KEY must be 64 hex chars (32 bytes)');
    return Buffer.from(AES_KEY_HEX, 'hex');
}

export function encryptConfig(plainJson: string): { iv: string; tag: string; data: string } {
    const key    = getKey();
    const iv     = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const enc    = Buffer.concat([cipher.update(plainJson, 'utf8'), cipher.final()]);
    const tag    = cipher.getAuthTag();
    return {
        iv:   iv.toString('base64'),
        tag:  tag.toString('base64'),
        data: enc.toString('base64')
    };
}

export function decryptConfig(payload: { iv: string; tag: string; data: string }): string {
    const key     = getKey();
    const iv      = Buffer.from(payload.iv, 'base64');
    const tag     = Buffer.from(payload.tag, 'base64');
    const data    = Buffer.from(payload.data, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
