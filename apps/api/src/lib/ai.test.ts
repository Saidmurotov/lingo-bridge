import { afterEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { quickTranslate, generateMaterial } from './ai';
import { AppError } from './errors';

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  return { ...actual, default: { ...actual.default, post: vi.fn() } };
});

const mockedPost = vi.mocked(axios.post);

function anthropicReply(text: string) {
  return { data: { content: [{ type: 'text', text }] } };
}

afterEach(() => {
  mockedPost.mockReset();
});

describe('quickTranslate', () => {
  it('parses a valid JSON model reply', async () => {
    mockedPost.mockResolvedValueOnce(
      anthropicReply('{"resultText": "Gipoteza rad etildi.", "detectedLang": "EN"}'),
    );

    const result = await quickTranslate({
      text: 'The hypothesis was rejected.',
      fromLang: null,
      toLang: 'UZ',
      academic: true,
    });

    expect(result.resultText).toBe('Gipoteza rad etildi.');
    expect(result.detectedLang).toBe('EN');
    expect(mockedPost).toHaveBeenCalledTimes(1);
    const [, body] = mockedPost.mock.calls[0];
    expect(body).toMatchObject({ max_tokens: 2048 });
  });

  it('tolerates prose or fences around the JSON', async () => {
    mockedPost.mockResolvedValueOnce(
      anthropicReply('Here you go:\n```json\n{"resultText": "Salom", "detectedLang": "EN"}\n```'),
    );

    const result = await quickTranslate({ text: 'Hello', fromLang: 'EN', toLang: 'UZ', academic: false });
    expect(result.resultText).toBe('Salom');
  });

  it('rejects output that fails shape validation', async () => {
    mockedPost.mockResolvedValue(anthropicReply('{"wrong": "shape"}'));

    await expect(
      quickTranslate({ text: 'Hello', fromLang: 'EN', toLang: 'UZ', academic: false }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('retries on 429 and then succeeds', async () => {
    vi.useFakeTimers();
    try {
      const rateLimited = Object.assign(new axios.AxiosError('rate limited'), {
        response: { status: 429 },
      });
      mockedPost
        .mockRejectedValueOnce(rateLimited)
        .mockResolvedValueOnce(anthropicReply('{"resultText": "Salom", "detectedLang": "EN"}'));

      const pending = quickTranslate({ text: 'Hello', fromLang: 'EN', toLang: 'UZ', academic: false });
      await vi.runAllTimersAsync();
      const result = await pending;

      expect(result.resultText).toBe('Salom');
      expect(mockedPost).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not leak provider details on repeated failure', async () => {
    vi.useFakeTimers();
    try {
      const serverError = Object.assign(new axios.AxiosError('secret internals'), {
        response: { status: 500 },
      });
      mockedPost.mockRejectedValue(serverError);

      const pending = quickTranslate({ text: 'Hello', fromLang: 'EN', toLang: 'UZ', academic: false });
      const assertion = expect(pending).rejects.toMatchObject({
        code: 'INTERNAL',
        message: 'AI service unavailable',
      });
      await vi.runAllTimersAsync();
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('generateMaterial', () => {
  it('returns the raw material text and sets a larger token budget', async () => {
    mockedPost.mockResolvedValueOnce(anthropicReply('# Present Perfect\n\n1. ...'));

    const content = await generateMaterial({
      subject: 'Ingliz tili',
      topic: 'Present Perfect',
      level: 'B1',
      type: 'EXERCISES',
      outputLang: 'UZ',
    });

    expect(content).toContain('Present Perfect');
    const [, body] = mockedPost.mock.calls[0];
    expect(body).toMatchObject({ max_tokens: 4096 });
  });
});
