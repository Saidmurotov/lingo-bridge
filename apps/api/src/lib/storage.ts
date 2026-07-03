import { Client } from 'minio';
import { env } from './env';

const endpoint = new URL(env.S3_ENDPOINT);

export const minio = new Client({
  endPoint: endpoint.hostname,
  port: endpoint.port ? Number(endpoint.port) : endpoint.protocol === 'https:' ? 443 : 80,
  useSSL: endpoint.protocol === 'https:',
  accessKey: env.S3_ACCESS_KEY,
  secretKey: env.S3_SECRET_KEY,
  region: env.S3_REGION,
});

export const BUCKET = env.S3_BUCKET;

export async function ensureBucket(): Promise<void> {
  const exists = await minio.bucketExists(BUCKET);
  if (!exists) await minio.makeBucket(BUCKET, env.S3_REGION);
}

export async function uploadObject(key: string, data: Buffer, mimeType: string): Promise<void> {
  await minio.putObject(BUCKET, key, data, data.length, { 'Content-Type': mimeType });
}

/** Short-lived download URL; ownership is checked in the route before calling this. */
export async function presignedDownloadUrl(key: string, expirySeconds = 600): Promise<string> {
  return minio.presignedGetObject(BUCKET, key, expirySeconds);
}

export async function removeObject(key: string): Promise<void> {
  await minio.removeObject(BUCKET, key);
}
