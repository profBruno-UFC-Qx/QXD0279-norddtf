export type MotivoDaSaida = 'navegacao' | 'logout'

type Interceptador = (continuar: () => unknown, motivo: MotivoDaSaida) => boolean

let interceptador: Interceptador | undefined

export function interceptarSaida(continuar: () => unknown, motivo: MotivoDaSaida): boolean {
  return interceptador?.(continuar, motivo) ?? false
}

export function registrarInterceptadorDeSaida(novo: Interceptador): () => void {
  interceptador = novo
  return () => {
    if (interceptador === novo) interceptador = undefined
  }
}
