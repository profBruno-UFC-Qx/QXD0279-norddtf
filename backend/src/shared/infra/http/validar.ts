import type { z } from 'zod';

export function validar<T extends z.ZodType>(schema: T, corpo: unknown): z.output<T> {
  return schema.parse(corpo ?? {});
}
