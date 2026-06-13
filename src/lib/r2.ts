import { S3Client } from '@aws-sdk/client-s3';

let _r2Client: S3Client | null = null;

/**
 * Lazy-initialized R2 client. Throws on first use if env vars are missing,
 * rather than at import time (which would crash the entire app).
 */
export function getR2Client(): S3Client {
  if (_r2Client) return _r2Client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      '[R2] Missing required environment variables. Ensure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are set.'
    );
  }

  _r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return _r2Client;
}

// Keep backward-compatible named export (lazy proxy)
// Usage: import { r2Client } from '@/lib/r2' still works, but will throw on first .send() if env is missing
export const r2Client = new Proxy({} as S3Client, {
  get(_target, prop) {
    const client = getR2Client();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
