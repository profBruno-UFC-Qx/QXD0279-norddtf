import { z } from 'zod';

export const categoriaSchema = z.object({
  nome: z
    .string({ error: 'Informe o nome da categoria.' })
    .trim()
    .min(1, { error: 'Informe o nome da categoria.' })
    .max(40, { error: 'O nome pode ter até 40 caracteres.' }),
});

export const idDaCategoria = z.uuid();
