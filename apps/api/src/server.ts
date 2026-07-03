// Composition root: plugins + route modules. Business logic lives in routes/ and lib/.
import fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { env } from './lib/env';
import { AppError } from './lib/errors';
import { ensureBucket } from './lib/storage';
import authPlugin from './plugins/auth';
import authRoutes from './routes/auth';
import translateRoutes from './routes/translate';
import materialsRoutes from './routes/materials';
import documentsRoutes from './routes/documents';
import historyRoutes from './routes/history';
import adminRoutes from './routes/admin';

export function buildServer() {
  const app = fastify({
    logger: {
      // Never log credentials or tokens (CLAUDE.md golden rule 2).
      redact: ['req.headers.authorization', 'req.headers["x-worker-token"]'],
    },
    bodyLimit: 1024 * 1024, // JSON bodies; file uploads go through multipart limits
  });

  app.register(cors, { origin: env.WEB_ORIGIN });
  app.register(jwt, { secret: env.JWT_ACCESS_SECRET });
  app.register(multipart, { limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 } });
  app.register(rateLimit, {
    global: false,
    hook: 'preHandler', // after JWT verification, so AI limits are per-user
    keyGenerator: (request) => request.user?.sub ?? request.ip,
  });

  app.register(authPlugin);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(error.toBody());
    }
    if (error.statusCode === 429) {
      return reply.status(429).send({ error: { code: 'RATE_LIMITED', message: "So'rovlar soni cheklovdan oshdi" } });
    }
    if (error.code === 'FST_REQ_FILE_TOO_LARGE') {
      return reply.status(413).send({ error: { code: 'FILE_TOO_LARGE', message: `Fayl hajmi ${env.MAX_UPLOAD_MB}MB dan oshmasligi kerak` } });
    }
    // No stack traces or internals to clients.
    request.log.error(error);
    return reply.status(500).send({ error: { code: 'INTERNAL', message: 'Serverda xatolik yuz berdi' } });
  });

  app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(translateRoutes, { prefix: '/api/translate' });
  app.register(materialsRoutes, { prefix: '/api/materials' });
  app.register(documentsRoutes, { prefix: '/api/documents' });
  app.register(historyRoutes, { prefix: '/api/history' });
  app.register(adminRoutes, { prefix: '/api/admin' });

  return app;
}

async function start(): Promise<void> {
  const app = buildServer();
  try {
    await ensureBucket();
  } catch (error) {
    app.log.warn({ err: error }, 'MinIO not reachable — document uploads will fail until it is up');
  }
  try {
    await app.listen({ port: env.API_PORT, host: '0.0.0.0' });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  void start();
}
