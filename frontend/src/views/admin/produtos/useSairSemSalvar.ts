import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import {
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  useRouter,
  type RouteLocationNormalized,
} from 'vue-router'

import { registrarInterceptadorDeSaida, type MotivoDaSaida } from '@/composables/interceptarSaida'

function posicaoNoHistorico(): number | undefined {
  const posicao = window.history.state?.position
  return typeof posicao === 'number' ? posicao : undefined
}

export function useSairSemSalvar(temAlteracao: () => boolean) {
  const router = useRouter()
  const pendente = shallowRef<() => unknown>()
  const motivo = ref<MotivoDaSaida>('navegacao')
  let liberado = false
  let posicao = posicaoNoHistorico()

  const confirmacaoAberta = computed({
    get: () => pendente.value !== undefined,
    set: (aberta: boolean) => {
      if (!aberta) pendente.value = undefined
    },
  })

  function pedir(continuar: () => unknown, motivoDoPedido: MotivoDaSaida) {
    pendente.value = continuar
    motivo.value = motivoDoPedido
  }

  function deveConfirmar() {
    return !liberado && temAlteracao()
  }

  // No voltar do navegador, o histórico já andou quando a guarda roda: a diferença de posição
  // diz quantos passos repetir depois de confirmar. Dentro do módulo, a saída vai para a listagem.
  function seguirPara(para: RouteLocationNormalized, passos: number) {
    if (passos === 0) return () => router.push(para.fullPath)
    const noModulo = para.path.startsWith('/admin/produtos/')
    if (noModulo) return () => router.replace({ name: 'admin-produtos' })
    return () => router.go(passos)
  }

  function guarda(para: RouteLocationNormalized) {
    if (para.name === 'login' || !deveConfirmar()) return true
    if (pendente.value) return false
    const atual = posicaoNoHistorico()
    const passos = atual !== undefined && posicao !== undefined ? atual - posicao : 0
    const seguir = seguirPara(para, passos)
    const continuar = () => {
      liberado = true
      return seguir()
    }
    pedir(continuar, 'navegacao')
    return false
  }

  onBeforeRouteLeave(guarda)
  onBeforeRouteUpdate(guarda)

  const pararDeAcompanhar = router.afterEach((_para, _de, falha) => {
    if (falha) {
      liberado = false
      return
    }
    posicao = posicaoNoHistorico()
  })

  const pararDeOuvirErros = router.onError(() => {
    liberado = false
  })

  function avisarAoFecharAJanela(evento: BeforeUnloadEvent) {
    if (!deveConfirmar()) return
    evento.preventDefault()
    evento.returnValue = ''
  }

  function interceptar(continuar: () => unknown, motivoDoPedido: MotivoDaSaida) {
    if (!deveConfirmar()) return false
    if (!pendente.value) pedir(continuar, motivoDoPedido)
    return true
  }

  let removerInterceptador: (() => void) | undefined

  onMounted(() => {
    window.addEventListener('beforeunload', avisarAoFecharAJanela)
    removerInterceptador = registrarInterceptadorDeSaida(interceptar)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', avisarAoFecharAJanela)
    pararDeAcompanhar()
    pararDeOuvirErros()
    removerInterceptador?.()
  })

  function liberar() {
    liberado = true
  }

  function religar() {
    liberado = false
    pendente.value = undefined
  }

  async function sair() {
    const continuar = pendente.value
    pendente.value = undefined
    try {
      await continuar?.()
    } catch {
      liberado = false
    }
  }

  return { confirmacaoAberta, motivo, sair, liberar, religar }
}
