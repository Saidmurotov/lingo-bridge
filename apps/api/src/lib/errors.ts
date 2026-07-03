// Typed errors mapped to the { error: { code, message } } envelope (docs/04 §1).

export type ErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA'
  | 'RATE_LIMITED'
  | 'INTERNAL';

const HTTP_BY_CODE: Record<ErrorCode, number> = {
  INVALID_INPUT: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  FILE_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA: 415,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
    this.statusCode = HTTP_BY_CODE[code];
  }

  toBody(): { error: { code: ErrorCode; message: string } } {
    return { error: { code: this.code, message: this.message } };
  }
}
