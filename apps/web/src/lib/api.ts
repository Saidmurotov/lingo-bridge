import type { ApiError, ApiSuccess } from 'shared';

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api';

type ApiErrorCode = ApiError['error']['code'] | 'UNKNOWN';

/** Typed error carrying the server's { error: { code, message } } payload. */
export class ApiRequestError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.code = code;
    this.status = status;
  }
}

/** Fired on window when the session can no longer be refreshed. AuthProvider listens. */
export const AUTH_LOGOUT_EVENT = 'lingo:auth-logout';

export function clearSession(): void {
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
}

// Single-flight: concurrent 401s share one refresh call, so the rotated
// refresh token is never spent twice (the API revokes it on first use).
let refreshInFlight: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return false;
    const body = (await response.json()) as ApiSuccess<RefreshedTokens>;
    localStorage.setItem('accessToken', body.data.accessToken);
    localStorage.setItem('refreshToken', body.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function refreshOnce(): Promise<boolean> {
  refreshInFlight ??= refreshTokens().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

function buildHeaders(options: RequestInit): Record<string, string> {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };
  if (!(options.body instanceof FormData) && headers['Content-Type'] === undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('accessToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function toApiError(response: Response): Promise<ApiRequestError> {
  let code: ApiErrorCode = 'UNKNOWN';
  let message = `Request failed with status ${response.status}`;
  try {
    const body = (await response.json()) as Partial<ApiError>;
    if (body.error) {
      code = body.error.code;
      message = body.error.message;
    }
  } catch {
    // Non-JSON error body — keep the generic message.
  }
  return new ApiRequestError(code, message, response.status);
}

/**
 * Fetch wrapper for the Lingo Bridge API.
 * - Adds the Bearer token from localStorage when present.
 * - Skips Content-Type for FormData bodies so the browser sets the multipart boundary.
 * - On 401, silently refreshes the access token once and retries; if the refresh
 *   fails, clears the session and notifies AuthProvider via AUTH_LOGOUT_EVENT.
 * - Resolves with the success envelope `{ data }`; throws ApiRequestError otherwise.
 */
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiSuccess<T>> {
  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: buildHeaders(options),
  });

  const isAuthCall = endpoint.startsWith('/auth/');
  if (response.status === 401 && !isAuthCall) {
    if (await refreshOnce()) {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: buildHeaders(options),
      });
    } else {
      clearSession();
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
    }
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return { data: undefined as T };
  }

  return (await response.json()) as ApiSuccess<T>;
}
