import type { Router } from 'vue-router'

import type { Perfil } from '@/types/usuario'

const CHAVE_DESTINO_GOOGLE = 'nordtf:destino-google'

export const destinoPadraoPorPerfil: Record<Perfil, string> = {
  visitante: '/',
  cliente: '/',
  admin: '/admin/pedidos',
}

export function voltarInterno(valor: unknown): string | null {
  if (typeof valor !== 'string' || !valor.startsWith('/')) return null
  if (valor.startsWith('//') || valor.startsWith('/\\')) return null
  return valor
}

export function destinoDepoisDeEntrar(router: Router, perfil: Perfil, voltar: string | null): string {
  const destinoPadrao = destinoPadraoPorPerfil[perfil]
  if (!voltar) return destinoPadrao

  const rota = router.resolve(voltar)
  const acesso = rota.meta.acesso ?? 'publico'

  if (rota.name === 'nao-encontrada' || acesso === 'visitante') return destinoPadrao
  if ((acesso === 'cliente' || acesso === 'admin') && acesso !== perfil) return destinoPadrao
  return voltar
}

export function guardarDestinoGoogle(voltar: string | null) {
  const destino = voltarInterno(voltar)
  try {
    if (destino) sessionStorage.setItem(CHAVE_DESTINO_GOOGLE, destino)
    else sessionStorage.removeItem(CHAVE_DESTINO_GOOGLE)
  } catch {
    // Sem sessionStorage, a volta do Google só usa o destino padrão do perfil.
  }
}

export function consumirDestinoGoogle(): string | null {
  try {
    const destino = sessionStorage.getItem(CHAVE_DESTINO_GOOGLE)
    sessionStorage.removeItem(CHAVE_DESTINO_GOOGLE)
    return voltarInterno(destino)
  } catch {
    return null
  }
}
