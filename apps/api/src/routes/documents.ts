// Document translation per docs/04 §5: multipart upload → MinIO → TranslationJob
// → Redis queue (docs/04 §8). The Python doc-worker reports back via PUT /:id/status.
import { timingSafeEqual } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { JobStatus, Role, WorkerJobPayload } from 'shared';
import { prisma } from '../lib/prisma';
import { enqueueDocJob } from '../lib/redis';
import { presignedDownloadUrl, uploadObject } from '../lib/storage';
import { env } from '../lib/env';
import { AppError } from '../lib/errors';
import { validate } from '../lib/validate';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]);
const MAX_FILES_PER_JOB = 10;

const optionsSchema = z.object({
  docType: z.enum(['DIPLOMA', 'TRANSCRIPT', 'CERTIFICATE', 'DISSERTATION', 'OTHER']),
  fromLang: z.enum(['UZ', 'EN', 'RU']),
  toLang: z.enum(['UZ', 'EN', 'RU']),
  notarize: z.coerce.boolean().default(false),
  keepFormat: z.coerce.boolean().default(true),
  urgent: z.coerce.boolean().default(false),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['QUEUED', 'PROCESSING', 'REVIEW', 'DONE', 'FAILED']).optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum(['QUEUED', 'PROCESSING', 'REVIEW', 'DONE', 'FAILED']),
  errorMessage: z.string().max(2000).optional(),
  resultFiles: z
    .array(
      z.object({
        storageKey: z.string().min(1),
        originalName: z.string().min(1),
        mimeType: z.string().min(1),
        sizeBytes: z.number().int().min(0),
      }),
    )
    .optional(),
});

interface UploadedFile {
  originalName: string;
  mimeType: string;
  data: Buffer;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.-]+/g, '_').slice(0, 120) || 'file';
}

function canReadJob(user: { sub: string; role: Role }, job: { userId: string }): boolean {
  return job.userId === user.sub || user.role === 'TRANSLATOR' || user.role === 'ADMIN';
}

