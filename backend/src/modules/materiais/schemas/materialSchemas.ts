import { z } from 'zod';

const PRECO_INVALIDO = 'Informe um preço válido.';

export const tipoMaterial = z.enum(['DTF', 'DTF_UV']);

export type TipoMaterial = z.infer<typeof tipoMaterial>;

export const materialSchema = z.object({
  precoPorM2: z
    .string({ error: PRECO_INVALIDO })
    .trim()
    .regex(/^\d{1,4}(\.\d{1,2})?$/, { error: PRECO_INVALIDO })
    .refine((preco) => !/^0+(\.0{1,2})?$/.test(preco), { error: PRECO_INVALIDO }),
  descricao: z
    .string({ error: 'Informe a descrição.' })
    .trim()
    .min(1, { error: 'Informe a descrição.' })
    .max(300, { error: 'A descrição pode ter até 300 caracteres.' }),
  etiqueta: z
    .string({ error: 'Informe a etiqueta.' })
    .trim()
    .min(1, { error: 'Informe a etiqueta.' })
    .max(40, { error: 'A etiqueta pode ter até 40 caracteres.' }),
});

export type DadosDoMaterial = z.infer<typeof materialSchema>;
