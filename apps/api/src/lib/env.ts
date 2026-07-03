import { z } from 'zod';

// Fail fast on missing secrets — no insecure fallbacks (docs/07 §1, §6).
const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  API_PORT: z.coerce.number().default(3000),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be a strong random string'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),

  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-6'),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET: z.string().default('lingo-files'),
  S3_REGION: z.string().default('us-east-1'),

  MAX_UPLOAD_MB: z.coerce.number().default(20),

  // Shared secret for doc-worker → api status callbacks.
  WORKER_TOKEN: z.string().min(16, 'WORKER_TOKEN must be a strong random string'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n  ');
    // eslint-disable-next-line no-console
    console.error(`Invalid environment configuration:\n  ${missing}`);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
