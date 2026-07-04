// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, AUTH_LOGOUT_EVENT, fetchApi } from './api';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Node 20+ ships an experimental (non-functional without a flag) localStorage
// global that shadows jsdom's, so stub a real in-memory implementation.
function makeStorage(): Storage {
  let store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => {
      store = new Map();
    },
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    key: (index: number) => [...store.keys()][index] ?? null,
  };
}

describe('fetchApi', () => {
  const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('localStorage', makeStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('resolves the success envelope and sends the Bearer token', async () => {
    localStorage.setItem('accessToken', 'token-1');
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: { ok: true } }));

    const result = await fetchApi<{ ok: boolean }>('/history');

    expect(result.data.ok).toBe(true);
    const [, init] = fetchMock.mock.calls[0];
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer token-1');
  });

  it('refreshes once on 401 and retries with the new token', async () => {
    localStorage.setItem('accessToken', 'expired');
    localStorage.setItem('refreshToken', 'refresh-1');
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: 'UNAUTHORIZED', message: 'expired' } }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { accessToken: 'fresh', refreshToken: 'refresh-2' } }))
      .mockResolvedValueOnce(jsonResponse(200, { data: { ok: true } }));

    const result = await fetchApi<{ ok: boolean }>('/history');

    expect(result.data.ok).toBe(true);
    expect(localStorage.getItem('accessToken')).toBe('fresh');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-2');
    // 3 calls: original, /auth/refresh, retry with new token
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [, retryInit] = fetchMock.mock.calls[2];
    expect((retryInit?.headers as Record<string, string>).Authorization).toBe('Bearer fresh');
  });

  it('clears the session and fires the logout event when refresh fails', async () => {
    localStorage.setItem('user', '{"id":"u1"}');
    localStorage.setItem('accessToken', 'expired');
    localStorage.setItem('refreshToken', 'revoked');
    const onLogout = vi.fn();
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: 'UNAUTHORIZED', message: 'expired' } }))
      .mockResolvedValueOnce(jsonResponse(401, { error: { code: 'UNAUTHORIZED', message: 'bad refresh' } }));

    await expect(fetchApi('/history')).rejects.toBeInstanceOf(ApiRequestError);
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(onLogout).toHaveBeenCalledTimes(1);
    window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
  });

  it('does not try to refresh for /auth/* endpoints', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(401, { error: { code: 'UNAUTHORIZED', message: "Email yoki parol noto'g'ri" } }),
    );

    await expect(fetchApi('/auth/login', { method: 'POST', body: '{}' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('maps error envelopes to ApiRequestError with code and message', async () => {
    localStorage.setItem('accessToken', 'token');
    fetchMock.mockResolvedValueOnce(
      jsonResponse(429, { error: { code: 'RATE_LIMITED', message: "So'rovlar soni cheklovdan oshdi" } }),
    );

    await expect(fetchApi('/translate', { method: 'POST', body: '{}' })).rejects.toMatchObject({
      code: 'RATE_LIMITED',
      status: 429,
      message: "So'rovlar soni cheklovdan oshdi",
    });
  });
});
