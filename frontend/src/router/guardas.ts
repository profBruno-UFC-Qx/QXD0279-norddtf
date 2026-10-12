import type { RouteLocationNormalized, Router } from 'vue-router'

import { useSessao } from '@/stores/sessao'
import { consumirDestinoGoogle, destinoDepoisDeEntrar, voltarInterno } from '@/utils/destino'

export async function guardaDeAcesso(to: RouteLocationNormalized, router: Router) {
  const sessao = useSessao()
  await sessao.carregar()

  const acesso = to.meta.acesso ?? 'publico'

  if (acesso === 'publico') return true
  if (acesso === 'visitante') {
    if (sessao.perfil === 'visitante') return true
    const voltar = voltarInterno(to.query.voltar) ?? consumirDestinoGoogle()
    return destinoDepoisDeEntrar(router, sessao.perfil, voltar)
  }
  if (sessao.perfil === 'visitante') return { path: '/login', query: { voltar: to.fullPath } }
  if (acesso !== sessao.perfil) return sessao.destinoPadrao
  return true
}
