import fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { z } from 'zod';

const server = fastify({ logger: true });
const prisma = new PrismaClient();

server.register(cors, { origin: '*' });
server.register(jwt, { secret: process.env.JWT_SECRET || 'supersecret' });
server.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string()
});

server.post('/api/auth/register', async (request, reply) => {
  const parsed = registerSchema.safeParse(request.body);
  if (!parsed.success) return reply.status(400).send({ error: { code: 'INVALID_INPUT', message: parsed.error.issues } });
  
  const { email, password, fullName } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return reply.status(409).send({ error: { code: 'CONFLICT', message: 'Email in use' } });

  const hash = await argon2.hash(password);
  const user = await prisma.user.create({
    data: { email, password: hash, name: fullName }
  });

  return reply.status(201).send({ data: { user: { id: user.id, email: user.email, fullName: user.name, role: user.role } } });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string() });

server.post('/api/auth/login', async (request, reply) => {
  const parsed = loginSchema.safeParse(request.body);
  if (!parsed.success) return reply.status(400).send({ error: { code: 'INVALID_INPUT', message: parsed.error.issues } });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || !(await argon2.verify(user.password, password))) {
    return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
  }

  const accessToken = server.jwt.sign({ id: user.id, email: user.email, role: user.role }, { expiresIn: '15m' });
  const refreshToken = server.jwt.sign({ id: user.id }, { expiresIn: '30d' });

  return { data: { accessToken, refreshToken, user: { id: user.id, email: user.email, fullName: user.name, role: user.role } } };
});

import { AIClient } from './lib/ai';
const ai = new AIClient(process.env.ANTHROPIC_API_KEY || '');

server.post('/api/translate', async (request, reply) => {
  const schema = z.object({ text: z.string(), fromLang: z.string().nullable(), toLang: z.string(), academic: z.boolean().optional() });
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) return reply.status(400).send({ error: { code: 'INVALID_INPUT', message: 'Invalid payload' } });
  
  const { text, fromLang, toLang, academic } = parsed.data;
  const prompt = `Translate the following text from ${fromLang || 'auto-detect'} to ${toLang}. ${academic ? 'Use academic terminology.' : ''}\n\nText: ${text}`;
  
  try {
    const translatedText = await ai.invokeWithRetry(prompt);
    return { data: { id: 'mock-id', resultText: translatedText, detectedLang: fromLang || 'EN' } };
  } catch (err) {
    return reply.status(500).send({ error: { code: 'INTERNAL', message: 'Translation failed' } });
  }
});

server.post('/api/documents', async (request, reply) => {
  const parts = request.files();
  let uploaded = 0;
  for await (const part of parts) {
    // mock save to MinIO
    uploaded++;
  }
  return reply.status(202).send({ data: { jobId: 'job-' + Date.now(), status: 'QUEUED', files: [{ id: 'mock', originalName: 'doc', sizeBytes: 100 }] } });
});

server.get('/api/documents/:id', async (request, reply) => {
  return { data: { id: (request.params as any).id, status: 'DONE', docType: 'DIPLOMA', fromLang: 'UZ', toLang: 'EN', notarize: false, files: [], completedAt: new Date().toISOString() } };
});

server.put('/api/documents/:id/status', async (request, reply) => {
  const schema = z.object({ status: z.string() });
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) return reply.status(400).send({ error: { code: 'INVALID_INPUT', message: 'Invalid payload' } });
  
  // Mock DB update, in real life we use prisma.job.update({ where: { id }, data: { status } })
  const { id } = request.params as any;
  request.log.info(`Job ${id} status updated to ${parsed.data.status}`);
  return { data: { id, status: parsed.data.status } };
});

server.post('/api/materials', async (request, reply) => {
  const schema = z.object({ subject: z.string(), topic: z.string(), level: z.string(), type: z.string(), outputLang: z.string(), notes: z.string().optional() });
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) return reply.status(400).send({ error: { code: 'INVALID_INPUT', message: 'Invalid payload' } });
  
  const { subject, topic, level, type, outputLang, notes } = parsed.data;
  const prompt = `Generate a ${type} for ${subject} about ${topic} at ${level} level. Output language: ${outputLang}. Additional notes: ${notes || 'none'}`;
  
  try {
    const content = await ai.invokeWithRetry(prompt);
    return reply.status(201).send({ data: { id: 'mat-' + Date.now(), content } });
  } catch (err) {
    return reply.status(500).send({ error: { code: 'INTERNAL', message: 'Material generation failed' } });
  }
});

server.get('/api/history', async (request, reply) => {
  // Mock history data since we don't have a fully seeded DB yet
  const items = [
    { type: 'quick', id: '1', summary: 'EN→UZ: The hypothesis...', createdAt: new Date().toISOString() },
    { type: 'material', id: '2', summary: 'Ingliz tili / Present Perfect / B1', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { type: 'document', id: '3', summary: 'Diplom UZ→EN', status: 'DONE', createdAt: new Date(Date.now() - 86400000).toISOString() }
  ];
  return { data: { items, total: items.length, page: 1, limit: 20 } };
});

server.post('/api/documents/:id/verify', async (request, reply) => {
  const schema = z.object({ resultFileId: z.string().optional(), note: z.string().optional() });
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) return reply.status(400).send({ error: { code: 'INVALID_INPUT', message: 'Invalid payload' } });
  
  const { id } = request.params as any;
  // Mock update job to DONE
  return { data: { id, status: 'DONE', verifiedAt: new Date().toISOString() } };
});

server.get('/api/admin/stats', async (request, reply) => {
  // Mock admin stats
  return { data: { users: 150, jobsCompleted: 45, revenue: 1200000 } };
});

// Phase 4: File Cleanup Cron Job
// Deletes documents older than 30 days
const setupCleanupCron = () => {
  setInterval(() => {
    server.log.info('Running document cleanup cron job...');
    // Real logic: prisma.document.deleteMany({ where: { createdAt: { lt: thirtyDaysAgo } } })
    // Real logic: s3_client.remove_object(...)
  }, 24 * 60 * 60 * 1000); // Run daily
};

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log(`Server running at http://localhost:3000/`);
    setupCleanupCron();
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
