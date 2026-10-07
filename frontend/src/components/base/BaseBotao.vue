<script setup lang="ts">
import { computed } from 'vue'

import BaseSpinner from './BaseSpinner.vue'

type Variante = 'primario' | 'secundario' | 'risco'
type Tamanho = 'padrao' | 'compacto'

const props = withDefaults(
  defineProps<{
    variante?: Variante
    tamanho?: Tamanho
    tipo?: 'button' | 'submit'
    carregando?: boolean
    desabilitado?: boolean
  }>(),
  {
    variante: 'primario',
    tamanho: 'padrao',
    tipo: 'button',
    carregando: false,
    desabilitado: false,
  },
)

const classesPorTamanho: Record<Tamanho, string> = {
  padrao: 'px-4.25 py-2.25 text-24 font-semibold',
  compacto: 'h-9.25 px-2.5 text-13 font-bold whitespace-nowrap',
}

const classesPorVariante: Record<Variante, string> = {
  primario: 'bg-amarelo-dtf',
  secundario: 'bg-branco-dtf ring-1 ring-inset',
  risco: 'bg-erro',
}

const contornoPorTamanho: Record<Tamanho, string> = {
  padrao: 'ring-preto-dtf',
  compacto: 'ring-cinza-escuro/67',
}

const classeDaVariante = computed(() => {
  if (props.desabilitado) return 'bg-cinza-escuro/67 cursor-not-allowed'
  if (props.variante !== 'secundario') return classesPorVariante[props.variante]
  return `${classesPorVariante.secundario} ${contornoPorTamanho[props.tamanho]}`
})
</script>

<template>
  <button
    :type="tipo"
    :disabled="desabilitado || carregando"
    :aria-busy="carregando || undefined"
    class="relative inline-flex items-center justify-center rounded-padrao text-preto-dtf"
    :class="[classesPorTamanho[tamanho], classeDaVariante]"
  >
    <span
      class="inline-flex items-center justify-center gap-4.5"
      :class="{ 'opacity-0': carregando }"
    >
      <slot />
    </span>
    <BaseSpinner v-if="carregando" class="absolute size-[1em]" />
  </button>
</template>
