import type { z } from 'zod';

export function toFieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    if (issue.path.length === 0) {
      continue;
    }
    errors[issue.path.map(String).join('.')] ??= issue.message;
  }
  return errors;
}