/** Constant-time comparison so the worker token can't be probed byte-by-byte. */
function isValidWorkerToken(header: unknown): boolean {
  if (typeof header !== 'string') return false;
  const provided = Buffer.from(header);
  const expected = Buffer.from(env.WORKER_TOKEN);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

async function readMultipart(request: FastifyRequest): Promise<{ fields: Record<string, string>; files: UploadedFile[] }> {
  const fields: Record<string, string> = {};
  const files: UploadedFile[] = [];

  try {
    for await (const part of request.parts()) {
      if (part.type === 'file') {
        if (files.length >= MAX_FILES_PER_JOB) {
          throw new AppError('INVALID_INPUT', `Ko'pi bilan ${MAX_FILES_PER_JOB} ta fayl yuklash mumkin`);
        }
        if (!ALLOWED_MIME_TYPES.has(part.mimetype)) {
          throw new AppError('UNSUPPORTED_MEDIA', 'Faqat PDF, DOCX, JPG yoki PNG qabul qilinadi');
        }
        files.push({
          originalName: part.filename ?? 'file',
          mimeType: part.mimetype,
          data: await part.toBuffer(),
        });
      } else {
        fields[part.fieldname] = String(part.value);
      }
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    // @fastify/multipart raises FST_REQ_FILE_TOO_LARGE when the plugin limit is hit.
    if ((error as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE') {
      throw new AppError('FILE_TOO_LARGE', `Fayl hajmi ${env.MAX_UPLOAD_MB}MB dan oshmasligi kerak`);
    }
    throw error;
  }

  return { fields, files };
}

export default async function documentsRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/',
    {
      preValidation: [app.authenticate],
      // Uploads are buffered in memory (up to MAX_UPLOAD_MB × 10 files), so
      // keep the per-user request rate low to bound memory use.
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const { fields, files } = await readMultipart(request);
      if (files.length === 0) throw new AppError('INVALID_INPUT', 'Kamida bitta fayl yuklang');
      const options = validate(optionsSchema, fields);

      const job = await prisma.translationJob.create({
        data: { userId: request.user.sub, ...options },
      });

      try {
        const sourceFiles: WorkerJobPayload['sourceFiles'] = [];
        const fileDtos: Array<{ id: string; originalName: string; sizeBytes: number }> = [];

        for (const [index, file] of files.entries()) {
          const storageKey = `jobs/${job.id}/source/${index}_${sanitizeFileName(file.originalName)}`;
          await uploadObject(storageKey, file.data, file.mimeType);
          const record = await prisma.jobFile.create({
            data: {
              jobId: job.id,
              kind: 'source',
              originalName: file.originalName,
              storageKey,
              mimeType: file.mimeType,
              sizeBytes: file.data.length,
            },
          });
          sourceFiles.push({ fileId: record.id, storageKey, mimeType: file.mimeType });
          fileDtos.push({ id: record.id, originalName: record.originalName, sizeBytes: record.sizeBytes });
        }

        await enqueueDocJob({
          jobId: job.id,
          docType: options.docType,
          fromLang: options.fromLang,
          toLang: options.toLang,
          notarize: options.notarize,
          keepFormat: options.keepFormat,
          sourceFiles,
        });

        await prisma.auditLog.create({
          data: { userId: request.user.sub, action: 'job.create', entityType: 'TranslationJob', entityId: job.id },
        });

        return reply.status(202).send({ data: { jobId: job.id, status: job.status, files: fileDtos } });
      } catch (error) {
        await prisma.translationJob.update({
          where: { id: job.id },
          data: { status: 'FAILED', errorMessage: 'Upload or enqueue failed' },
        });
        throw error;
      }
    },
  );

  app.get('/', { preValidation: [app.authenticate] }, async (request) => {
    const { page, limit, status } = validate(listQuerySchema, request.query);

    // Clients see their own jobs; translators/admins reviewing notarized work
    // may list REVIEW jobs across users (Phase 3 flow).
    const isReviewer = request.user.role === 'TRANSLATOR' || request.user.role === 'ADMIN';
    const where =
      isReviewer && status === 'REVIEW'
        ? { status: 'REVIEW' as JobStatus }
        : { userId: request.user.sub, ...(status ? { status } : {}) };

    const [items, total] = await Promise.all([
      prisma.translationJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { files: { select: { id: true, kind: true, originalName: true, sizeBytes: true } } },
      }),
      prisma.translationJob.count({ where }),
    ]);

    return { data: { items, total, page, limit } };
  });

  app.get('/:id', { preValidation: [app.authenticate] }, async (request) => {
    const { id } = validate(z.object({ id: z.string() }), request.params);

    const job = await prisma.translationJob.findUnique({
      where: { id },
      include: { files: { select: { id: true, kind: true, originalName: true, sizeBytes: true } } },
    });
    if (!job) throw new AppError('NOT_FOUND', 'Buyurtma topilmadi');
    if (!canReadJob(request.user, job)) throw new AppError('FORBIDDEN', 'Ruxsat yetarli emas');

    return {
      data: {
        id: job.id,
        status: job.status,
        docType: job.docType,
        fromLang: job.fromLang,
        toLang: job.toLang,
        notarize: job.notarize,
        errorMessage: job.errorMessage,
        files: job.files,
        createdAt: job.createdAt.toISOString(),
        completedAt: job.completedAt?.toISOString() ?? null,
      },
    };
  });

  app.get('/:id/files/:fileId/download', { preValidation: [app.authenticate] }, async (request) => {
    const { id, fileId } = validate(z.object({ id: z.string(), fileId: z.string() }), request.params);

    const file = await prisma.jobFile.findUnique({ where: { id: fileId }, include: { job: true } });
    if (!file || file.jobId !== id) throw new AppError('NOT_FOUND', 'Fayl topilmadi');
    if (!canReadJob(request.user, file.job)) throw new AppError('FORBIDDEN', 'Ruxsat yetarli emas');

    const url = await presignedDownloadUrl(file.storageKey);
    return { data: { url } };
  });

  // Worker callback — authenticated via shared WORKER_TOKEN, not user JWT.
  app.put('/:id/status', async (request) => {
    if (!isValidWorkerToken(request.headers['x-worker-token'])) {
      throw new AppError('UNAUTHORIZED', 'Invalid worker token');
    }
    const { id } = validate(z.object({ id: z.string() }), request.params);
    const update = validate(statusUpdateSchema, request.body);

    const job = await prisma.translationJob.findUnique({ where: { id } });
    if (!job) throw new AppError('NOT_FOUND', 'Job not found');

    if (update.resultFiles && update.resultFiles.length > 0) {
      await prisma.jobFile.createMany({
        data: update.resultFiles.map((f) => ({ jobId: id, kind: 'result', ...f })),
      });
    }

    const finished = update.status === 'DONE' || update.status === 'FAILED';
    await prisma.translationJob.update({
      where: { id },
      data: {
        status: update.status,
        errorMessage: update.errorMessage ?? null,
        ...(finished ? { completedAt: new Date() } : {}),
      },
    });

    return { data: { id, status: update.status } };
  });

  // Phase 3: translator confirms a notarized job's reviewed result.
  app.post(
    '/:id/verify',
    { preValidation: [app.requireRole('TRANSLATOR', 'ADMIN')] },
    async (request) => {
      const { id } = validate(z.object({ id: z.string() }), request.params);
      validate(z.object({ resultFileId: z.string().optional(), note: z.string().max(1000).optional() }), request.body ?? {});

      const job = await prisma.translationJob.findUnique({ where: { id } });
      if (!job) throw new AppError('NOT_FOUND', 'Buyurtma topilmadi');
      if (job.status !== 'REVIEW') throw new AppError('CONFLICT', 'Buyurtma tekshiruv holatida emas');

      await prisma.translationJob.update({
        where: { id },
        data: { status: 'DONE', reviewerId: request.user.sub, completedAt: new Date() },
      });
      await prisma.auditLog.create({
        data: { userId: request.user.sub, action: 'job.verify', entityType: 'TranslationJob', entityId: id },
      });

      return { data: { status: 'DONE' } };
    },
  );
}
