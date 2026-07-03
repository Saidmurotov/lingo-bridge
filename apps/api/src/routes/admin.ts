// Admin panel data (Phase 3). ADMIN role only.
import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';

export default async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.get('/stats', { preValidation: [app.requireRole('ADMIN')] }, async () => {
    const [users, jobsCompleted, quickTranslations, materials] = await Promise.all([
      prisma.user.count(),
      prisma.translationJob.count({ where: { status: 'DONE' } }),
      prisma.quickTranslation.count(),
      prisma.material.count(),
    ]);

    return { data: { users, jobsCompleted, quickTranslations, materials } };
  });
}
