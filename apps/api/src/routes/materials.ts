// Learning materials per docs/04 §4. Content is stored in Postgres (docs/03 Material.content).
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { generateMaterial } from '../lib/ai';
import { AppError } from '../lib/errors';
import { validate } from '../lib/validate';

const createSchema = z.object({
  subject: z.string().min(1).max(200),
  topic: z.string().min(1).max(200),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  type: z.enum(['LESSON_PLAN', 'EXERCISES', 'PRESENTATION', 'READING', 'TEST', 'VOCABULARY']),
  outputLang: z.enum(['UZ', 'EN', 'RU']),
  notes: z.string().max(2000).optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export default async function materialsRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/',
    {
      preValidation: [app.authenticate],
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const input = validate(createSchema, request.body);

      const content = await generateMaterial(input);

      const material = await prisma.material.create({
        data: { userId: request.user.sub, ...input, content },
      });

      return reply.status(201).send({ data: { id: material.id, content } });
    },
  );

  app.get('/', { preValidation: [app.authenticate] }, async (request) => {
    const { page, limit } = validate(listQuerySchema, request.query);
    const where = { userId: request.user.sub };

    const [items, total] = await Promise.all([
      prisma.material.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          subject: true,
          topic: true,
          level: true,
          type: true,
          outputLang: true,
          createdAt: true,
        },
      }),
      prisma.material.count({ where }),
    ]);

    return { data: { items, total, page, limit } };
  });

  app.get('/:id', { preValidation: [app.authenticate] }, async (request) => {
    const { id } = validate(z.object({ id: z.string() }), request.params);

    const material = await prisma.material.findUnique({ where: { id } });
    if (!material) throw new AppError('NOT_FOUND', 'Material topilmadi');
    if (material.userId !== request.user.sub) throw new AppError('FORBIDDEN', 'Ruxsat yetarli emas');

    return { data: material };
  });
}
