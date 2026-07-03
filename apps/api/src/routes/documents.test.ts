import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildServer } from '../server';

vi.mock('../lib/prisma', () => ({
  prisma: {
    translationJob: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), update: vi.fn() },
    jobFile: { create: vi.fn(), createMany: vi.fn(), findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));
vi.mock('../lib/redis', () => ({ redis: {}, enqueueDocJob: vi.fn() }));
vi.mock('../lib/storage', () => ({
  ensureBucket: vi.fn(),
  uploadObject: vi.fn(),
  presignedDownloadUrl: vi.fn().mockResolvedValue('https://minio.local/signed'),
  removeObject: vi.fn(),
}));

import { prisma } from '../lib/prisma';

const mockPrisma = vi.mocked(prisma, true);

const baseJob = {
  id: 'job-1',
  userId: 'user-1',
  docType: 'DIPLOMA' as const,
  fromLang: 'UZ' as const,
  toLang: 'EN' as const,
  notarize: true,
  keepFormat: true,
  urgent: false,
  status: 'REVIEW' as const,
  errorMessage: null,
  reviewerId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: null,
};

describe('job status transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects worker status callbacks without the worker token', async () => {
    const app = buildServer();
    const response = await app.inject({
      method: 'PUT',
      url: '/api/documents/job-1/status',
      payload: { status: 'DONE' },
    });

    expect(response.statusCode).toBe(401);
    expect(mockPrisma.translationJob.update).not.toHaveBeenCalled();
  });

  it('applies DONE from the worker: result files recorded, completedAt set', async () => {
    mockPrisma.translationJob.findUnique.mockResolvedValue(baseJob);
    mockPrisma.jobFile.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.translationJob.update.mockResolvedValue({ ...baseJob, status: 'DONE' });

    const app = buildServer();
    const response = await app.inject({
      method: 'PUT',
      url: '/api/documents/job-1/status',
      headers: { 'x-worker-token': process.env.WORKER_TOKEN! },
      payload: {
        status: 'DONE',
        resultFiles: [
          { storageKey: 'jobs/job-1/result/out.docx', originalName: 'out.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', sizeBytes: 1234 },
        ],
      },
    });

    expect(response.statusCode).toBe(200);
    expect(mockPrisma.jobFile.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ jobId: 'job-1', kind: 'result' })],
    });
    const updateArg = mockPrisma.translationJob.update.mock.calls[0][0];
    expect(updateArg.data.status).toBe('DONE');
    expect(updateArg.data.completedAt).toBeInstanceOf(Date);
  });

  it('records FAILED with an error message but no completed files', async () => {
    mockPrisma.translationJob.findUnique.mockResolvedValue(baseJob);
    mockPrisma.translationJob.update.mockResolvedValue({ ...baseJob, status: 'FAILED' });

    const app = buildServer();
    const response = await app.inject({
      method: 'PUT',
      url: '/api/documents/job-1/status',
      headers: { 'x-worker-token': process.env.WORKER_TOKEN! },
      payload: { status: 'FAILED', errorMessage: 'OCR failed' },
    });

    expect(response.statusCode).toBe(200);
    expect(mockPrisma.jobFile.createMany).not.toHaveBeenCalled();
    const updateArg = mockPrisma.translationJob.update.mock.calls[0][0];
    expect(updateArg.data.status).toBe('FAILED');
    expect(updateArg.data.errorMessage).toBe('OCR failed');
  });

  it('rejects an unknown status value', async () => {
    const app = buildServer();
    const response = await app.inject({
      method: 'PUT',
      url: '/api/documents/job-1/status',
      headers: { 'x-worker-token': process.env.WORKER_TOKEN! },
      payload: { status: 'NOT_A_STATUS' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('forbids clients from verifying notarized jobs', async () => {
    const app = buildServer();
    await app.ready();
    const clientToken = app.jwt.sign({ sub: 'user-1', role: 'CLIENT' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/documents/job-1/verify',
      headers: { authorization: `Bearer ${clientToken}` },
      payload: {},
    });

    expect(response.statusCode).toBe(403);
  });

  it('lets a translator verify a REVIEW job into DONE', async () => {
    mockPrisma.translationJob.findUnique.mockResolvedValue(baseJob);
    mockPrisma.translationJob.update.mockResolvedValue({ ...baseJob, status: 'DONE' });
    mockPrisma.auditLog.create.mockResolvedValue({} as never);

    const app = buildServer();
    await app.ready();
    const translatorToken = app.jwt.sign({ sub: 'translator-1', role: 'TRANSLATOR' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/documents/job-1/verify',
      headers: { authorization: `Bearer ${translatorToken}` },
      payload: { note: 'Tekshirildi' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.status).toBe('DONE');
    const updateArg = mockPrisma.translationJob.update.mock.calls[0][0];
    expect(updateArg.data.reviewerId).toBe('translator-1');
  });

  it('refuses to verify a job that is not in REVIEW', async () => {
    mockPrisma.translationJob.findUnique.mockResolvedValue({ ...baseJob, status: 'QUEUED' });

    const app = buildServer();
    await app.ready();
    const translatorToken = app.jwt.sign({ sub: 'translator-1', role: 'TRANSLATOR' });

    const response = await app.inject({
      method: 'POST',
      url: '/api/documents/job-1/verify',
      headers: { authorization: `Bearer ${translatorToken}` },
      payload: {},
    });

    expect(response.statusCode).toBe(409);
    expect(mockPrisma.translationJob.update).not.toHaveBeenCalled();
  });
});
