import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import jwt from '@fastify/jwt';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';

export async function authRoutes(app: FastifyInstance) {
  // Register
  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().optional(),
  });
  app.post('/auth/register', { schema: { body: registerSchema } }, async (req, reply) => {
    const { email, password, name } = req.body as any;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return reply.status(400).send({ error: 'User already exists' });
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, name, passwordHash: hash, role: 'CLIENT' } });
    const accessToken = app.jwt.sign({ sub: user.id, role: user.role }, { expiresIn: '15m' });
    const refreshToken = app.jwt.sign({ sub: user.id }, { expiresIn: '7d' });
    return reply.send({ accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  });

  // Login
  const loginSchema = z.object({ email: z.string().email(), password: z.string() });
  app.post('/auth/login', { schema: { body: loginSchema } }, async (req, reply) => {
    const { email, password } = req.body as any;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return reply.status(400).send({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return reply.status(400).send({ error: 'Invalid credentials' });
    const accessToken = app.jwt.sign({ sub: user.id, role: user.role }, { expiresIn: '15m' });
    const refreshToken = app.jwt.sign({ sub: user.id }, { expiresIn: '7d' });
    return reply.send({ accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  });

  // Refresh token
  const refreshSchema = z.object({ refreshToken: z.string() });
  app.post('/auth/refresh', { schema: { body: refreshSchema } }, async (req, reply) => {
    const { refreshToken } = req.body as any;
    try {
      const payload = app.jwt.verify(refreshToken) as any;
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new Error('User not found');
      const newAccess = app.jwt.sign({ sub: user.id, role: user.role }, { expiresIn: '15m' });
      const newRefresh = app.jwt.sign({ sub: user.id }, { expiresIn: '7d' });
      return reply.send({ accessToken: newAccess, refreshToken: newRefresh });
    } catch (e) {
      return reply.status(401).send({ error: 'Invalid refresh token' });
    }
  });

  // Protected route example
  app.get('/auth/me', { preValidation: [app.authenticate] }, async (req) => {
    const userId = (req.user as any).sub;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return { id: user?.id, email: user?.email, name: user?.name, role: user?.role };
  });
}
