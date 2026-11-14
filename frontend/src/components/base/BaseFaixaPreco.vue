<script setup lang="ts">
import { computed, useId, watch } from 'vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'

import { centavosParaDecimal, decimalParaCentavos, formatarMoeda } from '@/utils/formatacao'

const PASSO_DO_TECLADO = 100

const DIRECAO_POR_TECLA: Record<string, number> = {
  ArrowRight: 1,
  ArrowUp: 1,
  ArrowLeft: -1,
  ArrowDown: -1,
}

type Faixa = [string, string]

const props = defineProps<{ min: string; max: string }>()

const faixa = defineModel<Faixa>({ required: true })

const emit = defineEmits<{ confirmar: [faixa: Faixa] }>()

const idRotulo = `${useId()}-rotulo`

function paraCentavos(decimal: string) {
  return Number(decimalParaCentavos(decimal))
}

function paraFaixa([minimo = 0, maximo = 0]: number[]): Faixa {
  return [centavosParaDecimal(String(minimo)), centavosParaDecimal(String(maximo))]
}

function limitar(valor: number, inferior: number, superior: number) {
  return Math.min(Math.max(valor, inferior), superior)
}

const centavos = computed({
  get: () => faixa.value.map(paraCentavos),
  set: (valores: number[]) => {
    faixa.value = paraFaixa(valores)
  },
})

const limites = computed(() => ({ min: paraCentavos(props.min), max: paraCentavos(props.max) }))

const temIntervalo = computed(() => limites.value.max > limites.value.min)

watch(
  limites,
  ({ min, max }) => {
    const ajustados = centavos.value.map((valor) => limitar(valor, min, max))
    if (ajustados.some((valor, indice) => valor !== centavos.value[indice])) {
      centavos.value = ajustados
    }
  },
  { immediate: true },
)

const textoDaFaixa = computed(() => {
  if (!temIntervalo.value) return formatarMoeda(props.min)
  return `${formatarMoeda(faixa.value[0])} a ${formatarMoeda(faixa.value[1])}`
})

const polegares = computed(() => [
  { rotulo: 'Preço mínimo', texto: formatarMoeda(faixa.value[0]) },
  { rotulo: 'Preço máximo', texto: formatarMoeda(faixa.value[1]) },
])

// O Reka anda em centavos para alcançar min e max exatos; as setas andam R$ 1,00.
function aoTeclar(evento: KeyboardEvent, indice: number) {
  const direcao = DIRECAO_POR_TECLA[evento.key]
  if (!direcao) return
  evento.preventDefault()
  evento.stopPropagation()
  const [minimo = 0, maximo = 0] = centavos.value
  const valores = [minimo, maximo]
  const inferior = indice === 0 ? limites.value.min : minimo
  const superior = indice === 0 ? maximo : limites.value.max
  valores[indice] = limitar((valores[indice] ?? 0) + direcao * PASSO_DO_TECLADO, inferior, superior)
  centavos.value = valores
  emit('confirmar', paraFaixa(valores))
}
</script>

<template>
  <div role="group" :aria-labelledby="idRotulo" class="flex flex-col gap-1.25">
    <div class="flex items-baseline justify-between">
      <span :id="idRotulo" class="text-14 font-medium">Preço</span>
      <span class="text-12 font-medium text-cinza-dtf">{{ textoDaFaixa }}</span>
    </div>
    <SliderRoot
      v-if="temIntervalo"
      v-model="centavos"
      :min="limites.min"
      :max="limites.max"
      :step="1"
      class="relative flex h-4 w-full touch-none items-center select-none"
      @value-commit="emit('confirmar', paraFaixa($event))"
    >
      <SliderTrack class="relative h-1 grow rounded-full bg-cinza-escuro/67">
        <SliderRange class="absolute h-full rounded-full bg-amarelo-dtf" />
      </SliderTrack>
      <SliderThumb
        v-for="(polegar, indice) in polegares"
        :key="polegar.rotulo"
        :aria-label="polegar.rotulo"
        :aria-valuetext="polegar.texto"
        class="block size-4 cursor-pointer rounded-full bg-branco-dtf ring-2 ring-amarelo-dtf ring-inset"
        @keydown="aoTeclar($event, indice)"
      />
    </SliderRoot>
  </div>
</template>
