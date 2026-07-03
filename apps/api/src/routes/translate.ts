// Quick translate per docs/04 §3: synchronous Claude call + history row.
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { quickTranslate } from '../lib/ai';
import { validate } from '../lib/validate';

const translateSchema = z.object({
  text: z.string().min(1).max(10_000),
  fromLang: z.enum(['UZ', 'EN', 'RU']).nullable().optional().default(null),
  toLang: z.enum(['UZ', 'EN', 'RU']),
  academic: z.boolean().optional().default(false),
});

export default async function translateRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/',
    {
      preValidation: [app.authenticate],
      // Per-user limit to keep Anthropic spend bounded (docs/04 §9).
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (request) => {
      const input = validate(translateSchema, request.body);

      const result = await quickTranslate({
        text: input.text,
        fromLang: input.fromLang,
        toLang: input.toLang,
        academic: input.academic,
      });

      const record = await prisma.quickTranslation.create({
        data: {
          userId: request.user.sub,
          fromLang: input.fromLang ?? result.detectedLang ?? null,
          toLang: input.toLang,
          sourceText: input.text,
          resultText: result.resultText,
          academic: input.academic,
        },
      });

      return {
        data: {
          id: record.id,
          resultText: result.resultText,
          detectedLang: result.detectedLang,
        },
      };
    },
  );
}
