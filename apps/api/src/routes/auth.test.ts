import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as argon2 from 'argon2';
import { buildServer } from '../server';

vi.mock('../lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    refreshToken: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));
vi.mock('../lib/redis', () => ({ redis: {}, enqueueDocJob: vi.fn() }));
vi.mock('../lib/storage', () => ({
  ensureBucket: vi.fn(),
  uploadObject: vi.fn(),
  presignedDownloadUrl: vi.fn(),
  removeObject: vi.fn(),
}));

import { prisma } from '../lib/prisma';

const mockPrisma = vi.mocked(prisma, true);

const demoUser = {
  id: 'user-1',
  email: 'demo@lingobridge.uz',
  fullName: 'Demo Mijoz',
  role: 'CLIENT' as const,
  isActive: true,
  passwordHash: '',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers a new user and returns 201 with the user DTO', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(demoUser);

    const app = buildServer();
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'demo@lingobridge.uz', password: 'demo1234', fullName: 'Demo Mijoz' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      data: { user: { id: 'user-1', email: 'demo@lingobridge.uz', fullName: 'Demo Mijoz', role: 'CLIENT' } },
    });
  });

  it('rejects registration with an existing email as 409 CONFLICT', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(demoUser);

    const app = buildServer();
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'demo@lingobridge.uz', password: 'demo1234', fullName: 'Demo' },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe('CONFLICT');
  });

  it('rejects invalid input as 400 INVALID_INPUT', async () => {
    const app = buildServer();
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'not-an-email', password: 'short', fullName: '' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_INPUT');
  });

  it('logs in with correct credentials and returns tokens', async () => {
    const passwordHash = await argon2.hash('demo1234');
    mockPrisma.user.findUnique.mockResolvedValue({ ...demoUser, passwordHash });
    mockPrisma.refreshToken.create.mockResolvedValue({} as never);
    mockPrisma.auditLog.create.mockResolvedValue({} as never);

    const app = buildServer();
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'demo@lingobridge.uz', password: 'demo1234' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data.accessToken).toBeTruthy();
    expect(body.data.refreshToken).toBeTruthy();
    expect(body.data.user.email).toBe('demo@lingobridge.uz');
    // Refresh token is stored hashed, never in plain text.
    const stored = mockPrisma.refreshToken.create.mock.calls[0][0].data;
    expect(stored.tokenHash).not.toBe(body.data.refreshToken);
  });

  it('rejects a wrong password as 401 without revealing which field failed', async () => {
    const passwordHash = await argon2.hash('demo1234');
    mockPrisma.user.findUnique.mockResolvedValue({ ...demoUser, passwordHash });

    const app = buildServer();
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'demo@lingobridge.uz', password: 'wrong-password' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('UNAUTHORIZED');
  });

  it('requires a token for /me', async () => {
    const app = buildServer();
    const response = await app.inject({ method: 'GET', url: '/api/auth/me' });

    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('UNAUTHORIZED');
  });
});
