import type { z } from 'zod';
import { AppError } from './errors';

/** Parse with Zod or throw INVALID_INPUT with a compact, client-safe message. */
export function validate<S extends z.ZodTypeAny>(schema: S, input: unknown): z.output<S> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first.path.length > 0 ? `${first.path.join('.')}: ` : '';
    throw new AppError('INVALID_INPUT', `${path}${first.message}`);
  }
  return parsed.data;
}
