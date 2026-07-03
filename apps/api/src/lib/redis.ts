import { Redis } from 'ioredis';
import type { WorkerJobPayload } from 'shared';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3, lazyConnect: true });

const DOC_JOBS_QUEUE = 'doc-jobs';

/** Enqueue a document translation job for the Python doc-worker (docs/04 §8). */
export async function enqueueDocJob(payload: WorkerJobPayload): Promise<void> {
  await redis.rpush(DOC_JOBS_QUEUE, JSON.stringify(payload));
}
