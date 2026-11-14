import { useRoute, useRouter } from 'vue-router'

import { useSessao } from '@/stores/sessao'
import { voltarInterno } from '@/utils/destino'

export function useAcaoRestrita() {
  const route = useRoute()
  const router = useRouter()
  const sessao = useSessao()

  function exigirLogin() {
    if (sessao.perfil !== 'visitante') return true
    router.push({ name: 'login', query: { voltar: voltarInterno(route.fullPath) ?? undefined } })
    return false
  }

  return { exigirLogin }
}
