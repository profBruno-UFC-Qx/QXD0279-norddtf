import { z } from 'zod';

const email = z.string().trim().toLowerCase().max(254).pipe(z.email());

const senhaComPolitica = z
  .string()
  .min(8)
  .max(128)
  .regex(/\p{L}/u)
  .regex(/\p{Nd}/u);

export const signupSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  email,
  senha: senhaComPolitica,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1),
  senha: z.string().min(1),
});
