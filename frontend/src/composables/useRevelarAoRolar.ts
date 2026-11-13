import { onBeforeUnmount, onMounted } from 'vue'

/**
 * Revela elementos marcados com `data-revelar` conforme entram na viewport.
 * O atraso de cada elemento é controlado pela variável CSS `--revelar-atraso`.
 */
export function useRevelarAoRolar() {
  let observador: IntersectionObserver | null = null
  let elementos: HTMLElement[] = []
  let ultimaVerificacao = 0

  function revelar(elemento: Element) {
    elemento.classList.add('revelar-visivel')
    observador?.unobserve(elemento)
  }

  /**
   * Revela tudo que já chegou à linha de leitura. Inclui elementos que passaram
   * acima da viewport (salto por âncora, rolagem muito rápida ou restauração de
   * posição), evitando que fiquem invisíveis ao voltar.
   */
  function revelarNaViewport() {
    const altura = window.innerHeight || document.documentElement.clientHeight
    const limite = altura * 0.92

    for (const elemento of elementos) {
      if (elemento.classList.contains('revelar-visivel')) continue
      if (elemento.getBoundingClientRect().top < limite) revelar(elemento)
    }
  }

  function aoRolar() {
    const agora = Date.now()
    if (agora - ultimaVerificacao < 100) return

    ultimaVerificacao = agora
    revelarNaViewport()
  }

  function aoMudarVisibilidade() {
    if (document.visibilityState === 'visible') revelarNaViewport()
  }

  function aoCarregar() {
    revelarNaViewport()
  }

  onMounted(() => {
    elementos = Array.from(document.querySelectorAll<HTMLElement>('[data-revelar]'))

    if (elementos.length === 0) return

    revelarNaViewport()

    if (!('IntersectionObserver' in window)) {
      elementos.forEach(revelar)
      return
    }

    observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) revelar(entrada.target)
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )

    for (const elemento of elementos) {
      if (!elemento.classList.contains('revelar-visivel')) observador.observe(elemento)
    }

    window.addEventListener('scroll', aoRolar, { passive: true })
    window.addEventListener('resize', aoRolar)
    window.addEventListener('load', aoCarregar)
    document.addEventListener('visibilitychange', aoMudarVisibilidade)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', aoRolar)
    window.removeEventListener('resize', aoRolar)
    window.removeEventListener('load', aoCarregar)
    document.removeEventListener('visibilitychange', aoMudarVisibilidade)
    observador?.disconnect()
    observador = null
    elementos = []
  })
}
