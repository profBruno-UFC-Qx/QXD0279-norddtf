import type { RouteLocationNormalized } from 'vue-router'

import { useSessao } from '@/stores/sessao'

export async function guardaDeAcesso(to: RouteLocationNormalized) {
  const sessao = useSessao()
  await sessao.carregar()

  const acesso = to.meta.acesso ?? 'publico'

  if (acesso === 'publico') return true
  if (acesso === 'visitante') return sessao.perfil === 'visitante' ? true : sessao.destinoPadrao
  if (sessao.perfil === 'visitante') return { path: '/login', query: { voltar: to.fullPath } }
  if (acesso !== sessao.perfil) return sessao.destinoPadrao
  return true
}
