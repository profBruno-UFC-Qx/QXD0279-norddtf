import type { z } from 'zod';

export function toFieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const [campo] = issue.path;
    if (typeof campo !== 'string') {
      continue;
    }
    errors[campo] ??= issue.message;
  }
  return errors;
}
