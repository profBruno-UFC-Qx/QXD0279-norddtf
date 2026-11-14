import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { MENSAGEM_GERAL } from '@/api/ErroApi'
import { interceptarSaida } from '@/composables/interceptarSaida'
import { useAvisos } from '@/stores/avisos'
import { useSessao } from '@/stores/sessao'

export function useSair() {
  const sessao = useSessao()
  const router = useRouter()
  const saindo = ref(false)

  async function encerrarSessao(): Promise<string | null> {
    try {
      return await sessao.sair()
    } catch {
      useAvisos().erro(MENSAGEM_GERAL)
      return null
    }
  }

  async function encerrarESair() {
    saindo.value = true
    const destino = await encerrarSessao()
    saindo.value = false
    if (destino) await router.push(destino)
  }

  async function sair() {
    if (interceptarSaida(encerrarESair, 'logout')) return
    await encerrarESair()
  }

  return { saindo, sair }
}
