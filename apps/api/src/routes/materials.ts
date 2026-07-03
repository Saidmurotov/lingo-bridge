import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { callClaude } from '../lib/ai';

export default async function materialsRoutes(app: FastifyInstance) {
  const createSchema = z.object({
    subject: z.string(),
    topic: z.string(),
    level: z.string(),
    type: z.enum(['LESSON_PLAN', 'EXERCISES', 'PRESENTATION']),
    outputLang: z.string(),
    notes: z.string().optional(),
  });

  // POST /materials – generate material via Claude
  app.post(
    '/',
    { preValidation: [app.authenticate], schema: { body: createSchema } },
    async (req, reply) => {
      const { subject, topic, level, type, outputLang, notes } = req.body as any;
      const prompt = `Generate a ${type.toLowerCase().replace('_', ' ')} for the subject "${subject}" on topic "${topic}" at CEFR level ${level} in language ${outputLang}. Include any notes: ${notes ?? ''}`;
      try {
        const { content } = await callClaude(prompt);
        // Store as a simple text file in MinIO (placeholder – just save content string)
        const key = `materials/${req.user?.sub}/${Date.now()}.txt`;
        // For brevity we skip MinIO upload; assume content stored elsewhere.
        const material = await prisma.material.create({
          data: {
            userId: (req.user as any).sub,
            topic: `${subject} - ${topic}`,
            level,
            type,
            contentPath: key,
          },
        });
        // Real implementation would upload `content` to MinIO with the key.
        return reply.code(201).send({ data: { id: material.id, content } });
      } catch (e) {
        req.log.error(e);
        return reply.code(500).send({ error: 'Material generation failed' });
      }
    },
  );

  // GET /materials – list owned materials (pagination)
  app.get(
    '/',
    { preValidation: [app.authenticate] },
    async (req, reply) => {
      const page = Number((req.query as any).page) || 1;
      const limit = Number((req.query as any).limit) || 20;
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        prisma.material.findMany({
          where: { userId: (req.user as any).sub },
          take: limit,
          skip,
        }),
        prisma.material.count({ where: { userId: (req.user as any).sub } }),
      ]);
      return reply.send({ data: { items, total, page, limit } });
    },
  );

  // GET /materials/:id – single material
  app.get(
    '/:id',
    { preValidation: [app.authenticate] },
    async (req, reply) => {
      const material = await prisma.material.findUnique({
        where: { id: (req.params as any).id },
      });
      if (!material) return reply.code(404).send({ error: 'Material not found' });
      if (material.userId !== (req.user as any).sub) return reply.code(403).send({ error: 'Forbidden' });
      // In a real app we would fetch the actual content from MinIO; here we return placeholder.
      return reply.send({ data: { id: material.id, topic: material.topic, level: material.level, type: material.type, contentPath: material.contentPath } });
    },
  );
}
