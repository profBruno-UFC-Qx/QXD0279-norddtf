import { z } from 'zod';

const email = z
  .string({ error: 'Informe o e-mail.' })
  .trim()
  .toLowerCase()
  .max(254, { error: 'O e-mail pode ter até 254 caracteres.' })
  .pipe(z.email({ error: 'Informe um e-mail válido.' }));

const senhaComPolitica = z
  .string({ error: 'Informe a senha.' })
  .min(8, { error: 'A senha precisa ter pelo menos 8 caracteres.' })
  .max(128, { error: 'A senha pode ter no máximo 128 caracteres.' })
  .regex(/\p{L}/u, { error: 'A senha precisa ter pelo menos uma letra.' })
  .regex(/\p{Nd}/u, { error: 'A senha precisa ter pelo menos um número.' });

export const signupSchema = z.object({
  nome: z
    .string({ error: 'Informe o nome.' })
    .trim()
    .min(1, { error: 'Informe o nome.' })
    .max(120, { error: 'O nome pode ter até 120 caracteres.' }),
  email,
  senha: senhaComPolitica,
});

export const loginSchema = z.object({
  email: z
    .string({ error: 'Informe o e-mail.' })
    .trim()
    .toLowerCase()
    .min(1, { error: 'Informe o e-mail.' }),
  senha: z.string({ error: 'Informe a senha.' }).min(1, { error: 'Informe a senha.' }),
});
