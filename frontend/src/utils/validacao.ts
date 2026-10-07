import type { TypedSchema } from 'vee-validate'
import type { z } from 'zod'

import { ErroApi } from '@/api/ErroApi'

export function schemaZod<T extends z.ZodType>(schema: T): TypedSchema<z.input<T>, z.output<T>> {
  return {
    __type: 'VVTypedSchema',
    async parse(valores) {
      const resultado = await schema.safeParseAsync(valores)
      if (resultado.success) return { value: resultado.data, errors: [] }
      const porCaminho = new Map<string, string[]>()
      for (const issue of resultado.error.issues) {
        const caminho = issue.path.join('.')
        porCaminho.set(caminho, [...(porCaminho.get(caminho) ?? []), issue.message])
      }
      return { errors: [...porCaminho].map(([path, errors]) => ({ path, errors })) }
    },
  }
}

export function aplicarErrosDaApi(
  erro: unknown,
  setErrors: (erros: Record<string, string>) => void,
): boolean {
  if (!(erro instanceof ErroApi) || !erro.erros) return false
  if (Object.keys(erro.erros).length === 0) return false
  setErrors(erro.erros)
  return true
}
