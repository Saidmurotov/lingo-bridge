// Auth endpoints per docs/04 §2. Passwords: argon2. Refresh tokens: opaque,
// stored only as SHA-256 hashes (docs/03), rotated on every refresh.
import { createHash, randomBytes } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import * as argon2 from 'argon2';
import { z } from 'zod';
import type { UserDto } from 'shared';
import { prisma } from '../lib/prisma';
import { env } from '../lib/env';
import { AppError } from '../lib/errors';
import { validate } from '../lib/validate';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({ refreshToken: z.string().min(1) });

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function toUserDto(user: { id: string; email: string; fullName: string; role: UserDto['role'] }): UserDto {
  return { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
}

async function issueRefreshToken(userId: string): Promise<string> {
  const token = randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });
  return token;
}

export default async function authRoutes(app: FastifyInstance): Promise<void> {
  // Stricter per-IP limits against brute force (docs/04 §9).
  const authRateLimit = { rateLimit: { max: 10, timeWindow: '1 minute' } };

  app.post('/register', { config: authRateLimit }, async (request, reply) => {
    const { email, password, fullName } = validate(registerSchema, request.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('CONFLICT', 'Bu email allaqachon band');

    const passwordHash = await argon2.hash(password);
    const user = await prisma.user.create({ data: { email, passwordHash, fullName } });

    return reply.status(201).send({ data: { user: toUserDto(user) } });
  });

  app.post('/login', { config: authRateLimit }, async (request) => {
    const { email, password } = validate(loginSchema, request.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive || !(await argon2.verify(user.passwordHash, password))) {
      throw new AppError('UNAUTHORIZED', "Email yoki parol noto'g'ri");
    }

    const accessToken = app.jwt.sign(
      { sub: user.id, role: user.role },
      { expiresIn: env.ACCESS_TOKEN_TTL },
    );
    const refreshToken = await issueRefreshToken(user.id);

    await prisma.auditLog.create({
      data: { userId: user.id, action: 'auth.login' },
    });

    return { data: { accessToken, refreshToken, user: toUserDto(user) } };
  });

  app.post('/refresh', { config: authRateLimit }, async (request) => {
    const { refreshToken } = validate(refreshSchema, request.body);

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      include: { user: true },
    });
    if (!stored || stored.revoked || stored.expiresAt < new Date() || !stored.user.isActive) {
      throw new AppError('UNAUTHORIZED', 'Refresh token yaroqsiz');
    }

    // Rotation: the old token can never be used again.
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    const newRefresh = await issueRefreshToken(stored.userId);
    const accessToken = app.jwt.sign(
      { sub: stored.userId, role: stored.user.role },
      { expiresIn: env.ACCESS_TOKEN_TTL },
    );

    return { data: { accessToken, refreshToken: newRefresh } };
  });

  app.post('/logout', async (request, reply) => {
    const { refreshToken } = validate(refreshSchema, request.body);
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken) },
      data: { revoked: true },
    });
    return reply.status(204).send();
  });

  app.get('/me', { preValidation: [app.authenticate] }, async (request) => {
    const user = await prisma.user.findUnique({ where: { id: request.user.sub } });
    if (!user) throw new AppError('NOT_FOUND', 'Foydalanuvchi topilmadi');
    return {
      data: { ...toUserDto(user), createdAt: user.createdAt.toISOString() },
    };
  });
}
