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

/**
 * Fetch wrapper for the Lingo Bridge API.
 * - Adds the Bearer token from localStorage when present.
 * - Skips Content-Type for FormData bodies so the browser sets the multipart boundary.
 * - Resolves with the success envelope `{ data }`; throws ApiRequestError otherwise.
 */
export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiSuccess<T>> {
  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };

  if (!(options.body instanceof FormData) && headers['Content-Type'] === undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
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
    throw new ApiRequestError(code, message, response.status);
  }

  if (response.status === 204) {
    return { data: undefined as T };
  }

  return (await response.json()) as ApiSuccess<T>;
}
