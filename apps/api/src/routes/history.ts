// Unified history per docs/04 §7: quick translations + materials + document jobs.
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { HistoryItem } from 'shared';
import { prisma } from '../lib/prisma';
import { validate } from '../lib/validate';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['quick', 'material', 'document']).optional(),
});

const DOC_TYPE_LABEL: Record<string, string> = {
  DIPLOMA: 'Diplom',
  TRANSCRIPT: 'Transkript',
  CERTIFICATE: 'Sertifikat',
  DISSERTATION: 'Dissertatsiya',
  OTHER: 'Hujjat',
};

function truncate(text: string, max = 60): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default async function historyRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', { preValidation: [app.authenticate] }, async (request) => {
    const { page, limit, type } = validate(querySchema, request.query);
    const userId = request.user.sub;

    const wantQuick = !type || type === 'quick';
    const wantMaterial = !type || type === 'material';
    const wantDocument = !type || type === 'document';

    // True totals come from count(); the row queries below only fetch the
    // window being paginated, so merged.length must not be used as the total.
    const [quickTotal, materialTotal, jobTotal] = await Promise.all([
      wantQuick ? prisma.quickTranslation.count({ where: { userId } }) : 0,
      wantMaterial ? prisma.material.count({ where: { userId } }) : 0,
      wantDocument ? prisma.translationJob.count({ where: { userId } }) : 0,
    ]);

    const [quick, materials, jobs] = await Promise.all([
      wantQuick
        ? prisma.quickTranslation.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: page * limit,
            // sourceText can be 10k chars; the summary only needs the first 60.
            select: { id: true, fromLang: true, toLang: true, sourceText: true, createdAt: true },
          })
        : [],
      wantMaterial
        ? prisma.material.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: page * limit,
            select: { id: true, subject: true, topic: true, level: true, createdAt: true },
          })
        : [],
      wantDocument
        ? prisma.translationJob.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: page * limit,
            select: { id: true, docType: true, fromLang: true, toLang: true, status: true, createdAt: true },
          })
        : [],
    ]);

    const merged: HistoryItem[] = [
      ...quick.map((q): HistoryItem => ({
        type: 'quick',
        id: q.id,
        summary: `${q.fromLang ?? '?'}→${q.toLang}: ${truncate(q.sourceText)}`,
        createdAt: q.createdAt.toISOString(),
      })),
      ...materials.map((m): HistoryItem => ({
        type: 'material',
        id: m.id,
        summary: `${m.subject} / ${m.topic} / ${m.level}`,
        createdAt: m.createdAt.toISOString(),
      })),
      ...jobs.map((j): HistoryItem => ({
        type: 'document',
        id: j.id,
        summary: `${DOC_TYPE_LABEL[j.docType] ?? j.docType} ${j.fromLang}→${j.toLang}`,
        status: j.status,
        createdAt: j.createdAt.toISOString(),
      })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const total = quickTotal + materialTotal + jobTotal;
    const items = merged.slice((page - 1) * limit, page * limit);

    return { data: { items, total, page, limit } };
  });
}
